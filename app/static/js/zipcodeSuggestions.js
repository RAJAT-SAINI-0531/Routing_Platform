/**
 * Zipcode Suggestions Module
 * Provides autocomplete suggestions for zipcodes with ZIP + Street + County format
 * Shows suggestions when user presses ENTER after typing a zipcode
 */

const ZipcodeSuggestions = {
    // Cache for zipcode data from unique_cluj.geojson
    zipcodeData: null,
    suggestionCache: new Map(),
    
    // Track the current active input for suggestions
    currentActiveInput: null,
    
    // Configuration
    config: {
        maxSuggestions: 10,
        minZipcodeLength: 3,
        suggestionBoxClass: 'zipcode-suggestions',
        suggestionItemClass: 'suggestion-item',
        suggestionActiveClass: 'suggestion-active',
        suggestionBoxId: 'zipcode-suggestions-box'
    },

    /**
     * Initialize the suggestions module
     */
    init: function() {
        console.log('Initializing Zipcode Suggestions Module...');
        this.loadZipcodeData();
        this.bindEventHandlers();
        this.createSuggestionStyles();
    },

    /**
     * Load zipcode data from the server
     */
    loadZipcodeData: function() {
        // Try the dedicated route first
        fetch('/data/unique_cluj.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.zipcodeData = data.features;
                console.log(`Loaded ${this.zipcodeData.length} zipcode records`);
                this.preprocessData();
            })
            .catch(error => {
                console.error('Failed to load zipcode data from dedicated route:', error);
                console.warn('Zipcode suggestions will not be available until data is loaded');
            });
    },

    /**
     * Preprocess data for faster searching
     */
    preprocessData: function() {
        if (!this.zipcodeData) return;
        
        // Create search-optimized structure
        this.searchableData = this.zipcodeData.map(feature => {
            const props = feature.properties;
            return {
                postcode: props.postcode || '',
                city: props.city || '',
                address: props.address || '-',
                type: props.type || '',
                displayText: this.formatSuggestionText(props.postcode, props.city, props.address),
                searchText: `${props.postcode} ${props.city} ${props.address}`.toLowerCase()
            };
        }).filter(item => item.postcode); // Only include items with postcodes
        
        console.log(`Preprocessed ${this.searchableData.length} searchable items`);
    },

    /**
     * Format suggestion text as ZIP + Street + County
     */
    formatSuggestionText: function(postcode, city, address) {
        const street = address && address !== '-' ? address : '';
        return `${postcode} - ${street}${street ? ', ' : ''}${city}`;
    },

    /**
     * Format text for start zipcode display (zipcode - address)
     */
    formatStartZipcodeText: function(postcode, city, address) {
        const fullAddress = address && address !== '-' ? address : city;
        return `${postcode} - ${fullAddress}`;
    },

    /**
     * Format text for finish zipcode display (zipcode - street, address)
     */
    formatFinishZipcodeText: function(postcode, city, address) {
        const street = address && address !== '-' ? address : '';
        return `${postcode} - ${street}${street ? ', ' : ''}${city}`;
    },

    /**
     * Bind event handlers to zipcode input fields
     */
    bindEventHandlers: function() {
        // Use event delegation to handle dynamically created inputs
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const target = event.target;
                if (this.isZipcodeInput(target)) {
                    event.preventDefault();
                    this.handleZipcodeEnter(target);
                }
            }
        });

        // Update placeholder text as user types
        document.addEventListener('input', (event) => {
            const target = event.target;
            if (this.isZipcodeInput(target)) {
                this.updatePlaceholderText(target);
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (event) => {
            const suggestionBox = document.getElementById(this.config.suggestionBoxId);
            if (suggestionBox && !suggestionBox.contains(event.target) && !this.isZipcodeInput(event.target)) {
                this.hideSuggestions();
            }
        });

        // Handle suggestion selection with arrow keys
        document.addEventListener('keydown', (event) => {
            const suggestionBox = document.getElementById(this.config.suggestionBoxId);
            if (suggestionBox && suggestionBox.style.display !== 'none') {
                this.handleKeyboardNavigation(event);
            }
        });
    },

    /**
     * Update placeholder text to guide user
     */
    updatePlaceholderText: function(inputElement) {
        const value = inputElement.value.trim();
        if (value.length >= this.config.minZipcodeLength) {
            inputElement.placeholder = 'Press ENTER for suggestions';
        } else if (value.length > 0) {
            inputElement.placeholder = `Type ${this.config.minZipcodeLength - value.length} more characters...`;
        } else {
            inputElement.placeholder = 'Enter zip code';
        }
    },

    /**
     * Check if the target element is a zipcode input field
     */
    isZipcodeInput: function(element) {
        return element && 
               element.tagName === 'INPUT' && 
               element.getAttribute('data-type') === 'zip' &&
               (element.closest('.start-input') || element.closest('.end-input'));
    },

    /**
     * Handle ENTER key press on zipcode input
     */
    handleZipcodeEnter: function(inputElement) {
        const zipcode = inputElement.value.trim();
        
        // Store the current active input
        this.currentActiveInput = inputElement;
        console.log('handleZipcodeEnter: set currentActiveInput', {
            inputElement: inputElement,
            isStartInput: !!inputElement.closest('.start-input'),
            isEndInput: !!inputElement.closest('.end-input')
        });
        
        if (zipcode.length < this.config.minZipcodeLength) {
            this.hideSuggestions();
            return;
        }

        console.log(`Searching suggestions for zipcode: ${zipcode}`);
        const suggestions = this.getSuggestions(zipcode);
        
        if (suggestions.length > 0) {
            this.showSuggestions(inputElement, suggestions);
        } else {
            this.hideSuggestions();
            this.showNoResultsMessage(inputElement);
        }
    },

    /**
     * Get suggestions based on zipcode input
     */
    getSuggestions: function(zipcode) {
        if (!this.searchableData) {
            console.warn('Zipcode data not loaded yet');
            return [];
        }

        // Check cache first
        const cacheKey = zipcode.toLowerCase();
        if (this.suggestionCache.has(cacheKey)) {
            return this.suggestionCache.get(cacheKey);
        }

        const searchTerm = zipcode.toLowerCase();
        
        // Priority-based scoring system
        const suggestions = this.searchableData
            .map(item => {
                let score = 0;
                const postcodeLower = item.postcode.toLowerCase();
                const searchTextLower = item.searchText;
                
                // Exact postcode match gets highest priority
                if (postcodeLower === searchTerm) {
                    score = 1000;
                } 
                // Postcode starts with search term
                else if (postcodeLower.startsWith(searchTerm)) {
                    score = 800;
                }
                // Postcode contains search term
                else if (postcodeLower.includes(searchTerm)) {
                    score = 600;
                }
                // City or address contains search term
                else if (searchTextLower.includes(searchTerm)) {
                    score = 400;
                }
                // Partial match at word boundaries
                else if (this.hasWordBoundaryMatch(searchTextLower, searchTerm)) {
                    score = 200;
                }
                
                // Bonus points for shorter postcodes (more specific)
                if (score > 0) {
                    score += (10 - Math.min(item.postcode.length, 10));
                }
                
                return { ...item, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.maxSuggestions);

        // Cache the results
        this.suggestionCache.set(cacheKey, suggestions);
        
        return suggestions;
    },

    /**
     * Check for word boundary matches (e.g., "Cluj" matches "Cluj-Napoca")
     */
    hasWordBoundaryMatch: function(text, searchTerm) {
        const regex = new RegExp(`\\b${searchTerm}`, 'i');
        return regex.test(text);
    },

    /**
     * Show suggestions dropdown
     */
    showSuggestions: function(inputElement, suggestions) {
        this.hideSuggestions(); // Remove any existing suggestions
        
        const suggestionBox = this.createSuggestionBox(inputElement);
        suggestionBox.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            const suggestionItem = this.createSuggestionItem(suggestion, index);
            suggestionBox.appendChild(suggestionItem);
        });

        // Position and show the suggestion box
        this.positionSuggestionBox(suggestionBox, inputElement);
        suggestionBox.style.display = 'block';
        
        // Store reference to current input for selection handling - use both methods
        suggestionBox.dataset.targetInputId = inputElement.id || this.generateInputId(inputElement);
        suggestionBox.targetInputElement = inputElement; // Direct reference as backup
        
        console.log('showSuggestions: stored target input', {
            inputId: suggestionBox.dataset.targetInputId,
            inputElement: inputElement,
            isStartInput: !!inputElement.closest('.start-input'),
            isEndInput: !!inputElement.closest('.end-input')
        });
    },

    /**
     * Create or get existing suggestion box
     */
    createSuggestionBox: function(inputElement) {
        let suggestionBox = document.getElementById(this.config.suggestionBoxId);
        
        if (!suggestionBox) {
            suggestionBox = document.createElement('div');
            suggestionBox.id = this.config.suggestionBoxId;
            suggestionBox.className = this.config.suggestionBoxClass;
            document.body.appendChild(suggestionBox);
        }
        
        return suggestionBox;
    },

    /**
     * Create individual suggestion item
     */
    createSuggestionItem: function(suggestion, index) {
        const item = document.createElement('div');
        item.className = this.config.suggestionItemClass;
        item.dataset.index = index;
        item.innerHTML = `
            <div class="suggestion-main">${suggestion.displayText}</div>
            <div class="suggestion-type">${suggestion.type}</div>
        `;
        
        // Add click handler
        item.addEventListener('click', () => {
            this.selectSuggestion(suggestion);
        });
        
        return item;
    },

    /**
     * Position suggestion box relative to input
     */
    positionSuggestionBox: function(suggestionBox, inputElement) {
        const rect = inputElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        suggestionBox.style.position = 'absolute';
        suggestionBox.style.top = (rect.bottom + scrollTop + 2) + 'px';
        suggestionBox.style.left = (rect.left + scrollLeft) + 'px';
        suggestionBox.style.width = rect.width + 'px';
        suggestionBox.style.zIndex = '10000';
    },

    /**
     * Handle keyboard navigation in suggestions
     */
    handleKeyboardNavigation: function(event) {
        const suggestionBox = document.getElementById(this.config.suggestionBoxId);
        if (!suggestionBox) return;

        const items = suggestionBox.querySelectorAll(`.${this.config.suggestionItemClass}`);
        if (items.length === 0) return;

        let activeIndex = Array.from(items).findIndex(item => 
            item.classList.contains(this.config.suggestionActiveClass)
        );

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
                this.setActiveItem(items, activeIndex);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
                this.setActiveItem(items, activeIndex);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (activeIndex >= 0) {
                    items[activeIndex].click();
                }
                break;
                
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    },

    /**
     * Set active suggestion item
     */
    setActiveItem: function(items, activeIndex) {
        items.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add(this.config.suggestionActiveClass);
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove(this.config.suggestionActiveClass);
            }
        });
    },

    /**
     * Select a suggestion and update input
     */
    selectSuggestion: function(suggestion) {
        const suggestionBox = document.getElementById(this.config.suggestionBoxId);
        const targetInputId = suggestionBox ? suggestionBox.dataset.targetInputId : null;
        
        console.log('selectSuggestion called with:', {
            suggestion: suggestion.postcode,
            targetInputId: targetInputId,
            currentActiveInput: this.currentActiveInput
        });
        
        let targetInput = null;
        
        // First priority: use the stored currentActiveInput
        if (this.currentActiveInput) {
            targetInput = this.currentActiveInput;
            console.log('Using currentActiveInput:', targetInput);
        }
        // Second: try ID-based lookup
        else if (targetInputId) {
            targetInput = document.getElementById(targetInputId);
            console.log('Found target input by ID:', targetInput);
        }
        // Third: find the currently focused zipcode input
        else {
            targetInput = document.querySelector('input[data-type="zip"]:focus');
            console.log('Found target input by focus:', targetInput);
        }
        
        // Last resort: use the input element stored during showSuggestions
        if (!targetInput && suggestionBox.targetInputElement) {
            targetInput = suggestionBox.targetInputElement;
            console.log('Found target input from stored element:', targetInput);
        }
        
        // Final fallback: find any visible zipcode input
        if (!targetInput) {
            const inputs = document.querySelectorAll('input[data-type="zip"]');
            targetInput = Array.from(inputs).find(input => 
                input.offsetParent !== null // visible
            );
            console.log('Found target input by fallback:', targetInput);
        }
        
        if (targetInput) {
            // Check if this is a start or finish input
            const isStartInput = targetInput.closest('.start-input');
            const isEndInput = targetInput.closest('.end-input');
            
            console.log('Input type detection:', {
                isStartInput: !!isStartInput,
                isEndInput: !!isEndInput,
                inputElement: targetInput,
                parentClasses: targetInput.parentElement ? targetInput.parentElement.className : 'no parent'
            });
            
            if (isStartInput) {
                // For start input: show "zipcode - address" format in the input field
                targetInput.value = this.formatStartZipcodeText(suggestion.postcode, suggestion.city, suggestion.address);
                targetInput.dataset.selectedZipcode = suggestion.postcode;
                
                // STORE COMPLETE LOCATION DATA FOR PRECISE ROUTING
                targetInput.dataset.selectedLocationData = JSON.stringify({
                    postcode: suggestion.postcode,
                    city: suggestion.city,
                    address: suggestion.address,
                    type: suggestion.type
                });
                
                console.log('Updated start input with:', targetInput.value);
                console.log('Stored location data:', targetInput.dataset.selectedLocationData);
            } else if (isEndInput) {
                // For finish input: handle multiple selections with stacked display
                console.log('Handling finish zipcode selection');
                this.handleFinishZipcodeSelection(targetInput, suggestion);
            } else {
                // Default behavior for other inputs
                console.log('Using default behavior for input');
                targetInput.value = suggestion.postcode;
            }
        } else {
            console.error('No target input found for suggestion selection');
        }
        
        // Clear the active input reference
        this.currentActiveInput = null;
        
        this.hideSuggestions();
    },

    /**
     * Handle multiple selections for finish zipcodes
     */
    handleMultipleSelections: function(inputElement, suggestion) {
        // This method is now replaced by handleFinishZipcodeSelection
        // Keeping for backward compatibility
        this.handleFinishZipcodeSelection(inputElement, suggestion);
    },

    /**
     * Handle finish zipcode selection with stacked display below input
     */
    handleFinishZipcodeSelection: function(inputElement, suggestion) {
        console.log('handleFinishZipcodeSelection called with:', {
            inputElement: inputElement,
            suggestion: suggestion.postcode,
            parentClass: inputElement.parentElement ? inputElement.parentElement.className : 'no parent'
        });
        
        const endInputContainer = inputElement.closest('.end-input');
        if (!endInputContainer) {
            console.error('No .end-input container found for finish zipcode selection');
            return;
        }

        console.log('Found end-input container:', endInputContainer);

        // Create or get the selected zipcodes container
        let selectedContainer = endInputContainer.querySelector('.selected-zipcodes');
        if (!selectedContainer) {
            selectedContainer = document.createElement('div');
            selectedContainer.className = 'selected-zipcodes';
            endInputContainer.appendChild(selectedContainer);
            console.log('Created new selected-zipcodes container');
        } else {
            console.log('Using existing selected-zipcodes container');
        }

        // Check if this exact address is already selected (not just zipcode)
        const fullAddress = `${suggestion.postcode}-${suggestion.city}-${suggestion.address}`;
        const existingItem = selectedContainer.querySelector(`[data-full-address="${fullAddress}"]`);
        
        console.log('Duplicate check:', {
            postcode: suggestion.postcode,
            fullAddress: fullAddress,
            existingItem: existingItem,
            existingAddresses: Array.from(selectedContainer.querySelectorAll('.selected-zipcode-item')).map(item => item.dataset.fullAddress)
        });
        
        if (existingItem) {
            console.log('This exact address already selected:', fullAddress);
            return;
        }

        // Create selected zipcode item with finish format: "zipcode - street, address"
        const selectedItem = document.createElement('div');
        selectedItem.className = 'selected-zipcode-item';
        selectedItem.dataset.zipcode = suggestion.postcode;
        selectedItem.dataset.fullAddress = fullAddress; // Store full address for duplicate checking
        
        // STORE COMPLETE LOCATION DATA FOR PRECISE ROUTING
        selectedItem.dataset.locationData = JSON.stringify({
            postcode: suggestion.postcode,
            city: suggestion.city,
            address: suggestion.address,
            type: suggestion.type
        });
        selectedItem.dataset.city = suggestion.city;
        selectedItem.dataset.address = suggestion.address;
        selectedItem.dataset.type = suggestion.type;
        
        const displayText = this.formatFinishZipcodeText(suggestion.postcode, suggestion.city, suggestion.address);
        selectedItem.innerHTML = `
            <span class="selected-zipcode-text">${displayText}</span>
            <button type="button" class="remove-zipcode" title="Remove this zipcode">×</button>
        `;

        console.log('Created selected item with display text:', displayText);

        // Add remove functionality
        selectedItem.querySelector('.remove-zipcode').addEventListener('click', () => {
            this.removeSelectedZipcode(selectedItem, inputElement);
        });

        selectedContainer.appendChild(selectedItem);
        console.log('Added selected item to container');
        
        // Update the input value with comma-separated zipcodes
        this.updateInputValue(inputElement);
        
        // Clear the input for next entry and restore placeholder
        inputElement.value = '';
        inputElement.placeholder = 'Add another zipcode or press ENTER';
        
        console.log('Finish zipcode selection completed successfully');
    },

    /**
     * Add selected zipcode to the stacked list (for finish zipcodes)
     * @deprecated - Use handleFinishZipcodeSelection instead
     */
    addSelectedZipcode: function(inputElement, suggestion) {
        this.handleFinishZipcodeSelection(inputElement, suggestion);
    },

    /**
     * Remove selected zipcode from stacked list
     */
    removeSelectedZipcode: function(selectedItem, inputElement) {
        selectedItem.remove();
        this.updateInputValue(inputElement);
    },

    /**
     * Update input value with all selected zipcodes
     */
    updateInputValue: function(inputElement) {
        const endInputContainer = inputElement.closest('.end-input');
        const selectedItems = endInputContainer.querySelectorAll('.selected-zipcode-item');
        
        const zipcodes = Array.from(selectedItems).map(item => 
            item.dataset.zipcode
        ).join(', ');
        
        // Store the combined value in a hidden way or data attribute
        inputElement.dataset.selectedZipcodes = zipcodes;
        
        // For visual feedback, you might want to show a summary
        if (zipcodes) {
            inputElement.placeholder = `${selectedItems.length} zipcode(s) selected`;
        } else {
            inputElement.placeholder = 'Enter zip code';
        }
    },

    /**
     * Hide suggestions dropdown
     */
    hideSuggestions: function() {
        const suggestionBox = document.getElementById(this.config.suggestionBoxId);
        if (suggestionBox) {
            suggestionBox.style.display = 'none';
            suggestionBox.innerHTML = '';
            // Clean up references
            delete suggestionBox.dataset.targetInputId;
            delete suggestionBox.targetInputElement;
        }
    },

    /**
     * Show no results message
     */
    showNoResultsMessage: function(inputElement) {
        const suggestionBox = this.createSuggestionBox(inputElement);
        suggestionBox.innerHTML = '<div class="no-results">No matching zipcodes found</div>';
        this.positionSuggestionBox(suggestionBox, inputElement);
        suggestionBox.style.display = 'block';
        
        // Hide after 2 seconds
        setTimeout(() => {
            this.hideSuggestions();
        }, 2000);
    },

    /**
     * Generate unique ID for input element if it doesn't have one
     */
    generateInputId: function(inputElement) {
        const id = 'zipcode-input-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        inputElement.id = id;
        return id;
    },

    /**
     * Create CSS styles for suggestions
     */
    createSuggestionStyles: function() {
        if (document.getElementById('zipcode-suggestions-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'zipcode-suggestions-styles';
        style.textContent = `
            .zipcode-suggestions {
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                max-height: 300px;
                overflow-y: auto;
                display: none;
            }
            
            .suggestion-item {
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
            }
            
            .suggestion-item:last-child {
                border-bottom: none;
            }
            
            .suggestion-item:hover,
            .suggestion-item.suggestion-active {
                background-color: #f8f9fa;
            }
            
            .suggestion-main {
                font-weight: 500;
                color: #333;
                margin-bottom: 2px;
            }
            
            .suggestion-type {
                font-size: 0.85em;
                color: #666;
                text-transform: capitalize;
            }
            
            .no-results {
                padding: 15px;
                text-align: center;
                color: #999;
                font-style: italic;
            }
            
            .selected-zipcodes {
                margin-top: 8px;
                max-height: 120px;
                overflow-y: auto;
            }
            
            .selected-zipcode-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 20px;
                padding: 8px 12px;
                margin-bottom: 6px;
                font-size: 0.9em;
                color: #0c5460;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }
            
            .selected-zipcode-item:hover {
                background: #bee5eb;
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            }
            
            .selected-zipcode-text {
                flex-grow: 1;
                font-weight: 500;
            }
            
            .remove-zipcode {
                background: #0c5460;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                padding: 0;
                margin-left: 10px;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                opacity: 0.8;
            }
            
            .remove-zipcode:hover {
                opacity: 1;
                background: #084d59;
                transform: scale(1.1);
            }
        `;
        
        document.head.appendChild(style);
    },

    /**
     * Get selected zipcodes from an input (for integration with other modules)
     */
    getSelectedZipcodes: function(inputElement) {
        const isStartInput = inputElement.closest('.start-input');
        const isEndInput = inputElement.closest('.end-input');
        
        if (isStartInput) {
            // For start inputs, extract zipcode from the formatted value or dataset
            return inputElement.dataset.selectedZipcode || this.extractZipcodeFromValue(inputElement.value);
        } else if (isEndInput) {
            // For finish inputs, get from dataset or selected items
            if (inputElement.dataset.selectedZipcodes) {
                return inputElement.dataset.selectedZipcodes;
            }
            
            // Fallback: extract from selected items
            const endInputContainer = inputElement.closest('.end-input');
            const selectedItems = endInputContainer.querySelectorAll('.selected-zipcode-item');
            if (selectedItems.length > 0) {
                return Array.from(selectedItems).map(item => item.dataset.zipcode).join(', ');
            }
        }
        
        // Default fallback
        return inputElement.value.trim();
    },

    /**
     * Get selected zipcode-address pairs with full location data (NEW METHOD)
     * Returns detailed location information for precise routing
     */
    getSelectedLocations: function(inputElement) {
        const isStartInput = inputElement.closest('.start-input');
        const isEndInput = inputElement.closest('.end-input');
        
        if (isStartInput) {
            // For start inputs, get stored location data
            if (inputElement.dataset.selectedLocationData) {
                try {
                    return [JSON.parse(inputElement.dataset.selectedLocationData)];
                } catch (e) {
                    console.error('Error parsing stored location data:', e);
                }
            }
            
            // Fallback: try to find by current value
            const zipcode = this.extractZipcodeFromValue(inputElement.value);
            if (zipcode && this.searchableData) {
                const match = this.searchableData.find(item => 
                    item.postcode === zipcode && 
                    inputElement.value.includes(item.address)
                );
                if (match) {
                    return [{
                        postcode: match.postcode,
                        city: match.city,
                        address: match.address,
                        type: match.type
                    }];
                }
            }
            
            return null;
        } else if (isEndInput) {
            // For finish inputs, get from selected items with full data
            const endInputContainer = inputElement.closest('.end-input');
            const selectedItems = endInputContainer.querySelectorAll('.selected-zipcode-item');
            
            if (selectedItems.length > 0) {
                const locations = [];
                selectedItems.forEach(item => {
                    if (item.dataset.locationData) {
                        try {
                            locations.push(JSON.parse(item.dataset.locationData));
                        } catch (e) {
                            console.error('Error parsing location data:', e);
                            // Fallback to basic data
                            locations.push({
                                postcode: item.dataset.zipcode,
                                city: item.dataset.city || '',
                                address: item.dataset.address || '',
                                type: item.dataset.type || ''
                            });
                        }
                    }
                });
                return locations;
            }
            
            // Fallback for direct input
            if (inputElement.dataset.selectedLocationData) {
                try {
                    return [JSON.parse(inputElement.dataset.selectedLocationData)];
                } catch (e) {
                    console.error('Error parsing stored location data:', e);
                }
            }
        }
        
        return null;
    },

    /**
     * Extract zipcode from formatted value (e.g., "400656 - Strada Câmpului" -> "400656")
     */
    extractZipcodeFromValue: function(value) {
        if (!value) return '';
        
        // Extract zipcode from formats like "400656 - Strada Câmpului"
        const match = value.match(/^(\d+)/);
        return match ? match[1] : value.trim();
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    ZipcodeSuggestions.init();
});

// Export for use in other modules
window.ZipcodeSuggestions = ZipcodeSuggestions;

// Also support module exports if in a module environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZipcodeSuggestions;
}
