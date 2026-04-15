# Build stage
FROM dhi.io/node:24-alpine3.23-dev AS builder
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy dependency manifest
COPY package*.json ./

# Copy Prisma config and schema
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install
RUN npx prisma generate

# Copy source and compile
COPY . .
RUN npm run build


# Create the runtime
FROM dhi.io/node:24-alpine3.23-dev AS runner
WORKDIR /app

# Re-install openssl (required for Prisma runtime)
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/prisma/dev.db"

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Ensure the app can write to the SQLite file
USER node

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
