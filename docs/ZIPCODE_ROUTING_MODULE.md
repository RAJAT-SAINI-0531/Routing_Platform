# Zipcode to Zipcode(s) Routing Module

## Overview

This module provides a unified system for zipcode-to-zipcode routing that supports both **Multiple Destinations** and **Round Trip** routing modes. It can be used by both Form 1 and Form 2 in the application.

## Features

- **Multiple Destinations**: Route from one zipcode to multiple destination zipcodes
- **Round Trip**: Create a circular route visiting multiple waypoints and returning to start
- **Modular Design**: Reusable across different forms
- **Map Visualization**: Colored routes with proper legend
- **Table Display**: Detailed route information in sortable, searchable tables

## File Structure

```
app/static/js/
├── zipToZip.js           # Core routing module
├── form2Integration.js   # Form 2 specific integration
└── templates.js          # UI templates (existing)

app/static/
└── script.js            # Main application script (modified)

app/templates/
└── index.html           # Main HTML (modified)
```

## Usage

### Form 1 (Original zip-routing section)

Form 1 automatically uses the new module. No changes needed to the HTML structure.

```html
<section class="zip-routing">
    <div class="routing-mode-selector">
        <label for="routing-mode">Routing Mode:</label>
        <select id="routing-mode">
            <option value="multiple">Multiple Destinations</option>
            <option value="roundtrip">Round Trip</option>
        </select>
    </div>
    <span>Start zipcode<input type="text" class="start-zip"></span>
    <span>End zipcode(s)<input type="text" class="end-zip"></span>
    <button class="routing-zip-btn">Get Route</button>
</section>
```

### Form 2 (routing-tab section)

Form 2 gets an additional "GET ZIP ROUTE" button that appears when both inputs are set to zipcode mode.

The Form 2 integration:
- Monitors input types (address vs zipcode)
- Shows zipcode routing button only when both inputs are zipcode type
- Uses the same routing logic as Form 1
- Respects the routing mode selection from Form 2's dropdown

## API Usage

### Basic Usage

```javascript
// Simple routing call
ZipToZipRouting.executeRouting(
    '400656',           // start zipcode
    '400253, 400123',   // end zipcodes (comma-separated)
    'multiple',         // routing mode: 'multiple' or 'roundtrip'
    onSuccess,          // success callback (optional)
    onError            // error callback (optional)
);
```

### Advanced Usage with Callbacks

```javascript
ZipToZipRouting.route({
    startZip: '400656',
    endZips: '400253, 400123, 400789',
    routingMode: 'roundtrip',
    onSuccess: function(result) {
        console.log('Routing successful:', result.layerId);
        // Custom success handling
    },
    onError: function(error) {
        console.error('Routing failed:', error);
        // Custom error handling
    }
});
```

## Backend Endpoints

The module communicates with these backend endpoints:

- **`/get_zip_r`**: Multiple destinations routing
- **`/get_zip_roundtrip`**: Round trip routing

### Request Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `startZip` | Starting zipcode | `400656` |
| `endZip` (for multiple) | Comma-separated end zipcodes | `400253,400123` |
| `waypoints` (for roundtrip) | Comma-separated waypoints | `400253,400123` |

### Response Format

```json
{
    "start": "GeoJSON of start point",
    "routes": [
        {
            "end": "GeoJSON of end point",
            "route": "GeoJSON of route geometry",
            "segment": "Route description"
        }
    ],
    "routes_html": "HTML table for route details",
    "is_multiple": true,
    "is_roundtrip": false,
    "total_distance": 1234.56,
    "waypoint_sequence": "400656 → 400253 → 400123 → 400656"
}
```

## Routing Modes

### Multiple Destinations
- Creates separate routes from start to each destination
- Each route has different colors on the map
- Shows individual route information in table

**Example**: A → B, A → C, A → D

### Round Trip  
- Creates sequential route visiting all waypoints and returning to start
- Uses sequential color scheme to show route order
- Shows total trip distance and segment information

**Example**: A → B → C → D → A

## Color Schemes

### Multiple Destinations
```javascript
['#ff7800', '#0078ff', '#00ff78', '#ff0078', '#7800ff', '#78ff00']
```

### Round Trip
```javascript
['#ff4444', '#ff8800', '#ffbb00', '#88ff00', '#00ff88', '#0088ff', '#4400ff']
```

## Integration Guide

### Adding to New Forms

1. Include the module in your HTML:
```html
<script src="static/js/zipToZip.js"></script>
```

2. Call the routing function:
```javascript
// Simple call
ZipToZipRouting.handleForm1Routing(); // For Form 1 style

// Custom call
ZipToZipRouting.route({
    startZip: yourStartZip,
    endZips: yourEndZips,
    routingMode: yourMode
});
```

### Customizing Success/Error Handling

```javascript
ZipToZipRouting.route({
    startZip: '400656',
    endZips: '400253',
    routingMode: 'multiple',
    onSuccess: function(result) {
        // result contains:
        // - layerId: unique identifier for the route layer
        // - layerGroup: Leaflet layer group object
        // - responseData: complete backend response
        
        console.log('Route created with ID:', result.layerId);
    },
    onError: function(error) {
        // Custom error handling
        showCustomErrorMessage(error);
    }
});
```

## Dependencies

- jQuery (for AJAX requests)
- Leaflet.js (for map visualization)
- Existing `appLeaflet`, `layerTracker`, and `createRouteTable` globals
- `createRouteLayerControl` function from templates.js

## Migration from Original Code

The original `handleZipRouting()` function has been replaced with `ZipToZipRouting.handleForm1Routing()`. 

**Before:**
```javascript
getRouteBtn.addEventListener('click', handleZipRouting);
```

**After:**
```javascript
getRouteBtn.addEventListener('click', ZipToZipRouting.handleForm1Routing);
```

## Future Enhancements

- Support for mixed routing (zipcode to address, etc.)
- Route optimization algorithms
- Export route data functionality
- Save/load route configurations
- Integration with additional mapping services

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure `zipToZip.js` is loaded before `script.js`
2. **Form 2 button not appearing**: Check that both inputs are set to zipcode type
3. **Backend errors**: Verify zipcode exists in database
4. **Map not updating**: Ensure `appLeaflet.map` is initialized

### Debug Information

Enable debug logging by adding this to your code:
```javascript
// Enable detailed logging
console.log('ZipToZipRouting module:', ZipToZipRouting);
```

### Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| "Both start and end zipcode fields need to be filled" | Missing input values | Fill in all required fields |
| "Server returned: 500" | Backend processing error | Check server logs, verify zipcode exists |
| "Failed to fetch the route" | Network/API error | Check network connectivity and API endpoint |

<div align="center">

---
### Developed by **Rajat Saini**
---

</div>
