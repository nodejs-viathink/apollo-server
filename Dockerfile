FROM node:8.9-alpine
WORKDIR /usr/src/app
COPY ["package.json", "npm-shrinkwrap.json*", "./"]
RUN npm install -g nodemon && npm install && mv node_modules ../
COPY . .
EXPOSE 6000
CMD npm start