FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@10.29.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm@10.29.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 5005

CMD ["pnpm", "start"]