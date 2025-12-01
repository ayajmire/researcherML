// Utility Functions Module
(function () {
    'use strict';

    window.getFileIcon = function (filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(ext)) return '🖼️';
        if (['csv', 'tsv'].includes(ext)) return '';
        if (['txt', 'json'].includes(ext)) return '📄';
        if (['wav', 'mp3', 'flac', 'm4a'].includes(ext)) return '🎵';
        return '📁';
    };

    window.formatFileSize = function (bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    window.saveCurrentDataset = function () {
        try {
            // Create a JSON object with all the current data
            const datasetExport = {
                metadata: {
                    exported_at: new Date().toISOString(),
                    original_upload: window.uploadedData,
                    columns: window.allColumns,
                    total_rows: window.allData ? window.allData.length : 0,
                    variable_changes: window.variableChanges,
                    created_features: window.createdFeatures || []
                },
                data: window.allData || [],
                columns: window.allColumns || []
            };

            // Convert to JSON string
            const jsonString = JSON.stringify(datasetExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            a.download = `dataset_export_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Dataset exported successfully');
        } catch (error) {
            console.error('Error saving dataset:', error);
            alert('Error saving dataset: ' + error.message);
        }
    };

    // Navigation configuration for different model types
    const NAVIGATION_CONFIGS = {
        'ehr': [
            { step: 'upload', icon: '📤', label: 'Upload' },
            { step: 'viewer', icon: '📊', label: 'Dataset Viewer' },
            { step: 'cleaning', icon: '🧹', label: 'Data Cleaning' },
            { step: 'engineering', icon: '⚙️', label: 'Feature Engineering' },
            { step: 'visualization', icon: '📈', label: 'Visualization' },
            { step: 'training', icon: '🤖', label: 'Model Training' }
        ],
        'tabular': [
            { step: 'upload', icon: '📤', label: 'Upload' },
            { step: 'viewer', icon: '📊', label: 'Dataset Viewer' },
            { step: 'cleaning', icon: '🧹', label: 'Data Cleaning' },
            { step: 'engineering', icon: '⚙️', label: 'Feature Engineering' },
            { step: 'visualization', icon: '📈', label: 'Visualization' },
            { step: 'training', icon: '🤖', label: 'Model Training' }
        ]
    };

    window.renderNavigation = function (modelType) {
        const sidebarMenu = document.getElementById('sidebarMenu');
        if (!sidebarMenu) {
            console.error('sidebarMenu not found');
            return;
        }

        // Default to 'ehr' if no model type or unknown type
        const navConfig = NAVIGATION_CONFIGS[modelType] || NAVIGATION_CONFIGS['ehr'];
        console.log(`🎯 Rendering navigation for model type: ${modelType}, config has ${navConfig.length} items`);

        // Clear existing navigation
        sidebarMenu.innerHTML = '';

        // Render navigation items
        navConfig.forEach((item, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-step', item.step);
            button.id = `nav-${item.step}`;
            button.className = 'nav-item';

            // Upload is always visible and enabled
            // Other buttons will be shown/hidden by refreshNavigationAvailability based on data availability
            if (item.step !== 'upload') {
                // Start disabled and hidden - will be shown/enabled by refreshNavigationAvailability if data exists
                button.disabled = true;
                button.setAttribute('disabled', 'disabled');
                button.setAttribute('aria-disabled', 'true');
                button.setAttribute('tabindex', '-1');
                button.classList.add('disabled');
                button.style.display = 'none'; // Hide by default - only show if data exists
                button.title = 'Upload a dataset first to access this section';
            } else {
                // Upload is always visible and enabled
                button.disabled = false;
                button.removeAttribute('disabled');
                button.removeAttribute('aria-disabled');
                button.setAttribute('tabindex', '0');
                button.classList.remove('disabled');
                button.style.display = ''; // Always visible
            }

            button.innerHTML = `
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            `;

            sidebarMenu.appendChild(button);
        });

        console.log(`✅ Navigation buttons created: ${navConfig.length} buttons`);

        // Reset the data-initialized flag so listeners can be re-attached
        const nav = document.getElementById('workflowNav');
        if (nav) {
            nav.removeAttribute('data-initialized');
            console.log('✅ Reset data-initialized flag');
        }

        // Force re-attach event listeners
        // Use multiple strategies to ensure it works
        setTimeout(() => {
            attachNavigationListeners();
        }, 0);

        requestAnimationFrame(() => {
            attachNavigationListeners();

            // Refresh availability after listeners are attached
            if (window.refreshNavigationAvailability) {
                window.refreshNavigationAvailability();
            }
        });

        // Additional refreshes at different intervals to ensure state is correct
        // CRITICAL: Force multiple refreshes to ensure buttons are disabled if no dataset exists
        setTimeout(() => {
            if (window.refreshNavigationAvailability) {
                window.refreshNavigationAvailability();
            }
        }, 50);

        setTimeout(() => {
            if (window.refreshNavigationAvailability) {
                window.refreshNavigationAvailability();
            }
        }, 150);

        setTimeout(() => {
            if (window.refreshNavigationAvailability) {
                window.refreshNavigationAvailability();
            }
        }, 300);

        // Final refresh after a longer delay to catch any edge cases
        setTimeout(() => {
            if (window.refreshNavigationAvailability) {
                window.refreshNavigationAvailability();
            }
        }, 600);

        console.log(`✅ Navigation rendered for model type: ${modelType}`);
    };

    // Separate function to attach navigation listeners
    function attachNavigationListeners() {
        const nav = document.getElementById('workflowNav');
        if (!nav) {
            console.warn('⚠️ Navigation bar not found in attachNavigationListeners');
            return;
        }

        const buttons = nav.querySelectorAll('.nav-item[data-step]');
        if (buttons.length === 0) {
            console.warn('⚠️ No buttons found to attach listeners to');
            return;
        }

        console.log(`🔗 Attaching listeners to ${buttons.length} navigation buttons`);

        // Don't re-attach if already initialized (unless we're forcing it)
        // But we removed the flag in renderNavigation, so we'll always attach

        buttons.forEach((button) => {
            // Check if button already has a listener by checking for a data attribute
            if (button.hasAttribute('data-listener-attached')) {
                // Remove old listener by cloning
                const newButton = button.cloneNode(true);
                newButton.removeAttribute('data-listener-attached');
                button.parentNode.replaceChild(newButton, button);
                button = newButton;
            }

            // Add click listener
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const step = button.dataset.step;
                console.log('🔘 Navigation button clicked:', step, 'disabled:', button.disabled);

                if (button.disabled) {
                    const tooltip = button.getAttribute('title') || 'This section requires data. Please upload a dataset first.';
                    alert(tooltip);
                    return false;
                }

                if (typeof window.navigateToStep === 'function') {
                    window.navigateToStep(step);
                } else {
                    console.error('❌ navigateToStep function not available');
                    alert('Navigation is not ready. Please refresh the page.');
                }

                return false;
            });

            // Mark button as having listener attached
            button.setAttribute('data-listener-attached', 'true');
        });

        // Mark nav as initialized
        nav.setAttribute('data-initialized', 'true');
        console.log('✅ Navigation listeners attached to', buttons.length, 'buttons');
    }

    window.clearAllCachedData = function () {
        console.log('Clearing all cached data and resetting variables...');

        // Clear all localStorage items (tabular)
        localStorage.removeItem('uploadedData');
        localStorage.removeItem('allData');
        localStorage.removeItem('allColumns');
        localStorage.removeItem('variableChanges');
        localStorage.removeItem('createdFeatures');
        localStorage.removeItem('dataModified');

        // Reset all global variables
        window.uploadedData = null;
        window.allData = [];
        window.allColumns = [];
        window.variableChanges = {};
        window.createdFeatures = [];
        window.dataModified = false;
        window.currentPage = 1;
        window.currentVariableIndex = 0;
        window.variableData = null;

        console.log('All cached data cleared and variables reset (model type selection preserved)');

        // Render navigation based on preserved model type
        const preservedModelType = localStorage.getItem('selectedModelType') || 'ehr';
        if (window.renderNavigation) {
            console.log('🔄 Rendering navigation with preserved model type:', preservedModelType);
            window.renderNavigation(preservedModelType);
        }

        if (typeof window.refreshNavigationAvailability === 'function') {
            window.refreshNavigationAvailability();
        }
        if (typeof window.setActiveStep === 'function') {
            window.setActiveStep('upload');
        }
    };

    const NAV_REQUIREMENTS = {
        upload: () => true,
        viewer: () => {
            // Viewer requires uploaded data FIRST
            const hasUploadData = window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0;
            if (!hasUploadData) return false;

            // Then check for actual data
            const hasTabularData = window.allData && Array.isArray(window.allData) && window.allData.length > 0;
            return hasTabularData;
        },
        cleaning: () => {
            // Data cleaning requires uploaded data FIRST
            const hasUploadData = window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0;
            if (!hasUploadData) return false;

            // Then requires tabular/EHR data
            const hasData = window.allData && Array.isArray(window.allData) && window.allData.length > 0;
            return hasData;
        },
        engineering: () => {
            // Feature engineering requires uploaded data FIRST
            const hasUploadData = window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0;
            if (!hasUploadData) return false;

            // Then requires tabular/EHR data
            const hasData = window.allData && Array.isArray(window.allData) && window.allData.length > 0;
            return hasData;
        },
        visualization: () => {
            // Visualization requires uploaded data FIRST
            const hasUploadData = window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0;
            if (!hasUploadData) return false;

            // Then requires tabular data
            const hasTabularData = window.allData && Array.isArray(window.allData) && window.allData.length > 0;
            return hasTabularData;
        },
        training: () => {
            // Training requires uploaded data FIRST
            const hasUploadData = window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0;
            if (!hasUploadData) return false;

            // Then check for tabular data
            const hasTabularData = window.allData && Array.isArray(window.allData) && window.allData.length > 0;
            return hasTabularData;
        }
    };

    function showUploadLanding() {
        window.hideAllSections();
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const uploadBtn = document.getElementById('uploadBtn');
        const newUploadBtn = document.getElementById('newUploadBtn');
        const result = document.getElementById('result');

        if (uploadSection) {
            uploadSection.style.display = 'block';
            uploadSection.style.visibility = 'visible';
        }
        if (modelSelection) {
            modelSelection.style.display = 'block';
            modelSelection.style.visibility = 'visible';
        }

        // Show upload button ONLY on upload tab
        if (uploadBtn) {
            uploadBtn.style.display = window.uploadedData ? 'none' : 'block';
            uploadBtn.style.visibility = window.uploadedData ? 'hidden' : 'visible';
        }

        // Don't show newUploadBtn - use sidebar navigation instead
        if (newUploadBtn) {
            newUploadBtn.style.display = 'none';
            newUploadBtn.style.visibility = 'hidden';
        }

        if (result && result.innerHTML.trim().length > 0) {
            result.style.display = 'block';
            result.style.visibility = 'visible';
        }

        window.setActiveStep('upload');
    }

    window.refreshNavigationAvailability = function () {
        const nav = document.getElementById('workflowNav');
        if (!nav) {
            console.warn('⚠️ Navigation bar not found in refreshNavigationAvailability');
            return;
        }

        const sidebarMenu = document.getElementById('sidebarMenu');
        const buttons = nav.querySelectorAll('.nav-item[data-step]');

        // If no buttons found, try to render navigation
        if (buttons.length === 0) {
            console.warn('⚠️ No navigation buttons found, attempting to render navigation...');

            if (sidebarMenu && sidebarMenu.children.length === 0) {
                // Navigation menu is empty, render it
                // Check user's selected type FIRST, then uploaded data
                const userSelectedType = localStorage.getItem('selectedModelType');
                const storedUploadedData = localStorage.getItem('uploadedData');
                let uploadedModelType = null;
                if (storedUploadedData) {
                    try {
                        const data = JSON.parse(storedUploadedData);
                        uploadedModelType = data.selected_model_type || data.detected_type;
                    } catch (e) {
                        console.error('Error parsing stored uploadedData:', e);
                    }
                }

                const modelType = userSelectedType || uploadedModelType || 'ehr';
                console.log('  Rendering navigation for model type:', modelType, '(userSelected:', userSelectedType, 'uploaded:', uploadedModelType, ')');

                if (window.renderNavigation) {
                    window.renderNavigation(modelType);
                    // Retry after rendering
                    setTimeout(() => {
                        window.refreshNavigationAvailability();
                    }, 300);
                }
            }
            return;
        }

        // Check data state
        const hasUploadedData = window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0;
        const hasTabularData = window.allData && Array.isArray(window.allData) && window.allData.length > 0;
        const dataType = window.getCurrentDataType ? window.getCurrentDataType() : null;

        // Get model type from user's selection FIRST, then uploaded data
        const userSelectedType = localStorage.getItem('selectedModelType');
        const modelType = userSelectedType || (hasUploadedData && window.uploadedData ? (window.uploadedData.selected_model_type || window.uploadedData.detected_type) : null);

        console.log('🔍 Navigation refresh check:', {
            hasUploadedData,
            hasTabularData,
            dataType,
            modelType,
            allDataLength: window.allData ? window.allData.length : 0,
            buttonCount: buttons.length,
            buttonSteps: Array.from(buttons).map(b => b.dataset.step).join(', '),
            hasDataset: hasUploadedData || hasTabularData
        });

        // If no dataset at all, only upload should be enabled
        const hasAnyDataset = hasUploadedData || hasTabularData;
        if (!hasAnyDataset) {
            console.log('⚠️ No dataset found - only Upload button will be enabled');
        }

        let enabledCount = 0;
        buttons.forEach(button => {
            const step = button.dataset.step;
            const requirement = NAV_REQUIREMENTS[step];
            let enabled = false;

            if (step === 'upload') {
                enabled = true;
            } else if (requirement) {
                // Use requirement function for all steps
                enabled = requirement();
            }

            // Force update button state - be VERY explicit
            // CRITICAL: Show/hide buttons based on availability, not just enable/disable
            if (enabled) {
                // Enable button and show it
                button.disabled = false;
                button.removeAttribute('disabled');
                button.removeAttribute('title');
                button.removeAttribute('aria-disabled');
                button.setAttribute('tabindex', '0');
                button.classList.remove('disabled');
                button.style.display = ''; // Show the button
                // Clear inline styles to let CSS handle normal state
                button.style.opacity = '';
                button.style.cursor = '';
                button.style.pointerEvents = '';
                enabledCount++;
            } else {
                // Hide button if no dataset, otherwise disable it
                if (!hasAnyDataset && step !== 'upload') {
                    // No dataset at all - hide the button (except upload)
                    button.style.display = 'none';
                } else {
                    // Dataset exists but step not available - disable but show it
                    button.disabled = true;
                    button.setAttribute('disabled', 'disabled');
                    if (step === 'upload') {
                        button.title = '';
                        button.style.display = ''; // Upload is always visible
                    } else {
                        // Check if no dataset at all
                        if (!hasAnyDataset) {
                            button.title = 'Upload a dataset first to access this section';
                        } else {
                            button.title = 'Complete earlier steps to access this section';
                        }
                        button.style.display = ''; // Show but disabled
                    }
                    button.setAttribute('aria-disabled', 'true');
                    button.setAttribute('tabindex', '-1');
                    button.classList.add('disabled');
                    // Clear inline styles to let CSS handle disabled state
                    button.style.opacity = '';
                    button.style.cursor = '';
                    button.style.pointerEvents = '';
                }
            }
        });

        const enabledButtons = Array.from(buttons).filter(b => !b.disabled).map(b => b.dataset.step);
        console.log(`✅✅✅ Navigation availability refreshed. ${enabledCount}/${buttons.length} buttons enabled: [${enabledButtons.join(', ')}]`);

        // Debug: Log which buttons are actually disabled
        const disabledButtons = Array.from(buttons).filter(b => b.disabled).map(b => b.dataset.step);
        console.log(`   Disabled buttons: [${disabledButtons.join(', ')}]`);
    };

    window.setActiveStep = function (step) {
        if (!step) {
            console.warn('setActiveStep called with no step');
            return;
        }

        console.log('setActiveStep called with:', step);
        window.currentNavStep = step;

        const nav = document.getElementById('workflowNav');
        if (!nav) {
            console.warn('Navigation bar not found in setActiveStep, storing pending step');
            window.pendingNavStep = step;
            return;
        }

        const buttons = nav.querySelectorAll('.nav-item[data-step]');
        console.log('Updating active state for', buttons.length, 'buttons');

        buttons.forEach(button => {
            const isActive = button.dataset.step === step;
            button.classList.toggle('active', isActive);
            if (isActive) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });

        // Refresh navigation availability
        // IMPORTANT: This should enable buttons if data exists
        window.refreshNavigationAvailability();
        console.log('Active step set to:', step, 'allData length:', window.allData ? window.allData.length : 0);
    };

    window.navigateToStep = function (step) {
        console.log('🚀 navigateToStep called with:', step);
        console.log('   Current state:', {
            allDataLength: window.allData ? window.allData.length : 0,
            uploadedData: !!window.uploadedData,
            imageData: window.imageData ? window.imageData.uploadId : null,
            dataType: window.getCurrentDataType ? window.getCurrentDataType() : null
        });

        const target = step || 'upload';

        // Always allow navigation to upload
        if (target === 'upload') {
            showUploadLanding();
            return;
        }

        const requirement = NAV_REQUIREMENTS[target];
        const canNavigate = requirement ? requirement() : false;

        console.log(`   Navigation check for "${target}":`, canNavigate);
        if (!canNavigate) {
            console.warn(`   ❌ Navigation blocked for "${target}"`);
            console.warn('   Current data state:', {
                allData: window.allData ? window.allData.length : 0,
                uploadedData: window.uploadedData ? 'exists' : 'missing',
                imageData: window.imageData ? window.imageData.uploadId : 'none',
                dataType: window.getCurrentDataType ? window.getCurrentDataType() : 'unknown'
            });

            // Don't show alert if we have data - just log it
            // The issue might be a timing problem, so let's try to refresh navigation first
            window.refreshNavigationAvailability();

            // Re-check after refresh
            const canNavigateAfterRefresh = requirement ? requirement() : false;
            if (!canNavigateAfterRefresh) {
                alert('Please upload and prepare your dataset before accessing this section.');
                showUploadLanding();
                return;
            }
            // If it works after refresh, continue below
        }

        switch (target) {
            case 'viewer':
                if (window.showDataViewer) {
                    window.showDataViewer(window.uploadedData);
                } else {
                    console.error('showDataViewer function not found');
                    alert('Data viewer is not available. Please upload a dataset first.');
                }
                break;
            case 'cleaning':
                if (window.proceedToCleaning) {
                    window.proceedToCleaning();
                } else {
                    console.error('proceedToCleaning function not found');
                    alert('Data cleaning is not available. Please upload a dataset first.');
                }
                break;
            case 'engineering':
                if (window.showFeatureEngineeringInterface) {
                    window.showFeatureEngineeringInterface();
                } else {
                    console.error('showFeatureEngineeringInterface function not found');
                    alert('Feature engineering is not available. Please upload a dataset first.');
                }
                break;
            case 'visualization':
                if (window.showVisualizationInterface) {
                    window.showVisualizationInterface();
                } else {
                    console.error('showVisualizationInterface function not found');
                    alert('Visualization is not available. Please upload a dataset first.');
                }
                break;
            case 'training':
                if (window.proceedToModelTraining) {
                    window.proceedToModelTraining();
                } else {
                    console.error('proceedToModelTraining function not found');
                    alert('Model training is not available. Please upload a dataset first.');
                }
                break;
            default:
                console.warn('Unknown step:', target);
                showUploadLanding();
        }
    };

    // Initialize navigation on DOM ready
    function initializeNavigation() {
        console.log('Initializing navigation...');

        // Make sure nav bar exists
        const nav = document.getElementById('workflowNav');
        if (!nav) {
            console.warn('Navigation bar not found, retrying...');
            setTimeout(initializeNavigation, 200);
            return;
        }

        console.log('Navigation bar found, setting up buttons...');

        // Check if navigation menu is empty and render if needed
        const sidebarMenu = document.getElementById('sidebarMenu');
        if (sidebarMenu && sidebarMenu.children.length === 0) {
            console.log('⚠️ Navigation menu is empty during initialization, rendering default');
            // Check for stored model type
            const storedUploadedData = localStorage.getItem('uploadedData');
            let modelType = 'ehr'; // Default
            if (storedUploadedData) {
                try {
                    const data = JSON.parse(storedUploadedData);
                    modelType = data.selected_model_type || data.detected_type || 'ehr';
                    console.log('  Found stored model type:', modelType);
                } catch (e) {
                    console.error('Error parsing stored uploadedData:', e);
                }
            }
            if (window.renderNavigation) {
                window.renderNavigation(modelType);
                // Wait a bit for DOM to update before continuing
                setTimeout(() => {
                    // Continue with button setup below
                }, 100);
            }
        }

        const buttons = nav.querySelectorAll('.nav-item[data-step]');
        console.log('Found', buttons.length, 'navigation buttons');

        if (buttons.length === 0) {
            console.warn('⚠️ No navigation buttons found after rendering attempt');
            // Try again after a delay
            setTimeout(() => {
                initializeNavigation();
            }, 200);
            return;
        }

        // Attach event listeners to all navigation buttons (only once per initialization)
        if (!nav.hasAttribute('data-initialized')) {
            attachNavigationListeners();
        }

        // Set active step
        if (window.pendingNavStep) {
            console.log('Setting pending nav step:', window.pendingNavStep);
            window.setActiveStep(window.pendingNavStep);
            window.pendingNavStep = null;
        } else if (window.currentNavStep) {
            console.log('Setting current nav step:', window.currentNavStep);
            window.setActiveStep(window.currentNavStep);
        } else {
            // Always default to upload tab on initial load
            // User can navigate to other tabs after uploading
            console.log('Setting default nav step: upload (always start here)');
            window.setActiveStep('upload');
            showUploadLanding();
        }

        // Refresh availability after a short delay to ensure data is loaded
        // This is important because data might be loading asynchronously
        if (window.refreshNavigationAvailability) {
            // Immediate refresh
            window.refreshNavigationAvailability();

            // Also refresh after delays to catch async data loading
            setTimeout(() => {
                if (window.refreshNavigationAvailability) {
                    window.refreshNavigationAvailability();
                }
            }, 100);
            setTimeout(() => {
                if (window.refreshNavigationAvailability) {
                    window.refreshNavigationAvailability();
                }
            }, 500);
        }

        console.log('Navigation initialization complete');
    }

    // Initialize when DOM is ready - use multiple strategies to ensure it works
    function tryInitializeNavigation() {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initializeNavigation();
        } else {
            document.addEventListener('DOMContentLoaded', initializeNavigation);
        }
    }

    // Initialize navigation on page load
    // First, check user's selected model type, then uploaded data
    function initializeNavigationWithModelType() {
        // PRIORITY 1: Check if user has selected a model type (even if not uploaded yet)
        const userSelectedType = localStorage.getItem('selectedModelType');

        // PRIORITY 2: Check uploaded data
        const storedUploadedData = localStorage.getItem('uploadedData');
        let uploadedModelType = null;
        if (storedUploadedData) {
            try {
                const data = JSON.parse(storedUploadedData);
                uploadedModelType = data.selected_model_type || data.detected_type;
            } catch (e) {
                console.error('Error parsing stored uploadedData:', e);
            }
        }

        // Use user's selection FIRST, then uploaded data, then default to 'ehr'
        const modelType = userSelectedType || uploadedModelType || 'ehr';

        console.log('🔄 Initializing navigation with model type:', {
            userSelectedType: userSelectedType,
            uploadedModelType: uploadedModelType,
            finalModelType: modelType
        });

        // Render navigation based on model type
        if (window.renderNavigation) {
            window.renderNavigation(modelType);

            // CRITICAL: After rendering, refresh availability to ensure buttons are disabled if no dataset
            // Use multiple timeouts to ensure DOM is ready
            setTimeout(() => {
                if (window.refreshNavigationAvailability) {
                    console.log('🔄 Refreshing navigation availability after initialization...');
                    window.refreshNavigationAvailability();
                }
            }, 150);

            setTimeout(() => {
                if (window.refreshNavigationAvailability) {
                    window.refreshNavigationAvailability();
                }
            }, 400);
        } else {
            // Fallback: render default navigation if renderNavigation not available yet
            console.warn('renderNavigation not available, using default navigation');
        }
    }

    // Try immediately and also on load
    tryInitializeNavigation();

    // Also initialize navigation rendering
    // Use a small delay to ensure all modules are loaded
    setTimeout(() => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initializeNavigationWithModelType();
        } else {
            document.addEventListener('DOMContentLoaded', initializeNavigationWithModelType);
        }
    }, 100);

    // Also try after a short delay as backup to ensure navigation is rendered and refreshed
    setTimeout(function () {
        const nav = document.getElementById('workflowNav');
        const sidebarMenu = document.getElementById('sidebarMenu');

        // If navigation exists but menu is empty, render it
        if (nav && sidebarMenu && sidebarMenu.children.length === 0) {
            console.log('Backup initialization triggered - rendering navigation');
            initializeNavigationWithModelType();
        }

        // Always refresh navigation availability to ensure buttons are in correct state
        if (window.refreshNavigationAvailability) {
            console.log('Backup: Refreshing navigation availability');
            window.refreshNavigationAvailability();
        }
    }, 800);

    // Final refresh after page is fully loaded
    setTimeout(function () {
        if (window.refreshNavigationAvailability) {
            console.log('Final refresh: Ensuring navigation buttons are in correct state');
            window.refreshNavigationAvailability();
        }
    }, 1500);

    // Centralized page visibility control
    window.hideAllSections = function () {
        const ids = [
            'uploadSection',
            'modelSelection',
            'dataViewer',
            'cleaningPage',
            'resamplePage',
            'featureEngineeringPage',
            'visualizationPage',
            'modelTrainingPage',
            'result'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            }
        });

        // Hide upload buttons - they should only be visible on upload tab
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
            uploadBtn.style.visibility = 'hidden';
        }

        const newUploadBtn = document.getElementById('newUploadBtn');
        if (newUploadBtn) {
            newUploadBtn.style.display = 'none';
            newUploadBtn.style.visibility = 'hidden';
        }

        // MAKE SURE SIDEBAR IS ALWAYS VISIBLE
        const sidebar = document.getElementById('workflowNav');
        if (sidebar) {
            sidebar.style.display = 'flex';
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
        }
    };

    console.log('Utils module loaded');
})();

