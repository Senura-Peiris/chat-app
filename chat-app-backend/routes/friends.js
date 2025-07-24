// backend/routes/friends.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Your user model

// Middleware to authenticate token (simplified)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user contains userId, email, username, etc
    next();
  });
};

// POST /api/friends/invite
router.post("/invite", authenticateToken, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Get the sender user info from DB
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Setup Nodemailer transporter with your app SMTP config
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",      // e.g. Gmail SMTP
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,      // your app email here
        pass: process.env.SMTP_PASSWORD,  // app email password or app password
      },
    });

    // Email content with Reply-To set as user email
    const mailOptions = {
      from: `"Chatme - ${user.username}" <${process.env.SMTP_USER}>`,
      to: email,
      replyTo: user.email,
      subject: `${user.username} invited you to Chatme!`,
      html: `
        <p>${user.username} (${user.email}) invited you to join Chatme 🚀</p>
        <p>Click the link below to register:</p>
        <a href="http://localhost:3000/register">Join Chatme</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: `Invite sent to ${email}` });
  } catch (error) {
    console.error("Error sending invite email:", error);
    return res.status(500).json({ message: "Failed to send invite" });
  }
});

module.exports = router;
