import { Request } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.modal.js";
import { User } from "../models/user.model.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import {
  deleteFromCloudinary,
  findAverageRatings,
  invalidateCache,
  uploadToCloudinary,
} from "../utils/feature.js";
import ErrorHandler from "../utils/utility-class.js";
// import { faker } from "@faker-js/faker";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { category, name, price, stock, description } = req.body;

    const photos = req.files as Express.Multer.File[] | undefined;

    if (!photos) return next(new ErrorHandler("Please add photos", 400));

    if (photos.length < 1)
      return next(new ErrorHandler("Please add atleast 1 photo", 400));

    if (photos.length > 5)
      return next(new ErrorHandler("you can only upload 5 photos", 400));

    if (!name || !category || !stock || !price || !description) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    // UPLOAD TO CLOUDINARY

    const photosURL = await uploadToCloudinary(photos);

    await Product.create({
      name,
      price,
      description,
      stock,
      category: category.toLowerCase(),
      photos: photosURL,
    });

    await invalidateCache({
      product: true,
      admin: true,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

// REVALIDATE ON NEW, UPDATE, DELETE PRODUCT & NEW ORDER
export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  const key = "latest-products";

  products = await redis.get(key);

  if (products) products = JSON.parse(products);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);

    await redis.setex(key, redisTTL, JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  const key = "categories";

  categories = await redis.get(key);

  if (categories) categories = JSON.parse(categories);
  else {
    categories = await Product.distinct("category");

    await redis.setex(key, redisTTL, JSON.stringify(categories));
  }

  return res.status(200).json({
    success: true,
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;

  const key = "all-products";

  products = await redis.get(key);

  if (products) products = JSON.parse(products);
  else {
    products = await Product.find({});

    await redis.setex(key, redisTTL, JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;

  const id = req.params.id;

  const key = `product-${id}`;

  product = await redis.get(key);

  if (product) product = JSON.parse(product);
  else {
    product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product not found", 404));

    await redis.setex(key, redisTTL, JSON.stringify(product));
  }

  return res.status(200).json({
    success: true,
    product,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { category, name, price, stock, description } = req.body;
  const photos = req.files as Express.Multer.File[] | undefined;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (photos && photos.length > 0) {
    const photosURL = await uploadToCloudinary(photos);

    const ids = product.photos.map((photo) => photo.public_id);

    await deleteFromCloudinary(ids);

    product.set("photos", photosURL);
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;
  if (description) product.description = description;

  await product.save();

  await invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
  });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  const ids = product.photos.map((photo) => photo.public_id);

  await deleteFromCloudinary(ids);

  await product.deleteOne();

  await invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
  });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { category, price, search, sort } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProducts] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProducts.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

export const getAllProductReviews = TryCatch(async (req, res, next) => {
  let reviews;

  const key = `reviews-${req.params.id}`;

  reviews = await redis.get(key);

  if (reviews) reviews = JSON.parse(reviews);
  else {
    reviews = await Review.find({
      product: req.params.id,
    })
      .populate("user", "name photo")
      .sort({ updatedAt: -1 });

    await redis.setex(key, redisTTL, JSON.stringify(reviews));
  }

  return res.status(200).json({
    success: true,
    reviews,
  });
});

export const newReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);

  if (!user) return next(new ErrorHandler("Your are not loggedIn", 400));

  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  const { comment, rating } = req.body;

  const alreadyReviewed = await Review.findOne({
    user: user._id,
    product: product._id,
  });

  if (alreadyReviewed) {
    alreadyReviewed.comment = comment;
    alreadyReviewed.rating = rating;

    await alreadyReviewed.save();
  } else {
    await Review.create({
      comment,
      rating,
      user: user._id,
      product: product._id,
    });
  }

  const { numOfReviews, ratings } = await findAverageRatings(product._id);

  product.ratings = ratings;

  product.numOfReviews = numOfReviews;

  await product.save();

  await invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
    review: true,
  });

  return res.status(alreadyReviewed ? 200 : 201).json({
    success: true,
    message: alreadyReviewed
      ? "Your review updated"
      : "Review added successfully",
  });
});

export const deleteReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);

  if (!user) return next(new ErrorHandler("Your are not loggedIn", 400));

  const review = await Review.findById(req.params.id);

  if (!review) return next(new ErrorHandler("Review not found", 404));

  const isAuthenticUser = review.user.toString() === user._id.toString();

  if (!isAuthenticUser)
    return next(new ErrorHandler("You are not authorized", 401));

  await review.deleteOne();

  const product = await Product.findById(review.product);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  const { numOfReviews, ratings } = await findAverageRatings(product._id);

  product.ratings = ratings;

  product.numOfReviews = numOfReviews;

  await product.save();

  await invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
  });

  return res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

/*================
GENERATE FAKE DATA
==================
*/

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\b3f2e66e-946d-47ce-94bd-4c4871e7a87d.png",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ succecss: true });
// };

// const deleteRandomsProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ succecss: true });
// };

// deleteRandomsProducts(39);
// generateRandomProducts(41);
