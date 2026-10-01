FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@crm/web --docker

FROM node:20-alpine AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install
COPY --from=builder /app/out/full/ .
RUN npx turbo run build --filter=@crm/web...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./.next/static
COPY --from=installer /app/apps/web/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
