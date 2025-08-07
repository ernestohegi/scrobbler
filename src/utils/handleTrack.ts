import { Data, HandleTrack } from "../scrobbler.types.js";
import { generateApiSignature } from "./generateApiSignature.js";

const API_KEY = process.env.API_KEY!;
const API_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";

export const handleTrack = async ({
  res,
  message,
  method,
  scrobbleData,
  userSessionKey,
}: HandleTrack) => {
  try {
    console.log(message);

    const scrobbleParameters: Record<string, string> = {
      method,
      api_key: API_KEY,
      sk: userSessionKey,
      ...scrobbleData,
    };

    const urlSearchParams = new URLSearchParams({
      ...scrobbleParameters,
      api_sig: generateApiSignature(scrobbleParameters),
      format: "json",
    });

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
};
