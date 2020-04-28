FROM node:10

WORKDIR /home/node/

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY ./app ./

EXPOSE 8080

CMD npm start