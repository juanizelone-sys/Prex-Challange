FROM node:20-slim

# systeminformation usa el comando ps para listar procesos
RUN apt-get update && apt-get install -y --no-install-recommends procps \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

CMD ["node", "src/index.js"]
