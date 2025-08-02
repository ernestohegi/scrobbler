# Last.fm Scrobbler for YouTube Music

Sends your YouTube Music listening history to Last.fm.

## Environment variables

```bash
  API_KEY=your_api_key
  SHARED_SECRET=your_shared_secret
```

These are required for the Last.fm API. You can get them by creating an application on [Last.fm](https://www.last.fm/api/account/create).

## How to run

### Local development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Last.fm API credentials:

```bash
  cp .env.example .env
```

3. Install dependencies:

```bash
  pnpm install
```

4. Run the development server:

```bash
  pnpm dev
```

### or run it with Docker

```bash
  docker build -t scrobbler .
  docker run -p 3000:3000 --env-file .env scrobbler
```

### Production build

#### Build the project:

```bash
  pnpm build
```

#### Run the project:

```bash
  pnpm start
```

### or use Docker compose

- Create a docker-compose.yml file in the root of the project and then:

```bash
  docker compose up -d
  docker compose logs -f
```

## Auth token storage

The auth token is stored in memory for now, but you can implement a more persistent storage solution (e.g., a database) in the future.

### Redis

You can use Redis to store the auth token and other session data. This will allow you to easily scale your application and share session data between instances.

You need to have Redis running locally or in a Docker container. You can use the official Redis image:

```bash
  sudo apt install redis-server
```

Check Redis is running:

```bash
  redis-cli ping
```

Check key is stored:

```bash
  redis-cli get lastfm_session
```

### Tampermonkey script

Install the [Tampermonkey](https://www.tampermonkey.net/) extension in your browser and add the script from `public/tampermonkey.js`.

This scripts sends scrobbles to the server when you listen to a song on YouTube Music.

## How to scrobble

1. Start your application server (either in development or production mode).
1. Install the Tampermonkey script in your browser.
1. Visit http://localhost:3000, it will redirect you to the Last.fm authorization page.
1. Authorize the application to access your Last.fm account.
1. After authorization, you will be redirected back to the application with a token.
1. This token will be used to scrobble your music listening history. It is stored locally for now, but the plan is to store it in a database soon. It doesn't have an expiration time, so it should work indefinitely unless you revoke access from Last.fm.
1. Start listening to music on YouTube Music, and the scrobbles will be sent to Last.fm automatically.

## Next steps

- Check for invalid tokens and reauthorize if necessary.
- Store tokens in a database. SQLite with Turso or Postgres with Prisma.
- Add a settings page to manage tokens and preferences.
- Add dummy docker-compose.yml file.
