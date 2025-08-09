import { Request, Response } from "express";

import { loadSession } from "../utils/sessionStore.js";
import { ScrobbleData } from "../scrobbler.types.js";
import { handleTrack } from "../utils/handleTrack.js";
import { METHOD_NAMES } from "../scrobbler.consts.js";

export const ScrobbleRoute = async (req: Request, res: Response) => {
  const currentSession = await loadSession();

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
};
