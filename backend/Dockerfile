# Stage 1: Build stage (क्विज backend निर्माण चरण)
# Use node 20-alpine as the base image for compilation
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package descriptors first to cache dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Generate the Prisma client code
RUN npx prisma generate

# Compile TypeScript codebase to JavaScript
RUN npm run build

# Prune development dependencies to keep the production container small
RUN npm prune --production


# Stage 2: Production runtime stage (क्विज backend रनटाइम चरण)
# Use a lightweight node runtime for execution
FROM node:20-alpine

WORKDIR /app

# Copy built app and required files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose backend port
EXPOSE 5000

# Set environment variable to production
ENV NODE_ENV=production

# Run migrations and start the application in production mode
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
