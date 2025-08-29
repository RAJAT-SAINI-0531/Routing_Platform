# Server Flask Run Guide

## What is Happening?
This guide explains how to start the Flask server for the Routing Platform project. The server loads routes and points data, initializes the enhanced precise routing module, and serves the application on a specified address and port.

---

## Why is This Needed?
The Flask server is the backbone of the Routing Platform. It:
- Handles HTTP requests.
- Loads geospatial data for routing.
- Provides an interface for users to interact with the application.

---

## How It Works in This Project
1. **Data Loading**:
   - Routes are loaded from `data/route.gpkg`.
   - Points are loaded from `data/unique_cluj.geojson`.
2. **Enhanced Routing**:
   - The enhanced precise routing module processes requests for precise routes and points.
3. **Serving the Application**:
   - The Flask server runs on `http://127.0.0.1:5000` (local) and `http://192.168.87.211:5000` (network).

---

## Dependencies
- **Tools**:
  - Flask
  - Conda
- **Libraries**:
  - Flask-CORS
  - PyMongo
- **Data Files**:
  - `data/route.gpkg`
  - `data/unique_cluj.geojson`
- **Configuration**:
  - Python environment: `flaskenv`

---

## Step-by-Step Instructions

### 1. SSH into the Server
```bash
ssh pgs_admin@192.168.87.211
```
- **pgs_admin@192.168.87.211's password:**
    ```bash
    Milestone123!
    ```

### 2. Navigate to the Project Folder
```bash
cd Routing_Platform_Rajat
```

### 3. Activate the Python Environment
```bash
conda activate flaskenv
```

### 4. Start the Flask Server
```bash
flask run --host=0.0.0.0 --port=5000
```

### 5. Open the Application in a Browser
Visit the following URL in your browser:
```
http://192.168.87.211:5000/
```

### 6. Close the Application
Write this in terminal:
```
Ctrl + C
```

### 7. Exit the server
Write this in terminal:
```
exit
```

---

## Troubleshooting

### Restart the Application
If the application is already running or you encounter issues:
1. Stop the process communicating through port `5000`:
   ```bash
   fuser -n tcp -k 5000
   ```
2. Restart the Flask server:
   ```bash
   flask run --host=0.0.0.0 --port=5000
   ```

### Common Errors
- **Error: Could not locate a Flask application**:
  - Ensure the `FLASK_APP` environment variable is set:
    ```bash
    export FLASK_APP=../app
    ```
- **ServerSelectionTimeoutError**:
  - Check if MongoDB is running and accessible on the correct port.

---

## Summary + Key Takeaways
- The Flask server is essential for running the Routing Platform.
- Follow the step-by-step instructions to start the server and access the application.
- Troubleshoot common issues using the provided solutions.

---
<div align="center">

---

### 🛠️  Developed by **Rajat Saini**

---
</div>
