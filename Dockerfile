# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for bcrypt
RUN apk add --no-cache python3 g++ make

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Run the application
CMD ["node", "src/server.js"]