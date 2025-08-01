# scrobbler

Scrobbler for YouTube Music.

Sends your YouTube Music listening history to Last.fm.

## How to run

### Local development

1. Clone the repository
2. Install dependencies:

```bash
  pnpm install
```

3. Run the development server:

```bash
  pnpm dev
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

### Tampermonkey script

Install the [Tampermonkey](https://www.tampermonkey.net/) extension in your browser and add the script from `public/tampermonkey.js`.

This scripts sends scrobbles to the server when you listen to a song on YouTube Music.

## Environment variables

```bash
  API_KEY=your_api_key
  SHARED_SECRET=your_shared_secret
```

These are required for the Last.fm API. You can get them by creating an application on [Last.fm](https://www.last.fm/api/account/create).
