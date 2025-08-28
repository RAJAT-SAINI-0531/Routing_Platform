# 🔄 Migration Guide - Project Reorganization

## Overview
This guide helps you navigate the new organized project structure and update any references to moved files.

## 📁 File Relocations

### Docker Files
```bash
# OLD → NEW
Dockerfile → docker/Dockerfile
docker-compose.yml → docker/docker-compose.yml
docker_config.py → docker/docker_config.py
docker_run_routing.py → docker/docker_run_routing.py
environment.yml → docker/environment.yml
```

### Configuration Files
```bash
# OLD → NEW
config.py → config/config.py
.env → config/.env
.env.docker → config/.env.docker
.flaskenv → config/.flaskenv
requirements.txt → config/requirements.txt
```

### Output Data Files
```bash
# OLD → NEW
*.gpkg files → output_data/*.gpkg
FieldCalculatorLength_output.gpkg → output_data/FieldCalculatorLength_output.gpkg
output.gpkg → output_data/output.gpkg
ShortestPathPointToLayer_output.gpkg → output_data/ShortestPathPointToLayer_output.gpkg
start.gpkg → output_data/start.gpkg
```

### Scripts
```bash
# OLD → NEW  
setup-data.sh → scripts/setup-data.sh
setup-data.bat → scripts/setup-data.bat
start_app.sh → scripts/start_app.sh
kill_app.sh → scripts/kill_app.sh
test-setup.sh → scripts/test-setup.sh
```

### Processing Files
```bash
# OLD → NEW
shortest_path.py → processing/shortest_path.py
run_routing.py → processing/run_routing.py
```

### Documentation
```bash
# OLD → NEW
README-Docker.md → docs/README-Docker.md
IMPLEMENTATION_STATUS.md → docs/IMPLEMENTATION_STATUS.md
IMPLEMENTATION_SUMMARY.md → docs/IMPLEMENTATION_SUMMARY.md
SEARCH_FEATURE_DOCUMENTATION.md → docs/SEARCH_FEATURE_DOCUMENTATION.md
```

### Test Files
```bash
# OLD → NEW
test_search.html → tests/test_search.html
test.py → tests/test.py
```

### Static Assets
```bash
# OLD → NEW
app/static/style.css → app/static/css/style.css
app/static/templates.js → app/static/js/templates.js
```

## 🔧 Required Updates

### 1. Docker Commands
**OLD:**
```bash
docker-compose up --build
```

**NEW:**
```bash
cd docker/
docker-compose up --build
```

### 2. Script Execution
**OLD:**
```bash
./setup-data.sh
./start_app.sh
```

**NEW:**
```bash
./scripts/setup-data.sh
./scripts/start_app.sh
```

### 3. Import Statements (Python)
**OLD:**
```python
from shortest_path import ShortestPathPointToLayer_zipcodes_v5
```

**NEW:**
```python
from processing.shortest_path import ShortestPathPointToLayer_zipcodes_v5
```

### 4. HTML Template References
**Already Updated in index.html:**
```html
<!-- OLD -->
<link rel="stylesheet" href="static/style.css">
<script src="static/templates.js"></script>

<!-- NEW -->
<link rel="stylesheet" href="static/css/style.css">
<script src="static/js/templates.js"></script>
```

## 🚀 Running the Application

### Local Development
```bash
# Navigate to project root
cd routing_platform_v1-main

# Run application
python tests/test.py
```

### Docker Deployment
```bash
# Navigate to docker directory
cd docker/

# Build and run
docker-compose up --build
```

### Setup Data
```bash
# Windows
scripts/setup-data.bat

# Linux/Mac
chmod +x scripts/setup-data.sh
scripts/setup-data.sh
```

## 📋 Checklist After Migration

- [ ] Docker builds successfully from `docker/` directory
- [ ] Application runs locally with `python tests/test.py`
- [ ] Web interface loads with correct CSS styling
- [ ] JavaScript templates load correctly
- [ ] All documentation is accessible in `docs/`
- [ ] Scripts execute from `scripts/` directory

## 🔍 Verification Steps

1. **Test Docker Build:**
   ```bash
   cd docker/
   docker-compose build
   ```

2. **Test Local Application:**
   ```bash
   python tests/test.py
   ```
   Visit: http://localhost:5000

3. **Test Frontend Assets:**
   - Check CSS loading: Inspect page styles
   - Check JS loading: Open browser console for errors

4. **Test Documentation:**
   - Verify all docs are in `docs/` directory
   - Check internal links still work

## ⚠️ Common Issues

### Issue 1: Docker Compose Not Found
**Problem:** `docker-compose.yml not found`
**Solution:** Make sure you're in the `docker/` directory

### Issue 2: CSS/JS Not Loading
**Problem:** 404 errors for static files
**Solution:** Verify HTML template references are updated

### Issue 3: Python Import Errors
**Problem:** `ModuleNotFoundError` for moved files
**Solution:** Update import statements to use new paths

### Issue 4: Scripts Not Executable
**Problem:** Permission denied on scripts
**Solution:** 
```bash
chmod +x scripts/*.sh
```

## 📞 Support

If you encounter issues after migration:

1. Check the `docs/` directory for specific documentation
2. Verify all file paths are updated correctly
3. Ensure Docker is running if using containerized deployment
4. Check the console/logs for specific error messages

## 🎉 Benefits of New Structure

- **Clear Organization:** Related files are grouped together
- **Easy Navigation:** Find files faster with logical structure
- **Better Maintenance:** Smaller, focused directories
- **Scalability:** Easy to add new components
- **Professional Structure:** Industry-standard organization

The reorganization significantly improves project maintainability while preserving all functionality!
<div align="center">

---
### Developed by **Rajat Saini**
---

</div>
