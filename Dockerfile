# Use official Node.js image with Playwright / Chromium pre-installed
FROM mcr.microsoft.com/playwright/node:v1.50.0-jammy

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose server port
EXPOSE 3001

# Set production env
ENV PORT=3001
ENV NODE_ENV=production

# Command to start Inkos server
CMD ["node", "src/server.js"]
