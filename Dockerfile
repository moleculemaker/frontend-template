# Builds the frontend Docker image
#
# Usage:
#     docker build -t <image> .
#

# Use official node image as the base image
FROM --platform=$BUILDPLATFORM node:22 as build

# Set the working directory
WORKDIR /usr/local/app

ENV DEBIAN_FRONTEND=noninteractive

# Add dependencies manifest to app
COPY package.json package-lock.json ./

# Install all the dependencies
RUN npm install

# Add the source code to app
COPY angular.json entrypoint.sh tsconfig*.json package*.json proxy.conf.json tailwind.config.js .
COPY src ./src

# Generate the build of the application
RUN npm run build


# Stage 2: Serve app with nginx server

# Use official nginx image as the base image
FROM nginx:1.23.3

# Copy the build output to replace the default nginx contents
COPY --from=build /usr/local/app/dist/app/browser /usr/share/nginx/html/

# Copy the nginx config file, which has a try_files rule for SPA routing
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Run our envloader script before starting NGINX
COPY entrypoint.sh /entrypoint.sh
CMD [ "/entrypoint.sh" ]

# Expose port 80
EXPOSE 80
