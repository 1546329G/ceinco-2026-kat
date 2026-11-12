FROM node:24-bookworm-slim AS build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM mariadb:11.4
COPY --from=build /usr/local/bin/node /usr/local/bin/node
WORKDIR /opt/ceinco
COPY backend/ ./
COPY --from=build /build/backend/node_modules ./node_modules
COPY --from=build /build/frontend/dist ./public
COPY backend/container/schema.sql /docker-entrypoint-initdb.d/10-ceinco.sql
ENV NODE_ENV=production PORT=5000 DB_HOST=127.0.0.1 DB_PORT=3306 CEINCO_WEB_DIR=/opt/ceinco/public TZ=America/Lima
EXPOSE 5000
HEALTHCHECK --interval=5s --timeout=3s --start-period=45s CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
ENTRYPOINT ["bash", "/opt/ceinco/container/start.sh"]
