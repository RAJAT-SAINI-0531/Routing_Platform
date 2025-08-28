# Drag-and-Drop File Upload

**Author:** Rajat Saini

## What is This Feature?
A simple way for users to upload GeoJSON files by dragging them onto the web page. The app then validates, stores, and displays the data.

## Why is This Needed?
- Makes data entry easy and intuitive
- No need for manual file selection or complex forms
- Students can quickly see their data on the map

## How Does It Work in This Project?
- The frontend (JavaScript) listens for drag-and-drop events
- Uploaded files are sent to the Flask backend
- The backend validates the GeoJSON and stores it in MongoDB
- The map updates to show the new data

## Dependencies
- **Leaflet.js** (for map display)
- **Flask** (for backend API)
- **MongoDB** (for data storage)
- **GeoJSON files** (user-provided)

## Step-by-Step Usage Instructions
1. Prepare a valid GeoJSON file
2. Drag the file onto the upload area of the app
3. The app checks the file format and contents
4. If valid, the data is stored and shown on the map
5. If invalid, an error message appears

### Example: Uploading a File
- Open the app in your browser
- Find the upload area (usually above the map)
- Drag your GeoJSON file onto it
- Watch your data appear on the map!

| Diagram: Drag-and-Drop Flow |
|-----------------------------|
| User → Upload Area → Backend → MongoDB → Map |

## Troubleshooting
- Make sure your file is valid GeoJSON
- Check for error messages if upload fails
- See the browser console for details

---
**Summary & Key Takeaways**
- Drag-and-drop makes data upload fast and fun
- Valid files are instantly visualized
- Next, you’ll learn how the map displays your data

---
*Developed by Rajat Saini*
