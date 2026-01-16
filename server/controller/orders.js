const orderModel = require("../models/orders");

class Order {
  async getAllOrders(req, res) {
    try {
      let orders = await orderModel
        .find({})
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });
      
      return res.json({ 
        success: true, 
        orders,
        count: orders.length 
      });
    } catch (err) {
      console.error("Get all orders error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch orders" 
      });
    }
  }

  async getOrderByUser(req, res) {
    let { uId } = req.body;
    
    if (!uId) {
      return res.status(400).json({ 
        error: "User ID is required" 
      });
    }

    try {
      let orders = await orderModel
        .find({ user: uId })
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });
      
      return res.json({ 
        success: true, 
        orders,
        count: orders.length 
      });
    } catch (err) {
      console.error("Get user orders error:", err);
      
      // Handle invalid user ID format
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid user ID format" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to fetch user orders" 
      });
    }
  }

  async postCreateOrder(req, res) {
    let { allProduct, user, amount, transactionId, address, phone } = req.body;
    
    // Validate all required fields
    if (!allProduct || !user || !amount || !transactionId || !address || !phone) {
      return res.status(400).json({ 
        error: "All fields are required" 
      });
    }

    // Validate amount is a positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ 
        error: "Amount must be a positive number" 
      });
    }

    // Validate allProduct is an array and has items
    if (!Array.isArray(allProduct) || allProduct.length === 0) {
      return res.status(400).json({ 
        error: "Order must contain at least one product" 
      });
    }

    try {
      let newOrder = new orderModel({
        allProduct,
        user,
        amount: parsedAmount.toFixed(2), // Format to 2 decimal places
        transactionId,
        address: address.trim(),
        phone: phone.trim(),
      });
      
      let savedOrder = await newOrder.save();
      
      if (savedOrder) {
        // Populate the saved order for response
        const populatedOrder = await orderModel.findById(savedOrder._id)
          .populate("allProduct.id", "pName pImages pPrice")
          .populate("user", "name email");
        
        return res.status(201).json({ 
          success: "Order created successfully",
          order: populatedOrder,
          orderId: savedOrder._id
        });
      } else {
        return res.status(500).json({ 
          error: "Failed to save order" 
        });
      }
    } catch (err) {
      console.error("Create order error:", err);
      
      // Handle specific Mongoose errors
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: errors 
        });
      }
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid user or product ID format" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to create order" 
      });
    }
  }

  async postUpdateOrder(req, res) {
    let { oId, status } = req.body;
    
    if (!oId || !status) {
      return res.status(400).json({ 
        error: "Order ID and status are required" 
      });
    }

    // Validate status value (adjust based on your status enum)
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    try {
      // FIX: Use async/await instead of exec() callback
      const updatedOrder = await orderModel.findByIdAndUpdate(
        oId,
        {
          status: status.toLowerCase(),
          updatedAt: Date.now(),
        },
        { 
          new: true, // Return the updated document
          runValidators: true // Run schema validation
        }
      ).populate("allProduct.id", "pName pImages pPrice")
       .populate("user", "name email");

      if (!updatedOrder) {
        return res.status(404).json({ 
          error: "Order not found" 
        });
      }

      return res.json({ 
        success: "Order updated successfully",
        order: updatedOrder
      });
    } catch (err) {
      console.error("Update order error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid order ID format" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to update order" 
      });
    }
  }

  async postDeleteOrder(req, res) {
    let { oId } = req.body;
    
    if (!oId) {
      return res.status(400).json({ 
        error: "Order ID is required" 
      });
    }

    try {
      let deletedOrder = await orderModel.findByIdAndDelete(oId);
      
      if (!deletedOrder) {
        return res.status(404).json({ 
          error: "Order not found" 
        });
      }

      return res.json({ 
        success: "Order deleted successfully",
        deletedOrder: {
          id: deletedOrder._id,
          amount: deletedOrder.amount,
          status: deletedOrder.status
        }
      });
    } catch (err) {
      console.error("Delete order error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid order ID format" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to delete order" 
      });
    }
  }

  // Optional: Get single order by ID
  async getOrderById(req, res) {
    const { id } = req.params;
    
    try {
      const order = await orderModel.findById(id)
        .populate("allProduct.id", "pName pImages pPrice pDescription")
        .populate("user", "name email phone address");
      
      if (!order) {
        return res.status(404).json({ 
          error: "Order not found" 
        });
      }
      
      return res.json({ 
        success: true, 
        order 
      });
    } catch (err) {
      console.error("Get order by ID error:", err);
      
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          error: "Invalid order ID format" 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to fetch order" 
      });
    }
  }
}

const ordersController = new Order();
module.exports = ordersController;
