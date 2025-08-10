// ==UserScript==
// @name         YouTube Music Scrobbler
// @namespace    http://tampermonkey.net/
// @version      0.14.0
// @license      MIT
// @description  Send YouTube Music tracks to your Last.fm scrobbler backend with centralised fetcher
// @author       Ernesto Hegi
// @match        https://music.youtube.com/*
// @grant        none
// @homepageURL  https://github.com/ernestohegi/scrobbler
// ==/UserScript==

(function () {
  "use strict";

  console.log("YouTube Music Last.fm Scrobbler");

  let lastTrack = "";
  let scrobbleTimeout = null;

  const SCROBBLE_THRESHOLD_SECONDS = 240; // 4 minutes is the maximum scrobble wait time.
  const MINIMUM_SCROBBLE_LENGTH_SECONDS = 30; // minimum track length to scrobble
  const POLLING_INTERVAL_MS = 5000; // 5 seconds
  const ENDPOINTS = {
    NOW_PLAYING: "now-playing",
    SCROBBLE: "scrobble",
  };

  // Change this to your backend URL
  const BACKEND_URL = "http://localhost:3000";

  const getDurationInSeconds = (duration) => {
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

  const getFieldValue = (classNameSelector) => {
    const element = document.querySelector(
      `.ytmusic-player-bar${classNameSelector}`
    );

    return element ? element.innerText.trim() : null;
  };

  const getTrackInfo = () => {
    const track = getFieldValue(".title");
    const byline = getFieldValue(".byline");
    const duration = getFieldValue(".time-info");

    if (!track || !byline || !duration) return null;

    // byline is usually in the format "Artist • Album • Year"
    const [artist, album] = byline
      .replace(/ • /g, "")
      .split("\n")
      .filter(Boolean);

    return {
      artist,
      album,
      track,
      duration: getDurationInSeconds(duration),
    };
  };

  const sendToBackend = async (endpoint, trackInfo) => {
    const VALID_ENDPOINTS = Object.values(ENDPOINTS);

    const { artist, track } = trackInfo || {};

    if (!VALID_ENDPOINTS.includes(endpoint)) {
      console.error(`Invalid endpoint: ${endpoint}`);
      return;
    }

    if (!artist || !track) {
      console.error("Artist and track must be provided");
      return;
    }

    const ENDPOINT_URL = `${BACKEND_URL}/${endpoint}`;

    try {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackInfo),
      });

      if (!response.ok) {
        throw new Error(`Error status ${response.status} from ${ENDPOINT_URL}`);
      }
    } catch (error) {
      console.error(`Error sending to ${ENDPOINT_URL}: ${error}`);
    }
  };

  setInterval(async () => {
    const trackInfo = getTrackInfo();

    if (!trackInfo) return;

    const { artist, track, duration } = trackInfo;

    const currentTrackKey = `${artist} - ${track}`;

    // TODO allow for track duplicates
    if (currentTrackKey === lastTrack) return;

    lastTrack = currentTrackKey;

    if (scrobbleTimeout) {
      clearTimeout(scrobbleTimeout);
      scrobbleTimeout = null;
    }

    // TODO consider wether we want to set now playing for tracks
    // that are shorter than the scrobble threshold and won't count
    // towards scrobbling.
    await sendToBackend(ENDPOINTS.NOW_PLAYING, trackInfo);

    // Tracks shorter than 30 seconds should not be scrobbled.
    if (duration < MINIMUM_SCROBBLE_LENGTH_SECONDS) return;

    // Track has played for at least half its duration
    // or the scrobble threshold, whichever is smaller.
    const scrobbleWaitTimeInSeconds = Math.min(
      SCROBBLE_THRESHOLD_SECONDS,
      Math.floor(duration / 2)
    );

    if (!scrobbleWaitTimeInSeconds) return;

    // This will trigger the scrobble after the wait time.
    scrobbleTimeout = setTimeout(async () => {
      await sendToBackend(ENDPOINTS.SCROBBLE, trackInfo);

      scrobbleTimeout = null;
    }, scrobbleWaitTimeInSeconds * 1000);
  }, POLLING_INTERVAL_MS);
})();
