const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const productSchema = new mongoose.Schema(
  {
    pName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    pDescription: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    pPrice: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0.01, "Price must be greater than 0"],
    },
    pSold: {
      type: Number,
      default: 0,
      min: [0, "Sold count cannot be negative"],
    },
    pQuantity: {
      type: Number,
      default: 0,
      min: [0, "Quantity cannot be negative"],
    },
    pCategory: {
      type: ObjectId,
      ref: "categories",
      required: [true, "Product category is required"],
    },
    pImages: {
      type: [String], // Changed from Array to [String]
      required: [true, "Product images are required"],
    },
    pOffer: {
      type: Number, // Changed from String to Number
      default: 0,
      min: [0, "Offer percentage cannot be negative"],
      max: [100, "Offer percentage cannot exceed 100%"],
    },
    pRatingsReviews: [
      {
        review: String,
        user: { type: ObjectId, ref: "users" },
        rating: { // Changed from String to Number
          type: Number,
          min: [1, "Rating must be at least 1"],
          max: [5, "Rating cannot exceed 5"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pStatus: {
      type: String,
      required: [true, "Product status is required"],
      enum: ["active", "inactive", "out_of_stock"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Create indexes
productSchema.index({ pName: 1 });
productSchema.index({ pCategory: 1 });
productSchema.index({ pStatus: 1 });
productSchema.index({ pPrice: 1 });

const productModel = mongoose.model("products", productSchema);
module.exports = productModel;
