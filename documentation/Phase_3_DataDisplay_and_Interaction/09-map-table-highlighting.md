# Map-Table Highlighting

**Author:** Rajat Saini

## What is Map-Table Highlighting?
This feature links the map and table, allowing users to select a table row and see the corresponding feature highlighted on the map—or vice versa.

### Key Concepts
- **Bidirectional Interaction:** Select a row to highlight a map feature, or click a map feature to highlight its row.
- **Dynamic Updates:** Changes are reflected instantly in both the map and table.
- **Visual Feedback:** Highlights make it easy to see connections between data and geography.

| Example: Highlighting |
|-----------------------|
| Table Row → Map Feature |
| Map Feature → Table Row |

## Why is This Needed?
- Links data and geography for better understanding.
- Makes it easy to explore and analyze relationships.
- Provides a seamless user experience.

## How Does It Work in This Project?
- The frontend listens for clicks on table rows and map features.
- When a row is selected, the corresponding feature is highlighted on the map.
- When a map feature is clicked, its row is highlighted in the table.

## Dependencies
- **Leaflet.js** (for map interaction)
- **JavaScript** (for event handling)
- **GeoJSON files** (data source)

## Step-by-Step Usage Instructions
1. Open the app and upload a GeoJSON file.
2. Click a row in the table to highlight the feature on the map.
3. Click a feature on the map to highlight its row in the table.
4. Use this feature to explore relationships between data and geography.

### Example: Bidirectional Highlighting
- Select a row in the table: The map feature is highlighted.
- Click a map feature: The table row is highlighted.

---
**Summary & Key Takeaways**
- Map-table highlighting links data and geography seamlessly.
- It’s a powerful tool for exploring and analyzing spatial data.
- This feature combines the best of tables and maps for interactive learning.

---
*Developed by Rajat Saini*