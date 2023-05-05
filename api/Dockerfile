FROM node:17-alpine

WORKDIR /usr/src/app

COPY ./package.json ./
COPY ./package-lock.json ./

RUN npm install
RUN npm install -g nodemon
COPY . .

EXPOSE 4001
CMD ["nodemon", "Index.js"]
