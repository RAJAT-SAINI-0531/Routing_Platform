# Table Search Feature Implementation

## Overview
This implementation adds a comprehensive search functionality to the existing table system in the routing platform. The feature includes a dropdown column selector and search input that filters table rows and highlights matching text with semi-transparent orange highlighting.

## Key Features Implemented

### 1. Search Bar with Dynamic Dropdown
- **Column Selection**: Dropdown automatically populates with all column names from the table headers
- **Dynamic Population**: Column options are generated dynamically based on the actual table structure
- **Responsive Design**: Adapts to different table layouts and column counts

### 2. Text Highlighting
- **Orange Highlighting**: Uses `rgba(255,165,0,0.3)` for 30% opacity semi-transparent orange background
- **Partial Matching**: Highlights only the matching portion of text, not the entire cell
- **Case-Insensitive**: Search is case-insensitive for better user experience
- **Preserves Text Color**: Original text color and readability are maintained

### 3. Row Filtering
- **Show Matching Rows**: Only displays rows that contain the search text in the selected column
- **Real-time Updates**: Filtering happens as the user types
- **No Results Message**: Shows appropriate message when no matches are found

### 4. Integration with Existing Features
- **Compatible with Row Selection**: Search works seamlessly with the existing row selection functionality
- **Filter Button Integration**: Show Selected/Show Unselected/Default View/Deselect All buttons work with search results
- **Sortable Columns**: Search functionality doesn't interfere with column sorting
- **Non-Breaking**: Preserves all existing table functionalities

## Files Modified

### 1. `templates.js`
**Changes Made:**
- Added search container HTML to `routeTable` template
- Added search container HTML to `attributeTable` template
- Includes dropdown, input field, and clear button

```javascript
<div class="table-search-container">
    <div class="search-dropdown-container">
        <select class="search-column-dropdown" data-table-id="${tableId}">
            <option value="">Select Column...</option>
        </select>
        <input type="text" class="search-input" placeholder="Search..." data-table-id="${tableId}" disabled>
        <button class="clear-search-btn" data-table-id="${tableId}" disabled>×</button>
    </div>
</div>
```

### 2. `style.css`
**Changes Added:**
- Search container styling
- Dropdown and input field styling
- Clear button styling
- Search highlighting styles (`.search-highlight` class)
- Active filter button states

**Key CSS Classes:**
```css
.search-highlight {
    background-color: rgba(255, 165, 0, 0.3) !important;
    font-weight: normal;
    color: inherit;
}
```

### 3. `script.js`
**New Functions Added:**

#### Core Search Functions:
- `initializeTableSearch(containerId)`: Main initialization function
- `populateColumnDropdown(dropdown, table)`: Populates dropdown with column names
- `performSearch(table, columnIndex, searchText)`: Executes search and filtering
- `highlightTextInCell(cell, searchText)`: Highlights matching text
- `clearAllHighlights(table)`: Removes all highlighting
- `showAllRows(table)`: Shows all data rows
- `escapeRegExp(string)`: Escapes special regex characters

#### Enhanced Filter Functions:
- Updated all filter functions to handle search state
- Added `hasActiveSearch` parameter to maintain search results during filtering
- Improved integration between search and selection features

## How to Use

### Basic Usage:
1. **Select Column**: Choose a column from the dropdown menu
2. **Enter Search Text**: Type in the search input field
3. **View Results**: See filtered rows with highlighted matching text
4. **Clear Search**: Click the × button or select "Select Column..." to reset

### Advanced Usage:
1. **Combined with Selection**: Select rows first, then search to filter selected items
2. **Filter Integration**: Use Show Selected/Unselected buttons on search results
3. **Column Sorting**: Sort columns while maintaining search filters

## Technical Implementation Details

### Search Algorithm:
1. **Case-Insensitive Regex**: Uses `RegExp` with 'gi' flags for global, case-insensitive matching
2. **Partial Matching**: Finds all occurrences of search text within cell content
3. **HTML Preservation**: Stores original HTML content before highlighting for proper cleanup
4. **Performance Optimization**: Only processes visible data rows, excludes message rows

### Highlighting Mechanism:
1. **Text Extraction**: Gets plain text content from cells
2. **Pattern Replacement**: Replaces matching text with `<span class="search-highlight">` wrapper
3. **State Management**: Tracks original content using `data-original-content` attribute
4. **Cleanup Process**: Restores original HTML when clearing highlights

### Integration Strategy:
1. **Non-Intrusive**: Added functionality without modifying existing code structure
2. **Event Isolation**: Prevents search events from interfering with other table interactions
3. **State Preservation**: Maintains row selection states during search operations
4. **Filter Compatibility**: Seamlessly works with existing filter buttons

## Performance Considerations

### Optimizations:
- Only searches in the selected column (not all columns)
- Excludes system message rows from processing
- Uses efficient DOM manipulation techniques
- Implements proper event delegation

### Memory Management:
- Cleans up highlights when not needed
- Removes temporary DOM attributes
- Proper event listener cleanup

## Browser Compatibility
- Works with modern browsers supporting ES6+
- Uses standard DOM APIs
- Compatible with existing jQuery dependencies
- Responsive design works on mobile devices

## Testing
Use the `test_search.html` file to test the functionality:
1. Open the test file in a browser
2. Try different search scenarios
3. Test integration with row selection
4. Verify filter button functionality
5. Test clear search functionality

## Future Enhancements
Potential improvements that could be added:
1. **Multi-column Search**: Search across all columns simultaneously
2. **Regular Expression Support**: Advanced pattern matching
3. **Search History**: Remember previous searches
4. **Export Filtered Data**: Export only filtered rows
5. **Search Highlighting Themes**: Different highlight colors

## Conclusion
This implementation provides a robust, user-friendly search feature that enhances the existing table functionality without disrupting current workflows. The orange highlighting with 30% opacity ensures excellent visibility while maintaining text readability, and the dynamic column selection makes it easy to search specific data fields.

<div align="center">

---
### Developed by **Rajat Saini**
---

</div>
