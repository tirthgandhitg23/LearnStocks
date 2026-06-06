# Stage 1: Build React SPA
FROM node:18-alpine AS builder
WORKDIR /app

# Define build arguments for env variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_PY_API_BASE_URL
ARG VITE_ADVISOR_URL

# Set them as environment variables for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_PY_API_BASE_URL=$VITE_PY_API_BASE_URL
ENV VITE_ADVISOR_URL=$VITE_ADVISOR_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
