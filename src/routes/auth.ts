import { Request, Response } from "express";

import { loadSession, saveSession } from "../utils/sessionStore.js";
import { generateApiSignature } from "../utils/generateApiSignature.js";
import { METHOD_NAMES } from "../scrobbler.consts.js";
import { Data } from "../scrobbler.types.js";

const API_KEY = process.env.API_KEY!;
const API_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";

export const AuthRoute = async (req: Request, res: Response) => {
  const currentSession = await loadSession();

  if (currentSession) {
    res.json({ message: "Already authenticated", session: currentSession });
    return;
  }

  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const apiSignature = generateApiSignature({
      api_key: API_KEY,
      method: METHOD_NAMES.AUTH_GET_SESSION,
      token: token,
    });

    const urlSearchParams = new URLSearchParams({
      method: METHOD_NAMES.AUTH_GET_SESSION,
      api_key: API_KEY,
      token: token,
      api_sig: apiSignature,
      format: "json",
    });

    const response = await fetch(`${API_ENDPOINT}?${urlSearchParams}`);

    const data = (await response.json()) as Data;

    if (data.error) {
      return res.status(400).json({ error: data.message });
    }

    if (data.session) {
      await saveSession(data.session);
    }

    res.json({
      message: "Authentication successful",
      session: data.session,
    });
  } catch (error) {
    console.error("Error fetching session:", error);

    res.status(500).json({ error: "Internal server error" });
  }
};
