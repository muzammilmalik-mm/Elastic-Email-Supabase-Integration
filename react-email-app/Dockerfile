# Use Node.js LTS as base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies for building
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install serve globally for serving static files
RUN npm install -g serve

# Expose port 3012
EXPOSE 3012

CMD ["serve", "dist", "-l", "3012"]