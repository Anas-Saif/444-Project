# Use an official Nginx image as a base image
FROM nginx:alpine

# Copy the frontend files to the default Nginx public directory
COPY ./ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
