FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# No COPY . .  (source will be mounted via volumes)

EXPOSE 5000


CMD ["npm", "run", "dev"] 
# CMD ["npx", "nodemon", "--watch", "src", "--ext", "ts", "--exec", "ts-node", "src/index.ts"]
