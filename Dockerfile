FROM node:20.11.0 as builder

WORKDIR /app
RUN npm init -y
RUN npm install
RUN npm install typescript ts-node @types/node
COPY backend/ .
RUN npm run build

FROM node:20.11.0-alpine3.19
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/app.js"]
