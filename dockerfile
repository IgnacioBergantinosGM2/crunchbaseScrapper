FROM node:20
WORKDIR /
COPY package*.json ./
COPY . .

RUN npx playwright install && \
    npx playwright install --with-deps && \
    npx playwright install firefox

EXPOSE 3000
CMD ["node", "server.mjs"]