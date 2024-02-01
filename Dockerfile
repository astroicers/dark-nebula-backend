FROM node:20.11.0-alpine3.19

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src
RUN npm install
RUN npm install nodemon ts-node

EXPOSE 3000
CMD ["npm", "start"]
