require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const pool = require("./Backend/db");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "Frontend")));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Passport Configuration
// ======================

// Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const [users] = await pool.query(
          "SELECT * FROM users WHERE email = ?",
          [email]
        );
        if (users.length === 0) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: (req) => {
    let token = null;
    if (req && req.cookies) token = req.cookies.token;
    return token || ExtractJWT.fromAuthHeaderAsBearerToken()(req);
  },
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JWTStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const [users] = await pool.query(
        "SELECT id, email, name FROM users WHERE id = ?",
        [jwtPayload.id]
      );
      if (users.length === 0) return done(null, false);
      return done(null, users[0]);
    } catch (error) {
      return done(error);
    }
  })
);

// Routes
// =======

// Login Endpoint
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (!user) return res.status(401).json({ error: info.message });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    res.json({
      success: true,
      redirect: "/dashboard", // Or '/profile' if you prefer
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  })(req, res, next);
});

// Protected Dashboard Route
app.get(
  "/api/dashboard",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      message: `Welcome to your dashboard, ${req.user.name}`,
      user: req.user,
    });
  }
);

// Logout Endpoint
app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, redirect: "/login" });
});

// Serve Frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend", "index.html"));
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
