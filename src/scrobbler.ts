import "dotenv/config";
import express from "express";
import cors from "cors";

import { loadSession } from "./utils/sessionStore.js";

import { Session, ScrobbleData } from "./scrobbler.types.js";
import { METHOD_NAMES } from "./scrobbler.consts.js";
import { handleTrack } from "./utils/handleTrack.js";
import { handleAuth } from "./utils/handleAuth.js";

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY!;
const AUTH_URL = "https://www.last.fm/api/auth/";

let currentSession: Session | null = null;

const app = express();

app.use(express.json());
app.use(cors());

(async () => {
  currentSession = await loadSession();

  if (currentSession) {
    console.log(`Loaded session for user: ${currentSession.name}`);
  } else {
    console.log(`No session found, please log in.`);
  }
})();

console.log("Starting Scrobbler...");

app.get("/", (req, res) => {
  if (currentSession) {
    res.json({ message: "Already authenticated", session: currentSession });
    return;
  }

  res.redirect(`${AUTH_URL}?api_key=${API_KEY}`);
});

app.get("/auth", async (req, res) => {
  if (currentSession) {
    res.json({ message: "Already authenticated", session: currentSession });
    return;
  }

  await handleAuth({
    req,
    res,
  });
});

app.post("/nowplaying", async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Parse the reuest with Zod to confirm the data structure.
  const scrobbleData = req.body as ScrobbleData;

  if (!scrobbleData.artist || !scrobbleData.track) {
    return res
      .status(400)
      .json({ error: "Missing required track information" });
  }

  const { artist, track, album } = scrobbleData;

  await handleTrack({
    res,
    message: `Updating now playing: ${artist} - ${album} - ${track}`,
    method: METHOD_NAMES.TRACK_UPDATE_NOW_PLAYING,
    scrobbleData,
    userSessionKey: currentSession.key,
  });
});

app.post("/scrobble", async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const scrobbleData = req.body as ScrobbleData;

  if (!scrobbleData.artist || !scrobbleData.track) {
    return res
      .status(400)
      .json({ error: "Missing required track information" });
  }

  await handleTrack({
    res,
    message: "Scrobbled.",
    method: METHOD_NAMES.TRACK_SCROBBLE,
    scrobbleData: {
      ...scrobbleData,
      timestamp: Math.floor(Date.now() / 1000).toString(),
    },
    userSessionKey: currentSession.key,
  });
});

app.listen(PORT, () => {
  console.log(`Scrobbler is listening on port ${PORT}`);
});
