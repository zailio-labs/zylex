const { toTitleCase } = require("../config/function");
const categoryModel = require("../models/categories");
const fs = require("fs");
const path = require("path");

class Category {
  async getAllCategory(req, res) {
    try {
      let categories = await categoryModel.find({}).sort({ _id: -1 });
      return res.json({ success: true, categories });
    } catch (err) {
      console.error("Get all categories error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch categories" 
      });
    }
  }

  async postAddCategory(req, res) {
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({ 
        error: "Category image is required" 
      });
    }

    let { cName, cDescription, cStatus } = req.body;
    let cImage = req.file.filename;
    
    // Path fix for cross-platform compatibility
    const filePath = path.join(__dirname, `../public/uploads/categories/${cImage}`);

    // Validate all required fields
    if (!cName || !cDescription || !cStatus) {
      // Clean up uploaded file if validation fails
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkErr) {
        console.error("Failed to delete file:", unlinkErr);
      }
      
      return res.status(400).json({ 
        error: "All fields are required" 
      });
    }

    try {
      // Format category name
      cName = toTitleCase(cName.trim());
      
      // Check if category already exists (case-insensitive)
      const checkCategoryExists = await categoryModel.findOne({ 
        cName: { $regex: new RegExp(`^${cName}$`, 'i') } 
      });
      
      if (checkCategoryExists) {
        // Clean up uploaded file
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (unlinkErr) {
          console.error("Failed to delete file:", unlinkErr);
        }
        
        return res.status(409).json({ 
          error: "Category already exists" 
        });
      }

      // Create new category
      const newCategory = new categoryModel({
        cName,
        cDescription: cDescription.trim(),
        cStatus,
        cImage,
      });

      // Save category
      const savedCategory = await newCategory.save();
      
      return res.status(201).json({ 
        success: "Category created successfully",
        category: {
          id: savedCategory._id,
          name: savedCategory.cName,
          image: savedCategory.cImage
        }
      });

    } catch (err) {
      console.error("Add category error:", err);
      
      // Clean up uploaded file on error
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkErr) {
        console.error("Failed to delete file:", unlinkErr);
      }
      
      return res.status(500).json({ 
        error: "Failed to create category" 
      });
    }
  }

  async postEditCategory(req, res) {
    let { cId, cDescription, cStatus } = req.body;
    
    // Validate input
    if (!cId || !cDescription || !cStatus) {
      return res.status(400).json({ 
        error: "All fields are required" 
      });
    }

    try {
      // Check if category exists
      const categoryExists = await categoryModel.findById(cId);
      if (!categoryExists) {
        return res.status(404).json({ 
          error: "Category not found" 
        });
      }

      // Update category
      const updatedCategory = await categoryModel.findByIdAndUpdate(
        cId,
        {
          cDescription: cDescription.trim(),
          cStatus,
          updatedAt: Date.now(),
        },
        { 
          new: true, // Return the updated document
          runValidators: true // Run schema validation on update
        }
      );

      if (updatedCategory) {
        return res.json({ 
          success: "Category updated successfully",
          category: updatedCategory
        });
      } else {
        return res.status(500).json({ 
          error: "Failed to update category" 
        });
      }
    } catch (err) {
      console.error("Edit category error:", err);
      
      // Handle specific errors
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid category ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to update category" 
      });
    }
  }

  async getDeleteCategory(req, res) {
    let { cId } = req.body;
    
    if (!cId) {
      return res.status(400).json({ 
        error: "Category ID is required" 
      });
    }

    try {
      // Find category to get image filename
      const categoryToDelete = await categoryModel.findById(cId);
      
      if (!categoryToDelete) {
        return res.status(404).json({ 
          error: "Category not found" 
        });
      }

      // Path fix for cross-platform compatibility
      const filePath = path.join(__dirname, `../public/uploads/categories/${categoryToDelete.cImage}`);
      
      // Delete category from database
      const deletedCategory = await categoryModel.findByIdAndDelete(cId);
      
      if (deletedCategory) {
        // Delete image file
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (unlinkErr) {
          console.error("Failed to delete image file:", unlinkErr);
          // Don't fail the request if file deletion fails
        }
        
        return res.json({ 
          success: "Category deleted successfully",
          deletedCategory: {
            id: deletedCategory._id,
            name: deletedCategory.cName
          }
        });
      } else {
        return res.status(500).json({ 
          error: "Failed to delete category" 
        });
      }
    } catch (err) {
      console.error("Delete category error:", err);
      
      // Handle specific errors
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid category ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to delete category" 
      });
    }
  }

  // Optional: Get single category by ID
  async getCategoryById(req, res) {
    const { id } = req.params;
    
    try {
      const category = await categoryModel.findById(id);
      
      if (!category) {
        return res.status(404).json({ 
          error: "Category not found" 
        });
      }
      
      return res.json({ 
        success: true, 
        category 
      });
    } catch (err) {
      console.error("Get category error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid category ID" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to fetch category" 
      });
    }
  }
}

const categoryController = new Category();
module.exports = categoryController;
