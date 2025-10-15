# Dockerfile for the Fragments Microservice
# Docker instructions required to build the image
# a Node.js fragments microservice image.

# # Use node version 22.19.0
FROM node:22.19.0

# Metadata about the image
LABEL maintainer="Prince Magar proka-magar@myseneca.ca"
LABEL description="Fragments Node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080


# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false


# Use /app as our working directory
WORKDIR /app

# Copy the package.json and package-lock.json
# files into the working dir (/app).  NOTE: this requires that we have
# already set our WORKDIR in a previous step.
COPY package*.json ./


# Install node dependencies defined in package-lock.json
RUN npm install


# Copy HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Copy src to /app/src/
COPY ./src ./src

# We run our service on port 8080
EXPOSE 8080

# Start the container by running our server
CMD ["npm", "start"]
