FROM node:26-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@latest

FROM base AS dependencies

WORKDIR /app

COPY ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "./"]

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM dependencies AS build

COPY . .

RUN pnpm build

FROM base AS production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./
COPY --from=dependencies /app/pnpm-workspace.yaml ./
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3847

EXPOSE 3847

CMD ["pnpm", "start"]
