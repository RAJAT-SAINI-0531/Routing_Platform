/**
 * Form 2 Implementation - Routing Tab Section
 * This integrates zipToZip.js with Form 2 using the existing GET ROUTE button
 */

// Function to handle zipcode-to-zipcode routing through existing GET ROUTE button
function handleZipToZipRouting() {
    // Get the routing mode from Form 2's dropdown
    const routingModeAlt = document.getElementById('routing-mode-alt');
    const routingMode = routingModeAlt && routingModeAlt.value && routingModeAlt.value !== '' ? routingModeAlt.value : 'multiple';
    
    // Get start and end inputs from Form 2
    const startInput = document.querySelector('.start-input input');
    const endInput = document.querySelector('.end-input input');
    
    console.log('handleZipToZipRouting - Found inputs:', {
        startInput: startInput,
        endInput: endInput,
        routingMode: routingMode
    });
    
    // Validate inputs exist and are zipcode type
    if (!startInput || !endInput) {
        alert('Please fill in both start and end fields');
        return false; // Prevent original handler from running
    }
    
    // Check if both inputs are zipcode type
    const startType = startInput.getAttribute('data-type');
    const endType = endInput.getAttribute('data-type');
    
    console.log('Input types:', { startType, endType });
    
    // Only handle if both are zipcode types
    if (startType === 'zip' && endType === 'zip') {
        // Get complete location data instead of just zipcodes
        let startLocationData = null;
        let endLocationData = null;
        
        if (window.ZipcodeSuggestions && typeof window.ZipcodeSuggestions.getSelectedLocations === 'function') {
            const startLocations = window.ZipcodeSuggestions.getSelectedLocations(startInput);
            const endLocations = window.ZipcodeSuggestions.getSelectedLocations(endInput);
            
            console.log('DEBUG: Raw location data from ZipcodeSuggestions:', {
                startLocations: startLocations,
                endLocations: endLocations
            });
            
            startLocationData = startLocations && startLocations.length > 0 ? startLocations[0] : null;
            endLocationData = endLocations && endLocations.length > 0 ? endLocations : null;
            
            console.log('DEBUG: Processed location data:', {
                startLocationData: startLocationData,
                endLocationData: endLocationData
            });
        }
        
        // Fallback to zipcode-only extraction if location data not available
        let startZip = '';
        let endZips = '';
        
        if (startLocationData) {
            startZip = startLocationData.postcode;
        } else if (window.ZipcodeSuggestions && typeof window.ZipcodeSuggestions.getSelectedZipcodes === 'function') {
            startZip = window.ZipcodeSuggestions.getSelectedZipcodes(startInput);
        } else {
            startZip = startInput.value.trim();
        }
        
        if (endLocationData) {
            endZips = endLocationData.map(loc => loc.postcode).join(', ');
        } else if (window.ZipcodeSuggestions && typeof window.ZipcodeSuggestions.getSelectedZipcodes === 'function') {
            endZips = window.ZipcodeSuggestions.getSelectedZipcodes(endInput);
        } else {
            endZips = endInput.value.trim();
        }
        
        console.log('Extracted location data:', {
            startZip: startZip,
            endZips: endZips,
            startLocationData: startLocationData,
            endLocationData: endLocationData,
            startInputValue: startInput.value,
            endInputValue: endInput.value
        });
        
        if (!startZip || !endZips) {
            alert('Please enter both start and end zipcodes');
            return false; // Prevent original handler from running
        }
        
        console.log('Form 2 routing with:', { startZip, endZips, routingMode, startLocationData, endLocationData });
        
        // Use the ZipToZipRouting module with enhanced location data
        ZipToZipRouting.route({
            startZip: startZip,
            endZips: endZips,
            routingMode: routingMode,
            // Pass complete location data for precise routing
            startLocationData: startLocationData,
            endLocationData: endLocationData,
            onSuccess: function(result) {
                console.log('Form 2 zipcode routing successful:', result);
            },
            onError: function(error) {
                console.error('Form 2 zipcode routing error:', error);
                alert('Zipcode routing failed: ' + error);
            }
        });
        
        return false; // Prevent original handler from running
    }
    
    // If not both zipcode types, return true to allow original handler to run
    return true;
}

