FROM node:20.11.0-alpine3.19

WORKDIR /app
COPY backend/package*.json ./
RUN npm install
RUN npm install nodemon ts-node
COPY backend/ .

EXPOSE 3000
CMD ["npm", "start"]
