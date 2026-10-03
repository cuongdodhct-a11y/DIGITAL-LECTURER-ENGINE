# OCI Always Free / Ampere A1 deployment
# Target: linux/arm64 (OCI VM.Standard.A1.Flex)
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    npm_config_update_notifier=false \
    npm_config_fund=false

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --include=dev

COPY . .
RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npm","run","start"]
