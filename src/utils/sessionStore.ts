import { Redis } from "ioredis";
import { Session } from "../scrobbler.types.js";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

const redis = new Redis({
  host: redisHost,
  port: redisPort,
});

const SESSION_KEY = "lastfm_session";

export const saveSession = async (session: Session): Promise<void> => {
  await redis.set(SESSION_KEY, JSON.stringify(session));
};

export const loadSession = async (): Promise<Session | null> => {
  const data = await redis.get(SESSION_KEY);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};
