# Basic Point-to-Point Routing

**Author:** Rajat Saini

## What is Basic Point-to-Point Routing?
This feature calculates the shortest route between two points (A and B) on a map. It’s the simplest form of routing and forms the foundation for more advanced features.

### Key Concepts
- **Start and End Points:** The user selects two points on the map.
- **Shortest Path:** The app calculates the quickest route between these points.
- **Visualization:** The route is displayed on the map.

| Example: Point-to-Point |
|-------------------------|
| A → B (Shortest Path)  |

## Why is This Needed?
- Point-to-point routing is the most basic and essential feature of any routing app.
- It helps users understand how routing works.
- Students learn how to handle user input and API responses.

## How Does It Work in This Project?
- The user selects start and end points on the map.
- The frontend sends these points to the backend via an API call.
- The backend calculates the route using QGIS and returns the result.
- The frontend displays the route on the map.

## Dependencies
- **Leaflet.js** (for map interaction)
- **Flask** (for backend API)
- **QGIS** (for route calculation)
- **GeoJSON files** (data source)

## Step-by-Step Usage Instructions
1. Open the app and upload a road network GeoJSON file.
2. Select two points on the map as the start and end.
3. Click the “Get Route” button.
4. The app calculates and displays the shortest path.

### Example: A to B Routing
- Select Point A and Point B on the map.
- Click “Get Route.”
- The shortest path is displayed on the map.

---
**Summary & Key Takeaways**
- Point-to-point routing is the foundation of all routing features.
- It demonstrates the integration of user input, backend processing, and frontend visualization.
- Next, you’ll learn about enhancing the user experience with zipcode autocomplete suggestions.

---
*Developed by Rajat Saini*