import "dotenv/config";
import fetch from "node-fetch";
import express from "express";
import md5 from "md5";
import cors from "cors";

import type { Session, Data, ScrobbleData } from "./scrobbler.types.ts";

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY!;
const AUTH_URL = "https://www.last.fm/api/auth/";
const API_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";
const SHARED_SECRET = process.env.SHARED_SECRET!;

const app = express();

let currentSession: Session | null = null;

console.log("Starting Scrobbler...");

app.use(express.json());
app.use(cors());

function generateApiSignature(params: Record<string, string>): string {
  const concatenatedString = Object.keys(params)
    .sort()
    .map((key) => key + params[key])
    .join("");

  return md5(concatenatedString + SHARED_SECRET);
}

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

  const methodName = "auth.getSession";

  const signatureParameters: Record<string, string> = {
    api_key: API_KEY,
    method: methodName,
    token: token,
  };

  const apiSignature = generateApiSignature(signatureParameters);

  const urlSearchParams = new URLSearchParams({
    method: methodName,
    api_key: API_KEY,
    token: token,
    api_sig: apiSignature,
    format: "json",
  });

  try {
    const response = await fetch(
      `${API_ENDPOINT}?${urlSearchParams.toString()}`
    );

    const data: Data = (await response.json()) as Data;

    if (data.error) {
      return res.status(400).json({ error: data.message });
    }

    console.log("Authentication response from Last.fm:", data);

    currentSession = data.session || null;

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
  const scrobbleData = req.body as ScrobbleData;

  if (!currentSession) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!scrobbleData.artist || !scrobbleData.track || !scrobbleData.timestamp) {
    return res
      .status(400)
      .json({ error: "Missing required track information" });
  }

  const artistName = scrobbleData.artist.split("\n")[0].trim();

  const methodName = "track.scrobble";

  const scrobbleParameters: Record<string, string> = {
    method: methodName,
    api_key: API_KEY,
    sk: currentSession.key,
    artist: artistName,
    track: scrobbleData.track,
    timestamp: scrobbleData.timestamp.toString(),
  };

  const apiSignature = generateApiSignature(scrobbleParameters);

  const urlSearchParams = new URLSearchParams({
    ...scrobbleParameters,
    api_sig: apiSignature,
    format: "json",
  });

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlSearchParams.toString(),
    });

    const data = (await response.json()) as Data;

    console.log("Last.fm scrobble response:", data);

    if (data.error) {
      return res.status(400).json({ error: data.message });
    }

    res.json({ message: "Track scrobbled successfully", data });
  } catch (error) {
    console.error("Error sending scrobble request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/nowplaying", async (req, res) => {
  const nowPlayingData = req.body as ScrobbleData;

  if (!currentSession) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!nowPlayingData.artist || !nowPlayingData.track) {
    return res
      .status(400)
      .json({ error: "Missing required track information" });
  }

  const artistName = nowPlayingData.artist.split("\n")[0].trim();

  const methodName = "track.updateNowPlaying";

  const nowPlayingParameters: Record<string, string> = {
    method: methodName,
    api_key: API_KEY,
    sk: currentSession.key,
    artist: artistName,
    track: nowPlayingData.track,
  };

  const apiSignature = generateApiSignature(nowPlayingParameters);

  const urlSearchParams = new URLSearchParams({
    ...nowPlayingParameters,
    api_sig: apiSignature,
    format: "json",
  });

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlSearchParams.toString(),
    });

    const data = (await response.json()) as Data;

    if (data.error) {
      return res.status(400).json({ error: data.message });
    }

    res.json({ message: "Now playing updated", data });
  } catch (error) {
    console.error("Error updating now playing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Scrobbler is listening on port ${PORT}`);
});
