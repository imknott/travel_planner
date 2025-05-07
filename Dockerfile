# 1. Use official Node.js base image
FROM node:18-slim

# 2. Set working directory
WORKDIR /app

# 3. Install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy all app files
COPY . .

# 5. Build the Next.js app
RUN npm run build

# 6. Tell Next.js to use the standalone build output
ENV NODE_ENV=production
ENV PORT=8080

# 7. Start the Next.js server
CMD ["node", ".next/standalone/server.js"]

