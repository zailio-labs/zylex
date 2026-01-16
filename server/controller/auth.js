const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");

class Auth {
  async isAdmin(req, res) {
    let { loggedInUserId } = req.body;
    try {
      let loggedInUserRole = await userModel.findById(loggedInUserId);
      // FIX: Added null check for user
      if (!loggedInUserRole) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ role: loggedInUserRole.userRole });
    } catch (error) {
      console.error("isAdmin error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }

  async allUser(req, res) {
    try {
      let allUser = await userModel.find({});
      res.json({ users: allUser });
    } catch (error) {
      console.error("allUser error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }

  /* User Registration/Signup controller  */
  async postSignup(req, res) {
    let { name, email, password, cPassword } = req.body;
    let error = {};
    
    // Input validation
    if (!name || !email || !password || !cPassword) {
      error = {
        ...error,
        name: "Field must not be empty",
        email: "Field must not be empty",
        password: "Field must not be empty",
        cPassword: "Field must not be empty",
      };
      return res.status(400).json({ error });
    }
    
    if (name.length < 3 || name.length > 25) {
      error = { ...error, name: "Name must be 3-25 characters" };
      return res.status(400).json({ error });
    }
    
    if (!validateEmail(email)) {
      error = {
        ...error,
        password: "",
        name: "",
        email: "Email is not valid",
      };
      return res.status(400).json({ error });
    }
    
    if (password.length < 8 || password.length > 255) {
      error = {
        ...error,
        password: "Password must be 8-255 characters",
        name: "",
        email: "",
      };
      return res.status(400).json({ error });
    }
    
    if (password !== cPassword) {
      error = {
        ...error,
        password: "Passwords do not match",
        cPassword: "Passwords do not match",
        name: "",
        email: "",
      };
      return res.status(400).json({ error });
    }

    try {
      // Check if email already exists
      const existingUser = await userModel.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        error = {
          ...error,
          password: "",
          name: "",
          email: "Email already exists",
        };
        return res.status(409).json({ error }); // 409 Conflict
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
      
      // Format name
      const formattedName = toTitleCase(name);
      
      // Create new user
      const newUser = new userModel({
        name: formattedName,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        userRole: 1, // 1 for admin, 0 for customer (as per your comment)
      });

      // Save user
      const savedUser = await newUser.save();
      
      // Remove password from response
      const userResponse = savedUser.toObject();
      delete userResponse.password;
      
      return res.status(201).json({
        success: "Account created successfully. Please login",
        user: userResponse
      });

    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ 
        error: "Registration failed. Please try again later." 
      });
    }
  }

  /* User Login/Signin controller  */
  async postSignin(req, res) {
    let { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    try {
      // Find user by email (case-insensitive)
      const user = await userModel.findOne({ 
        email: email.toLowerCase().trim() 
      });
      
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          _id: user._id, 
          role: user.userRole,
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '24h' } // Added expiration for better security
      );

      // Verify token (optional)
      const decoded = jwt.verify(token, JWT_SECRET);

      // Prepare user data for response (without password)
      const userData = user.toObject();
      delete userData.password;

      return res.json({
        success: "Login successful",
        token: token,
        user: {
          _id: decoded._id,
          role: decoded.role,
          email: decoded.email
        },
        userDetails: userData
      });

    } catch (error) {
      console.error("Signin error:", error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(500).json({ error: "Token generation failed" });
      }
      
      return res.status(500).json({ 
        error: "Login failed. Please try again later." 
      });
    }
  }
}

const authController = new Auth();
module.exports = authController;
