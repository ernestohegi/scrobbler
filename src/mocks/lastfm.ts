import { http, HttpResponse } from "msw";

const LAST_FM_API_URL = "https://ws.audioscrobbler.com/2.0/";

export const handlers = [
  http.post(LAST_FM_API_URL, async () =>
    HttpResponse.json({ ok: true }, { status: 200 })
  ),
];
