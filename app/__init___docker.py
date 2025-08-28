from flask import Flask
from flask_bootstrap import Bootstrap
from docker.docker_config import Config
from pymongo import MongoClient
from flask_cors import CORS
import geopandas as gpd
import os

app = Flask(__name__)
CORS(app)

app.config.from_object(Config)
bootstrap = Bootstrap(app)

# MongoDB connection with Docker service name
mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://mongodb:27017')
client = MongoClient(mongodb_uri)
db = client.flask_db
geoms = db.geoms
route = db.route

# Define Docker and local data directories
docker_data_dir = '/app/data'
local_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

# Use Docker directory if it exists, otherwise fallback to local directory
data_dir = docker_data_dir if os.path.exists(docker_data_dir) else local_data_dir

# Construct file paths dynamically
routes_file = os.path.join(data_dir, 'route.gpkg')
points_file = os.path.join(data_dir, 'unique_cluj.geojson')
network_file = os.path.join(data_dir, 'viteze_drum300.gpkg')

# Check if files exist before loading
routes_gdf = None
points = None

if os.path.exists(routes_file):
    try:
        routes_gdf = gpd.read_file(routes_file)
        routes_gdf.to_crs(epsg=4326, inplace=True)
        print(f"Loaded routes from {routes_file}")
    except Exception as e:
        print(f"Error loading routes file: {e}")

if os.path.exists(points_file):
    try:
        points = gpd.read_file(points_file)
        print(f"Loaded points from {points_file}")
    except Exception as e:
        print(f"Error loading points file: {e}")

# Make data available globally
app.config['ROUTES_GDF'] = routes_gdf
app.config['POINTS'] = points
app.config['NETWORK_FILE'] = network_file
app.config['DATA_DIR'] = data_dir

from app import routes, errors, models
