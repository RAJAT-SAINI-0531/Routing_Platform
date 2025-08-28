# Data Structure: GeoJSON

**Author:** Rajat Saini

## What is GeoJSON?
GeoJSON is a simple format for encoding geographic data structures using JavaScript Object Notation (JSON). It’s widely used for sharing maps, routes, and location data.

### Key Concepts
- **Features:** Points, lines, polygons representing locations, routes, or areas
- **Properties:** Extra data attached to each feature (e.g., name, type)
- **Coordinate System:** Uses latitude and longitude (WGS84)

| GeoJSON Example |
|----------------|
| `{ "type": "FeatureCollection", "features": [ ... ] }` |

## Why is This Needed?
- GeoJSON is the standard for web mapping and GIS apps
- It’s easy to read, write, and share
- Our app uses GeoJSON for all map data and routing

## How Does It Work in This Project?
- Users upload GeoJSON files containing points (locations) or lines (routes)
- The backend reads and processes these files using Python and QGIS
- The frontend (Leaflet.js) displays the data on interactive maps

## Dependencies
- **GeoJSON files** (user-uploaded)
- **QGIS** (for processing)
- **Leaflet.js** (for displaying)
- **MongoDB** (for storing)

## Step-by-Step Usage Instructions
1. Prepare a GeoJSON file with your locations or routes
2. Upload the file using the app’s drag-and-drop feature
3. The app validates and stores your data
4. See your data visualized on the map

### Example: Simple Point GeoJSON
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [23.594, 46.771]
      },
      "properties": {
        "name": "Sample Location"
      }
    }
  ]
}
```

---
**Summary & Key Takeaways**
- GeoJSON is the backbone of all mapping features in this app
- You’ll use it to upload, store, and visualize geographic data
- Next, you’ll learn how to upload files and see your data in action

---
*Developed by Rajat Saini*