// Function to intercept GET ROUTE button clicks
function interceptGetRouteButton() {
    const getRouteBtn = document.querySelector('.query-btn');
    console.log('interceptGetRouteButton: Found button:', getRouteBtn);
    
    if (!getRouteBtn) {
        console.error('GET ROUTE button not found!');
        return;
    }
    
    // Remove all existing event listeners by cloning the button
    const newButton = getRouteBtn.cloneNode(true);
    getRouteBtn.parentNode.replaceChild(newButton, getRouteBtn);
    
    console.log('Removed all existing event listeners from GET ROUTE button');
    
    // Add our new single event handler
    newButton.addEventListener('click', function(event) {
        console.log('GET ROUTE button clicked - new handler running');
        
        // Check if this should be handled by zipcode routing
        const shouldContinue = handleZipToZipRouting();
        
        console.log('shouldContinue:', shouldContinue);
        
        // If zipcode routing handled it, we're done
        if (!shouldContinue) {
            console.log('Zipcode routing handled the request');
            return;
        }
        
        console.log('Delegating to original routing logic');
        // Otherwise, handle non-zipcode routing cases
        handleNonZipcodeRouting();
    });
    
    console.log('New button event handler set up successfully');
}

// Function to handle non-zipcode routing cases (extracted from original script.js)
function handleNonZipcodeRouting() {
    const startInput = document.querySelector('.start-input input');
    const endInput = document.querySelector('.end-input input');
    
    if (!startInput || !endInput) {
        alert('Please fill in both start and end fields');
        return;
    }
    
    const startType = startInput.getAttribute('data-type');
    const endType = endInput.getAttribute('data-type');
    
    console.log('handleNonZipcodeRouting:', { startType, endType });
    
    if (startType === 'address' && endType === 'address') {
        const startPoint = startInput.getAttribute('data-coord');
        const endPoint = endInput.getAttribute('data-coord');
        
        if (!startPoint || !endPoint) {
            alert('Please select addresses from the suggestions');
            return;
        }
        
        if (typeof window.addrQuery === 'function') {
            window.addrQuery(startPoint, endPoint);
        } else {
            console.error('addrQuery function not available');
        }
    }
    else if (startType === 'address' && endType === 'zip') {
        const startPoint = startInput.getAttribute('data-coord');
        const endZip = endInput.value.trim();
        
        if (!startPoint || !endZip) {
            alert('Please select start address and enter end zipcode');
            return;
        }
        
        console.log('Address to zip routing');
        if (typeof window.addrZipQuery === 'function') {
            window.addrZipQuery(startPoint, endZip);
        } else {
            console.error('addrZipQuery function not available');
        }
    }
    else if (startType === 'zip' && endType === 'address') {
        const startZip = startInput.value.trim();
        const endPoint = endInput.getAttribute('data-coord');
        
        if (!startZip || !endPoint) {
            alert('Please enter start zipcode and select end address');
            return;
        }
        
        console.log('Zip to address routing');
        if (typeof window.zipAddrQuery === 'function') {
            window.zipAddrQuery(startZip, endPoint);
        } else {
            console.error('zipAddrQuery function not available');
        }
    }
    else {
        console.log('Unknown routing combination:', { startType, endType });
        alert('Please select valid start and end points');
    }
}

// Initialize Form 2 integration when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Form2Integration: DOM loaded, setting up integration...');
    
    // Add a small delay to ensure all other scripts have loaded
    setTimeout(function() {
        console.log('Form2Integration: Setting up button interceptor...');
        interceptGetRouteButton();
    }, 500);
});

// Export functions for external use
window.Form2ZipRouting = {
    handleZipToZipRouting: handleZipToZipRouting,
    interceptGetRouteButton: interceptGetRouteButton
};
