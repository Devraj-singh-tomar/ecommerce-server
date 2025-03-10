import { Request } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.middleware.js";
import { Order } from "../models/order.model.js";
import { NewOrderRequestBody } from "../types/types.js";
import { invalidateCache, reduceStock } from "../utils/feature.js";
import ErrorHandler from "../utils/utility-class.js";

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      discount,
      shippingCharges,
      total,
    } = req.body;

    if (!shippingInfo || !orderItems || !user || !subtotal || !tax || !total)
      return next(new ErrorHandler("Please enter all fields", 400));

    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      discount,
      shippingCharges,
      total,
    });

    await reduceStock(orderItems);

    await invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  }
);

export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  const key = `my-orders-${user}`;

  let orders;

  orders = await redis.get(key);

  if (orders) orders = JSON.parse(orders);
  else {
    orders = await Order.find({ user: user });

    await redis.setex(key, redisTTL, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  const key = `all-orders`;

  let orders;

  orders = await redis.get(key);

  if (orders) orders = JSON.parse(orders);
  else {
    orders = await Order.find().populate("user", "name");

    await redis.setex(key, redisTTL, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrders = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const key = `orders-${id}`;

  let order;

  order = await redis.get(key);

  if (order) order = JSON.parse(order);
  else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) return next(new ErrorHandler("Order not found", 400));

    await redis.setex(key, redisTTL, JSON.stringify(order));
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;

    case "Shipped":
      order.status = "Delivered";
      break;

    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order processed successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  await order.deleteOne();

  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});
