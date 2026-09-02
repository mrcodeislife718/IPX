FROM node:22.20.0-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

FROM node:22.20.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system --gid 10001 ipx && useradd --system --uid 10001 --gid ipx --home-dir /nonexistent --shell /usr/sbin/nologin ipx
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER ipx
EXPOSE 8080
CMD ["node","src/server.js"]
