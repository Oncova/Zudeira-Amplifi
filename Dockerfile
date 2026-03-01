# Use official Node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install production deps; install tsx globally for running TypeScript entry
RUN npm ci --omit=dev && npm i -g tsx

# Copy source
COPY . .

# Build frontend assets
RUN npm run build

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start the server using tsx so we can run server.ts directly
CMD ["tsx", "server.ts"]
