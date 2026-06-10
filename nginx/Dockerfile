# Stage 1: build the React SPA
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Install dependencies first (layer-cached unless package files change)
COPY frontend/package*.json ./
RUN npm ci --omit=dev

COPY frontend/ .

# VITE_API_BASE_URL is intentionally left empty: in production all /api/*
# requests go through nginx's proxy_pass, so relative URLs are correct.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine

# Bake the built SPA into the image
COPY --from=frontend-build /app/dist /var/www/frontend

# Nginx config is managed separately and mounted or copied here
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
