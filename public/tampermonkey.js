// ==UserScript==
// @name         YouTube Music Scrobbler
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Send YouTube Music tracks to your Last.fm scrobbler backend with centralized fetcher
// @author       Ernesto Hegi
// @match        https://music.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let lastTrack = "";
  let scrobbleTimeout = null;

  const SCROBBLE_THRESHOLD_SECONDS = 120; // 2 minutes max
  const MINIMUM_SCROBBLE_LENGTH_SECONDS = 30; // minimum track length to scrobble

  // Change this to your backend URL
  const BACKEND_URL = "http://localhost:3000";

  function parseDuration(durationStr) {
    if (!durationStr) return 0;

    const parts = durationStr.split(":").map(Number);

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
  }

  function sendToBackend(endpoint, artist, track) {
    console.log(`Sending to ${endpoint}:`, artist, track);

    return fetch(`${BACKEND_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist,
        track,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch((err) => console.error(`Failed to send to ${endpoint}:`, err));
  }

  const getTrackInfo = () => {
    const title = document.querySelector(
      ".title.ytmusic-player-bar"
    )?.innerText;
    const artist = document.querySelector(
      ".byline.ytmusic-player-bar"
    )?.innerText;
    const durationStr = document.querySelector(
      "span.ytp-time-duration"
    )?.innerText;

    if (!title || !artist) return null;

    const durationSeconds = parseDuration(durationStr);

    return { artist, track: title, durationSeconds };
  };

  const checkTrack = () => {
    console.log("Polling for track info...");

    const trackInfo = getTrackInfo();

    if (!trackInfo) return;

    const currentTrackKey = `${trackInfo.artist} - ${trackInfo.track}`;

    if (currentTrackKey !== lastTrack) {
      lastTrack = currentTrackKey;

      if (scrobbleTimeout) {
        clearTimeout(scrobbleTimeout);

        scrobbleTimeout = null;
      }

      sendToBackend("nowplaying", trackInfo.artist, trackInfo.track);

      if (trackInfo.durationSeconds < MINIMUM_SCROBBLE_LENGTH_SECONDS) {
        console.log(
          "Track too short to scrobble:",
          trackInfo.durationSeconds,
          "seconds"
        );
        return;
      }

      const waitTimeSeconds = Math.min(
        SCROBBLE_THRESHOLD_SECONDS,
        Math.floor(trackInfo.durationSeconds / 2)
      );

      scrobbleTimeout = setTimeout(() => {
        sendToBackend("scrobble", trackInfo.artist, trackInfo.track);

        scrobbleTimeout = null;
      }, waitTimeSeconds * 1000);
    }
  };

  setInterval(checkTrack, 5000);
})();
