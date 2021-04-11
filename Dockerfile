from node:12.22-slim

RUN apt-get update
RUN apt-get install -y git

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 4444

ENTRYPOINT [ "node", "src/main.js" ]