FROM node:18

RUN apt update && apt install -y ffmpeg python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "index.js"]
