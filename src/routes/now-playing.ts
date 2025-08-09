import { Request, Response } from "express";

import { METHOD_NAMES } from "../scrobbler.consts.js";
import { ScrobbleData } from "../scrobbler.types.js";
import { handleTrack } from "../utils/handleTrack.js";
import { loadSession } from "../utils/sessionStore.js";

export const NowPlayingRoute = async (req: Request, res: Response) => {
  const currentSession = await loadSession();

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
};
