import { handlers } from "./mocks/lastfm.js";
import { setupServer } from "msw/node";
import request from "supertest";

import app from "./scrobbler.js";

const server = setupServer(...handlers);

const SERVER_URL = "127.0.0.1";

vi.mock("./utils/sessionStore.js", () => ({
  saveSession: vi.fn(),
  loadSession: vi.fn(() =>
    Promise.resolve({
      name: "Test User",
      key: "test_session_key",
      subscriber: 1,
    })
  ),
}));

describe("scrobbler", () => {
  beforeAll(() => {
    server.listen({
      onUnhandledRequest(request, print) {
        if (request.url.includes(SERVER_URL)) {
          return;
        }

        print.warning();
      },
    });
  });

  beforeEach(() => {
    const fakeDate = new Date("2025-08-10T12:00:00Z");

    vi.useFakeTimers({
      now: fakeDate,
      shouldAdvanceTime: false,
    });
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  describe("routes", () => {
    test("scrobble", async () => {
      const response = await request(app)
        .post("/scrobble")
        .set("Accept", "application/json")
        .send({
          artist: "Arch Enemy",
          track: "The Immortal",
          album: "Burning Bridges",
        });

      const { status, body } = response;

      expect(status).toEqual(200);
      expect(body).toEqual({
        message: "Track scrobbled successfully with method: track.scrobble",
        scrobbleData: {
          artist: "Arch Enemy",
          track: "The Immortal",
          album: "Burning Bridges",
          timestamp: "1754827200",
        },
      });
    });

    test("now-playing", async () => {
      const response = await request(app)
        .post("/now-playing")
        .set("Accept", "application/json")
        .send({
          artist: "Death",
          track: "Crystal Mountain",
          album: "Symbolic",
        });

      const { status, body } = response;

      expect(status).toEqual(200);
      expect(body).toEqual({
        message:
          "Track scrobbled successfully with method: track.updateNowPlaying",
        scrobbleData: {
          artist: "Death",
          track: "Crystal Mountain",
          album: "Symbolic",
        },
      });
    });
  });
});
