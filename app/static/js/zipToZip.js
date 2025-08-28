/**
 * Zipcode to Zipcode(s) Routing Module
 * Handles both Multiple Destinations and Round Trip routing
 * Can be used by both Form 1 and Form 2
 */

const ZipToZipRouting = {
    
    /**
     * Main r    },

    /**
     * Form 2 Handler (for routing-tab section) - handles both multiple destinations and round trip
     * @param {string} startZip - Starting zipcode
     * @param {string} endZips - End zipcodes (comma-separated for multiple)
     * @param {string} routingMode - 'multiple' or 'roundtrip'
     * @param {Object} startLocationData - Complete start location data
     * @param {Array} endLocationData - Array of complete end location data
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    executeRouting: function(startZip, endZips, routingMode, onSuccess, onError, startLocationData = null, endLocationData = null) {
        // Input validation
        if (!startZip || !endZips) {
            const errorMsg = "Both start and end zipcode fields need to be filled";
            if (onError) onError(errorMsg);
            else alert(errorMsg);
            return;
        }

        // Normalize routing mode to lowercase
        routingMode = routingMode.toLowerCase();
        
        console.log('executeRouting called with:', {
            startZip: startZip,
            endZips: endZips,
            routingMode: routingMode,
            startLocationData: startLocationData,
            endLocationData: endLocationData
        });

        // Build query parameters
        let queryParams = new URLSearchParams();
        queryParams.set('startZip', startZip);
        
        // Add location data for precise routing if available
        if (startLocationData) {
            queryParams.set('startAddress', startLocationData.address || '');
            queryParams.set('startCity', startLocationData.city || '');
        }
        
        if (endLocationData && Array.isArray(endLocationData)) {
            // For multiple end points with specific addresses
            const endAddresses = endLocationData.map(loc => loc.address || '').join('|');
            const endCities = endLocationData.map(loc => loc.city || '').join('|');
            queryParams.set('endAddresses', endAddresses);
            queryParams.set('endCities', endCities);
        }

        // Determine API endpoint based on routing mode
        let url;
        if (routingMode === 'roundtrip' || routingMode === 'round trip') {
            queryParams.set('waypoints', endZips);
            url = `/get_zip_roundtrip?${queryParams.toString()}`;
        } else {
            queryParams.set('endZip', endZips);
            url = `/get_zip_r?${queryParams.toString()}`;
        }

        console.log(`Executing ${routingMode} routing: ${startZip} -> ${endZips}`);
        console.log('API URL:', url);

        // Make AJAX request
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(responseData) {
                console.log("Routing response received:", responseData);
                
                if (responseData.error) {
                    if (onError) onError(responseData.error);
                    else alert("Error: " + responseData.error);
                    return;
                }

                // Process and visualize routes
                ZipToZipRouting.processRouteResponse(responseData, onSuccess);
            },
            error: function(xhr) {
                const errorMsg = `Failed to fetch the route. Server returned: ${xhr.status} - ${xhr.responseText}`;
                console.error("AJAX Error:", xhr.status, xhr.responseText);
                if (onError) onError(errorMsg);
                else alert(errorMsg);
            }
        });
    },

    /**
     * Process route response and add to map
     * @param {Object} responseData - Response from backend
     * @param {Function} onSuccess - Success callback
     */
    processRouteResponse: function(responseData, onSuccess) {
        const geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };

        // Remove previous route tables
        document.querySelectorAll('.table-container').forEach(table => table.remove());

        let routeLayerGroup;
        let layerName;

        if (responseData.is_multiple) {
            console.log("Processing multiple routes");
            console.log("Is roundtrip:", responseData.is_roundtrip);
            
            // Create start point
            const startPoint = L.geoJSON(JSON.parse(responseData['start']), {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            });
            const allLayers = [startPoint];
            
            // Choose color scheme based on routing type
            let colors;
            if (responseData.is_roundtrip) {
                // Sequential colors for roundtrip
                colors = ['#ff4444', '#ff8800', '#ffbb00', '#88ff00', '#00ff88', '#0088ff', '#4400ff'];
                layerName = responseData.waypoint_sequence || "Round Trip";
            } else {
                // Different colors for multiple destinations
                colors = ['#ff7800', '#0078ff', '#00ff78', '#ff0078', '#7800ff', '#78ff00'];
                layerName = "Multiple Routes";
            }
            
            // Process each route
            responseData.routes.forEach((routeData, index) => {
                console.log(`Processing route ${index + 1}:`, routeData.segment || `Route ${index + 1}`);
                const color = colors[index % colors.length];
                
                try {
                    const endGeoJSON = JSON.parse(routeData['end']);
                    const routeGeoJSON = JSON.parse(routeData['route']);
                    
                    // Add end point
                    if (endGeoJSON.features && endGeoJSON.features.length > 0) {
                        const endPoint = L.geoJSON(endGeoJSON, {
                            pointToLayer: function (feature, latlng) {
                                return L.circleMarker(latlng, {...geojsonMarkerOptions, fillColor: color});
                            }
                        });
                        allLayers.push(endPoint);
                    }
                    
                    // Add route line
                    if (routeGeoJSON.features && routeGeoJSON.features.length > 0) {
                        const route = L.geoJSON(routeGeoJSON, {
                            style: {
                                color: color, 
                                weight: responseData.is_roundtrip ? 5 : 4,
                                opacity: responseData.is_roundtrip ? 0.9 : 0.8
                            }
                        });
                        allLayers.push(route);
                        console.log(`Added route ${index + 1} to map with color ${color}`);
                    }
                } catch (parseError) {
                    console.error(`Error parsing GeoJSON for route ${index + 1}:`, parseError);
                }
            });
            
            routeLayerGroup = L.layerGroup(allLayers);
            
        } else {
            // Single route processing
            console.log("Processing single route");
            const startPoint = L.geoJSON(JSON.parse(responseData['start']), {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            });
            
            const routesData = responseData.routes && responseData.routes.length > 0 ? responseData.routes[0] : null;
            
            if (routesData) {
                const endPoint = L.geoJSON(JSON.parse(routesData['end']), {
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, geojsonMarkerOptions);
                    }
                });
                const route = L.geoJSON(JSON.parse(routesData['route']));
                routeLayerGroup = L.layerGroup([startPoint, endPoint, route]);
                layerName = "Routes";
            }
        }

        // Add to map and layer control
        if (routeLayerGroup) {
            routeLayerGroup.addTo(appLeaflet.map);
            
            const id = Date.now();
            layerTracker[id] = {
                layer: routeLayerGroup,
                routeData: responseData,
                name: layerName
            };
            
            // Show layer control
            const control = document.querySelector(".leaflet-control-layers");
            control.style.display = "block";
            
            // Add to layer control
            const controlHTML = createRouteLayerControl(id, layerName);
            appLeaflet.layerControl.addOverlay(routeLayerGroup, controlHTML);

            // Show route table if available
            if (responseData.routes_html) {
                console.log("Displaying routes table");
                const tableId = createRouteTable(responseData);
                
                // Add special formatting for round trip
                if (responseData.is_roundtrip && responseData.total_distance) {
                    const tableContainer = document.getElementById(tableId);
                    if (tableContainer) {
                        const titleElement = tableContainer.querySelector('.table-title');
                        if (titleElement) {
                            titleElement.textContent = `Round Trip: ${responseData.total_distance}m total`;
                        }
                    }
                }
            }

            // Call success callback
            if (onSuccess) {
                onSuccess({
                    layerId: id,
                    layerGroup: routeLayerGroup,
                    responseData: responseData
                });
            }
        }
    },

    /**
     * Form 1 Handler (existing handleZipRouting replacement)
     */
    handleForm1Routing: function() {
        const startZip = document.querySelector('.start-zip').value;
        const endZip = document.querySelector('.end-zip').value;
        const routingMode = document.getElementById('routing-mode').value;

        ZipToZipRouting.executeRouting(startZip, endZip, routingMode);
    },

    /**
     * Form 2 Handler (new - for routing-tab section)
     * @param {string} startZip - Starting zipcode
     * @param {string} endZips - End zipcodes (comma-separated)
     * @param {string} routingMode - 'multiple' or 'roundtrip'
     */
    handleForm2Routing: function(startZip, endZips, routingMode) {
        ZipToZipRouting.executeRouting(startZip, endZips, routingMode);
    },

    /**
     * Universal handler - can be called from any form
     * @param {Object} params - Parameters object
     * @param {string} params.startZip - Starting zipcode
     * @param {string} params.endZips - End zipcodes (comma-separated)
     * @param {string} params.routingMode - 'multiple' or 'roundtrip'
     * @param {Object} params.startLocationData - Complete start location data (optional)
     * @param {Array} params.endLocationData - Array of complete end location data (optional)
     * @param {Function} params.onSuccess - Success callback
     * @param {Function} params.onError - Error callback
     */
    route: function(params) {
        ZipToZipRouting.executeRouting(
            params.startZip,
            params.endZips,
            params.routingMode,
            params.onSuccess,
            params.onError,
            params.startLocationData,
            params.endLocationData
        );
    }
};

// Export for use in other modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZipToZipRouting;
}
