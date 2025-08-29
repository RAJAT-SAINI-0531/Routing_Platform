from flask import Flask
from flask_bootstrap import Bootstrap
from config.config import Config
from pymongo import MongoClient
from flask_cors import CORS
import geopandas as gpd
import os

app = Flask(__name__)
CORS(app)

app.config.from_object(Config)
bootstrap = Bootstrap(app)

# MongoDB connection - try Docker first, then local
mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27018')
client = MongoClient(mongodb_uri)
db = client.flask_db
geoms = db.geoms
route = db.route

# Use local paths if Docker paths don't exist
docker_data_dir = '/app/data'
local_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

data_dir = docker_data_dir if os.path.exists(docker_data_dir) else local_data_dir
routes_file = os.path.join(data_dir, 'route.gpkg')
points_file = os.path.join(data_dir, 'unique_cluj.geojson')

# Check if files exist before loading
routes_gdf = None
points = None

if os.path.exists(routes_file):
    try:
        routes_gdf = gpd.read_file(routes_file)
        routes_gdf.to_crs(epsg=4326, inplace=True)
        print(f"✅ Loaded routes from {routes_file}")
    except Exception as e:
        print(f"❌ Error loading routes file: {e}")

if os.path.exists(points_file):
    try:
        points = gpd.read_file(points_file)
        print(f"✅ Loaded points from {points_file}")
    except Exception as e:
        print(f"❌ Error loading points file: {e}")

from app import routes, errors, models



