const productModel = require("../models/products");
const fs = require("fs");
const path = require("path");

class Product {
  // Delete Image from uploads -> products folder
  static async deleteImages(images, mode) {
    const basePath = path.join(__dirname, "../../public/uploads/products/");
    
    for (const image of images) {
      let filePath;
      if (mode === "file") {
        filePath = path.join(basePath, image.filename);
      } else {
        filePath = path.join(basePath, image);
      }
      
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted image: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error deleting image ${filePath}:`, err.message);
      }
    }
  }

  async getAllProduct(req, res) {
    try {
      let products = await productModel
        .find({})
        .populate("pCategory", "_id cName")
        .sort({ _id: -1 });
      
      return res.json({ 
        success: true, 
        products,
        count: products.length 
      });
    } catch (err) {
      console.error("Get all products error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch products" 
      });
    }
  }

  async postAddProduct(req, res) {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: "Product images are required" 
      });
    }

    let { pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus } = req.body;
    let images = req.files;
    
    // Validate all required fields
    if (!pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
      await Product.deleteImages(images, "file");
      return res.status(400).json({ 
        error: "All fields are required" 
      });
    }
    
    // Validate field lengths
    if (pName.length > 255 || pDescription.length > 3000) {
      await Product.deleteImages(images, "file");
      return res.status(400).json({
        error: "Name must be ≤ 255 characters & Description ≤ 3000 characters"
      });
    }
    
    // Validate exactly 2 images
    if (images.length !== 2) {
      await Product.deleteImages(images, "file");
      return res.status(400).json({ 
        error: "Exactly 2 images are required" 
      });
    }

    // Validate numeric fields
    const price = parseFloat(pPrice);
    const quantity = parseInt(pQuantity);
    const offer = pOffer ? parseFloat(pOffer) : 0;
    
    if (isNaN(price) || price <= 0) {
      await Product.deleteImages(images, "file");
      return res.status(400).json({ 
        error: "Price must be a positive number" 
      });
    }
    
    if (isNaN(quantity) || quantity < 0) {
      await Product.deleteImages(images, "file");
      return res.status(400).json({ 
        error: "Quantity must be a non-negative number" 
      });
    }
    
    if (isNaN(offer) || offer < 0 || offer > 100) {
      await Product.deleteImages(images, "file");
      return res.status(400).json({ 
        error: "Offer must be between 0 and 100" 
      });
    }

    try {
      let allImages = images.map(img => img.filename);
      
      let newProduct = new productModel({
        pImages: allImages,
        pName: pName.trim(),
        pDescription: pDescription.trim(),
        pPrice: price.toFixed(2),
        pQuantity: quantity,
        pCategory,
        pOffer: offer,
        pStatus,
      });

      let savedProduct = await newProduct.save();
      
      return res.status(201).json({ 
        success: "Product created successfully",
        product: {
          id: savedProduct._id,
          name: savedProduct.pName,
          images: savedProduct.pImages,
          price: savedProduct.pPrice
        }
      });
    } catch (err) {
      console.error("Add product error:", err);
      await Product.deleteImages(images, "file");
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: errors 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to create product" 
      });
    }
  }

  async postEditProduct(req, res) {
    let {
      pId,
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      pOffer,
      pStatus,
      pImages,
    } = req.body;
    
    let editImages = req.files || [];

    // Validate required fields
    if (!pId || !pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
      if (editImages.length > 0) {
        await Product.deleteImages(editImages, "file");
      }
      return res.status(400).json({ 
        error: "All fields are required" 
      });
    }
    
    // Validate field lengths
    if (pName.length > 255 || pDescription.length > 3000) {
      if (editImages.length > 0) {
        await Product.deleteImages(editImages, "file");
      }
      return res.status(400).json({
        error: "Name must be ≤ 255 characters & Description ≤ 3000 characters"
      });
    }
    
    // Validate image count
    if (editImages.length === 1) {
      await Product.deleteImages(editImages, "file");
      return res.status(400).json({ 
        error: "Must provide exactly 2 images or none to keep existing" 
      });
    }

    try {
      // Check if product exists
      const existingProduct = await productModel.findById(pId);
      if (!existingProduct) {
        if (editImages.length > 0) {
          await Product.deleteImages(editImages, "file");
        }
        return res.status(404).json({ 
          error: "Product not found" 
        });
      }

      let editData = {
        pName: pName.trim(),
        pDescription: pDescription.trim(),
        pPrice: parseFloat(pPrice).toFixed(2),
        pQuantity: parseInt(pQuantity),
        pCategory,
        pOffer: pOffer ? parseFloat(pOffer) : 0,
        pStatus,
      };

      // Handle image update
      if (editImages.length === 2) {
        let allEditImages = editImages.map(img => img.filename);
        editData.pImages = allEditImages;
        
        // Delete old images
        if (pImages) {
          const oldImages = pImages.split(',').filter(img => img.trim() !== '');
          await Product.deleteImages(oldImages, "string");
        }
      }

      // FIX: Use async/await instead of exec() callback
      const updatedProduct = await productModel.findByIdAndUpdate(
        pId,
        editData,
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validation
        }
      );

      return res.json({ 
        success: "Product updated successfully",
        product: updatedProduct
      });
    } catch (err) {
      console.error("Edit product error:", err);
      
      // Cleanup uploaded files on error
      if (editImages.length > 0) {
        await Product.deleteImages(editImages, "file");
      }
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid product ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to update product" 
      });
    }
  }

  async getDeleteProduct(req, res) {
    let { pId } = req.body;
    
    if (!pId) {
      return res.status(400).json({ 
        error: "Product ID is required" 
      });
    }

    try {
      // Find product first to get image names
      const productToDelete = await productModel.findById(pId);
      
      if (!productToDelete) {
        return res.status(404).json({ 
          error: "Product not found" 
        });
      }

      // Delete product from database
      const deletedProduct = await productModel.findByIdAndDelete(pId);
      
      if (deletedProduct) {
        // Delete images from filesystem
        await Product.deleteImages(productToDelete.pImages, "string");
        
        return res.json({ 
          success: "Product deleted successfully",
          deletedProduct: {
            id: deletedProduct._id,
            name: deletedProduct.pName
          }
        });
      }
    } catch (err) {
      console.error("Delete product error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid product ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to delete product" 
      });
    }
  }

  async getSingleProduct(req, res) {
    let { pId } = req.body;
    
    if (!pId) {
      return res.status(400).json({ 
        error: "Product ID is required" 
      });
    }

    try {
      let singleProduct = await productModel
        .findById(pId)
        .populate("pCategory", "cName")
        .populate("pRatingsReviews.user", "name email userImage");
      
      if (!singleProduct) {
        return res.status(404).json({ 
          error: "Product not found" 
        });
      }
      
      return res.json({ 
        success: true, 
        product: singleProduct 
      });
    } catch (err) {
      console.error("Get single product error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid product ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to fetch product" 
      });
    }
  }

  async getProductByCategory(req, res) {
    let { catId } = req.body;
    
    if (!catId) {
      return res.status(400).json({ 
        error: "Category ID is required" 
      });
    }

    try {
      let products = await productModel
        .find({ pCategory: catId })
        .populate("pCategory", "cName");
      
      return res.json({ 
        success: true, 
        products,
        count: products.length 
      });
    } catch (err) {
      console.error("Get products by category error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid category ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to fetch products" 
      });
    }
  }

  async getProductByPrice(req, res) {
    let { price } = req.body;
    
    if (!price) {
      return res.status(400).json({ 
        error: "Price filter is required" 
      });
    }

    const maxPrice = parseFloat(price);
    if (isNaN(maxPrice) || maxPrice <= 0) {
      return res.status(400).json({ 
        error: "Price must be a positive number" 
      });
    }

    try {
      let products = await productModel
        .find({ pPrice: { $lt: maxPrice } })
        .populate("pCategory", "cName")
        .sort({ pPrice: -1 });
      
      return res.json({ 
        success: true, 
        products,
        count: products.length,
        maxPrice 
      });
    } catch (err) {
      console.error("Get products by price error:", err);
      return res.status(500).json({ 
        error: "Failed to filter products" 
      });
    }
  }

  async getWishProduct(req, res) {
    let { productArray } = req.body;
    
    if (!productArray || !Array.isArray(productArray)) {
      return res.status(400).json({ 
        error: "Product array is required" 
      });
    }

    try {
      let wishProducts = await productModel.find({
        _id: { $in: productArray }
      });
      
      return res.json({ 
        success: true, 
        products: wishProducts,
        count: wishProducts.length 
      });
    } catch (err) {
      console.error("Get wish products error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch wishlist products" 
      });
    }
  }

  async getCartProduct(req, res) {
    let { productArray } = req.body;
    
    if (!productArray || !Array.isArray(productArray)) {
      return res.status(400).json({ 
        error: "Product array is required" 
      });
    }

    try {
      let cartProducts = await productModel.find({
        _id: { $in: productArray }
      });
      
      return res.json({ 
        success: true, 
        products: cartProducts,
        count: cartProducts.length 
      });
    } catch (err) {
      console.error("Get cart products error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch cart products" 
      });
    }
  }

  async postAddReview(req, res) {
    let { pId, uId, rating, review } = req.body;
    
    if (!pId || !rating || !review || !uId) {
      return res.status(400).json({ 
        error: "All fields are required" 
      });
    }

    // Validate rating
    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ 
        error: "Rating must be between 1 and 5" 
      });
    }

    try {
      // Check if product exists
      const product = await productModel.findById(pId);
      if (!product) {
        return res.status(404).json({ 
          error: "Product not found" 
        });
      }

      // Check if user already reviewed
      const existingReview = product.pRatingsReviews.find(
        item => item.user.toString() === uId
      );
      
      if (existingReview) {
        return res.status(409).json({ 
          error: "You have already reviewed this product" 
        });
      }

      // FIX: Use async/await instead of exec() callback
      const updatedProduct = await productModel.findByIdAndUpdate(
        pId,
        {
          $push: {
            pRatingsReviews: {
              review: review.trim(),
              user: uId,
              rating: ratingNum,
            },
          },
        },
        { new: true, runValidators: true }
      ).populate("pRatingsReviews.user", "name email");

      return res.json({ 
        success: "Thanks for your review",
        review: updatedProduct.pRatingsReviews.slice(-1)[0] // Get the newly added review
      });
    } catch (err) {
      console.error("Add review error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid product or user ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to add review" 
      });
    }
  }

  async deleteReview(req, res) {
    let { rId, pId } = req.body;
    
    if (!rId || !pId) {
      return res.status(400).json({ 
        error: "Review ID and Product ID are required" 
      });
    }

    try {
      // FIX: Use async/await instead of exec() callback
      const updatedProduct = await productModel.findByIdAndUpdate(
        pId,
        {
          $pull: { pRatingsReviews: { _id: rId } },
        },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ 
          error: "Product not found" 
        });
      }

      return res.json({ 
        success: "Your review has been deleted",
        productId: pId
      });
    } catch (err) {
      console.error("Delete review error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid product or review ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to delete review" 
      });
    }
  }
}

const productController = new Product();
module.exports = productController;
