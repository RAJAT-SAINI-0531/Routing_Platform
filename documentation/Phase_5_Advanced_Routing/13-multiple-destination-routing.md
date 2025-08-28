# Multiple Destination Routing

**Author:** Rajat Saini

## What is Multiple Destination Routing?
This feature calculates routes from a single starting point to multiple destinations. It’s often used in logistics and delivery planning.

### Key Concepts
- **One-to-Many Routing:** Routes from one start point to several destinations.
- **Star Pattern:** The routes form a star-like structure with the start point at the center.
- **Optimization:** Ensures efficient routing to all destinations.

| Example: Multiple Destinations |
|--------------------------------|
| A → B, A → C, A → D           |

## Why is This Needed?
- Useful for delivery, logistics, and travel planning.
- Demonstrates advanced routing capabilities.
- Helps students understand one-to-many routing algorithms.

## How Does It Work in This Project?
- The user selects a start point and multiple destinations on the map.
- The frontend sends these points to the backend via an API call.
- The backend calculates routes using QGIS and returns the results.
- The frontend displays all routes on the map.

## Dependencies
- **Leaflet.js** (for map interaction)
- **Flask** (for backend API)
- **QGIS** (for route calculation)
- **GeoJSON files** (data source)

## Step-by-Step Usage Instructions
1. Open the app and upload a road network GeoJSON file.
2. Select a start point and multiple destinations on the map.
3. Click the “Get Routes” button.
4. The app calculates and displays routes to all destinations.

### Example: A to B, C, D Routing
- Select Point A as the start.
- Select Points B, C, and D as destinations.
- Click “Get Routes.”
- The routes are displayed on the map.

---
**Summary & Key Takeaways**
- Multiple destination routing is essential for logistics and planning.
- It demonstrates the power of one-to-many routing algorithms.
- Next, you’ll learn about round-trip routing for closed loops.

---
*Developed by Rajat Saini*