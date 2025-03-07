import mongoose, { Document } from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { redis } from "../app.js";
import { Product } from "../models/product.model.js";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Review } from "../models/review.modal.js";
import { Redis } from "ioredis";

export const findAverageRatings = async (
  productId: mongoose.Types.ObjectId
) => {
  let totalRating = 0;

  const reviews = await Review.find({ product: productId });

  reviews.forEach((review) => {
    totalRating += review.rating;
  });

  const averageRating = Math.floor(totalRating / reviews.length) || 0;

  return {
    numOfReviews: reviews.length,
    ratings: averageRating,
  };
};

const getBase64 = (file: Express.Multer.File) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
  const promises = files.map(async (file) => {
    return new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      cloudinary.uploader.upload(getBase64(file), (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  });

  const result = await Promise.all(promises);

  return result.map((i) => ({
    public_id: i?.public_id,
    url: i?.secure_url,
  }));
};

export const deleteFromCloudinary = async (publicIds: string[]) => {
  const promises = publicIds.map((id) => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error, result) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  await Promise.all(promises);
};

export const connectRedis = (redisURI: string) => {
  const redis = new Redis(redisURI);

  redis.on("connect", () => console.log("redis connected"));

  redis.on("error", (error) => console.log(error));

  return redis;
};

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecommercee",
    })
    .then((c) => {
      console.log(`DB connected to ${c.connection.host}`);
    })
    .catch((e) => console.log(e));
};

export const invalidateCache = async ({
  product,
  admin,
  order,
  review,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (review) {
    await redis.del([`reviews-${productId}`]);
  }

  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));

    await redis.del(productKeys);
  }

  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `orders-${orderId}`,
    ];

    await redis.del(orderKeys);
  }

  if (admin) {
    await redis.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];

    const product = await Product.findById(order.productId);

    if (!product) throw new Error("Product Not Found");

    product.stock -= order.quantity;

    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;

  const percent = (thisMonth / lastMonth) * 100;

  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

// created for not to repeat code ------------------------------------
interface myDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}

type FuncProps = {
  length: number;
  docArr: myDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;

    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};
