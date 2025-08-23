import "dotenv/config";
import express from "express";
import cors from "cors";

import {
  AuthRoute,
  HomeRoute,
  NowPlayingRoute,
  ScrobbleRoute,
} from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(cors());

console.log("Starting Last.fm Scrobbler...");

app.get("/", HomeRoute);

app.get("/auth", AuthRoute);

app.post("/now-playing", NowPlayingRoute);

app.post("/scrobble", ScrobbleRoute);

export default app;
