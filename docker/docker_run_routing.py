import os
import sys
from qgis.core import (
    QgsApplication,
    QgsVectorLayer,
    QgsVectorFileWriter,
    QgsWkbTypes
)
from qgis.analysis import QgsNativeAlgorithms
from processing.core.Processing import Processing
from qgis import processing
from shortest_path import ShortestPathPointToLayer_zipcodes_v5

# Make sure the environment is headless
os.environ["QT_QPA_PLATFORM"] = "offscreen"
os.environ["DISPLAY"] = ":99"

# Set the QGIS prefix path for Docker environment
QGIS_PREFIX_PATH = "/opt/conda/envs/flaskenv/share/qgis"

# Initialize the QGIS Application
QgsApplication.setPrefixPath(QGIS_PREFIX_PATH, True)
qgs = QgsApplication([], False)
qgs.initQgis()
Processing.initialize()
QgsApplication.processingRegistry().addProvider(QgsNativeAlgorithms())

# Docker-compatible paths
network_file = "/app/data/viteze_drum300.gpkg"

routing = ShortestPathPointToLayer_zipcodes_v5()
params = {
    "pathtypetocalculate0shortest1fastest": 1,  # Default: Fastest (1)
    "pathtypetocalculatetypeshortestorfastest": "Fastest",  # Default: "Fastest"

    "roadclassification (16)": network_file,  # Line layer
    "roadclassification (16) (2)": sys.argv[2],  # Point layer
    "roadclassification (16) (2) (2)": sys.argv[1],  # Point layer

    "speedvalue": 50,  # Default speed value
    "speedvalue (2)": 0,  # Topology tolerance 

    "FieldCalculatorLength": "/app/routing_data/FieldCalculatorLength_output.gpkg",  # Output sink
    "FinalShortestPath": sys.argv[3],  # Output sink
    "ShortestPathPointToLayer": "/app/routing_data/ShortestPathPointToLayer_output.gpkg"  # Output sink
}

try:
    processing.run(routing, params)
    print("Routing processing completed successfully")
except Exception as e:
    print(f"Error in routing processing: {e}")
    sys.exit(1)
finally:
    qgs.exitQgis()
