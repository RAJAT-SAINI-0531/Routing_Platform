const appLeaflet = {
    map: null,
    layerControl: null,
} 
let options = {
    maxZoom: 20,
    tolerance: 3,
    debug: 0,
    style: { 
        fillColor: "#FD831E",
        color: "#FF8000",
        weight: 7,
        opacity: 1,
        fillOpacity: 1,
    }};


const layerTracker = {};

//-----------------------------------------------------------------------------------------------------------------------------------------------
// Map Feature Highlighting System
//-----------------------------------------------------------------------------------------------------------------------------------------------

// Global highlighting layer and state management
const mapHighlighting = {
    highlightLayer: null,
    highlightedFeatures: new Map(), // Maps table row indices to feature data
    currentTableId: null,
    
    // Initialize highlight layer
    init() {
        if (!this.highlightLayer) {
            this.highlightLayer = L.layerGroup().addTo(appLeaflet.map);
        }
    },
    
    // Clear all highlights
    clearAll() {
        if (this.highlightLayer) {
            this.highlightLayer.clearLayers();
        }
        this.highlightedFeatures.clear();
    },
    
    // Remove specific feature highlight
    removeHighlight(rowIndex) {
        if (this.highlightedFeatures.has(rowIndex)) {
            const feature = this.highlightedFeatures.get(rowIndex);
            if (feature.highlightLayer) {
                this.highlightLayer.removeLayer(feature.highlightLayer);
            }
            this.highlightedFeatures.delete(rowIndex);
        }
    },
    
    // Add feature highlight
    addHighlight(rowIndex, featureData, geojsonLayer) {
        if (!featureData) return;
        
        this.init();
        
        // Create highlight style
        const highlightStyle = {
            color: '#ffff00',
            fillColor: '#ffff00',
            fillOpacity: 0.6,
            opacity: 1,
            weight: 5
        };
        
        // Create highlight layer based on geometry type
        let highlightLayer;
        if (geojsonLayer) {
            // Clone the original layer with highlight style
            highlightLayer = L.geoJSON(featureData, {
                style: highlightStyle,
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        ...highlightStyle,
                        radius: 8
                    });
                }
            });
        }
        
        if (highlightLayer) {
            this.highlightLayer.addLayer(highlightLayer);
            this.highlightedFeatures.set(rowIndex, {
                data: featureData,
                highlightLayer: highlightLayer
            });
        }
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------
// Search and Filter Functions
//-----------------------------------------------------------------------------------------------------------------------------------------------

// Initialize search functionality for a table
const initializeTableSearch = (containerId) => {
    const container = document.getElementById(containerId) || document.querySelector('.attribute-table-container');
    if (!container) return;

    const dropdown = container.querySelector('.search-column-dropdown');
    const searchInput = container.querySelector('.search-input');
    const clearBtn = container.querySelector('.clear-search-btn');
    const table = container.querySelector('table');

    if (!dropdown || !searchInput || !clearBtn || !table) return;

    // Populate dropdown with column names
    populateColumnDropdown(dropdown, table);

    // Event listeners
    dropdown.addEventListener('change', function() {
        const selectedColumn = this.value;
        if (selectedColumn) {
            searchInput.disabled = false;
            searchInput.focus();
            clearBtn.disabled = false;
        } else {
            searchInput.disabled = true;
            searchInput.value = '';
            clearBtn.disabled = true;
            clearAllHighlights(table);
            showAllRows(table);
        }
    });

    searchInput.addEventListener('input', function() {
        const searchText = this.value.trim();
        const selectedColumn = dropdown.value;
        
        if (selectedColumn && searchText) {
            performSearch(table, selectedColumn, searchText);
        } else if (!searchText) {
            clearAllHighlights(table);
            showAllRows(table);
        }
    });

    clearBtn.addEventListener('click', function() {
        dropdown.value = '';
        searchInput.value = '';
        searchInput.disabled = true;
        clearBtn.disabled = true;
        clearAllHighlights(table);
        showAllRows(table);
        
        // Re-apply current filter state if any
        const container = this.closest('.table-container') || this.closest('.attribute-table-container');
        if (container) {
            // Check if any filter buttons are active and reapply
            const activeFilter = getActiveFilter(container);
            if (activeFilter) {
                const tbody = table.querySelector('tbody');
                const allRows = Array.from(tbody.querySelectorAll('tr'));
                const dataRows = allRows.filter(row => {
                    const tds = row.querySelectorAll('td');
                    if (tds.length === 0 || row.hasAttribute('data-message-row')) return false;
                    
                    const rowText = row.textContent.trim();
                    return !rowText.includes('No features found') && 
                           !rowText.includes('No data available') &&
                           !rowText.includes('No rows selected') &&
                           !rowText.includes('All rows are selected');
                });
                
                handleTableFilter(container, activeFilter);
            }
        }
    });
};

// Populate dropdown with column names from table headers
const populateColumnDropdown = (dropdown, table) => {
    const headers = table.querySelectorAll('thead th');
    
    // Clear existing options except the first one
    while (dropdown.children.length > 1) {
        dropdown.removeChild(dropdown.lastChild);
    }
    
    headers.forEach((header, index) => {
        // Get clean column name without sort indicators
        let columnName = '';
        
        // First try to get text from child nodes excluding sort indicators
        const textNodes = [];
        header.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node.textContent);
            } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('sort-indicator')) {
                textNodes.push(node.textContent);
            }
        });
        
        if (textNodes.length > 0) {
            columnName = textNodes.join('').trim();
        } else {
            // Fallback: get all text and remove sort indicators
            columnName = header.textContent.trim();
            columnName = columnName.replace(/\s*[↕↑↓]\s*$/, '').trim();
        }
        
        if (columnName) {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = columnName;
            dropdown.appendChild(option);
        }
    });
};

// Perform search and highlight matching text
const performSearch = (table, columnIndex, searchText) => {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Clear previous highlights and show all rows
    clearAllHighlights(table);
    
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const dataRows = allRows.filter(row => {
        const tds = row.querySelectorAll('td');
        if (tds.length === 0 || row.hasAttribute('data-message-row')) return false;
        
        const rowText = row.textContent.trim();
        return !rowText.includes('No features found') && 
               !rowText.includes('No data available') &&
               !rowText.includes('No rows selected') &&
               !rowText.includes('All rows are selected');
    });

    let visibleRows = [];
    const searchRegex = new RegExp(escapeRegExp(searchText), 'gi');

    dataRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const targetCell = cells[parseInt(columnIndex)];
        
        if (targetCell) {
            const cellText = targetCell.textContent;
            const hasMatch = searchRegex.test(cellText);
            
            if (hasMatch) {
                // Highlight matching text in the cell
                highlightTextInCell(targetCell, searchText);
                visibleRows.push(row);
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        } else {
            row.style.display = 'none';
        }
    });

    // Handle message rows and non-data rows
    const messageRows = tbody.querySelectorAll('tr[data-message-row]');
    messageRows.forEach(row => row.remove());

    // Show no results message if no matches found
    if (visibleRows.length === 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.setAttribute('data-message-row', 'true');
        noResultsRow.innerHTML = `<td colspan="100%" style="text-align: center; font-style: italic; color: #666;">No matches found for "${searchText}"</td>`;
        tbody.appendChild(noResultsRow);
    }
};

// Highlight matching text within a cell
const highlightTextInCell = (cell, searchText) => {
    const originalHTML = cell.innerHTML;
    const textContent = cell.textContent;
    
    // Store original content if not already stored
    if (!cell.hasAttribute('data-original-content')) {
        cell.setAttribute('data-original-content', originalHTML);
    }
    
    // Create regex for case-insensitive matching
    const searchRegex = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');
    
    // Replace matching text with highlighted version
    const highlightedHTML = textContent.replace(searchRegex, '<span class="search-highlight">$1</span>');
    
    cell.innerHTML = highlightedHTML;
};

