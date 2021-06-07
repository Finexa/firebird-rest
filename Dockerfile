from node:14.17-slim

RUN apt-get update
RUN apt-get install -y git

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN npm ci

EXPOSE 4444

ENTRYPOINT [ "node", "src/main.js" ]