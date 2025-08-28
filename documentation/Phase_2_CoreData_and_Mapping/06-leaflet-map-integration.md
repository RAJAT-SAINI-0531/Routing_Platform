# Leaflet Map Integration

**Author:** Rajat Saini

## What is Leaflet?
Leaflet is a lightweight JavaScript library for interactive maps. It lets you display geographic data, add markers, draw routes, and more—all in the browser.

## Why is This Needed?
- Maps make geographic data visual and engaging
- Students can see their uploaded data instantly
- Interactive maps help users explore and understand routes

## How Does It Work in This Project?
- The frontend uses Leaflet.js to create and display maps
- GeoJSON data is loaded and shown as layers
- Users can interact with markers, popups, and routes

## Dependencies
- **Leaflet.js** (main mapping library)
- **GeoJSON files** (data source)
- **Bootstrap** (for UI styling)

## Step-by-Step Usage Instructions
1. Upload a GeoJSON file (see previous doc)
2. The app loads your data and adds it to the map
3. Explore the map: click markers, view popups, pan/zoom
4. Try adding more data or changing the map style

### Example: Adding a Marker
```js
L.marker([46.771, 23.594]).addTo(map)
  .bindPopup('Sample Location')
  .openPopup();
```

| Diagram: Map Layers |
|---------------------|
| Base Map → GeoJSON Layer → Markers/Popups |

## Troubleshooting
- If the map doesn’t show, check your browser console for errors
- Make sure your GeoJSON is valid
- Refresh the page after uploading new data

---
**Summary & Key Takeaways**
- Leaflet makes maps interactive and fun
- You’ll see your data visualized and can explore routes
- Next, you’ll learn about tables and data interaction

---
*Developed by Rajat Saini*