// Clear all highlights from table
const clearAllHighlights = (table) => {
    const highlightedCells = table.querySelectorAll('[data-original-content]');
    
    highlightedCells.forEach(cell => {
        const originalContent = cell.getAttribute('data-original-content');
        cell.innerHTML = originalContent;
        cell.removeAttribute('data-original-content');
    });
};

// Show all data rows
const showAllRows = (table) => {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const dataRows = allRows.filter(row => {
        const tds = row.querySelectorAll('td');
        if (tds.length === 0 || row.hasAttribute('data-message-row')) return false;
        
        const rowText = row.textContent.trim();
        return !rowText.includes('No features found') && 
               !rowText.includes('No data available') &&
               !rowText.includes('No rows selected') &&
               !rowText.includes('All rows are selected');
    });

    // Remove any search message rows
    const messageRows = tbody.querySelectorAll('tr[data-message-row]');
    messageRows.forEach(row => row.remove());

    // Show all data rows
    dataRows.forEach(row => {
        row.style.display = '';
    });
};

// Get currently active filter
const getActiveFilter = (container) => {
    const activeButton = container.querySelector('.table-control-btn.active');
    return activeButton ? activeButton.getAttribute('data-action') : null;
};

// Escape special regex characters
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

//-----------------------------------------------------------------------------------------------------------------------------------------------
// Table Management Functions
//-----------------------------------------------------------------------------------------------------------------------------------------------

// Row Selection and Filtering Functions
const initializeTableRowSelection = (containerId) => {
    const container = document.getElementById(containerId) || document.querySelector('.attribute-table-container');
    if (!container) return;

    const table = container.querySelector('table');
    if (!table) return;

    // Add click listeners to all data rows
    const tbody = table.querySelector('tbody');
    if (tbody) {
        tbody.addEventListener('click', function(e) {
            const row = e.target.closest('tr');
            if (row && !row.hasAttribute('data-message-row')) {
                const rowText = row.textContent.trim();
                // Only allow clicking on actual data rows, not system message rows
                const isSystemMessage = rowText.includes('No features found') || 
                                       rowText.includes('No data available') ||
                                       rowText.includes('No rows selected') ||
                                       rowText.includes('All rows are selected');
                
                if (!isSystemMessage && row.querySelectorAll('td').length > 0) {
                    toggleRowSelection(row);
                }
            }
        });
    }

    // Add listeners for control buttons
    const controlButtons = container.querySelectorAll('.table-control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.getAttribute('data-action');
            handleTableFilter(container, action);
        });
    });
    
    // Add listeners for search controls
    const searchDropdown = container.querySelector('.search-column-dropdown');
    const searchInput = container.querySelector('.search-input');
    const clearSearchBtn = container.querySelector('.clear-search-btn');
    
    if (searchDropdown || searchInput || clearSearchBtn) {
        // These will be handled by initializeTableSearch
        // Just ensure they don't interfere with other event handlers
        [searchDropdown, searchInput, clearSearchBtn].forEach(element => {
            if (element) {
                element.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        });
    }
};

const toggleRowSelection = (row) => {
    const wasSelected = row.classList.contains('selected');
    
    if (wasSelected) {
        row.classList.remove('selected');
        // Remove map highlight
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        mapHighlighting.removeHighlight(rowIndex);
    } else {
        row.classList.add('selected');
        // Add map highlight
        highlightFeatureFromTableRow(row);
    }
};

// Function to highlight map feature based on table row
const highlightFeatureFromTableRow = (row) => {
    const table = row.closest('table');
    const container = row.closest('.table-container, .attribute-table-container');
    
    if (!table || !container) {
        console.warn('Could not find table or container for row highlighting');
        return;
    }
    
    const rowIndex = Array.from(row.parentNode.children).indexOf(row);
    console.log('Highlighting row index:', rowIndex);
    
    // Get the layer data associated with this table
    const layerData = getLayerDataForTable(container);
    if (!layerData) {
        console.warn('No layer data found for table');
        return;
    }
    
    console.log('Found layer data:', layerData);
    
    // Extract feature data for this row
    const featureData = extractFeatureDataFromRow(row, table, layerData);
    if (featureData) {
        console.log('Extracted feature data:', featureData);
        mapHighlighting.addHighlight(rowIndex, featureData, layerData.layer);
    } else {
        console.warn('Could not extract feature data for row', rowIndex);
    }
};

// Get layer data associated with a table
const getLayerDataForTable = (container) => {
    console.log('Getting layer data for container:', container.className);
    console.log('Current layerTracker:', Object.keys(layerTracker));
    
    // Check if this is a route table
    if (container.classList.contains('table-container')) {
        const tableId = container.id;
        console.log('Route table ID:', tableId);
        
        // Find the most recent route data in layerTracker
        const layerEntries = Object.entries(layerTracker);
        layerEntries.reverse(); // Get most recent first
        
        for (const [id, data] of layerEntries) {
            if (data.routeData || data.name === "Routes" || data.name === "Multiple Routes") {
                console.log('Found route layer data:', id, data);
                return data;
            }
        }
    }
    
    // Check if this is an attribute table
    if (container.classList.contains('attribute-table-container')) {
        console.log('Processing attribute table');
        
        // For attribute tables, find the most recent GeoJSON layer
        const layerEntries = Object.entries(layerTracker);
        layerEntries.reverse(); // Get most recent first
        
        for (const [id, data] of layerEntries) {
            if (data.data && data.layer && data.data.features) {
                console.log('Found attribute layer data:', id, data);
                return data;
            }
        }
    }
    
    console.warn('No matching layer data found');
    return null;
};

// Extract feature data from a table row
const extractFeatureDataFromRow = (row, table, layerData) => {
    if (!layerData) return null;
    
    const rowIndex = Array.from(row.parentNode.children).indexOf(row);
    
    // For GeoJSON attribute tables
    if (layerData.data && layerData.data.features && layerData.data.features[rowIndex]) {
        return layerData.data.features[rowIndex];
    }
    
    // For route tables - different handling based on data structure
    if (layerData.routeData) {
        const routeData = layerData.routeData;
        
        // Handle multiple routes scenario
        if (routeData.is_multiple && routeData.routes && routeData.routes[rowIndex]) {
            try {
                const routeInfo = routeData.routes[rowIndex];
                
                // Try to get the route geometry
                if (routeInfo['route']) {
                    const routeGeoJSON = JSON.parse(routeInfo['route']);
                    if (routeGeoJSON.features && routeGeoJSON.features.length > 0) {
                        return routeGeoJSON.features[0];
                    } else if (routeGeoJSON.geometry) {
                        return routeGeoJSON;
                    }
                }
                
                // Fallback to endpoint if route not available
                if (routeInfo['end']) {
                    const endGeoJSON = JSON.parse(routeInfo['end']);
                    if (endGeoJSON.features && endGeoJSON.features.length > 0) {
                        return endGeoJSON.features[0];
                    } else if (endGeoJSON.geometry) {
                        return endGeoJSON;
                    }
                }
            } catch (e) {
                console.error('Error parsing route data:', e);
            }
        }
        
        // Handle single route scenario
        else if (routeData.routes && routeData.routes[rowIndex]) {
            try {
                const routeGeoJSON = JSON.parse(routeData.routes[rowIndex]['route']);
                if (routeGeoJSON.features && routeGeoJSON.features.length > 0) {
                    return routeGeoJSON.features[0];
                } else if (routeGeoJSON.geometry) {
                    return routeGeoJSON;
                }
            } catch (e) {
                console.error('Error parsing single route GeoJSON:', e);
            }
        }
    }
    
    // Try to extract from layer data based on table content
    if (layerData.layer && layerData.layer.getLayers) {
        const layers = layerData.layer.getLayers();
        // Try to find a feature that corresponds to this row
        if (layers[rowIndex] && layers[rowIndex].feature) {
            return layers[rowIndex].feature;
        }
        
        // For route layers, look for LineString features
        for (let layer of layers) {
            if (layer.getLayers) {
                const subLayers = layer.getLayers();
                const lineStringLayer = subLayers.find(l => 
                    l.feature && l.feature.geometry && l.feature.geometry.type === 'LineString'
                );
                if (lineStringLayer && lineStringLayer.feature) {
                    return lineStringLayer.feature;
                }
            }
        }
    }
    
    return null;
};

