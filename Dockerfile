FROM node:slim

WORKDIR /app
COPY package.json /app/
COPY yarn.lock /app/

ENV NODE_ENV=production
RUN yarn install --immutable

COPY src /app/src

EXPOSE 3000

CMD ["yarn", "start"]