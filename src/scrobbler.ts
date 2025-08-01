import "dotenv/config";
import fetch from "node-fetch";
import express from "express";
import md5 from "md5";

import type { Session, Data } from "./scrobbler.types.ts";

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY!;
const AUTH_URL = "https://www.last.fm/api/auth/";
const API_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";
const SHARED_SECRET = process.env.SHARED_SECRET;

const app = express();

let session: Session | null = null;

console.log("Starting Scrobbler...");

app.use(express.json());

app.get("/", (req, res) => {
  if (session) {
    res.json({ message: "Already authenticated", session });
    return;
  }

  // Redirect to Last.fm authentication page
  res.redirect(`${AUTH_URL}?api_key=${API_KEY}`);
});

app.get("/auth", async (req, res) => {
  if (session) {
    res.json({ message: "Already authenticated", session });
    return;
  }

  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const METHOD = "auth.getSession";

  const signatureParams: Record<string, string> = {
    api_key: API_KEY,
    method: METHOD,
    token,
  };

  const signature = Object.keys(signatureParams)
    .sort()
    .map((key) => `${key}${signatureParams[key]}`)
    .join("");

  const API_SIGNATURE = md5(`${signature}${SHARED_SECRET}`);

  const urlParams = new URLSearchParams({
    method: METHOD,
    api_key: API_KEY,
    token: token,
    api_sig: API_SIGNATURE,
    format: "json",
  });

  try {
    const response = await fetch(`${API_ENDPOINT}?${urlParams.toString()}`);

    const data: Data = (await response.json()) as Data;

    if (data.error) {
      return res.status(400).json({ error: data.message });
    }

    console.log(data);

    session = data.session || null;

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
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log("Received scrobble request:", req.body);
});

app.listen(PORT, () => {
  console.log(`Scrobbler is listening on port ${PORT}`);
});
