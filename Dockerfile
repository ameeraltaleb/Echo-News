# Use Node 20 Alpine as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build tools for native dependencies (like Tailwind Oxide)
RUN apk add --no-cache libc6-compat python3 make g++

# Copy only package.json first to leverage Docker cache
# We intentionally DO NOT copy package-lock.json here to bypass the npm optional dependency bug
COPY package.json ./

# Clean install dependencies, forcing legacy peer deps to resolve React 19 conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the Vite application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
