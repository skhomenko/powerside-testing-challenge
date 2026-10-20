FROM cypress/included:cypress-16.2.0-node-24.22.0-chrome-155.0.8059.79-1-ff-158.0-edge-155.0.4283.45-1@sha256:8286fe42a37ca6766d2987732e89f046997a59e5387baffd940a1e99501411f7

ENV CYPRESS_CACHE_FOLDER=/opt/cypress-cache \
    CYPRESS_INSTALL_BINARY=0 \
    TZ=America/Toronto \
    HOME=/root

WORKDIR /app

# Keep the included binary accessible when running with the host's user ID.
RUN mv /root/.cache/Cypress /opt/cypress-cache \
    && chmod -R a+rX /opt/cypress-cache \
    && mkdir -p /tmp/runner-home \
    && chmod 1777 /tmp/runner-home

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
    && npx cypress verify \
    && npm cache clean --force

COPY cypress.config.js ./
COPY scripts/ ./scripts/
COPY cypress/ ./cypress/
RUN mkdir -p results cypress/downloads \
    && chmod 755 /app \
    && chmod 1777 results cypress/downloads

ENV HOME=/tmp/runner-home
USER node
ENTRYPOINT ["npm"]
CMD ["run", "test:smoke"]
