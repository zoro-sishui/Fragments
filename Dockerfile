# Dockerfile for the Fragments Microservice
# Docker instructions required to build the image
# a Node.js fragments microservice image.

# # stage 1: build the application
FROM node:22.19.0 AS build

# Metadata about the image
LABEL maintainer="Prince Magar proka-magar@myseneca.ca"
LABEL description="Fragments Node.js microservice"

# Use /app as our working directory
WORKDIR /app

#environment variables in a single layer
ENV NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

# Copy the package.json and package-lock.json
# files into the working dir (/app).  NOTE: this requires that we have
# already set our WORKDIR in a previous step.
COPY package*.json ./


# Install node dependencies defined in package-lock.json
RUN npm install


COPY ./src ./src

# Copy HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

## Final stage

FROM node:22.19.0 AS slim

WORKDIR /app

#setting environment variables during runtime
ENV PORT=8080\
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

# Copy only the files we need from the build stage
COPY --from=build /app /app

# We run our service on port 8080
EXPOSE 8080

# Start the container by running our server
CMD ["npm", "start"]
