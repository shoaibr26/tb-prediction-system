FROM ubuntu:22.04

# Avoid tzdata interactive prompt during build
ENV DEBIAN_FRONTEND=noninteractive

# Update system and install necessary dependencies
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (Version 18)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy the ml-pipeline requirements and install them
# (We install Python dependencies globally in the Docker container)
COPY ml-pipeline/requirements.txt /app/ml-pipeline/
RUN pip3 install --no-cache-dir -r /app/ml-pipeline/requirements.txt
RUN pip3 install --no-cache-dir opencv-python-headless "numpy<2"

# Copy package.json for backend and install Node dependencies
COPY backend/package*.json /app/backend/
WORKDIR /app/backend
RUN npm install

# Copy the rest of the application (Backend and ML-Pipeline)
COPY backend /app/backend
COPY ml-pipeline /app/ml-pipeline

# Ensure the Python path in predict.js can find exactly where Python is installed.
# We will globally replace the venv hardcoded path during build so it points to the system python3.
RUN sed -i "s|const venvPythonPath.*|const venvPythonPath = 'python3';|g" /app/backend/routes/predict.js

# Expose Hugging Face's required port
ENV PORT=7860
EXPOSE 7860

# Run the backend
CMD ["node", "server.js"]
