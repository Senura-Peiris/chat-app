const express = require("express");
const Channel = require("../models/Friends");
const router = express.Router();

router.post("/create", async (req, res) => {
  const { name, isPrivate } = req.body;
  const channel = new Channel({ name, isPrivate });
  await channel.save();
  res.json(channel);
});

router.get("/", async (req, res) => {
  const channels = await Channel.find();
  res.json(channels);
});

module.exports = router;