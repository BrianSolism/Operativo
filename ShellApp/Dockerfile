# ── Stage 1: Build Angular ───────────────────────────────────
# node:20 (Debian) requerido — esbuild no funciona en alpine/musl
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx ng build --configuration production

# ── Stage 2: Serve con Nginx ─────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist/shellapp /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