const handleTableFilter = (container, action) => {
    const table = container.querySelector('table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Remove existing active filter button classes
    const filterButtons = container.querySelectorAll('.table-control-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to current button
    const currentButton = container.querySelector(`[data-action="${action}"]`);
    if (currentButton && action !== 'default-view') {
        currentButton.classList.add('active');
    }

    // Get all rows, but respect search filtering
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const dataRows = allRows.filter(row => {
        // Check if row has td elements and is not a message row
        const tds = row.querySelectorAll('td');
        if (tds.length === 0 || row.hasAttribute('data-message-row')) return false;
        
        // Exclude system message rows by content
        const rowText = row.textContent.trim();
        return !rowText.includes('No features found') && 
               !rowText.includes('No data available') &&
               !rowText.includes('No rows selected') &&
               !rowText.includes('All rows are selected') &&
               !rowText.includes('No matches found for');
    });

    // Check if search is active and get visible rows from search
    const searchInput = container.querySelector('.search-input');
    const dropdown = container.querySelector('.search-column-dropdown');
    const hasActiveSearch = searchInput && dropdown && dropdown.value && searchInput.value.trim();
    
    let visibleDataRows = dataRows;
    if (hasActiveSearch) {
        // Only consider rows that are currently visible from search
        visibleDataRows = dataRows.filter(row => row.style.display !== 'none');
    }

    switch(action) {
        case 'show-selected':
            showSelectedRows(tbody, visibleDataRows, allRows, hasActiveSearch);
            break;
        case 'show-unselected':
            showUnselectedRows(tbody, visibleDataRows, allRows, hasActiveSearch);
            break;
        case 'default-view':
            showDefaultView(tbody, allRows, hasActiveSearch);
            break;
        case 'deselect-all':
            deselectAllRows(tbody, dataRows, hasActiveSearch);
            break;
    }
};

const showSelectedRows = (tbody, dataRows, allRows, hasActiveSearch = false) => {
    const selectedRows = dataRows.filter(row => row.classList.contains('selected'));
    
    // Hide all existing message rows first
    const messageRows = tbody.querySelectorAll('tr[data-message-row]');
    messageRows.forEach(row => row.remove());
    
    if (dataRows.length === 0) {
        // No data rows exist, show all rows normally
        allRows.forEach(row => {
            row.style.display = '';
        });
    } else if (selectedRows.length === 0) {
        // Hide all data rows and show message
        dataRows.forEach(row => {
            row.style.display = 'none';
        });
        
        const messageText = hasActiveSearch ? 'No selected rows in search results' : 'No rows selected';
        const noSelectionRow = document.createElement('tr');
        noSelectionRow.setAttribute('data-message-row', 'true');
        noSelectionRow.innerHTML = `<td colspan="100%" style="text-align: center; font-style: italic; color: #666;">${messageText}</td>`;
        tbody.appendChild(noSelectionRow);
    } else {
        // Show only selected rows, hide others
        dataRows.forEach(row => {
            if (row.classList.contains('selected')) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // If search is active, hide non-matching selected rows
        if (hasActiveSearch) {
            selectedRows.forEach(row => {
                const wasHiddenBySearch = row.style.display === 'none';
                if (wasHiddenBySearch) {
                    row.style.display = 'none';
                }
            });
        }
    }
};

const showUnselectedRows = (tbody, dataRows, allRows, hasActiveSearch = false) => {
    const selectedRows = dataRows.filter(row => row.classList.contains('selected'));
    const unselectedRows = dataRows.filter(row => !row.classList.contains('selected'));
    
    // Hide all existing message rows first
    const messageRows = tbody.querySelectorAll('tr[data-message-row]');
    messageRows.forEach(row => row.remove());
    
    if (dataRows.length === 0) {
        // No data rows exist, show all rows normally
        allRows.forEach(row => {
            row.style.display = '';
        });
    } else if (unselectedRows.length === 0 && selectedRows.length > 0) {
        // Hide all data rows and show message
        dataRows.forEach(row => {
            row.style.display = 'none';
        });
        
        const messageText = hasActiveSearch ? 'All search results are selected' : 'All rows are selected';
        const allSelectedRow = document.createElement('tr');
        allSelectedRow.setAttribute('data-message-row', 'true');
        allSelectedRow.innerHTML = `<td colspan="100%" style="text-align: center; font-style: italic; color: #666;">${messageText}</td>`;
        tbody.appendChild(allSelectedRow);
    } else {
        // Show only unselected rows, hide selected ones
        dataRows.forEach(row => {
            if (!row.classList.contains('selected')) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // If search is active, hide non-matching unselected rows
        if (hasActiveSearch) {
            unselectedRows.forEach(row => {
                const wasHiddenBySearch = row.style.display === 'none';
                if (wasHiddenBySearch) {
                    row.style.display = 'none';
                }
            });
        }
    }
};

const showDefaultView = (tbody, allRows, hasActiveSearch = false) => {
    // Hide all existing message rows first
    const messageRows = tbody.querySelectorAll('tr[data-message-row]');
    messageRows.forEach(row => row.remove());
    
    // Show all non-message rows
    allRows.forEach(row => {
        if (!row.hasAttribute('data-message-row')) {
            row.style.display = '';
        }
    });
    
    // If search is active, re-apply search filtering
    if (hasActiveSearch) {
        // Find the container and trigger search again
        const container = tbody.closest('.table-container') || tbody.closest('.attribute-table-container');
        if (container) {
            const dropdown = container.querySelector('.search-column-dropdown');
            const searchInput = container.querySelector('.search-input');
            const table = container.querySelector('table');
            
            if (dropdown && searchInput && table && dropdown.value && searchInput.value.trim()) {
                performSearch(table, dropdown.value, searchInput.value.trim());
            }
        }
    }
};

const deselectAllRows = (tbody, dataRows, hasActiveSearch = false) => {
    // Remove selected class from all data rows
    dataRows.forEach(row => {
        row.classList.remove('selected');
    });
    
    // Clear all map highlights
    mapHighlighting.clearAll();
    
    // Hide all existing message rows
    const messageRows = tbody.querySelectorAll('tr[data-message-row]');
    messageRows.forEach(row => row.remove());
    
    // Show all non-message rows
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    allRows.forEach(row => {
        if (!row.hasAttribute('data-message-row')) {
            row.style.display = '';
        }
    });
    
    // If search is active, re-apply search filtering
    if (hasActiveSearch) {
        const container = tbody.closest('.table-container') || tbody.closest('.attribute-table-container');
        if (container) {
            const dropdown = container.querySelector('.search-column-dropdown');
            const searchInput = container.querySelector('.search-input');
            const table = container.querySelector('table');
            
            if (dropdown && searchInput && table && dropdown.value && searchInput.value.trim()) {
                performSearch(table, dropdown.value, searchInput.value.trim());
            }
        }
    }
};

const createRouteTable = (responseData) => {
    console.log('createRouteTable called with:', responseData);
    
    // Check if TableTemplates is available
    if (typeof TableTemplates === 'undefined') {
        console.error('TableTemplates is not defined!');
        return;
    }
    
    // Determine table title based on route type
    let title = 'Route Results';
    if (responseData.is_roundtrip) {
        title = 'Round Trip Results';
    } else if (responseData.is_multiple) {
        title = 'Multiple Routes Results';
    }
    const tableId = `route-table-${Date.now()}`;
    
    console.log('Creating table with title:', title, 'and ID:', tableId);
    
    // Remove existing tables
    document.querySelectorAll('.table-container').forEach(table => table.remove());
    
    // Create new table
    const tableContainer = document.createElement('div');
    tableContainer.innerHTML = TableTemplates.routeTable(title, responseData.routes_html, tableId);
    document.body.appendChild(tableContainer.firstElementChild);
    
    console.log('Table container added to DOM');
    
    // Add event listeners
    setupTableEventListeners(tableId);
    
    // Make table columns sortable
    makeSortable(tableId);
    
    // Initialize row selection functionality
    initializeTableRowSelection(tableId);
    
    // Initialize search functionality
    initializeTableSearch(tableId);
    
    return tableId;
};

const setupTableEventListeners = (tableId) => {
    const tableContainer = document.getElementById(tableId);
    if (!tableContainer) return;
    
    const header = tableContainer.querySelector('.table-header');
    const closeBtn = tableContainer.querySelector('.close-table-btn');
    
    // Drag functionality
    let isDragging = false;
    let startX = 0, startY = 0, offsetX = 0, offsetY = 0;
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('close-table-btn')) return;
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        document.body.style.userSelect = 'none';
        header.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        tableContainer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            header.style.cursor = 'move';
        }
    });
    
    // Touch events for mobile
    header.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('close-table-btn')) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX - offsetX;
        startY = touch.clientY - offsetY;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        offsetX = touch.clientX - startX;
        offsetY = touch.clientY - startY;
        tableContainer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) isDragging = false;
    });
    
    // Close button functionality
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Clear map highlights before removing table
        mapHighlighting.clearAll();
        tableContainer.remove();
    });
    
    // Hover effects
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#c82333';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = '#dc3545';
    });
    
    // Prevent clicks inside table from propagating
    const tableContent = tableContainer.querySelector('.table-content');
    if (tableContent) {
        tableContent.addEventListener('click', (e) => {
            // Don't stop propagation for table rows to allow selection
            if (!e.target.closest('tr')) {
                e.stopPropagation();
            }
        });
    }
    
    // Prevent header clicks from propagating (except close button)
    header.addEventListener('click', (e) => {
        if (!e.target.classList.contains('close-table-btn')) {
            e.stopPropagation();
        }
    });
    
    // Prevent control button clicks from propagating
    const controlsContainer = tableContainer.querySelector('.table-controls');
    if (controlsContainer) {
        controlsContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
};

