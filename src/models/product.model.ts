import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter name"],
    },

    photos: [
      {
        public_id: {
          type: String,
          required: [true, "Please enter public ID"],
        },

        url: {
          type: String,
          required: [true, "Please enter url"],
        },
      },
    ],

    price: {
      type: Number,
      required: [true, "Please enter price"],
    },

    stock: {
      type: Number,
      required: [true, "Please enter stock"],
    },

    category: {
      type: String,
      required: [true, "Please add category"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Please add description"],
    },

    ratings: {
      type: Number,
      default: 0,
    },

    numOfReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", schema);
