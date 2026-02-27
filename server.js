const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// ✅ MongoDB Connect
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Error:", err));

// ✅ Simple Schema
const videoSchema = new mongoose.Schema({
  title: String,
  url: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Video = mongoose.model("Video", videoSchema);

// ✅ Home Route
app.get("/", (req, res) => {
  res.send("YouTube Tracker Server Running 🚀");
});

// ✅ Get All Videos
app.get("/videos", async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Error fetching videos" });
  }
});

// ✅ Add Video
app.post("/add-video", async (req, res) => {
  try {
    const { title, url } = req.body;
    const newVideo = new Video({ title, url });
    await newVideo.save();
    res.json({ message: "Video Added Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error adding video" });
  }
});

// ✅ Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
