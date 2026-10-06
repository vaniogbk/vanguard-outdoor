FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# no `|| npm install` fallback: a lockfile that does not match package.json must fail the build, not silently drift
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
# never run as root: the app only reads its own files and talks to the network
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:${PORT:-4000}/health || exit 1
CMD ["node", "src/index.js"]
