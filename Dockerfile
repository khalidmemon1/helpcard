# HelpCard on Google Cloud Run: build the static site, serve it with nginx (tiny, fast, almost no CPU).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
# Cloud Run sends traffic to 8080
EXPOSE 8080
