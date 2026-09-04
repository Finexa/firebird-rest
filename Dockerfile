FROM oven/bun:1

WORKDIR /usr/src/app

RUN bun install -g pm2

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production --ignore-scripts

COPY . .

EXPOSE 4243

ENTRYPOINT [ "bun", "run", "start" ]
