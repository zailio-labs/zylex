const mongoose = require("mongoose");

const customizeSchema = new mongoose.Schema(
  {
    slideImage: {
      type: String,
      required: [true, "Slide image is required"],
    },
    firstShow: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Create index for firstShow
customizeSchema.index({ firstShow: 1 });

const customizeModel = mongoose.model("customizes", customizeSchema);
module.exports = customizeModel;
