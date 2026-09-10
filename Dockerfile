FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./

RUN npm install

COPY server/ ./

RUN npx prisma generate

RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/server.js"]
