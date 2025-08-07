import { Response } from "express";

import { METHOD_NAMES } from "./scrobbler.consts.js";

type MethodName = (typeof METHOD_NAMES)[keyof typeof METHOD_NAMES];

export type Session = {
  name: string;
  key: string;
  subscriber: number;
};

export type Data = {
  session?: Session;
  message?: string;
  error?: number;
};

export type ScrobbleData = {
  artist: string;
  track: string;
  album: string;
  duration: string;
  timestamp?: string;
};

export type HandleTrack = {
  res: Response;
  message: string;
  method: MethodName;
  scrobbleData: ScrobbleData;
  userSessionKey: string;
};
