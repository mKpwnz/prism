FROM node:lts

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN npm install

CMD [ "npm", "run",  "start" ]
