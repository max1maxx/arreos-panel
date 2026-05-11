FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install all dependencies (including dev) for the build process
RUN npm install

COPY prisma ./prisma

# Add build arguments for Next.js build-time requirements
ARG DATABASE_URL
ARG JWT_SECRET

# Set environment variables for build time
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate

COPY . .
RUN npx next build --turbopack

EXPOSE 3001

CMD ["npm", "start"]
