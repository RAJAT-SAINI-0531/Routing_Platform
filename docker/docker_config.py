import os

# Docker-specific configuration
basedir = '/app'

class DockerConfig(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    
    # MongoDB connection for Docker
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://mongodb:27017/flask_db'
    
    # QGIS paths for Docker
    QGIS_PREFIX_PATH = os.environ.get('QGIS_PREFIX_PATH') or '/opt/conda/envs/flaskenv/share/qgis'
    
    # Define Docker and local routing data directories
    docker_routing_data_dir = '/app/routing_data'
    local_routing_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'routing_data')

    # Use Docker directory if it exists, otherwise fallback to local directory
    ROUTING_DATA_DIR = docker_routing_data_dir if os.path.exists(docker_routing_data_dir) else local_routing_data_dir

    # Data directories
    GPKG_FILES_DIR = '/app/data'
    
    # Network and road data paths (adjust these based on your data)
    NETWORK_FILE = '/app/data/viteze_drum300.gpkg'
    POINTS_FILE = '/app/data/unique_cluj.geojson'
    ROUTES_FILE = '/app/data/route.gpkg'
