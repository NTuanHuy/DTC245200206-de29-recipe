FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY --chown=node:node . .

RUN node --check server.js \
    && node --check db.js \
    && node --check monitoring.js \
    && node --check auth.js \
    && node --check admin.js

USER node

EXPOSE 3000

CMD ["node", "server.js"]
