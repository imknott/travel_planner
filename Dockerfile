# Use official Node.js 18 base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install deps first (for Docker caching)
COPY package*.json ./
RUN npm install

# Copy the rest of your app
COPY . .

# Build the Next.js app
RUN npm run build

# Set required Cloud Run environment variable
ENV PORT=8080

# Expose port for Cloud Run
EXPOSE 8080

# Start Next.js server in standalone mode on port 8080
CMD ["npm", "start"]
