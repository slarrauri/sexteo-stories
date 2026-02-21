# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Add build arguments for public environment variables
ARG PUBLIC_APPWRITE_ENDPOINT
ARG PUBLIC_APPWRITE_PROJECT_ID
ARG PUBLIC_APPWRITE_PROJECT_NAME
ARG GOOGLE_ANALYTICS_ID

# Set them as environment variables for the build process
ENV PUBLIC_APPWRITE_ENDPOINT=$PUBLIC_APPWRITE_ENDPOINT
ENV PUBLIC_APPWRITE_PROJECT_ID=$PUBLIC_APPWRITE_PROJECT_ID
ENV PUBLIC_APPWRITE_PROJECT_NAME=$PUBLIC_APPWRITE_PROJECT_NAME
ENV GOOGLE_ANALYTICS_ID=$GOOGLE_ANALYTICS_ID

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-slim

WORKDIR /app

# Copy production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy build artifacts and server script
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/static ./static
COPY --from=builder /app/package.json ./package.json

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
