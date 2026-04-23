/**
 * Application State Store for ResearcherML
 * Centralized state management to replace window.* global variables
 */

const AppStore = (function() {
    // Private state object
    let _state = getInitialState();

    /**
     * Get initial/default state
     * @returns {Object} Initial state object
     */
    function getInitialState() {
        return {
            // Uploaded data
            allData: [],
            allColumns: [],
            uploadedData: null,
            fileId: null,
            fileName: null,
            
            // Data type and model selection
            dataType: null,
            modelType: null,
            modelAction: null,
            
            // Cleaning
            variableChanges: {},
            cleanedData: null,
            
            // Feature engineering
            createdFeatures: [],
            selectedFeatures: [],
            targetColumn: null,
            
            // Model training
            trainedModels: [],
            bestModel: null,
            
            // Time series
            timeSeriesFrequency: 1.0,
            timeSeriesTimestampColumn: null,
            
            // UI state
            currentSection: 'uploadSection',
            isLoading: false,
            error: null
        };
    }

    /**
     * Get a state value
     * @param {string} key - State key to retrieve
     * @returns {*} State value or undefined if key doesn't exist
     */
    function get(key) {
        if (key === undefined) {
            // Return entire state (read-only copy)
            return Object.assign({}, _state);
        }
        return _state[key];
    }

    /**
     * Set a state value
     * @param {string|Object} keyOrObject - State key or object of key-value pairs
     * @param {*} value - Value to set (ignored if first param is object)
     */
    function set(keyOrObject, value) {
        if (typeof keyOrObject === 'object' && keyOrObject !== null) {
            // Bulk update
            Object.keys(keyOrObject).forEach(key => {
                _state[key] = keyOrObject[key];
            });
        } else {
            // Single update
            _state[keyOrObject] = value;
        }
        
        // Trigger any listeners (future enhancement)
        triggerListeners(keyOrObject);
    }

    /**
     * Update a state value (merge objects)
     * @param {string} key - State key to update
     * @param {*} value - Value to merge
     */
    function update(key, value) {
        if (typeof _state[key] === 'object' && typeof value === 'object') {
            _state[key] = Object.assign({}, _state[key], value);
        } else {
            _state[key] = value;
        }
        triggerListeners(key);
    }

    /**
     * Reset state to initial values
     */
    function reset() {
        _state = getInitialState();
        triggerListeners('*');
    }

    /**
     * Clear specific keys or all state
     * @param {string|Array<string>} keys - Key(s) to clear, or '*' for all
     */
    function clear(keys = '*') {
        if (keys === '*') {
            reset();
        } else if (Array.isArray(keys)) {
            keys.forEach(key => {
                delete _state[key];
            });
        } else {
            delete _state[keys];
        }
        triggerListeners(keys);
    }

    // State change listeners (for future reactive updates)
    const _listeners = {};

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch ('*' for all)
     * @param {Function} callback - Function to call on change
     * @returns {Function} Unsubscribe function
     */
    function subscribe(key, callback) {
        if (!_listeners[key]) {
            _listeners[key] = [];
        }
        _listeners[key].push(callback);
        
        // Return unsubscribe function
        return function unsubscribe() {
            const index = _listeners[key].indexOf(callback);
            if (index > -1) {
                _listeners[key].splice(index, 1);
            }
        };
    }

    /**
     * Trigger listeners for a specific key
     * @param {string|Object} keyOrObject - Key that changed
     */
    function triggerListeners(keyOrObject) {
        const keys = typeof keyOrObject === 'object' 
            ? Object.keys(keyOrObject) 
            : [keyOrObject];
        
        keys.forEach(key => {
            // Trigger specific listeners
            if (_listeners[key]) {
                _listeners[key].forEach(callback => callback(_state[key], key));
            }
            
            // Trigger wildcard listeners
            if (_listeners['*']) {
                _listeners['*'].forEach(callback => callback(_state, key));
            }
        });
    }

    /**
     * Persist state to localStorage
     * @param {string} key - Storage key (default: 'researcherml_state')
     */
    function persist(key = 'researcherml_state') {
        try {
            // Don't persist large data objects
            const stateToPersist = Object.assign({}, _state);
            delete stateToPersist.allData;
            delete stateToPersist.uploadedData;
            delete stateToPersist.cleanedData;
            
            localStorage.setItem(key, JSON.stringify(stateToPersist));
        } catch (e) {
            console.warn('Could not persist state to localStorage:', e);
        }
    }

    /**
     * Restore state from localStorage
     * @param {string} key - Storage key (default: 'researcherml_state')
     */
    function restore(key = 'researcherml_state') {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsedState = JSON.parse(stored);
                Object.assign(_state, parsedState);
                triggerListeners('*');
            }
        } catch (e) {
            console.warn('Could not restore state from localStorage:', e);
        }
    }

    // Public API
    return {
        get,
        set,
        update,
        reset,
        clear,
        subscribe,
        persist,
        restore
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppStore = AppStore;
}
