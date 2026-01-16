const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");

// ========== ADD THIS SECTION ==========
// Admin credentials configuration
const ADMIN_CREDENTIALS = {
  email: "admin@hayroo.com", // Change this to your desired admin email
  password: "Admin@123",      // Change this to your desired admin password
};
// =====================================

class Auth {
  // ... existing isAdmin and allUser methods ...

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
        return res.status(409).json({ error });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Format name
      const formattedName = toTitleCase(name);
      
      // ========== MODIFIED: Determine user role ==========
      // Check if this is the admin email
      const isAdminEmail = email.toLowerCase().trim() === ADMIN_CREDENTIALS.email.toLowerCase();
      const userRole = isAdminEmail ? 1 : 0; // 1 = admin, 0 = customer
      // ==================================================
      
      // Create new user
      const newUser = new userModel({
        name: formattedName,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        userRole: userRole, // Dynamic role based on email
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
      // ========== MODIFIED: Check for hardcoded admin first ==========
      const emailLower = email.toLowerCase().trim();
      
      // Check if this is the admin trying to login
      if (emailLower === ADMIN_CREDENTIALS.email.toLowerCase()) {
        // Verify admin password (plain text comparison)
        if (password === ADMIN_CREDENTIALS.password) {
          // Check if admin user exists in database
          let adminUser = await userModel.findOne({ email: emailLower });
          
          // If admin doesn't exist, create it
          if (!adminUser) {
            const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 12);
            adminUser = new userModel({
              name: "Administrator",
              email: emailLower,
              password: hashedPassword,
              userRole: 1, // Admin role
            });
            await adminUser.save();
          } else if (adminUser.userRole !== 1) {
            // If user exists but is not admin, upgrade to admin
            adminUser.userRole = 1;
            await adminUser.save();
          }

          // Create JWT token for admin
          const token = jwt.sign(
            { 
              _id: adminUser._id, 
              role: 1, // Admin role
              email: adminUser.email 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          // Prepare user data
          const userData = adminUser.toObject();
          delete userData.password;

          return res.json({
            success: "Admin login successful",
            token: token,
            user: {
              _id: adminUser._id,
              role: 1,
              email: adminUser.email
            },
            userDetails: userData
          });
        } else {
          // Wrong admin password
          return res.status(401).json({
            error: "Invalid email or password",
          });
        }
      }
      // ============================================================

      // Regular user login (not admin)
      const user = await userModel.findOne({ email: emailLower });
      
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Verify password for regular users
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
        { expiresIn: '24h' }
      );

      // Prepare user data for response (without password)
      const userData = user.toObject();
      delete userData.password;

      return res.json({
        success: "Login successful",
        token: token,
        user: {
          _id: user._id,
          role: user.userRole,
          email: user.email
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
