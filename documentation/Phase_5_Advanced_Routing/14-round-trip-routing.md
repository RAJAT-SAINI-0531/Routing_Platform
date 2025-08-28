# Round Trip Routing

**Author:** Rajat Saini

## What is Round Trip Routing?
This feature calculates a route that starts and ends at the same point, visiting multiple destinations in between. It’s commonly used for tours and delivery routes.

### Key Concepts
- **Closed Loop:** The route forms a loop, returning to the start point.
- **Sequential Routing:** Visits destinations in a specific order.
- **Optimization:** Ensures the shortest possible round trip.

| Example: Round Trip |
|---------------------|
| A → B → C → A      |

## Why is This Needed?
- Useful for planning tours, delivery routes, and circular journeys.
- Demonstrates advanced routing algorithms.
- Helps students understand closed-loop routing.

## How Does It Work in This Project?
- The user selects a start point and multiple destinations on the map.
- The frontend sends these points to the backend via an API call.
- The backend calculates the round trip using QGIS and returns the result.
- The frontend displays the round trip on the map.

## Dependencies
- **Leaflet.js** (for map interaction)
- **Flask** (for backend API)
- **QGIS** (for route calculation)
- **GeoJSON files** (data source)

## Step-by-Step Usage Instructions
1. Open the app and upload a road network GeoJSON file.
2. Select a start point and multiple destinations on the map.
3. Click the “Get Round Trip” button.
4. The app calculates and displays the round trip.

### Example: A to B, C, A Routing
- Select Point A as the start.
- Select Points B and C as destinations.
- Click “Get Round Trip.”
- The round trip is displayed on the map.

---
**Summary & Key Takeaways**
- Round trip routing is essential for planning circular journeys.
- It demonstrates the power of closed-loop routing algorithms.
- Next, you’ll learn about enhanced zipcode integration for modern routing.

---
*Developed by Rajat Saini*