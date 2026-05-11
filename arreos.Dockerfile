FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
# We remove flags that are not supported by next build
RUN npm run build -- --turbopack

EXPOSE 3001

CMD ["npm", "start"]
