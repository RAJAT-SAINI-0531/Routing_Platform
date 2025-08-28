# Flask + QGIS Routing Platform - Docker Setup

This guide will help you run the Flask + QGIS routing platform using Docker containers with full QGIS processing support.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8 or higher
- Your GeoPackage (.gpkg) and GeoJSON data files

## Quick Start

1. **Setup data files:**
   ```bash
   # Make setup script executable (Linux/Mac)
   chmod +x setup-data.sh
   ./setup-data.sh
   
   # Copy your data files to ./data/ directory
   cp /path/to/your/route.gpkg ./data/
   cp /path/to/your/unique_cluj.geojson ./data/
   cp /path/to/your/viteze_drum300.gpkg ./data/
   ```

2. **Build and run the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Flask app: http://localhost:5000
   - MongoDB: localhost:27017

## Project Structure

```
├── Dockerfile                 # QGIS + Flask container definition
├── docker-compose.yml        # Multi-service orchestration
├── docker_config.py          # Docker-specific configuration
├── docker_run_routing.py     # QGIS processing for Docker
├── app/
│   ├── __init___docker.py    # Docker-compatible app initialization
│   └── ...                   # Other app files
├── data/                     # Mount point for your data files
│   ├── route.gpkg           # Road network (you provide)
│   ├── unique_cluj.geojson  # Point data (you provide)
│   └── viteze_drum300.gpkg  # Speed data (you provide)
└── routing_data/            # Persistent routing outputs
```

## Services

### Flask + QGIS App
- **Port:** 5000
- **Features:** 
  - Full QGIS processing support with headless display (Xvfb)
  - Hot code reloading for development
  - CORS enabled for frontend development
  - Persistent routing data storage

### MongoDB
- **Port:** 27017
- **Database:** flask_db
- **Collections:** geoms, route
- **Persistence:** Named volume `mongodb_data`

## Development Features

### Hot Reloading
Your source code is mounted as a volume, so any changes to Python files will automatically reload the Flask application.

### QGIS Processing
The container includes:
- Full QGIS 3.22 installation
- Headless display server (Xvfb) for GUI components
- All QGIS processing algorithms
- Python QGIS API access

### Data Persistence
- Routing outputs: `/app/routing_data` (named volume)
- Input data: `/app/data` (bind mount from `./data`)
- MongoDB data: Persistent named volume

## Environment Variables

The container uses these environment variables:

```bash
# Flask Configuration
FLASK_APP=test.py
FLASK_ENV=development
FLASK_DEBUG=1

# QGIS Headless Configuration
QT_QPA_PLATFORM=offscreen
DISPLAY=:99
QGIS_PREFIX_PATH=/opt/conda/envs/flaskenv/share/qgis

# Database
MONGODB_URI=mongodb://mongodb:27017/flask_db

# File Paths
ROUTES_FILE=/app/data/route.gpkg
POINTS_FILE=/app/data/unique_cluj.geojson
NETWORK_FILE=/app/data/viteze_drum300.gpkg
```

## Commands

### Build and start services
```bash
docker-compose up --build
```

### Run in background
```bash
docker-compose up --build -d
```

### View logs
```bash
# All services
docker-compose logs -f

# Just the Flask app
docker-compose logs -f flask-qgis-app
```

### Test QGIS installation
```bash
docker-compose exec flask-qgis-app mamba run -n flaskenv python -c "from qgis.core import QgsApplication; print('QGIS OK')"
```

### Access container shell
```bash
docker-compose exec flask-qgis-app bash
```

### Stop services
```bash
docker-compose down
```

### Clean up (removes volumes)
```bash
docker-compose down -v
```

## Troubleshooting

### QGIS Import Errors
If you see QGIS import errors:
```bash
# Check QGIS installation
docker-compose exec flask-qgis-app mamba list | grep qgis

# Check Python path
docker-compose exec flask-qgis-app echo $PYTHONPATH
```

### File Not Found Errors
Ensure your data files are in the `./data/` directory:
```bash
ls -la ./data/
# Should show: route.gpkg, unique_cluj.geojson, viteze_drum300.gpkg
```

### MongoDB Connection Issues
```bash
# Check MongoDB service
docker-compose exec mongodb mongo --eval "db.runCommand('ping')"

# Check connectivity from Flask app
docker-compose exec flask-qgis-app python -c "from pymongo import MongoClient; client = MongoClient('mongodb://mongodb:27017'); print('MongoDB OK')"
```

### Performance Issues
- Increase Docker memory allocation (Docker Desktop > Settings > Resources)
- Use SSD storage for better I/O performance
- Consider using `--build --no-cache` for clean builds

## Data Requirements

Your data files should be:
- **route.gpkg**: Line layer with road network
- **unique_cluj.geojson**: Point layer with locations
- **viteze_drum300.gpkg**: Network with speed/classification attributes

## Production Considerations

For production deployment:
1. Remove `FLASK_DEBUG=1` and `FLASK_ENV=development`
2. Use a production WSGI server (Gunicorn)
3. Configure proper secrets management
4. Set up reverse proxy (nginx)
5. Configure backup for MongoDB and routing data

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify data files are in `./data/`
3. Test QGIS installation as shown above
4. Ensure Docker has sufficient resources allocated
<div align="center">

---
### Developed by **Rajat Saini**
---

</div>
