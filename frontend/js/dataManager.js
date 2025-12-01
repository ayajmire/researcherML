// Data Management Module - localStorage restoration and data management
(function () {
    'use strict';

    // Ensure global variables exist
    if (typeof window.allData === 'undefined') window.allData = [];
    if (typeof window.allColumns === 'undefined') window.allColumns = [];
    if (typeof window.variableChanges === 'undefined') window.variableChanges = {};
    if (typeof window.dataModified === 'undefined') window.dataModified = false;
    if (typeof window.uploadedData === 'undefined') window.uploadedData = null;
    if (!window.createdFeatures || !Array.isArray(window.createdFeatures)) {
        window.createdFeatures = [];
    }

    // Ensure imaging data variables exist
    if (typeof window.imageData === 'undefined') {
        window.imageData = {
            folderStructure: null,
            images: [],
            uploadId: null,
            rootPath: null
        };
    }
    if (typeof window.imageLabels === 'undefined') {
        window.imageLabels = {};
    }
    if (typeof window.imageMetadata === 'undefined') {
        window.imageMetadata = {
            uploadId: null,
            taskType: null,
            labelType: null,
            preprocessing: {}
        };
    }

    window.restoreAllData = function () {
        try {
            const savedAllData = localStorage.getItem('allData');
            const savedDataModified = localStorage.getItem('dataModified');
            if (savedAllData) {
                window.allData = JSON.parse(savedAllData);
                console.log('Restored allData from localStorage, length:', window.allData.length);
                if (savedDataModified === 'true') {
                    window.dataModified = true;
                    console.log('Restored dataModified = true from localStorage');
                }
            } else {
                console.log('No saved allData found in localStorage');
            }
        } catch (error) {
            console.error('Error restoring allData:', error);
            window.allData = [];
        }
    };

    window.restoreAllColumns = function () {
        try {
            const savedColumns = localStorage.getItem('allColumns');
            if (savedColumns) {
                window.allColumns = JSON.parse(savedColumns);
                console.log('Restored allColumns from localStorage:', window.allColumns);
            } else {
                console.log('No saved allColumns found in localStorage');
            }
        } catch (error) {
            console.error('Error restoring allColumns:', error);
            window.allColumns = [];
        }
    };

    window.restoreVariableChanges = function () {
        try {
            const savedVariableChanges = localStorage.getItem('variableChanges');
            if (savedVariableChanges) {
                window.variableChanges = JSON.parse(savedVariableChanges);
                console.log('Restored variable changes from localStorage:', window.variableChanges);
            }
        } catch (error) {
            console.error('Error restoring variable changes:', error);
            window.variableChanges = {};
        }
    };

    window.restoreCreatedFeatures = function () {
        try {
            const savedFeatures = localStorage.getItem('createdFeatures');
            if (savedFeatures) {
                window.createdFeatures = JSON.parse(savedFeatures);
                console.log('Restored createdFeatures from localStorage:', window.createdFeatures);
                console.log('allColumns already restored:', window.allColumns);
            }
        } catch (error) {
            console.error('Error restoring createdFeatures:', error);
            window.createdFeatures = [];
        }
    };

    // ========== IMAGING DATA RESTORATION ==========
    window.restoreImageData = function () {
        try {
            const savedImageData = localStorage.getItem('imageData');
            if (savedImageData) {
                window.imageData = JSON.parse(savedImageData);
                console.log('Restored imageData from localStorage:', window.imageData);
            } else {
                window.imageData = {
                    folderStructure: null,
                    images: [],
                    uploadId: null,
                    totalImages: 0
                };
            }
        } catch (error) {
            console.error('Error restoring imageData:', error);
            window.imageData = {
                folderStructure: null,
                images: [],
                uploadId: null,
                totalImages: 0
            };
        }
    };

    window.restoreImageLabels = function () {
        try {
            const savedImageLabels = localStorage.getItem('imageLabels');
            if (savedImageLabels) {
                window.imageLabels = JSON.parse(savedImageLabels);
                console.log('Restored imageLabels from localStorage, count:', Object.keys(window.imageLabels).length);
            } else {
                window.imageLabels = {};
            }
        } catch (error) {
            console.error('Error restoring imageLabels:', error);
            window.imageLabels = {};
        }
    };

    window.restoreImageMetadata = function () {
        try {
            const savedImageMetadata = localStorage.getItem('imageMetadata');
            if (savedImageMetadata) {
                window.imageMetadata = JSON.parse(savedImageMetadata);
                console.log('Restored imageMetadata from localStorage:', window.imageMetadata);
            } else {
                window.imageMetadata = {
                    uploadId: null,
                    taskType: null,
                    labelType: null,
                    preprocessing: {},
                    modelType: null
                };
            }
        } catch (error) {
            console.error('Error restoring imageMetadata:', error);
            window.imageMetadata = {
                uploadId: null,
                taskType: null,
                labelType: null,
                preprocessing: {},
                modelType: null
            };
        }
    };

    window.restoreUploadedData = function () {
        try {
            const savedData = localStorage.getItem('uploadedData');
            if (savedData) {
                window.uploadedData = JSON.parse(savedData);
                console.log('Restored uploaded data from localStorage:', window.uploadedData);

                // Restore model type and action from uploaded data
                if (window.uploadedData) {
                    if (window.uploadedData.selected_model_type) {
                        window.selectedModelType = window.uploadedData.selected_model_type;
                        console.log('Restored selectedModelType:', window.selectedModelType);
                    }
                    if (window.uploadedData.selected_model_action) {
                        window.selectedModelAction = window.uploadedData.selected_model_action;
                        console.log('Restored selectedModelAction:', window.selectedModelAction);
                    }

                    // If imaging data, restore imaging-specific data
                    if (window.uploadedData.selected_model_type === 'imaging' ||
                        window.uploadedData.detected_type === 'imaging') {
                        window.restoreImageData();
                        window.restoreImageLabels();
                        window.restoreImageMetadata();
                    }
                }

                // If we have uploaded data, refresh navigation but DON'T automatically show viewer
                // User should navigate to viewer tab manually
                if (window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0) {
                    // Refresh navigation after data is restored
                    setTimeout(() => {
                        if (window.refreshNavigationAvailability) {
                            console.log('🔄 Refreshing navigation after data restoration...');
                            window.refreshNavigationAvailability();
                        }
                    }, 100);

                    // DON'T automatically show data viewer - let user navigate to it
                    // Only show upload page on initial load
                    if (window.setActiveStep) {
                        window.setActiveStep('upload');
                    }
                    if (window.showUploadLanding) {
                        window.showUploadLanding();
                    }
                } else {
                    // No data - show upload page
                    if (window.setActiveStep) {
                        window.setActiveStep('upload');
                    }
                    if (window.showUploadLanding) {
                        window.showUploadLanding();
                    }
                }
            }
        } catch (error) {
            console.error('Error restoring uploaded data:', error);
            localStorage.removeItem('uploadedData');
        }
    };

    // Initialize restoration on page load
    function initializeRestoration() {
        // Restore tabular data
        window.restoreAllColumns();
        window.restoreAllData();
        window.restoreVariableChanges();
        window.restoreCreatedFeatures();

        // Restore uploaded data (which will conditionally restore imaging data)
        window.restoreUploadedData();

        // Always restore imaging data structures (will be empty if not imaging)
        window.restoreImageData();
        window.restoreImageLabels();
        window.restoreImageMetadata();

        // After restoration, ALWAYS refresh navigation to ensure buttons are in correct state
        setTimeout(() => {
            if (window.refreshNavigationAvailability) {
                const hasTabularData = window.allData && window.allData.length > 0;
                const hasUploadedData = window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0;

                console.log('🔄 Refreshing navigation after page load restoration...', {
                    hasTabularData,
                    hasUploadedData
                });

                // ALWAYS refresh navigation availability - it will disable buttons if no data
                window.refreshNavigationAvailability();
            }
        }, 300);

        // Additional refresh to ensure state is correct
        setTimeout(() => {
            if (window.refreshNavigationAvailability) {
                window.refreshNavigationAvailability();
            }
        }, 600);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRestoration);
    } else {
        initializeRestoration();
    }

    console.log('Data Manager module loaded');
})();
