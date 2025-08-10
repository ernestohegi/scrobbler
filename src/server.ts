import app from "./scrobbler.js";

import { loadSession } from "./utils/sessionStore.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Scrobbler is listening on port ${PORT}`);

  const currentSession = await loadSession();

  const message = currentSession?.name
    ? `Loaded session for user: ${currentSession.name}`
    : "No session found, please log in.";

  console.log(message);
});
