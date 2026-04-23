# Install-in-container build: works on any CI runner without a local
# pre-populated node_modules (the previous variant required the host to
# run `npm install` first and broke on Node ABI mismatches).
FROM node:22.15.0-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install --legacy-peer-deps --no-audit --prefer-offline
COPY . .
RUN rm -rf node_modules/.cache && npm run build

FROM nginx:alpine
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
