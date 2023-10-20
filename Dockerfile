FROM node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN npm install --build-from-source

CMD [ "npm", "run",  "start" ]
