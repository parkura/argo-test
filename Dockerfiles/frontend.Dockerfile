# Frontend image — independent image per app.
FROM node:24-alpine
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
WORKDIR /app
COPY src/server.mjs .
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
