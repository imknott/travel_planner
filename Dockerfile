# ====== First stage: Build the app ======
FROM node:18-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Next.js app (standalone mode)
RUN npm run build

# ====== Second stage: Production image ======
FROM node:18-slim

WORKDIR /app

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port Cloud Run listens on
EXPOSE 8080

# Start the app
CMD ["node", "server.js"]
