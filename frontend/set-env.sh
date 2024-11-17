#!/bin/sh

# Debug statement
echo "Running set-env.sh script"

# Set the API_ENDPOINT environment variable
echo "window.API_ENDPOINT = '${API_ENDPOINT}';" > /usr/share/nginx/html/config.js

# Debug statement to check the content of config.js
cat /usr/share/nginx/html/config.js