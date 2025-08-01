import "dotenv/config";

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const LAST_FM_AUTH_URL = "https://www.last.fm/api/auth/";

console.log("Starting Scrobbler...");

app.use(express.json());

app.get("/", (req, res) => {
  res.redirect(`${LAST_FM_AUTH_URL}?api_key=${API_KEY}`);
});

app.get("/auth", (req, res) => {
  console.log("Received auth request:", req.query);
});

app.listen(PORT, () => {
  console.log(`Scrobbler is listening on port ${PORT}`);
});
