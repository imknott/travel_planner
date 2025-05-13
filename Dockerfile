# ====== First stage: Build the app ======
FROM mcr.microsoft.com/playwright:v1.39.0-jammy AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Install Chromium browser (for scraping)
RUN npx playwright install chromium

# Build the app
RUN npm run build

# ====== Second stage: Production image ======
FROM mcr.microsoft.com/playwright:v1.39.0-jammy

WORKDIR /app

# Copy built output from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the app
CMD ["node", "server.js"]
