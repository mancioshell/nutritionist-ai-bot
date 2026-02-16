# Stage 1: Build
FROM node:24-slim AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/

RUN yarn build

# Stage 2: Run
FROM node:24-slim

RUN npm install -g @github/copilot

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build/bot.js"]