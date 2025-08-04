FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY pnpm-lock.yaml* package.json ./
RUN pnpm fetch
RUN pnpm install --offline

FROM dependencies AS build
COPY . .
RUN pnpm exec tsc

FROM base AS production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./built
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "built/scrobbler.js"]