const createLayerControl = (id, layerName, hasAttributeTable = false) => {
    return TableTemplates.layerControl(id, layerName, hasAttributeTable);
};

const createRouteLayerControl = (id, layerName) => {
    return TableTemplates.routeLayerControl(id, layerName);
};

// Function to show route table when clicking on route layer button
const showRouteTable = (routeId) => {
    console.log('showRouteTable called with routeId:', routeId);
    console.log('Current layerTracker:', layerTracker);
    
    const routeData = layerTracker[routeId];
    if (!routeData) {
        console.error('No route data found for ID:', routeId);
        console.log('Available IDs in layerTracker:', Object.keys(layerTracker));
        return;
    }
    
    // Check if this is a GeoJSON file (has .data property) or route data (has .routeData property)
    if (routeData.data) {
        // This is a GeoJSON file, show attribute table
        showAttributeTable(routeId, routeData.name, routeData.data);
        return;
    }
    
    // This is route data, show route table
    
    console.log('Found route data:', routeData);
    
    const responseData = routeData.routeData;
    if (responseData && responseData.routes_html) {
        console.log('Creating route table from stored data');
        createRouteTable(responseData);
    } else {
        console.error('No routes_html found in stored route data');
        console.log('responseData:', responseData);
        
        // Create a simple fallback table
        const fallbackResponse = {
            routes_html: `<table><tr><td>Route table data not available</td></tr></table>`,
            is_multiple: false
        };
        createRouteTable(fallbackResponse);
    }
};

//-----------------------------------------------------------------------------------------------------------------------------------------------
// Function to make table columns sortable
const makeSortable = (containerId) => {
    const container = document.getElementById(containerId) || document.querySelector('.attribute-table-container');
    if (!container) {
        console.log('Container not found for sortable functionality');
        return;
    }
    
    const table = container.querySelector('table');
    if (!table) {
        console.log('Table not found in container');
        return;
    }
    
    const headers = table.querySelectorAll('th');
    
    headers.forEach((header, columnIndex) => {
        // Add cursor pointer and sort indicator styling
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.style.position = 'relative';
        header.title = 'Click to sort';
        header.classList.add('sortable');
        
        // Check if sort indicator already exists (to avoid duplicates)
        let sortIndicator = header.querySelector('.sort-indicator');
        if (!sortIndicator) {
            sortIndicator = document.createElement('span');
            sortIndicator.className = 'sort-indicator';
            sortIndicator.innerHTML = ' ↕';
            sortIndicator.style.fontSize = '12px';
            header.appendChild(sortIndicator);
        }
        
        let sortDirection = 'asc'; // Track sort direction
        
        // Remove any existing event listeners to avoid duplicates
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', (e) => {
            // Prevent header drag when clicking for sort
            e.stopPropagation();
            
            // Reset all other headers
            const allHeaders = table.querySelectorAll('th');
            allHeaders.forEach((h, idx) => {
                if (idx !== columnIndex) {
                    const indicator = h.querySelector('.sort-indicator');
                    if (indicator) {
                        indicator.innerHTML = ' ↕';
                    }
                }
            });
            
            // Update current header indicator
            const indicator = newHeader.querySelector('.sort-indicator');
            if (sortDirection === 'asc') {
                indicator.innerHTML = ' ↓';
                sortDirection = 'desc';
            } else {
                indicator.innerHTML = ' ↑';
                sortDirection = 'asc';
            }
            
            sortTable(table, columnIndex, sortDirection);
        });
    });
};

