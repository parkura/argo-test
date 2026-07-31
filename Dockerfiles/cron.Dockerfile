# Cronjob image — runs once and exits.
FROM node:24-alpine
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
WORKDIR /app
COPY src/tick.mjs .
USER node
CMD ["node", "tick.mjs"]
