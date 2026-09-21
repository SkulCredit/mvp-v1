
FROM node:20-alpine AS builder

WORKDIR /app

ENV SKIP_GEOIP_UPDATE=1

COPY package*.json ./
RUN npm install --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS deps

WORKDIR /app

ENV SKIP_GEOIP_UPDATE=1

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

FROM node:20-alpine AS dev

WORKDIR /app

ENV SKIP_GEOIP_UPDATE=1

COPY package*.json ./
RUN npm install --ignore-scripts

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]

FROM node:20-alpine AS prod

RUN addgroup -S skulcredit && adduser -S skulcredit -G skulcredit

WORKDIR /app

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist

COPY package*.json ./

RUN mkdir -p /app/uploads && chown -R skulcredit:skulcredit /app

USER skulcredit

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
