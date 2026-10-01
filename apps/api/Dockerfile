FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@crm/api --docker

FROM node:20-alpine AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install
COPY --from=builder /app/out/full/ .
RUN npx turbo run build --filter=@crm/api...

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g prisma
COPY --from=installer /app/apps/api/dist ./dist
COPY --from=installer /app/packages/prisma ./prisma
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/api/package.json ./package.json
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main"]
