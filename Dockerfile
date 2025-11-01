# Use a small Node LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production

# Copy source
COPY . .

# Expose port (match your PORT env var, default 7000)
EXPOSE 7000

# Use environment variable for port in server.js
ENV NODE_ENV=production

# Start the app
CMD ["npm", "start"]
