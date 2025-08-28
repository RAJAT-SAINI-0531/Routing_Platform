#!/bin/bash

# Create data directory
mkdir -p data
mkdir -p routing_data

echo "=== Docker Setup for Flask + QGIS Routing Platform ==="
echo ""
echo "Please copy your data files to the ./data directory:"
echo "  - route.gpkg (road network routes)"
echo "  - unique_cluj.geojson (point data)" 
echo "  - viteze_drum300.gpkg (speed/classification data)"
echo ""
echo "Example commands:"
echo "  cp /path/to/your/route.gpkg ./data/"
echo "  cp /path/to/your/unique_cluj.geojson ./data/"
echo "  cp /path/to/your/viteze_drum300.gpkg ./data/"
echo ""
echo "After copying your data files, run:"
echo "  docker-compose up --build"
echo ""
echo "The application will be available at: http://localhost:5000"
echo "MongoDB will be available at: localhost:27017"
echo ""
echo "For development with hot-reloading:"
echo "  docker-compose up --build -d"
echo "  docker-compose logs -f flask-qgis-app"
echo ""
echo "To test QGIS processing:"
echo "  docker-compose exec flask-qgis-app mamba run -n flaskenv python -c \"from qgis.core import QgsApplication; print('QGIS OK')\""