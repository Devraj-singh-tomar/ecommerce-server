import { Request } from "express";
import { TryCatch } from "../middlewares/error.middleware.js";
import { NewProductRequestBody } from "../types/types.js";
import { Product } from "../models/product.model.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { category, name, price, stock } = req.body;

    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add photo", 400));

    if (!name || !category || !stock || !price) {
      rm(photo.path, () => {
        console.log("Deleted");
      });

      return next(new ErrorHandler("Please enter all fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);
