FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Carpeta donde se guardan los json, con permisos para el usuario node
RUN mkdir -p data && chown node:node data
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
