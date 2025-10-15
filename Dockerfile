# Dockerfile for the Fragments Microservice
# Defines all Docker instructions required to build
# a Node.js fragments microservice image.

# Use a specific Node.js version
FROM node:22.19.0

# Metadata about the image
LABEL maintainer="Prince Magar proka-magar@myseneca.ca"
LABEL description="Fragments Node.js microservice"

# Environment variables
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Create and use /app as our working directory
WORKDIR /app

# Copy dependency files first (for caching optimization)
COPY package*.json ./

# Install node dependencies
RUN npm install


# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Copy the rest of the application code
COPY ./src ./src

# Expose the port our service runs on
EXPOSE 8080

# Start the container by running our server
CMD ["npm", "start"]
