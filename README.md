# 🗺️ Flask + QGIS Routing Platform

A comprehensive web-based GIS routing platform that combines Flask, QGIS, and Leaflet for advanced route analysis and visualization.

## 🚀 Features

- **Interactive Web Mapping** with Leaflet.js
- **Advanced Routing Calculations** powered by QGIS
- **Real-time Table Management** with search, filtering, and sorting
- **Map-Table Integration** with feature highlighting
- **Docker Support** for containerized deployment
- **MongoDB Integration** for data persistence
- **GeoJSON/GeoPackage Support** for spatial data

## 📁 Project Structure

```
routing_platform_v1/
├── 📁 app/                     # Main Flask application
│   ├── __init__.py            # App initialization
│   ├── routes.py             # API endpoints and routing logic (594 lines)
│   ├── models.py             # Data models
│   ├── forms.py              # WTForms definitions
│   ├── errors.py             # Error handling
│   ├── 📁 static/            # Static assets
│   │   ├── 📁 css/           # Stylesheets
│   │   │   └── style.css     # Main styles
│   │   ├── 📁 js/            # JavaScript modules
│   │   │   ├── script.js     # Main JavaScript (2336 lines - NEEDS SPLITTING)
│   │   │   └── templates.js  # HTML template functions
│   │   ├── leaflet-geojson-vt.js # Leaflet plugin
│   │   └── *.png             # Map icons
│   └── 📁 templates/         # Jinja2 templates
│       └── index.html        # Main interface
│
├── 📁 config/                 # Configuration files
│   ├── config.py             # Main configuration
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables
│   ├── .env.docker           # Docker environment
│   └── .flaskenv             # Flask environment
│
├── 📁 docker/                 # Docker configuration
│   ├── Dockerfile            # Container definition
│   ├── docker-compose.yml    # Multi-service orchestration
│   ├── docker_config.py      # Docker-specific settings
│   ├── docker_run_routing.py # QGIS processing for containers
│   └── environment.yml       # Conda environment (200+ packages)
│
├── 📁 processing/             # QGIS algorithms and routing
│   ├── shortest_path.py      # Custom QGIS routing algorithm (159 lines)
│   └── run_routing.py        # Local routing execution
│
├── 📁 scripts/               # Utility and setup scripts
│   ├── setup-data.bat/.sh    # Data setup scripts
│   ├── start_app.sh          # Application startup
│   ├── kill_app.sh           # Application shutdown
│   └── test-setup.sh         # Testing utilities
│
├── 📁 docs/                  # Comprehensive documentation
│   ├── README-Docker.md      # Docker setup guide
│   ├── COMPLETE_PROJECT_ANALYSIS.md # File-by-file analysis
│   ├── MIGRATION_GUIDE.md    # File relocation guide
│   ├── JAVASCRIPT_MODULARIZATION.md # JS refactoring plan
│   ├── FINAL_PROJECT_STRUCTURE.md   # Complete structure
│   ├── IMPLEMENTATION_STATUS.md     # Feature status
│   ├── IMPLEMENTATION_SUMMARY.md    # Implementation details
│   └── SEARCH_FEATURE_DOCUMENTATION.md # Search feature docs
│
├── 📁 tests/                 # Testing files
│   ├── test_search.html      # Search feature testing
│   └── test.py               # Application testing
│
├── 📁 data/                  # Input data directory
│   ├── route.gpkg           # Road network data
│   ├── unique_cluj.geojson  # Point data
│   ├── viteze_drum300.gpkg  # Speed/classification data
│   ├── routes/              # Route files
│   ├── zip_end/             # End point archives
│   └── zip_start/           # Start point archives
│
├── 📁 output_data/           # Generated output files
│   ├── FieldCalculatorLength_output.gpkg
│   ├── output.gpkg
│   ├── ShortestPathPointToLayer_output.gpkg
│   └── start.gpkg
│
├── 📁 routing_data/          # Runtime routing data
│   ├── start_*.gpkg         # Generated start points
│   └── end_*.gpkg           # Generated end points
│
├── .dockerignore             # Docker ignore patterns
├── .gitignore               # Git ignore patterns
└── README.md                # This file
```

## 🛠️ Installation & Setup

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd routing_platform_v1
   ```

2. **Install dependencies**
   ```bash
   pip install -r config/requirements.txt
   ```

3. **Setup data files**
   ```bash
   # Windows
   scripts/setup-data.bat
   
   # Linux/Mac
   chmod +x scripts/setup-data.sh
   scripts/setup-data.sh
   ```

4. **Run the application**
   ```bash
   python tests/test.py
   ```

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   cd docker/
   docker-compose up --build
   ```

2. **Access the application**
   - Web interface: http://localhost:5000
   - MongoDB: localhost:27017

## 🔧 Configuration

- **Local Config**: `config/config.py`
- **Docker Config**: `docker/docker_config.py`
- **Environment Variables**: `config/.env` files

## 📊 Key Components

### Frontend (JavaScript)
- **Main Logic**: `app/static/js/script.js` (⚠️ 2336 lines - NEEDS MODULARIZATION)
- **Templates**: `app/static/js/templates.js`
- **Styles**: `app/static/css/style.css`

### Backend (Python)
- **Flask Routes**: `app/routes.py` (594 lines)
- **QGIS Integration**: `processing/shortest_path.py` (159 lines)
- **Docker Processing**: `docker/docker_run_routing.py`

### Data Processing
- **Input**: GeoJSON files, coordinate pairs, zip codes
- **Processing**: QGIS routing algorithms
- **Output**: Route geometries, distance calculations, attribute tables

## 🚨 Recommended Improvements

### 1. **JavaScript Modularization** (URGENT)
The `app/static/js/script.js` file (2336 lines) should be split into:
```
app/static/js/
├── core.js           # App initialization and globals
├── mapping.js        # Leaflet map interactions
├── routing.js        # Routing functionality
├── tables.js         # Table management and search
├── highlighting.js   # Map-table feature highlighting
└── fileHandling.js   # File upload and processing
```

### 2. **Enhanced Documentation**
- API documentation
- Code comments and JSDoc
- User guides
- Deployment guides

### 3. **Testing Framework**
- Unit tests for Python functions
- Integration tests for API endpoints
- Frontend testing for JavaScript functions

### 4. **Performance Optimization**
- Code splitting and lazy loading
- Database indexing
- Caching strategies

## 🔄 Workflow

1. **User Upload** → GeoJSON files or coordinate input
2. **Frontend Processing** → Validation and map visualization
3. **Backend API** → Flask route handlers
4. **QGIS Processing** → Shortest path calculations
5. **Data Storage** → MongoDB persistence
6. **Result Display** → Interactive tables and map highlighting

## 📋 API Endpoints

- `GET /` - Main application interface
- `GET /get_zip_route` - Single zip code routing
- `GET /get_zip_r` - Multiple zip code routing  
- `GET /get_address_route` - Address-based routing
- `POST /add_to_db` - Store GeoJSON data
- `POST /delete` - Remove data


<div align="center">

---

### 🛠️  Developed by **Rajat Saini**

---
</div>
