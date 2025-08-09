import "dotenv/config";
import express from "express";
import cors from "cors";

import { loadSession } from "./utils/sessionStore.js";

import {
  AuthRoute,
  HomeRoute,
  NowPlayingRoute,
  ScrobbleRoute,
} from "./routes/index.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors());

console.log("Starting Scrobbler...");

app.get("/", HomeRoute);

app.get("/auth", AuthRoute);

app.post("/now-playing", NowPlayingRoute);

app.post("/scrobble", ScrobbleRoute);

app.listen(PORT, async () => {
  console.log(`Scrobbler is listening on port ${PORT}`);

  const currentSession = await loadSession();

  const message = currentSession?.name
    ? `Loaded session for user: ${currentSession.name}`
    : "No session found, please log in.";

  console.log(message);
});
