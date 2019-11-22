FROM node:10

COPY ./app /home/node/app

WORKDIR /home/node/app

RUN npm install -g

USER node

EXPOSE 8080

CMD npm start