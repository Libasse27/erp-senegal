FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs backups

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
