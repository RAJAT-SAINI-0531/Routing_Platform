# Installation & Setup

**Author:** Rajat Saini

## What is This Step?
Setting up your local development environment to run the routing web app.

## Why is This Needed?
- You need a working app to learn and experiment.
- Local setup lets you see changes instantly and debug easily.

## How Does It Work in This Project?
- You’ll install Python, required libraries, and MongoDB.
- You’ll run the Flask server and open the app in your browser.

## Dependencies
- **Python 3.x**
- **MongoDB** (local or Docker)
- **QGIS** (for routing features)
- **Node.js & npm** (for frontend dependencies, if needed)

## Step-by-Step Instructions

### 1. Install Python
- Download from [python.org](https://www.python.org/downloads/)
- Add Python to your PATH during installation

### 2. Install MongoDB
- Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- Follow the installer instructions
- Start MongoDB service

### 3. Install QGIS (Optional for advanced routing)
- Download from [qgis.org](https://qgis.org/en/site/forusers/download.html)
- Install QGIS and its Python bindings

### 4. Clone the Project
```sh
git clone <your-repo-url>
cd routing_platform_v1-main
```

### 5. Install Python Dependencies
```sh
pip install -r config/requirements.txt
```

### 6. Run the Flask App
```sh
python start_app.py
```
- Open [http://localhost:5000](http://localhost:5000) in your browser

### 7. Try It!
- Upload a sample GeoJSON file
- See your data on the map

## Troubleshooting
- If you get errors, check Python and MongoDB are installed and running
- Use `pip list` to verify dependencies
- Check the project README for more help

---
**Summary & Key Takeaways**
- Local setup is the foundation for all learning and experimentation
- You’ll be ready to explore mapping and routing features next

---
*Developed by Rajat Saini*
