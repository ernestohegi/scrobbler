# Last.fm Scrobbler

Sends your music listening history to [Last.fm](https://www.last.fm).

## Environment variables

```bash
  API_KEY=your_api_key
  SHARED_SECRET=your_shared_secret
```

These are required for the Last.fm API. You can get them by creating an application on [Last.fm](https://www.last.fm/api/account/create).

## Server

Build and run manually or use `docker`. If you go with docker, you need to install Redis locally. If you use `docker compose`, it will be handled for you.

### Local

1. Clone the repository
1. Copy `.env.example` to `.env` and fill in your Last.fm API credentials:

```bash
  cp .env.example .env
```

#### Manually install and run the project

1. Install dependencies:

```bash
  pnpm install
```

2. Run the development server:

```bash
  pnpm dev
```

#### Docker

```bash
  docker build -t scrobbler .
  docker run -p 3000:3000 --env-file .env scrobbler
```

### Production

Build and run manually or use `docker compose`.

#### Manually install, build and run the project

```bash
  pnpm install
```

```bash
  pnpm build
```

```bash
  pnpm start
```

#### Docker compose

```bash
  docker compose up -d
```

Tail logs with:

```bash
  docker compose logs -f
```

## User (session) token

The session token is used to authenticate scrobbles to Last.fm. It is generated when you authorize the application to access your Last.fm account.

- After your server is running, visit http://localhost:3000.
- You will be redirected to the Last.fm authorization page.
- Authorize the application to access your Last.fm account.
- After authorization, you will be redirected back to the application with a token.
- This token will be used to scrobble your music listening history. It is stored in memory for now, but the plan is to store it in a database soon. It doesn't have an expiration time, so it should work indefinitely unless you revoke access from Last.fm.

### Redis

We use [Redis](https://redis.io/) to store the session data received from Last.fm containing the user session auth token.

You need to have Redis running locally or in a Docker container (already provided in the Docker setup through the docker-compose.yml file). You can use the official Redis image:

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

## Client

### Tampermonkey

Install the [Tampermonkey](https://www.tampermonkey.net/) extension in your browser and add the script from the `/public` folder relevant to your music service.

Click on the Tampermonkey icon in your browser and select "Create a new script". Then, copy and paste the contents of the script file into the editor.

### How to scrobble

#### Setup

1. Start your server.
1. Install the Tampermonkey extension in your browser.
1. Add the Tampermonkey script for the service you use from `public/SERVICE_NAME-tampermonkey.js` to your Tampermonkey extension's dashboard.

#### Authorization

1. Visit http://localhost:3000, it will redirect you to the Last.fm authorization page.
1. Authorize the application to access your Last.fm account.
1. After authorization, you will be redirected back to the application, to `/auth`, with a token.
1. This token will be used to scrobble your music listening history. It is stored locally on your machine with **Redis**, but the plan is to store it in a database soon so it can be managed if necessary.
1. The Last.fm user token doesn't have an expiration time, so it should work indefinitely unless you revoke access from Last.fm to the app itself.

#### Scrobble

1. Finally, the most important part, start listening to music on your music service.
1. The scrobbles will be sent to Last.fm automatically.

### YouTube Music

So far we only support YouTube Music, but you can add support for other music services by creating a new Tampermonkey script and implementing the logic to fetch the currently playing track and send it to the server.

## Next steps

- Check for invalid tokens and reauthorize if necessary.
- Store tokens in a database. SQLite with Turso or Postgres with Prisma.
- Add a settings page to manage tokens and preferences.
