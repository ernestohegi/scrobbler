import { Request, Response } from "express";
import { loadSession } from "../utils/sessionStore.js";

const AUTH_URL = "https://www.last.fm/api/auth/";
const API_KEY = process.env.API_KEY!;

export const HomeRoute = async (req: Request, res: Response) => {
  const currentSession = await loadSession();

  if (currentSession) {
    res.json({ message: "Already authenticated", session: currentSession });
    return;
  }

  res.redirect(`${AUTH_URL}?api_key=${API_KEY}`);
};