const sortTable = (table, columnIndex, direction) => {
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.log('No tbody found in table');
        return;
    }
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0) {
        console.log('No rows found to sort');
        return;
    }
    
    // Skip empty rows or rows that indicate no data
    const dataRows = rows.filter(row => {
        const cells = row.querySelectorAll('td');
        return cells.length > 0 && !row.textContent.includes('No features found') && !row.textContent.includes('No data available');
    });
    
    if (dataRows.length === 0) {
        console.log('No data rows to sort');
        return;
    }
    
    // Get data type for sorting from first non-empty cell
    let isNumeric = false;
    for (let row of dataRows) {
        const cell = row.querySelectorAll('td')[columnIndex];
        if (cell && cell.textContent.trim()) {
            const value = cell.textContent.trim();
            isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
            break;
        }
    }
    
    dataRows.sort((a, b) => {
        const cellA = a.querySelectorAll('td')[columnIndex];
        const cellB = b.querySelectorAll('td')[columnIndex];
        
        if (!cellA || !cellB) return 0;
        
        let valueA = cellA.textContent.trim();
        let valueB = cellB.textContent.trim();
        
        // Handle empty values
        if (!valueA && !valueB) return 0;
        if (!valueA) return direction === 'asc' ? 1 : -1;
        if (!valueB) return direction === 'asc' ? -1 : 1;
        
        // Handle numeric sorting
        if (isNumeric) {
            valueA = parseFloat(valueA) || 0;
            valueB = parseFloat(valueB) || 0;
            
            if (direction === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        }
        
        // Handle string sorting
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
        
        if (direction === 'asc') {
            return valueA.localeCompare(valueB);
        } else {
            return valueB.localeCompare(valueA);
        }
    });
    
    // Clear tbody and append sorted rows (preserve non-data rows at the end)
    const nonDataRows = rows.filter(row => !dataRows.includes(row));
    tbody.innerHTML = '';
    dataRows.forEach(row => tbody.appendChild(row));
    nonDataRows.forEach(row => tbody.appendChild(row));
};

//-----------------------------------------------------------------------------------------------------------------------------------------------
// Function to style tables for better readability (legacy support)
const styleTableContainer = (tableContainer) => {
    // This function is kept for backward compatibility but functionality is now handled by CSS
    console.log('Table styling is now handled by CSS classes');
};
//-----------------------------------------------------------------------------------------------------------------------------------------------



const initApp = () => {
    appLeaflet.map = L.map('map').setView([46.76328536153317, 23.60311995318753], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(appLeaflet.map);
   
    // Initialize map highlighting system
    mapHighlighting.init();

    appLeaflet.layerControl = L.control.layers(null, null, { position: 'bottomright', collapsed : false}).addTo(appLeaflet.map);

    
    const customIcon = L.icon({
        iconUrl: 'static/216224_circles_icon.png',
        iconSize: [20, 20],
        shadowUrl: null,
        shadowSize:   [0, 0]
    })


    // appLeaflet.map.pm.addControls({
    //     position: 'topleft',
    //     drawMarker: true,
    //     drawCircleMarker : false,
    //     drawPolyline : false,
    //     drawRectangle: false,
    //     drawPolygon : false,
    //     drawCircle: false, 
    //     drawText : false, 
    //     dragMode : false,
    //     cutPolygon: false,
    //     rotateMode: false,
    //     drawControls : true, 
    //     editControls : true,
    // })

    // appLeaflet.map.pm.setGlobalOptions({globalOptions : {cursorMarker: false}})

    let layerElements = []


    appLeaflet.map.on('pm:drawstart', function (e) {
        if (e.shape === 'Marker') {
            document.querySelectorAll('.leaflet-marker-icon').forEach(el => {
                el.style.display = 'none';  
            });
        }
    });
    

    appLeaflet.map.on("pm:create", (e) => {
        if (e.shape == "Marker"){
            e.layer.setIcon(customIcon)
        }
        layerElements.push(e.layer)
        
    });


    appLeaflet.map.on("pm:remove", (e) =>{
        console.log(e.layer)
    })



    appLeaflet.map.on("pm:drawend", () => {
        const layerGroup = L.layerGroup(layerElements)
        const id = Date.now()
        
        const overlayHTML = `<span><button onclick=removeLayerGroup(${id})>x<button>Points Added</button></span>`

        appLeaflet.layerControl.addOverlay(layerGroup, [overlayHTML]).addTo(appLeaflet.map)
        const dropdownMenus = document.querySelectorAll(".dropdown-menu")
        const insertHTML = `<button id="${id}" class="dropdown-item">Points Added</button>`
        dropdownMenus.forEach((menu) => {
            menu.insertAdjacentHTML('beforeend', insertHTML)
        })
        layerTracker[id] = layerGroup

        setTimeout(() => {
            const checkboxes = document.querySelectorAll('.leaflet-control-layers-selector');
            if (checkboxes.length > 0) {
                const lastCheckbox = checkboxes[checkboxes.length - 1];
    
                if (!lastCheckbox.checked) {
                    lastCheckbox.click(); 
                }
            } else {
                console.warn("Checkbox not found!");
            }
        }, 500); 
        
        const control = document.querySelector(".leaflet-control-layers");
        control.style.display = "block";


        const geoJSONdata = layerGroup.toGeoJSON()
        geoJSONdata['id'] = id
        
        const jsonString = JSON.stringify(geoJSONdata);
        const url = '/add_to_db';
        const method = 'POST';
    
        $.ajax({
            url: url,
            type: method, 
            data: jsonString,
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            },
            dataType: "json",
            success: function(response) {
                console.log(response);
            },
            error: function(xhr){
                console.log(xhr.responseText);
            } 
        });

        layerElements = []
    })


    const droparea = document.querySelector('.droparea');
    
    const prevents = (e) => e.preventDefault();

    const events = ['dragenter', 'dragover', 'dragleave', 'drop']

    events.forEach(
        evtName => {
            droparea.addEventListener(evtName, prevents)
        }
    )
    
    const inputButton = document.querySelector('#file')
    inputButton.addEventListener("change", handleDrop)
    

    droparea.addEventListener("drop", handleDrop);



    document.addEventListener("click", (event) => {
        // Debug: Log all clicks on attribute table elements
        if (event.target.closest('.attribute-table-container')) {
            console.log('Click on attribute table area:', event.target);
            console.log('Target classes:', event.target.classList);
        }
        
        if (event.target.classList.contains("dropdown-item")) {
            const fileName = event.target.textContent
            const nestedParent = event.target.parentElement.parentElement
            const fileContainer = nestedParent.nextElementSibling
            const id = event.target.id
            fileContainer.insertAdjacentHTML('beforeend', `<span><button id=${id} class='closeRouteBtn'>x</button>${fileName}</span>`)
        }
        
        if (event.target.classList.contains("closeRouteBtn")) {
            event.target.parentElement.remove()
        }

        if (event.target.classList.contains('closeRouteLayer')){
            event.target.parentElement.remove()
            const id = event.target.id
            const routeData = layerTracker[id]
            if (routeData) {
                const routeToRemove = routeData.layer || routeData; // Handle both old and new format
                appLeaflet.map.removeLayer(routeToRemove);
                appLeaflet.layerControl.removeLayer(routeToRemove)
                delete layerTracker[id]; // Clean up the tracker
            }

            const control = document.querySelector('.leaflet-control-layers')
            if (!control.querySelector('.leaflet-control-layers-overlays').hasChildNodes()){
                control.style.display = "none";
            }
            
            // Close any open route tables
            document.querySelectorAll('.table-container').forEach(table => table.remove());
        }

        if(event.target.classList.contains('close-table')){
            event.target.parentElement.style.display = 'none'
        }

        // Add handler for attribute table close button
        if(event.target.classList.contains('close-attribute-table')){
            console.log('Close attribute table button clicked'); // Debug log
            event.preventDefault();
            event.stopPropagation();
            closeAttributeTable();
            return; // Ensure we don't continue processing other handlers
        }

        // Add handler for route table buttons
        if(event.target.classList.contains('route-table-btn')){
            console.log('Route table button clicked'); // Debug log
            event.preventDefault();
            event.stopPropagation();
            const routeId = event.target.getAttribute('data-route-id');
            if (routeId) {
                showRouteTable(routeId);
            }
            return;
        }


    });



    document.querySelectorAll('input#address').forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (!event.target.checked) {
                return;
            }
            const name = event.target.name 
            const divContainer = document.querySelector(`.${name}-input`);
            
            divContainer.innerHTML = "";
            const geocoder = L.Control.geocoder({
                collapsed: false,
                placeholder: "Search address",
                geocoder: new L.Control.Geocoder.Nominatim()
            }).addTo(appLeaflet.map);
            
            
            geocoder.on('markgeocode', (e) => {
                const name = e.geocode.name
                console.log(name)
                const input = divContainer.querySelector('input[type="search"]')
                input.value = name
                input.setAttribute('data-type', 'address')
                input.setAttribute('data-coord', e.geocode.center )
            })



            const geocoderContainer = geocoder.getContainer();
            geocoderContainer.style.backgroundColor = 'orange';
            geocoderContainer.style.opacity = '0.45'

            divContainer.appendChild(geocoder.getContainer())
            
        })
    })


    document.querySelectorAll('input#zipcode').forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (!event.target.checked) {
                return;
            }
            const name = event.target.name 
            const divContainer = document.querySelector(`.${name}-input`)
            divContainer.innerHTML = ""
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'zipInput';
            input.placeholder = 'Enter zip code'
            input.style.backgroundColor = 'green'
            input.style.opacity = '0.45'
            divContainer.appendChild(input);    
            input.setAttribute('data-type', 'zip')
        });
    });

    const zipQueryBtn = document.querySelector('.query-btn')
    zipQueryBtn.addEventListener('click', handleZipAddrQuery)
    
    // Add routing mode change listener for Form 2 only
    const routingModeSelectAlt = document.getElementById('routing-mode-alt');
    
    if (routingModeSelectAlt) {
        // Set initial description if element exists
        const routingDescription = document.getElementById('routing-description');
        if (routingDescription) {
            // Only update description if a valid value is selected (not the placeholder)
            const initialValue = routingModeSelectAlt.value;
            if (initialValue && initialValue !== '') {
                updateRoutingDescription(initialValue);
            }
        }
        
        routingModeSelectAlt.addEventListener('change', function() {
            if (routingDescription) {
                // Only update description if a valid value is selected (not the placeholder)
                if (this.value && this.value !== '') {
                    updateRoutingDescription(this.value);
                }
            }
            
            // Forms are now independent - no synchronization
        });
    }

}

