# Stage 1: Build stage (React frontend निर्माण चरण)
# Use node 20-alpine for building Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to optimize layer caching
COPY package*.json ./

# Install packages
RUN npm ci

# Copy the rest of the frontend source code
COPY . .

# Build the production optimized bundle
RUN npm run build


# Stage 2: Serve stage (React static assets Nginx मा राख्ने चरण)
# Use Nginx to serve static React pages
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
