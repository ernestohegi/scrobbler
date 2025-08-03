import "dotenv/config";
import fetch from "node-fetch";
import express from "express";
import md5 from "md5";
import cors from "cors";

import { saveSession, loadSession } from "./utils/sessionStore.js";

type Session = {
  name: string;
  key: string;
  subscriber: number;
};

type Data = {
  session?: Session;
  message?: string;
  error?: number;
};

type ScrobbleData = {
  artist: string;
  track: string;
  duration: string;
};

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY!;
const AUTH_URL = "https://www.last.fm/api/auth/";
const API_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";
const SHARED_SECRET = process.env.SHARED_SECRET!;
const METHOD_NAMES = {
  AUTH_GET_SESSION: "auth.getSession",
  TRACK_SCROBBLE: "track.scrobble",
  TRACK_UPDATE_NOW_PLAYING: "track.updateNowPlaying",
};

const generateApiSignature = (params: Record<string, string>): string => {
  const concatenated = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  return md5(concatenated + SHARED_SECRET);
};

let currentSession: Session | null = null;

const app = express();

app.use(express.json());
app.use(cors());

(async () => {
  currentSession = await loadSession();
  console.log("Loaded auth token.");
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

  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const signatureParameters: Record<string, string> = {
    api_key: API_KEY,
    method: METHOD_NAMES.AUTH_GET_SESSION,
    token: token,
  };
  const apiSignature = generateApiSignature(signatureParameters);

  const urlSearchParams = new URLSearchParams({
    method: METHOD_NAMES.AUTH_GET_SESSION,
    api_key: API_KEY,
    token: token,
    api_sig: apiSignature,
    format: "json",
  });

  try {
    const response = await fetch(
      `${API_ENDPOINT}?${urlSearchParams.toString()}`
    );

    const data = (await response.json()) as Data;

    if (data.error) {
      return res.status(400).json({ error: data.message });
    }

    currentSession = data.session || null;

    if (currentSession) {
      await saveSession(currentSession);
    }

    res.json({
      message: "Authentication successful",
      session: data.session,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/scrobble", async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const data = req.body as ScrobbleData;

  if (!data || !data.artist || !data.track) {
    return res
      .status(400)
      .json({ error: "Missing required track information" });
  }

  const { artist, track } = data;

  const scrobbleParameters: Record<string, string> = {
    method: METHOD_NAMES.TRACK_SCROBBLE,
    api_key: API_KEY,
    sk: currentSession.key,
    artist: artist,
    track: track,
    timestamp: Math.floor(Date.now() / 1000),
  };

  const apiSignature = generateApiSignature(scrobbleParameters);

  const urlSearchParams = new URLSearchParams({
    ...scrobbleParameters,
    api_sig: apiSignature,
    format: "json",
  });

  console.log({ urlSearchParams });

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `${urlSearchParams}`,
    });

    const scrobble = (await response.json()) as Data;

    if (scrobble.error) {
      return res.status(400).json({ error: scrobble.message });
    }

    res.json({ message: "Track scrobbled successfully", scrobble });
  } catch (error) {
    console.error("Error sending scrobble request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/nowplaying", async (req, res) => {
  if (!currentSession) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const data = req.body as ScrobbleData;

  if (!data.artist || !data.track) {
    return res
      .status(400)
      .json({ error: "Missing required track information" });
  }

  const { artist, track, duration } = data;

  const nowPlayingParameters: Record<string, string> = {
    method: METHOD_NAMES.TRACK_UPDATE_NOW_PLAYING,
    api_key: API_KEY,
    sk: currentSession.key,
    artist,
    track,
    duration,
  };

  const apiSignature = generateApiSignature(nowPlayingParameters);

  const urlSearchParams = new URLSearchParams({
    ...nowPlayingParameters,
    api_sig: apiSignature,
    format: "json",
  });

  console.log(urlSearchParams);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `${urlSearchParams}`,
    });

    const nowPlaying = (await response.json()) as Data;

    if (nowPlaying.error) {
      return res.status(400).json({ error: nowPlaying.message });
    }

    res.json({ message: "Now playing updated", nowPlaying });
  } catch (error) {
    console.error("Error updating now playing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Scrobbler is listening on port ${PORT}`);
});
