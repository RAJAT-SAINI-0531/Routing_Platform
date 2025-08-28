# Attribute Tables

**Author:** Rajat Saini

## What are Attribute Tables?
Attribute tables display data associated with geographic features. For example, a table might show the names, types, and coordinates of points on a map.

### Key Concepts
- **Rows:** Represent individual features (e.g., a location or route).
- **Columns:** Represent attributes (e.g., name, type, coordinates).
- **Interactive:** Users can select rows to highlight features on the map.

| Example Table |
|---------------|
| Name | Type  | Coordinates       |
|------|-------|-------------------|
| A    | Point | [23.594, 46.771] |
| B    | Line  | [[23.5, 46.7], ...] |

## Why is This Needed?
- Tables make it easy to view and interact with data.
- They provide a structured way to explore geographic features.
- Users can quickly find and analyze specific data points.

## How Does It Work in This Project?
- The backend sends GeoJSON data to the frontend.
- The frontend generates a table for the data.
- Users can click rows to highlight features on the map.

## Dependencies
- **GeoJSON files** (data source)
- **Leaflet.js** (for map integration)
- **JavaScript** (for table generation and interaction)

## Step-by-Step Usage Instructions
1. Upload a GeoJSON file (see previous docs).
2. The app generates a table for the uploaded data.
3. Click on a row to highlight the corresponding feature on the map.
4. Use the table to explore and analyze your data.

### Example: Table Row Selection
- Open the app and upload a GeoJSON file.
- Find the attribute table below the map.
- Click a row to see the feature highlighted on the map.

---
**Summary & Key Takeaways**
- Attribute tables make data exploration easy and intuitive.
- They bridge the gap between raw data and visual maps.
- Next, you’ll learn about searching and filtering table data.

---
*Developed by Rajat Saini*