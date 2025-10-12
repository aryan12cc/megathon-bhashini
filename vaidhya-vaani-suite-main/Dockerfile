# UI Dockerfile (React/Vite)
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set build-time environment variables
ARG VITE_API_URL
ARG VITE_DATABASE_URL
ARG VITE_S2S_URL
ARG VITE_SARAANSH_URL
ARG VITE_LIPIGYAN_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DATABASE_URL=$VITE_DATABASE_URL
ENV VITE_S2S_URL=$VITE_S2S_URL
ENV VITE_SARAANSH_URL=$VITE_SARAANSH_URL
ENV VITE_LIPIGYAN_URL=$VITE_LIPIGYAN_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