// File Upload Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('file-upload-toggle');
    const fileSection = document.getElementById('file-upload-section');
    
    if (toggle && fileSection) {
        toggle.addEventListener('change', function() {
            if (this.checked) {
                // Show the file upload section
                fileSection.style.display = 'block';
                fileSection.classList.remove('hide');
                fileSection.classList.add('show');
            } else {
                // Hide the file upload section
                fileSection.classList.remove('show');
                fileSection.classList.add('hide');
                
                // Hide after animation completes
                setTimeout(() => {
                    if (!toggle.checked) {
                        fileSection.style.display = 'none';
                        fileSection.classList.remove('hide');
                    }
                }, 400); // Match the slideUp animation duration
            }
        });
    }
});

// Function to update routing description
function updateRoutingDescription(mode) {
    const routingDescription = document.getElementById('routing-description');
    if (routingDescription) {
        if (mode === 'roundtrip') {
            routingDescription.textContent = 'Plan a circular route: A → B → C → ... → A';
        } else {
            routingDescription.textContent = 'Plan routes to multiple destinations: A → B, A → C, A → D';
        }
    }
}

const handleZipAddrQuery = () => { 
    const startInput = document.querySelector('.start-input')
                               .querySelector('input')
    const startType = startInput.getAttribute('data-type')


    const endInput = document.querySelector('.end-input').querySelector('input')               
    const endType = endInput.getAttribute('data-type')


    if(startType == 'zip' & endType == 'zip'){
        zipQuery(startInput, endInput)
    }

    if(startType == 'address' & endType == 'address'){
        const startPoint =  startInput.getAttribute('data-coord')
        const endPoint = endInput.getAttribute('data-coord')

        addrQuery(startPoint, endPoint)
    }
    
    if (startType == 'address' & endType == 'zip'){
        const startPoint = startInput.getAttribute('data-coord')
        console.log('Address to zip')
        addrZipQuery(startPoint, endInput.value)
    }

    if (startType == 'zip' & endType == 'address'){
        const endPoint = endInput.getAttribute('data-coord')
        console.log('Zip to address')
        zipAddrQuery(startInput .value, endPoint)
    }

}





const zipAddrQuery = (startInput, endPoint) => {
    const url = `/get_zip_addr_route?startPoint=${startInput}&endPoint=${endPoint}`
    const method = 'GET'
    $.ajax({
        url:url,
        type:method,
        dataType:'json',
        complete: function(response){
            const geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            console.log(response)

            const responseData = JSON.parse(response.responseText)
            const startPoint = L.geoJSON(JSON.parse(responseData['start']), {
                pointToLayer : function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions)
                }
            });
            const endPoint = L.geoJSON(JSON.parse(responseData['end']), {
                pointToLayer : function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions)
                }
            });
            const route = L.geoJSON(JSON.parse(responseData['route']));

            const routeLayerGroup = L.layerGroup([startPoint, endPoint, route]).addTo(appLeaflet.map);

            const id = Date.now()
            layerTracker[id] = {
                layer: routeLayerGroup,
                name: "Routes"
            };
            const control = document.querySelector(".leaflet-control-layers")
            control.style.display = "block";        
            const controlHTML = createRouteLayerControl(id, "Routes");
            appLeaflet.layerControl.addOverlay(routeLayerGroup, controlHTML);

        },
        error: function(xhr) {
            console.error("Error fetching route:", xhr.responseText);
            alert("Failed to fetch the route. Please try again.");
        }
    })
}



const addrZipQuery = (startPoint, endInput) => {
    const url = `/get_addr_zip_route?startPoint=${startPoint}&endPoint=${endInput}`
    const method = 'GET'
    $.ajax({
        url:url,
        type:method,
        dataType: 'json',
        complete: function(response){
            const geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            console.log(response)

            const responseData = JSON.parse(response.responseText)
            const startPoint = L.geoJSON(JSON.parse(responseData['start']), {
                pointToLayer : function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions)
                }
            });
            const endPoint = L.geoJSON(JSON.parse(responseData['end']), {
                pointToLayer : function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions)
                }
            });
            const route = L.geoJSON(JSON.parse(responseData['route']));

            const routeLayerGroup = L.layerGroup([startPoint, endPoint, route]).addTo(appLeaflet.map);

            const id = Date.now()
            layerTracker[id] = {
                layer: routeLayerGroup,
                name: "Routes"
            };
            const control = document.querySelector(".leaflet-control-layers")
            control.style.display = "block";        
            const controlHTML = createRouteLayerControl(id, "Routes");
            appLeaflet.layerControl.addOverlay(routeLayerGroup, controlHTML);

        },
        error: function(xhr) {
            console.error("Error fetching route:", xhr.responseText);
            alert("Failed to fetch the route. Please try again.");
        }
    })
}


    // Address support
const addrQuery = (startPoint, endPoint) => {
    const url = `/get_address_route?startPoint=${startPoint}&endPoint=${endPoint}`
    const method = 'GET'
    $.ajax({
        url:url,
        type:method,
        dataType: 'json',
        complete: function(response){
            const geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            console.log(response)

            const responseData = JSON.parse(response.responseText)
            const startPoint = L.geoJSON(JSON.parse(responseData['start']), {
                pointToLayer : function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions)
                }
            });
            const endPoint = L.geoJSON(JSON.parse(responseData['end']), {
                pointToLayer : function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions)
                }
            });
            const route = L.geoJSON(JSON.parse(responseData['route']));

            const routeLayerGroup = L.layerGroup([startPoint, endPoint, route]).addTo(appLeaflet.map);

            const id = Date.now()
            layerTracker[id] = {
                layer: routeLayerGroup,
                name: "Routes"
            };
            const control = document.querySelector(".leaflet-control-layers")
            control.style.display = "block";        
            const controlHTML = createRouteLayerControl(id, "Routes");
            appLeaflet.layerControl.addOverlay(routeLayerGroup, controlHTML);

        },
        error: function(xhr) {
            console.error("Error fetching route:", xhr.responseText);
            alert("Failed to fetch the route. Please try again.");
        }
    })
}


