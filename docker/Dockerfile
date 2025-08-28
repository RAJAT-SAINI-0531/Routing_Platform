FROM condaforge/mambaforge:latest

# Set working directory
WORKDIR /app

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Bucharest

# Install system dependencies for QGIS headless operation
RUN apt-get update && apt-get install -y \
    xvfb \
    libgl1-mesa-glx \
    libglu1-mesa \
    libxrender1 \
    libxext6 \
    libxrandr2 \
    libxi6 \
    libxss1 \
    libxinerama1 \
    libxcursor1 \
    libxcomposite1 \
    libxdamage1 \
    libxtst6 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Copy environment file first for better caching (from current directory since it's in docker/)
COPY environment.yml /app/

# Install conda environment with QGIS
RUN mamba env create -f environment.yml && \
    mamba clean --all --yes

# Activate the environment
SHELL ["mamba", "run", "-n", "flaskenv", "/bin/bash", "-c"]

# Set QGIS environment variables for headless operation
ENV QT_QPA_PLATFORM=offscreen
ENV DISPLAY=:99
ENV QGIS_PREFIX_PATH=/opt/conda/envs/flaskenv/share/qgis
ENV QGIS_SERVER_LOG_LEVEL=0
ENV QGIS_DEBUG=0
ENV QT_LOGGING_RULES="*.debug=false"
ENV PYTHONPATH=/opt/conda/envs/flaskenv/lib/python3.10/site-packages:/opt/conda/envs/flaskenv/share/qgis/python:/opt/conda/envs/flaskenv/share/qgis/python/plugins:$PYTHONPATH

# Create necessary directories
RUN mkdir -p /app/routing_data/zip_start \
             /app/routing_data/zip_end \
             /app/routing_data/routes \
             /app/app/static \
             /app/app/templates \
             /app/data

# Copy application files (from parent directory since Dockerfile is in docker/ subdirectory)
COPY .. /app/

# Create a non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Test QGIS installation
RUN mamba run -n flaskenv python -c "from qgis.core import QgsApplication; print('QGIS import successful')"

USER appuser

# Expose port
EXPOSE 5000

# Simple startup without complex script
CMD ["bash", "-c", "Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset & sleep 2 && mamba run -n flaskenv python -m flask run --host=0.0.0.0 --port=5000"]