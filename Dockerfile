FROM node:lts

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN npm install --omit=dev && prisma generate

CMD [ "npm", "run",  "start" ]
