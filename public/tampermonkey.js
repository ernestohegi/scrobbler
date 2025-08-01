// ==UserScript==
// @name         YouTube Music Scrobbler
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Send YouTube Music tracks to your Last.fm scrobbler backend
// @author       You
// @match        https://music.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let lastTrack = "";

  const sendToBackend = (artist, track) => {
    console.log("Sending to backend:", artist, track);

    fetch("http://localhost:3000/scrobble", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist,
        track,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch((err) => console.error("Failed to scrobble:", err));
  };

  const getTrackInfo = () => {
    const title = document.querySelector(
      ".title.ytmusic-player-bar"
    )?.innerText;
    const artist = document.querySelector(
      ".byline.ytmusic-player-bar"
    )?.innerText;

    if (title && artist) {
      const currentTrack = `${artist} - ${title}`;

      if (currentTrack !== lastTrack) {
        lastTrack = currentTrack;

        console.log("New track detected:", currentTrack);

        sendToBackend(artist, title);
      }
    }
  };

  // Poll every 5 seconds
  setInterval(() => {
    console.log("Polling...");

    getTrackInfo();
  }, 5000);
})();