const zipQuery = (startInput, endInput) => {
    const startZip = startInput.value
    const endZip = endInput.value
    const url = `/get_zip_route?startZip=${startZip}&endZip=${endZip}`;
    const method = 'GET'

    $.ajax({
        url:url,
        type:method,
        dataType:'json',
        complete: function(response) {
            console.log("Response status:", response.status);
            console.log("Response text:", response.responseText);
            
            // Check if response is valid
            if (!response.responseText || response.responseText === 'undefined') {
                console.error("Received undefined response");
                alert("Server returned an invalid response. Please try again.");
                return;
            }
            
            try {
                const responseData = JSON.parse(response.responseText);
                console.log("Parsed response data:", responseData);
                
                if (responseData.error) {
                    alert("Error: " + responseData.error);
                    return;
                }
                
                const geojsonMarkerOptions = {
                    radius: 8,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                };
                
                // Check if it's multiple destinations
                if (responseData.is_multiple) {
                    console.log("Processing multiple routes");
                    // Handle multiple routes
                    const startPoint = L.geoJSON(JSON.parse(responseData['start']), {
                        pointToLayer : function (feature, latlng){
                            return L.circleMarker(latlng, geojsonMarkerOptions)
                        }
                    });

                    // Add all end points and routes with different colors
                    const allLayers = [startPoint];
                    const colors = ['#ff7800', '#0078ff', '#00ff78', '#ff0078', '#7800ff', '#78ff00'];
                    
                    responseData.routes.forEach((routeData, index) => {
                        console.log(`Processing route ${index + 1}`);
                        const color = colors[index % colors.length];
                        const endPoint = L.geoJSON(JSON.parse(routeData['end']), {
                            pointToLayer : function (feature, latlng){
                                return L.circleMarker(latlng, {...geojsonMarkerOptions, fillColor: color})
                            }
                        });
                        const route = L.geoJSON(JSON.parse(routeData['route']), {
                            style: {color: color, weight: 4}
                        });
                        
                        allLayers.push(endPoint, route);
                    });

                    const routeLayerGroup = L.layerGroup(allLayers).addTo(appLeaflet.map);

                    const id = Date.now()
                    layerTracker[id] = {
                        layer: routeLayerGroup,
                        routeData: responseData,
                        name: "Multiple Routes"
                    };
                    const control = document.querySelector(".leaflet-control-layers")
                    control.style.display = "block";        
                    const controlHTML = createRouteLayerControl(id, "Multiple Routes");
                    appLeaflet.layerControl.addOverlay(routeLayerGroup, controlHTML);

                    // Show attribute table using new template system
                    if (responseData.routes_html) {
                        console.log("Displaying routes table");
                        createRouteTable(responseData);
                    } else {
                        console.log("No routes_html in response");
                    }
                } else {
                    console.log("Processing single route");
                    // Handle single route (existing logic)
                    const startPoint = L.geoJSON(JSON.parse(responseData['start']), {
                        pointToLayer : function (feature, latlng){
                            return L.circleMarker(latlng, geojsonMarkerOptions)
                        }
                    });
                    const endPoint = L.geoJSON(JSON.parse(responseData['end']), {
                        pointToLayer : function (feature, latlng){
                            return L.circleMarker(latlng, geojsonMarkerOptions)
                        }
                    });
                    const route = L.geoJSON(JSON.parse(responseData['routes']));

                    const routeLayerGroup = L.layerGroup([startPoint, endPoint, route]).addTo(appLeaflet.map);

                    const id = Date.now()
                    layerTracker[id] = routeLayerGroup
                    const control = document.querySelector(".leaflet-control-layers")
                    control.style.display = "block";        
                    const controlHTML = createRouteLayerControl(id, "Routes");
                    appLeaflet.layerControl.addOverlay(routeLayerGroup, controlHTML);
                }
            } catch (parseError) {
                console.error("Error parsing response:", parseError);
                console.error("Response text that failed to parse:", response.responseText);
                alert("Error processing server response: " + parseError.message);
            }
        },
        error: function(xhr) {
            console.error("AJAX Error:", xhr.status, xhr.responseText);
            alert("Failed to fetch the route. Server returned: " + xhr.status + " - " + xhr.responseText);
        }
    })
}
    



const handleRouting = () =>{

    const startContainer = document.querySelector('.layer-container.start')
    
    let startId;
    try {
        startId = startContainer.querySelector('.closeRouteBtn').id;
    } catch (error) {
        console.error("Error retrieving startId:", error);
        alert("Please select a valid start layer.");
        return;
    }

    const endContainer = document.querySelector('.layer-container.end')
    
    let endId;
    try {
        endId = endContainer.querySelector('.closeRouteBtn').id
    } catch (error){
        console.error("Error retrieving endId:", error);
        alert("Please select a valid endLayer.");
        return;
    }

    const url = `/get_route?startId=${startId}&endId=${endId}`;
    const method = 'GET';

    $.ajax({
        url: url,
        type: method,
        dataType: "json",
        success: function(response) {
            const routeLayer = L.geoJson.vt(response).addTo(appLeaflet.map);
            appLeaflet.layerControl.addOverlay(routeLayer, "Route");
        },
        error: function(xhr) {
            console.error("Error fetching route:", xhr.responseText);
            alert("Failed to fetch the route. Please try again.");
        }
    });
    

}


const removeLayerGroup = (id) =>{
    const layerGroup = layerTracker[id]
    appLeaflet.map.removeLayer(layerGroup)
    appLeaflet.layerControl.removeLayer(layerGroup)     
    
    const control = document.querySelector('.leaflet-control-layers')
    if (!control.querySelector('.leaflet-control-layers-overlays').hasChildNodes()){
        control.style.display = "none";
    }


    
    const buttons = document.querySelectorAll(`#${CSS.escape(id)}`)
    buttons.forEach((button) => button.remove())

    
    delete layerTracker[id] 

    const url = '/delete'
    const method = 'POST'
    const data = {'id' : id}
    

    
    
    
    $.ajax({
        url: url,
        type: method, 
        data: JSON.stringify(data),
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
        dataType: "json",
        success: function(response) {
            console.log(response);
        },
        error: function(xhr){
            console.log(xhr.responseText);
        } 
    });
}

