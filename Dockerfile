FROM node

ENV NODE_ENV production
USER node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN npm i

CMD [ "npm", "run",  "start" ]
