FROM node:22-alpine
WORKDIR /app
COPY server/package.json ./package.json
RUN npm install --omit=dev
COPY server/src ./src
EXPOSE 8080
CMD ["node","src/index.js"]