// Add this function after the styleTableContainer function
const showAttributeTable = (layerId, layerName, geoJsonData) => {
    // Check if TableTemplates is loaded
    if (typeof TableTemplates === 'undefined') {
        console.error('TableTemplates is not loaded! Make sure templates.js is included.');
        alert('Template system not loaded. Please refresh the page.');
        return;
    }

    // Hide any existing attribute table
    const existingContainer = document.querySelector('.attribute-table-container');
    if (existingContainer) {
        existingContainer.style.display = 'none';
    }

    const container = document.querySelector('.attribute-table-container');
    
    // Create table HTML
    let tableHTML = `
        <table class="attribute-table">
    `;

    // Get all unique property keys from features
    const allKeys = new Set();
    if (geoJsonData.features && geoJsonData.features.length > 0) {
        geoJsonData.features.forEach(feature => {
            if (feature.properties) {
                Object.keys(feature.properties).forEach(key => allKeys.add(key));
            }
        });
    }

    const propertyKeys = Array.from(allKeys);

    // Add headers
    tableHTML += '<thead><tr>';
    tableHTML += '<th>Feature ID</th>';
    tableHTML += '<th>Geometry Type</th>';
    propertyKeys.forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Add data rows
    if (geoJsonData.features && geoJsonData.features.length > 0) {
        geoJsonData.features.forEach((feature, index) => {
            tableHTML += '<tr>';
            tableHTML += `<td>${index + 1}</td>`;
            tableHTML += `<td>${feature.geometry ? feature.geometry.type : 'N/A'}</td>`;
            
            propertyKeys.forEach(key => {
                const value = feature.properties && feature.properties[key] !== undefined 
                    ? feature.properties[key] 
                    : '';
                tableHTML += `<td>${value}</td>`;
            });
            tableHTML += '</tr>';
        });
    } else {
        tableHTML += `<tr><td colspan="${propertyKeys.length + 2}">No features found</td></tr>`;
    }

    tableHTML += '</tbody></table>';
    
    // Use template
    container.innerHTML = TableTemplates.attributeTable(layerName, tableHTML);
    container.style.display = 'block';
    
    // Add direct event listener to close button as backup
    const closeButton = container.querySelector('.close-attribute-table');
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            console.log('Direct close button clicked'); // Debug log
            e.preventDefault();
            e.stopPropagation();
            closeAttributeTable();
        });
    }
    
    // Add drag functionality only (close button handled by global listener)
    setupAttributeTableDrag(container);
    
    // Make table columns sortable
    makeSortable(null); // Pass null since we'll find the container internally
    
    // Initialize row selection functionality
    initializeTableRowSelection(null);
    
    // Initialize search functionality
    initializeTableSearch(null);
};

const setupAttributeTableDrag = (container) => {
    let isDragging = false;
    let startX = 0, startY = 0, offsetX = 0, offsetY = 0;
    
    const header = container.querySelector('.attribute-table-header');
    
    // Mouse events for dragging
    header.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('close-attribute-table')) return;
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        document.body.style.userSelect = 'none';
        header.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            header.style.cursor = 'move';
        }
    });
    
    // Touch events for mobile
    header.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('close-attribute-table')) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX - offsetX;
        startY = touch.clientY - offsetY;
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        offsetX = touch.clientX - startX;
        offsetY = touch.clientY - startY;
        container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    });
    
    document.addEventListener('touchend', function() {
        if (isDragging) isDragging = false;
    });
    
    // Prevent clicks inside table from propagating (but allow row selection)
    const tableContent = container.querySelector('.attribute-table-content');
    if (tableContent) {
        tableContent.addEventListener('click', function(e) {
            // Don't stop propagation for table rows to allow selection
            if (!e.target.closest('tr')) {
                e.stopPropagation();
            }
        });
    }
    
    // Prevent header clicks from propagating (except close button)
    header.addEventListener('click', function(e) {
        if (!e.target.classList.contains('close-attribute-table')) {
            e.stopPropagation();
        }
    });
    
    // Prevent control button clicks from propagating
    const controlsContainer = container.querySelector('.table-controls');
    if (controlsContainer) {
        controlsContainer.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
};

const closeAttributeTable = () => {
    console.log('closeAttributeTable function called'); // Debug log
    const container = document.querySelector('.attribute-table-container');
    console.log('Container found:', container); // Debug log
    if (container) {
        // Clear map highlights before closing table
        mapHighlighting.clearAll();
        container.style.display = 'none';
        // Reset transform when closing
        container.style.transform = 'translate(-50%, -50%)';
        console.log('Attribute table closed'); // Debug log
    } else {
        console.log('No attribute table container found'); // Debug log
    }
};

// Function to load attribute table for database layers
const loadAttributeTableFromDB = (layerId, layerName) => {
    $.ajax({
        url: `/get_layer_data/${layerId}`,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            showAttributeTable(layerId, layerName, response);
        },
        error: function(xhr) {
            console.error("Error loading layer data:", xhr.responseText);
            alert("Failed to load attribute table.");
        }
    });
};

// Update the handleDrop function to store GeoJSON data and make layer names clickable
const handleDrop = (e) => {
    e.preventDefault();

    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];

    if(!file) return;

    const reader = new FileReader();

    const control = document.querySelector(".leaflet-control-layers")
    control.style.display = "block";

    const filename = file.name.replace(/\..+/g, '')
    reader.readAsText(file, "UTF-8");
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result)
        const geoJsonLayer = L.geoJson.vt(data, options).addTo(appLeaflet.map);
        data['id'] = Date.now()

        layerTracker[data['id']] = {
            layer: geoJsonLayer,
            data: data,
            name: filename
        };

        // Create the layer control using route template for consistent styling
        const overlayHTML = createRouteLayerControl(data['id'], filename);
        appLeaflet.layerControl.addOverlay(geoJsonLayer, [overlayHTML]);

        const dropdownMenus = document.querySelectorAll(".dropdown-menu")
        const insertHTML = `<button id="${data['id']}" class="dropdown-item">${filename}</button>`
        dropdownMenus.forEach((menu) => {
            menu.insertAdjacentHTML('beforeend', insertHTML)
        })

        // Make the POST request 
        const jsonString = JSON.stringify(data);
        const url = '/add_to_db';
        const method = 'POST';

        $.ajax({
            url: url,
            type: method, 
            data: jsonString,
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            },
            dataType: "json",
            success: function(response) {
                console.log(response);
            },
            error: function(xhr){
                console.log(xhr.responseText);
            } 
        });
    }
}

// Update removeLayer function to handle new layerTracker structure
const removeLayer = (id) => {
    const layerGroup = layerTracker[id];
    if (!layerGroup) return;

    const layer = layerGroup.layer;
    appLeaflet.map.removeLayer(layer);
    appLeaflet.layerControl.removeLayer(layer)     
    
    const control = document.querySelector('.leaflet-control-layers')
    if (!control.querySelector('.leaflet-control-layers-overlays').hasChildNodes()){
        control.style.display = "none";
    }

    delete layerTracker[id]

    document.querySelector('#file').value = "";

    const buttons = document.querySelectorAll(`#${CSS.escape(id)}`)
    buttons.forEach((button) => button.remove())

    // Close attribute table if it's open for this layer
    closeAttributeTable();

    const url = '/delete'
    const method = 'POST'
    const data = {'id' : id}

    console.log(layerTracker)

    $.ajax({
        url: url,
        type: method, 
        data: JSON.stringify(data),
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
        dataType: "json",
        success: function(response) {
            console.log(response);
        },
        error: function(xhr){
            console.log(xhr.responseText);
        } 
    });
};

// Update the event listener for closing tables
document.addEventListener("click", (event) => {
    console.log('Global click detected:', event.target); // Debug log
    
    if(event.target.classList.contains('close-attribute-table')){
        console.log('Close attribute table button clicked'); // Debug log
        event.stopPropagation();
        event.preventDefault();
        closeAttributeTable();
        return;
    }

    if(event.target.classList.contains('close-table-btn')){
        const tableId = event.target.getAttribute('data-table-id');
        const tableContainer = document.getElementById(tableId);
        if (tableContainer) {
            tableContainer.remove();
        }
        return;
    }
});

document.addEventListener("DOMContentLoaded", initApp)

// Export routing functions to window for use in form2Integration.js
window.addrQuery = addrQuery;
window.addrZipQuery = addrZipQuery;
window.zipAddrQuery = zipAddrQuery;



