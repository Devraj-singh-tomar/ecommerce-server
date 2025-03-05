import mongoose, { mongo } from "mongoose";

const schema = new mongoose.Schema({
  comment: {
    type: String,
  },

  rating: {
    type: Number,
    required: [true, "Please rate this product"],
    min: [1, "Min. you can rate is 1"],
    max: [5, "Max. you can rate is 5"],
  },

  user: {
    type: String,
    ref: "User",
    required: true,
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
});

export const Review = mongoose.model("Review", schema);
