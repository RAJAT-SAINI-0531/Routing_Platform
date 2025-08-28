const TableTemplates = {
    routeTable: (title, content, tableId) => `
        <div class="table-container" id="${tableId}">
            <div class="table-header">
                <h4 class="table-title">${title}</h4>
                <button class="close-table-btn" data-table-id="${tableId}">×</button>
            </div>
            <div class="table-controls">
                <button class="table-control-btn show-selected" data-action="show-selected">Show Selected</button>
                <button class="table-control-btn show-unselected" data-action="show-unselected">Show Unselected</button>
                <button class="table-control-btn" data-action="default-view">Default View</button>
                <button class="table-control-btn deselect-all" data-action="deselect-all">Deselect All</button>
            </div>
            <div class="table-search-container">
                <div class="search-dropdown-container">
                    <select class="search-column-dropdown" data-table-id="${tableId}">
                        <option value="">Select Column...</option>
                    </select>
                    <input type="text" class="search-input" placeholder="Search..." data-table-id="${tableId}" disabled>
                    <button class="clear-search-btn" data-table-id="${tableId}" disabled>×</button>
                </div>
            </div>
            <div class="table-content">
                ${content}
            </div>
        </div>
    `,
    
    attributeTable: (layerName, tableContent) => `
        <div class="attribute-table-header">
            <span>Attribute Table: ${layerName}</span>
            <button class="close-attribute-table">×</button>
        </div>
        <div class="table-controls">
            <button class="table-control-btn show-selected" data-action="show-selected">Show Selected</button>
            <button class="table-control-btn show-unselected" data-action="show-unselected">Show Unselected</button>
            <button class="table-control-btn" data-action="default-view">Default View</button>
            <button class="table-control-btn deselect-all" data-action="deselect-all">Deselect All</button>
        </div>
        <div class="table-search-container">
            <div class="search-dropdown-container">
                <select class="search-column-dropdown" data-container="attribute-table">
                    <option value="">Select Column...</option>
                </select>
                <input type="text" class="search-input" placeholder="Search..." data-container="attribute-table" disabled>
                <button class="clear-search-btn" data-container="attribute-table" disabled>×</button>
            </div>
        </div>
        <div class="attribute-table-content">
            ${tableContent}
        </div>
    `,
    
    layerControl: (id, layerName, hasAttributeTable = false) => `
        <span class="layer-control-item">
            <button class="layer-remove-btn" onclick="removeLayer('${id}')">×</button>
            <button class="layer-name-btn ${hasAttributeTable ? 'clickable-layer-name' : ''}" 
                    ${hasAttributeTable ? `onclick="event.stopPropagation(); showAttributeTable('${id}', '${layerName}', layerTracker['${id}'].data)"` : ''}>
                ${layerName}
            </button>
        </span>
    `,
    
    routeLayerControl: (id, layerName) => `
        <span class="layer-control-item">
            <button id="${id}" class="closeRouteLayer layer-remove-btn">×</button>
            <button class="layer-name-btn route-table-btn" data-route-id="${id}" onclick="event.stopPropagation(); showRouteTable('${id}')">${layerName}</button>
        </span>
    `
};
