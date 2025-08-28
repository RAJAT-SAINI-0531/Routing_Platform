# Docker Deployment

**Author:** Rajat Saini

## What is Docker?
Docker is a tool that packages your app and its dependencies into containers. Containers run the same way on any computer—no more "it works on my machine" problems!

## Why is This Needed?
- Makes setup and deployment easy for everyone
- Ensures consistency across Windows, Linux, and Mac
- Simplifies sharing and scaling your app

## How Does It Work in This Project?
- The app is containerized using a `Dockerfile` and `docker-compose.yml`
- MongoDB and Flask run as separate services
- All dependencies are installed automatically

## Dependencies
- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
- Project files: `Dockerfile`, `docker-compose.yml`, `config/requirements.txt`

## Step-by-Step Instructions

### 1. Install Docker
- Download from [docker.com](https://www.docker.com/products/docker-desktop)
- Follow the installation guide for your OS

### 2. Build and Run the Containers
```sh
docker-compose up --build
```
- This command builds the images and starts the services

### 3. Access the App
- Open [http://localhost:5000](http://localhost:5000) in your browser
- The app and MongoDB are running in containers

### 4. Try It!
- Upload a GeoJSON file and see your data on the map

## How to Start the App
1. Navigate to the `docker` directory:
```sh
cd docker
```
2. Choose your startup method:
   - **Option A: Normal restart (if no code changes)**
     ```sh
     docker-compose up
     ```
   - **Option B: If you made code changes**
     ```sh
     docker-compose up --build
     ```

## How to Stop the App
- Press `Ctrl+C` in the terminal
- Run:
```sh
docker-compose down
```

## 🎯 Typical Workflow
1. **First time each day:**
   - Open a terminal in the project folder:
     ```sh
     cd docker
     ```
   - Run:
     ```sh
     docker-compose up
     ```
   - Wait for startup (1-2 minutes)
   - Open [http://localhost:5000](http://localhost:5000)

2. **When you modify code:**
   - Stop the app:
     ```sh
     Ctrl+C
     docker-compose down
     ```
   - Restart the app:
     ```sh
     docker-compose up --build
     ```

3. **EASY WAY:**
   - If the app is running, you can make changes in your code editor (e.g., VS Code).
   - Save the changes.
   - Refresh the browser to see the updates.

## EXTRA: When Something is Broken
- Stop the app:
```sh
docker-compose down --volumes
```
- Perform a clean restart:
```sh
docker-compose up --build
```

## Troubleshooting
- If you get errors, check Docker Desktop is running
- Use `docker ps` to see running containers
- Check logs with:
```sh
docker-compose logs
```

---
**Summary & Key Takeaways**
- Docker makes deployment easy and consistent
- You can run the app anywhere, regardless of your OS
- Follow the typical workflow for smooth development and testing
- Next, you’ll learn about the data structure and mapping features

<div align="center">

---

### 🛠️  Developed by **Rajat Saini**

---
</div>
