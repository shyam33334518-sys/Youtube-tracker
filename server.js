const express = require("express");

const app = express();

// Home route
app.get("/", (req, res) => {
  res.send("Server Working ✅");
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
