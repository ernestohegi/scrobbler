// ==UserScript==
// @name         YouTube Music Scrobbler
// @namespace    http://tampermonkey.net/
// @version      0.10.0
// @description  Send YouTube Music tracks to your Last.fm scrobbler backend with centralised fetcher
// @author       Ernesto Hegi
// @match        https://music.youtube.com/*
// @grant        none
// @homepageURL  https://github.com/ernestohegi/scrobbler
// ==/UserScript==

(function () {
  "use strict";

  let lastTrack = "";
  let scrobbleTimeout = null;

  const SCROBBLE_THRESHOLD_SECONDS = 240; // 4 minutes is the maximum scrobble wait time.
  const MINIMUM_SCROBBLE_LENGTH_SECONDS = 30; // minimum track length to scrobble
  const POLLING_INTERVAL_MS = 5000; // 5 seconds
  const ENDPOINTS = {
    NOW_PLAYING: "nowplaying",
    SCROBBLE: "scrobble",
  };

  // Change this to your backend URL
  const BACKEND_URL = "http://localhost:3000";

  const getDuration = (duration) => {
    if (!duration) return 0;

    // Handle "current / total" format (e.g. "0:38 / 4:20")
    if (duration.includes(" / ")) {
      duration = duration.split(" / ")[1].trim();
    }

    const parts = duration.split(":").map(Number);

    let length = 0;

    if (parts.length === 2) {
      // Handle MM:SS format
      length = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // Handle HH:MM:SS format
      length = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return length;
  };

  const getArtist = (artist) => {
    if (!artist) return "";

    return artist.split("\n")[0].trim();
  };

  const getFieldValue = (classNameSelector) => {
    const element = document.querySelector(
      `.ytmusic-player-bar${classNameSelector}`
    );

    return element ? element.innerText.trim() : null;
  };

  const getTrackInfo = () => {
    const title = getFieldValue(".title");
    const artist = getFieldValue(".byline");
    const duration = getFieldValue(".time-info");

    if (!title || !artist || !duration) return null;

    return {
      artist: getArtist(artist),
      track: title,
      durationSeconds: getDuration(duration),
    };
  };

  const sendToBackend = async (endpoint, trackInfo) => {
    const VALID_ENDPOINTS = Object.values(ENDPOINTS);
    const UNKNOWN = "unknown";

    const { artist, track } = trackInfo || {};

    if (!VALID_ENDPOINTS.includes(endpoint)) {
      console.error(`Invalid endpoint: ${endpoint}`);
      return;
    }

    if (!artist || !track) {
      console.error(
        `Artist and track must be provided: ${artist || UNKNOWN}, ${
          track || UNKNOWN
        }`
      );
      return;
    }

    const ENDPOINT_URL = `${BACKEND_URL}/${endpoint}`;

    console.log(`Sending to ${ENDPOINT_URL}: ${artist} - ${track}`);

    try {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist,
          track,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error status ${response.status} from ${ENDPOINT_URL}`);
      }

      const data = await response.json();

      console.log(`Response from ${ENDPOINT_URL}: ${data}`);
    } catch (error) {
      console.error(`Error sending to ${ENDPOINT_URL}: ${error}`);
    }
  };

  setInterval(async () => {
    console.log("YouTube Music Last.fm Scrobbler");
    console.log("Polling for track info...");

    const trackInfo = getTrackInfo();

    if (!trackInfo) {
      console.log("No track info found. Skipping scrobble.");
      return;
    }

    const { artist, track, duration } = trackInfo;

    // TODO consider wether we want to set now playing for tracks
    // that are shorter than the scrobble threshold and won't count
    // towards scrobbling.
    await sendToBackend(ENDPOINTS.NOW_PLAYING, trackInfo);

    const currentTrackKey = `${artist} - ${track}`;

    if (currentTrackKey !== lastTrack) return false;

    lastTrack = currentTrackKey;

    if (scrobbleTimeout) {
      clearTimeout(scrobbleTimeout);
      scrobbleTimeout = null;
    }

    // Tracks shorter than 30 seconds should not be scrobbled.
    if (duration < MINIMUM_SCROBBLE_LENGTH_SECONDS) {
      console.log(`Track too short to scrobble: ${duration} seconds`);
      return;
    }

    // Track has played for at least half its duration
    // or the scrobble threshold, whichever is smaller.
    const scrobbleWaitTimeInSeconds = Math.min(
      SCROBBLE_THRESHOLD_SECONDS,
      Math.floor(duration / 2)
    );

    // This will trigger the scrobble after the wait time.
    scrobbleTimeout = setTimeout(async () => {
      await sendToBackend(ENDPOINTS.SCROBBLE, trackInfo);

      scrobbleTimeout = null;
    }, scrobbleWaitTimeInSeconds * 1000);
  }, POLLING_INTERVAL_MS);
})();
