# --- 1. Etapa de "Construcción" (Builder) ---
# Usamos una imagen completa de Node.js para construir el proyecto
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el package.json y package-lock.json
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo devDependencies)
RUN npm install

# Copiamos todo el código fuente
COPY . .

# Argumentos para las variables de entorno PÚBLICAS
# Las necesitaremos durante el 'build'
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Corremos el comando de build de Next.js
RUN npm run build

# --- 2. Etapa de "Producción" (Final) ---
# Usamos una imagen súper ligera solo para correr el resultado
FROM node:18-alpine

WORKDIR /app

# Copiamos solo los archivos necesarios desde la etapa "builder"
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Exponemos el puerto 3000 (el puerto por defecto de Next.js)
EXPOSE 3000

# El comando para iniciar la aplicación en modo producción
CMD ["node", "server.js"]