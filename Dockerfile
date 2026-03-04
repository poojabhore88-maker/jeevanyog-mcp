# Use official Node.js long-term support image
FROM node:20-slim

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create reports and logs directories
RUN mkdir -p reports downloads logs

# Expose the port the app runs on
EXPOSE 9000

# Use PM2 to run and monitor the application
RUN npm install pm2 -g

# Start command
CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]
