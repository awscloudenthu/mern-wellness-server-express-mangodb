# Use Node.js base image
FROM node:18

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port Express will run on
EXPOSE 5001

# Command to run the app
CMD ["node", "server.js"]