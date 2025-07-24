const express = require("express");
const Message = require("../models/Message");
const router = express.Router();

router.get("/:channelId", async (req, res) => {
  const messages = await Message.find({ channelId: req.params.channelId });
  res.json(messages);
});

module.exports = router;