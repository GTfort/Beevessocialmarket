require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT;

// Middleware
app.use(express.static(path.join(__dirname, "Frontend")));
app.use(cookieParser());
app.use(express.json());

// Mock database (replace with real DB in production)
const users = [
  {
    id: 1,
    email: "user@example.com",
    password: "password123", // Hashed password
    name: "Test User",
  },
];

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-very-secure-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    // Find user by email
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare passwords
    const passwordMatch = password === user.password;
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: remember ? "7d" : JWT_EXPIRES_IN,
    });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : undefined, // 7 days if remember me
      sameSite: "strict",
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

// Validate token endpoint
app.get("/api/validate-token", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

// User data endpoint (example)
app.get("/api/user", authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

// Google OAuth initialization (example)
app.get("/auth/google", (req, res) => {
  // In a real app, this would redirect to Google's OAuth endpoint
  res.json({ message: "Google OAuth would be initiated here" });
});

// Google OAuth callback (example)
app.get("/auth/google/callback", (req, res) => {
  // In a real app, this would handle the OAuth callback
  res.json({ message: "Google OAuth callback would be handled here" });
});

// Password reset endpoints (example)
app.post("/api/forgot-password", (req, res) => {
  // In a real app, this would send a password reset email
  res.json({ message: "Password reset email would be sent here" });
});

app.post("/api/reset-password", (req, res) => {
  // In a real app, this would handle password reset
  res.json({ message: "Password would be reset here" });
});

// Protect HTML files for authenticated routes
app.get(
  ["/pages/dashboard.html", "/pages/profile.html", "/pages/history.html"],
  authenticateToken,
  express.static(path.join(__dirname, "Frontend"))
);

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
