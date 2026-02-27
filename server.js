const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ===== MongoDB Connect =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== Schema =====
const historySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  views: Number,
  likes: Number
});

const videoSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  channel: String,
  thumbnail: String,
  trackingUntil: Date,
  history: [historySchema]
});

const Video = mongoose.model("Video", videoSchema);

// ===== YouTube Fetch =====
async function fetchVideo(videoId) {
  const res = await axios.get(
    "https://www.googleapis.com/youtube/v3/videos",
    {
      params: {
        part: "snippet,statistics",
        id: videoId,
        key: process.env.YOUTUBE_API_KEY
      }
    }
  );

  const item = res.data.items[0];

  return {
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.high.url,
    views: Number(item.statistics.viewCount),
    likes: Number(item.statistics.likeCount || 0)
  };
}

// ===== Add Video API =====
app.post("/add", async (req, res) => {
  const { videoId } = req.body;

  await Video.deleteMany(); // Only 1 video allowed

  const data = await fetchVideo(videoId);

  const now = new Date();

  await Video.create({
    videoId,
    title: data.title,
    channel: data.channel,
    thumbnail: data.thumbnail,
    trackingUntil: new Date(now.getTime() + 26 * 60 * 60 * 1000),
    history: []
  });

  res.json({ success: true });
});

// ===== Get Current Data =====
app.get("/status", async (req, res) => {
  const video = await Video.findOne();
  res.json(video);
});

// ===== 5 Minute Cron Job =====
cron.schedule("*/5 * * * *", async () => {
  const video = await Video.findOne();
  if (!video) return;

  if (new Date() > video.trackingUntil) {
    await Video.deleteMany();
    console.log("Video auto deleted after 26 hours");
    return;
  }

  try {
    const data = await fetchVideo(video.videoId);

    video.history.push({
      views: data.views,
      likes: data.likes
    });

    await video.save();
    console.log("Updated:", new Date());
  } catch (err) {
    console.log("Fetch error");
  }
});
app.get("/", (req, res) => {
  res.send("YouTube Tracker Server Running 🚀");
});
app.listen(PORT, () => console.log("Server running"));
