// Global Configuration and State Variables
// All variables are exposed on window to maintain backward compatibility

(function () {
    'use strict';

    // API Configuration - automatically use current domain
    window.API_BASE_URL = window.location.origin;
    console.log('API Base URL:', window.API_BASE_URL);

    // Global state variables
    window.selectedFiles = [];
    window.selectedModelType = null;
    window.selectedModelAction = null;
    window.uploadedData = null;
    window.currentPage = 1;
    window.rowsPerPage = 50;

    // Tabular data storage (for EHR/tabular models)
    window.allData = [];
    window.allColumns = [];
    window.variableChanges = {};
    window.currentVariableIndex = 0;
    window.variableData = null;
    window.globalRowFilter = {};
    window.dataModified = false;
    window.originalDataset = null;

    // Initialize createdFeatures array
    if (!window.createdFeatures || !Array.isArray(window.createdFeatures)) {
        window.createdFeatures = [];
    }

    // Helper function to get current data type
    window.getCurrentDataType = function () {
        // Check uploadedData first (most reliable)
        if (window.uploadedData) {
            return window.uploadedData.selected_model_type ||
                window.uploadedData.detected_type ||
                'ehr';
        }
        // Fall back to selectedModelType
        return window.selectedModelType || 'ehr';
    };

    // Helper function to check if current data is tabular/EHR
    window.isTabularData = function () {
        const dataType = window.getCurrentDataType();
        return dataType === 'ehr' || dataType === 'tabular' || (!dataType && window.allData && window.allData.length > 0);
    };

    // Chart instances for cleanup
    window.currentChart = null;

    /**
     * Recalculate all engineered features without blocking the UI thread.
     * Features are processed in small batches using setTimeout/requestAnimationFrame
     * so that the upload screen stays responsive even when many engineered features exist.
     */
    window.recalculateAllEngineeredFeatures = function (options = {}) {
        const { logPrefix = '[recalc]' } = options;

        if (!window.createdFeatures || !Array.isArray(window.createdFeatures) || window.createdFeatures.length === 0) {
            console.log(`${logPrefix} No engineered features to recalculate`);
            return;
        }

        if (!window.allData || window.allData.length === 0) {
            console.log(`${logPrefix} No data available to recalculate features`);
            return;
        }

        // Avoid running multiple recalculations simultaneously
        if (window._engineeredFeatureRecalcInProgress) {
            console.log(`${logPrefix} Recalculation already in progress, skipping duplicate call`);
            return;
        }

        window._engineeredFeatureRecalcInProgress = true;

        // Work on a shallow copy so we can safely queue items
        const featuresQueue = window.createdFeatures.slice();
        const totalFeatures = featuresQueue.length;
        let processedCount = 0;
        const startTime = Date.now();

        console.log(`${logPrefix} Recalculating ${totalFeatures} engineered feature(s)...`);

        const finishRecalc = () => {
            window._engineeredFeatureRecalcInProgress = false;
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`${logPrefix} Finished recalculating ${processedCount}/${totalFeatures} feature(s) in ${duration}s`);

            // Refresh any visible views so new columns appear
            if (typeof window.refreshDataViewerIfVisible === 'function') {
                window.refreshDataViewerIfVisible();
            }
            if (typeof window.refreshCleaningInterfaceIfVisible === 'function') {
                window.refreshCleaningInterfaceIfVisible();
            }
            if (typeof window.updateAvailableVariablesDisplay === 'function') {
                window.updateAvailableVariablesDisplay();
            }
        };

        const processNextFeature = () => {
            if (featuresQueue.length === 0) {
                finishRecalc();
                return;
            }

            const feature = featuresQueue.shift();
            try {
                if (feature.type === 'rule_based') {
                    if (typeof window.calculateAndAddRuleBasedFeature === 'function') {
                        window.calculateAndAddRuleBasedFeature(
                            feature.variable,
                            feature.operator,
                            feature.value,
                            feature.feature_name
                        );
                    } else if (typeof window.createColumnSimple === 'function') {
                        // Legacy fallback
                        window.createColumnSimple(
                            feature.variable,
                            feature.operator,
                            feature.value,
                            feature.feature_name
                        );
                    }
                } else if (feature.type === 'combined' || feature.type === 'combination') {
                    if (typeof window.calculateAndAddCombinedFeature === 'function') {
                        const columnA = feature.columnA ?? feature.column_a;
                        const columnB = feature.columnB ?? feature.column_b;
                        window.calculateAndAddCombinedFeature(
                            columnA,
                            columnB,
                            feature.feature_name
                        );
                    }
                }
                processedCount += 1;
                if (processedCount % 5 === 0 || processedCount === totalFeatures) {
                    console.log(`${logPrefix} Processed ${processedCount}/${totalFeatures} feature(s)...`);
                }
            } catch (error) {
                console.error(`${logPrefix} Error recalculating feature "${feature.feature_name}":`, error);
            }

            // Yield back to the event loop to keep the UI responsive
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(processNextFeature);
            } else {
                setTimeout(processNextFeature, 0);
            }
        };

        // Kick off the asynchronous processing
        setTimeout(processNextFeature, 0);
    };

    console.log('Config module loaded - Global state initialized');
})();

