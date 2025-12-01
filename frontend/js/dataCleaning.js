// Data Cleaning Module - All data cleaning functionality
(function () {
    'use strict';

    // Ensure globals exist
    if (typeof window.allData === 'undefined') window.allData = [];
    if (typeof window.allColumns === 'undefined') window.allColumns = [];
    if (typeof window.currentVariableIndex === 'undefined') window.currentVariableIndex = 0;
    if (typeof window.variableData === 'undefined') window.variableData = null;
    if (typeof window.variableChanges === 'undefined') window.variableChanges = {};
    if (typeof window.dataModified === 'undefined') window.dataModified = false;
    if (typeof window.uploadedData === 'undefined') window.uploadedData = null;

    async function proceedToCleaning() {
        // Check if this is imaging data - data cleaning is not applicable for imaging
        if (window.isImagingData && window.isImagingData()) {
            alert('Data cleaning is only available for tabular/EHR data. For imaging data, please use the Label Management feature.');
            return;
        }

        if (window.hideAllSections) window.hideAllSections();
        // Hide all upload elements and data viewer, show only cleaning page
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const dataViewer = document.getElementById('dataViewer');
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const visualizationPage = document.getElementById('visualizationPage');
        const modelTrainingPage = document.getElementById('modelTrainingPage');
        const cleaningPage = document.getElementById('cleaningPage');
        const result = document.getElementById('result');
        const newUploadBtn = document.getElementById('newUploadBtn');
        const uploadBtn = document.getElementById('uploadBtn');

        // Force hide all sections except cleaning page
        if (uploadSection) {
            uploadSection.style.display = 'none';
            uploadSection.style.visibility = 'hidden';
        }
        if (modelSelection) {
            modelSelection.style.display = 'none';
            modelSelection.style.visibility = 'hidden';
        }
        if (dataViewer) {
            dataViewer.style.display = 'none';
            dataViewer.style.visibility = 'hidden';
        }
        if (featureEngineeringPage) {
            featureEngineeringPage.style.display = 'none';
            featureEngineeringPage.style.visibility = 'hidden';
        }
        if (visualizationPage) {
            visualizationPage.style.display = 'none';
            visualizationPage.style.visibility = 'hidden';
        }
        if (modelTrainingPage) {
            modelTrainingPage.style.display = 'none';
            modelTrainingPage.style.visibility = 'hidden';
        }
        if (result) {
            result.style.display = 'none';
            result.style.visibility = 'hidden';
        }

        // Hide ALL upload buttons - they should only be visible on upload tab
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
            uploadBtn.style.visibility = 'hidden';
        }
        if (newUploadBtn) {
            newUploadBtn.style.display = 'none';
            newUploadBtn.style.visibility = 'hidden';
        }
        if (cleaningPage) {
            cleaningPage.style.display = 'block';
            cleaningPage.style.visibility = 'visible';
        }

        if (window.setActiveStep) {
            window.setActiveStep('cleaning');
        }

        // Load the cleaning interface
        await loadCleaningInterface();
    }

    // Global variables for variable cleaning - all moved to frontend/js/config.js

    // Restore uploaded data from localStorage on page load
    // Restoration functions moved to frontend/js/dataManager.js

    // Test function for debugging feature creation
    window.testFeatureCreation = function () {
        console.log('Testing feature creation...');
        if (!window.createdFeatures || !Array.isArray(window.createdFeatures)) {
            window.createdFeatures = [];
        }

        // Add a test feature
        const testFeature = {
            type: 'rule_based',
            variable: 'test_var',
            operator: '>',
            value: '100',
            feature_name: 'test_feature',
            created_at: new Date().toISOString()
        };

        window.createdFeatures.push(testFeature);
        console.log('Added test feature:', testFeature);
        console.log('Total features:', window.createdFeatures.length);

        window.updateCreatedFeaturesDisplay();
        alert('Test feature added! Check the Created Features section.');
    };

    // Debug function to check current state
    window.debugCurrentState = function () {
        console.log('=== DEBUG CURRENT STATE ===');
        console.log('window.uploadedData:', window.uploadedData);
        console.log('window.allColumns:', window.allColumns);
        console.log('window.allData length:', window.allData ? window.allData.length : 'null');
        console.log('createdFeatures:', window.createdFeatures);
        if (window.allData && window.allData.length > 0) {
            console.log('Sample row keys:', Object.keys(window.allData[0]));
            console.log('Sample row data:', window.allData[0]);

            // Check if the yes column exists in the data
            if (window.allData[0].hasOwnProperty('yes')) {
                console.log('YES column exists in data!');
                console.log('First 10 values of yes column:', window.allData.slice(0, 10).map(row => row.yes));
            } else {
                console.log('YES column does NOT exist in data!');
            }
        }
        console.log('========================');
    };

    // Test function to create a new feature automatically
    window.testAutoFeature = function () {
        console.log('=== TESTING AUTOMATIC FEATURE CREATION ===');

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available');
            return;
        }

        // Create a simple test feature
        const featureName = 'test_auto_feature';
        const variable = 'Year of diagnosis';
        const operator = '>';
        const value = '2015';

        console.log(`Creating feature: ${variable} ${operator} ${value} -> ${featureName}`);

        // Check if feature already exists
        if (window.allColumns.includes(featureName)) {
            console.log('Feature already exists, removing it first...');
            const index = window.allColumns.indexOf(featureName);
            window.allColumns.splice(index, 1);
            window.allData.forEach(row => delete row[featureName]);
        }

        // Add to window.allColumns
        window.allColumns.push(featureName);

        // Call the calculation function
        window.calculateAndAddRuleBasedFeature(variable, operator, value, featureName);

        console.log('=== AUTOMATIC FEATURE CREATION COMPLETE ===');
    };

    // Function to force refresh Data Cleaning interface
    window.refreshDataCleaning = function () {
        console.log('=== FORCING DATA CLEANING REFRESH ===');
        console.log('Current window.allColumns:', window.allColumns);
        console.log('window.allColumns length:', window.allColumns.length);

        if (window.allColumns.length > 0) {
            window.currentVariableIndex = 0;
            window.displayCleaningInterface();
            console.log('Data Cleaning interface refreshed');
        } else {
            console.log('No columns available to refresh');
        }
    };

    // Function to force refresh all interfaces
    window.refreshAllInterfaces = function () {
        console.log('=== FORCING REFRESH OF ALL INTERFACES ===');
        console.log('Current window.allColumns:', window.allColumns);
        console.log('window.allColumns length:', window.allColumns.length);

        // Refresh Dataset Viewer if visible
        const dataViewer = document.getElementById('dataViewer');
        if (dataViewer && dataViewer.style.display !== 'none') {
            console.log('Refreshing Dataset Viewer...');
            if (window.allData && window.allData.length > 0) {
                const totalRows = window.allData.length;
                window.showPaginatedData(window.allColumns, totalRows, window.allColumns.length);
            }
        }

        // Refresh Data Cleaning if visible
        const cleaningPage = document.getElementById('cleaningPage');
        if (cleaningPage && cleaningPage.style.display !== 'none') {
            console.log('Refreshing Data Cleaning...');
            window.currentVariableIndex = 0;
            window.displayCleaningInterface();
        }

        console.log('All interfaces refreshed');
    };

    // Test function to manually add yes column data
    window.testAddYesColumn = function () {
        console.log('Manually adding yes column data...');
        if (!window.allData || window.allData.length === 0) {
            console.error('No data available');
            return;
        }

        window.allData.forEach((row, index) => {
            const histologicValue = row['Histologic Type ICD-O-3'];
            if (histologicValue && histologicValue !== '' && histologicValue !== 'nan') {
                const numericValue = parseFloat(histologicValue);
                if (!isNaN(numericValue)) {
                    row.yes = numericValue > 1 ? 1 : 0;
                } else {
                    row.yes = 0;
                }
            } else {
                row.yes = 0;
            }
        });

        console.log('Added yes column data to all rows');
        console.log('First 10 values:', window.allData.slice(0, 10).map(row => `${row['Histologic Type ICD-O-3']} -> ${row.yes}`));
    };

    // All restoration functions moved to frontend/js/dataManager.js
    // They are automatically called on page load by the module

    async function loadCleaningInterface() {
        // First, get the column information from the uploaded data
        if (!window.uploadedData || !window.uploadedData.file_ids || window.uploadedData.file_ids.length === 0) {
            alert('No data available for cleaning. Please upload a dataset first.');
            // Navigate back to viewer or upload page
            if (window.navigateToStep) {
                window.navigateToStep('viewer');
            } else if (window.showDataViewer && window.uploadedData) {
                window.showDataViewer(window.uploadedData);
            } else {
                if (window.setActiveStep) {
                    window.setActiveStep('upload');
                }
            }
            return;
        }

        // CRITICAL: Restore data from localStorage if not in memory
        // This ensures data is available even if user navigates directly to cleaning
        if (!window.allData || window.allData.length === 0) {
            console.log('⚠️ allData not in memory, attempting to restore from localStorage...');
            try {
                const savedAllData = localStorage.getItem('allData');
                if (savedAllData) {
                    window.allData = JSON.parse(savedAllData);
                    console.log('✅ Restored allData from localStorage, length:', window.allData.length);

                    // Also restore allColumns if available
                    const savedAllColumns = localStorage.getItem('allColumns');
                    if (savedAllColumns) {
                        window.allColumns = JSON.parse(savedAllColumns);
                        console.log('✅ Restored allColumns from localStorage:', window.allColumns.length, 'columns');
                    }

                    // Restore dataModified flag
                    const savedDataModified = localStorage.getItem('dataModified');
                    if (savedDataModified === 'true') {
                        window.dataModified = true;
                    }
                } else {
                    console.log('⚠️ No allData in localStorage, will load from backend');
                }
            } catch (error) {
                console.error('❌ Error restoring allData from localStorage:', error);
            }
        }

        // Initialize history if not already done
        if (window.allData && window.allData.length > 0) {
            initializeHistory();
        }

        // Show loading state
        const cleaningContent = document.getElementById('cleaningContent');
        cleaningContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 2rem; margin-bottom: 20px;">⏳</div>
            <h4 style="color: #1E40AF; margin-bottom: 15px;">Loading Dataset Information...</h4>
            <p style="color: #64748B;">Getting column data for cleaning...</p>
        </div>
    `;

        try {
            // Check if we have data in memory (either from localStorage or already loaded)
            if (window.allData && window.allData.length > 0) {
                console.log('✅ Using existing allData for cleaning interface');
                console.log('   allData length:', window.allData.length);
                console.log('   allColumns length:', window.allColumns ? window.allColumns.length : 0);

                // Ensure allColumns is set - if not, we need to fetch from backend
                if (!window.allColumns || window.allColumns.length === 0) {
                    console.log('⚠️ allColumns is empty, fetching from backend...');
                    try {
                        const fileId = window.uploadedData.file_ids[0];
                        // For column metadata, use preview (fast)
                        const response = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}`);
                        if (response.ok) {
                            const fileData = await response.json();
                            if (fileData.type === 'tabular' && fileData.columns) {
                                window.allColumns = fileData.columns;
                                console.log('✅ Loaded allColumns from backend:', window.allColumns.length);
                                // Save to localStorage
                                localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error fetching columns from backend:', error);
                    }
                }

                // CRITICAL: Recalculate all engineered features to ensure they're present
                if (window.recalculateAllEngineeredFeatures) {
                    console.log('Recalculating engineered features for cleaning interface...');
                    window.recalculateAllEngineeredFeatures();
                }

                // Save to localStorage to ensure persistence
                try {
                    const dataSize = JSON.stringify(window.allData).length;
                    if (dataSize <= 5 * 1024 * 1024) { // 5MB limit
                        localStorage.setItem('allData', JSON.stringify(window.allData));
                        console.log('✅ Saved allData to localStorage');
                    }
                } catch (e) {
                    console.warn('⚠️ Could not save allData to localStorage:', e);
                }

                if (window.allColumns && window.allColumns.length > 0) {
                    localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
                    console.log('✅ Saved allColumns to localStorage:', window.allColumns.length, 'columns');
                }

                window.currentVariableIndex = 0;
                window.displayCleaningInterface();
            } else {
                // Data not in memory or localStorage - MUST load from backend
                console.log('⚠️ allData not in memory or localStorage, loading from backend...');
                console.log('   uploadedData:', window.uploadedData);
                console.log('   file_ids:', window.uploadedData?.file_ids);

                if (!window.uploadedData || !window.uploadedData.file_ids || window.uploadedData.file_ids.length === 0) {
                    throw new Error('No file IDs available. Please upload a dataset first.');
                }

                const fileId = window.uploadedData.file_ids[0];
                console.log('   Loading data for data cleaning...');

                // Check if we already have full dataset in memory
                if (!window.allData || window.allData.length === 0 || !window.fullDatasetLoaded) {
                    console.log('   Fetching full dataset for data cleaning...');
                    const response = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}?full=true`);
                    console.log('   Response status:', response.status);

                    if (response.ok) {
                        const fileData = await response.json();
                        console.log('   File data type:', fileData.type);
                        console.log('   File data keys:', Object.keys(fileData));

                        if (fileData.type === 'tabular' && fileData.data && Array.isArray(fileData.data)) {
                            console.log('✅ Loading cleaning interface from backend...');
                            console.log('   Backend columns:', fileData.columns?.length || 0);
                            console.log('   Backend data rows:', fileData.data?.length || 0);

                            // Load fresh data from backend
                            window.allData = fileData.data;
                            window.totalDatasetRows = fileData.shape ? fileData.shape[0] : window.allData.length;
                            window.totalDatasetCols = fileData.shape ? fileData.shape[1] : (fileData.columns ? fileData.columns.length : 0);
                            window.fullDatasetLoaded = true;
                            console.log('✅ Loaded allData from backend, length:', window.allData.length);
                            console.log('   First row sample:', window.allData[0]);

                            // Initialize allColumns if not set, or keep existing if it has more columns (engineered features)
                            if (!window.allColumns || window.allColumns.length === 0) {
                                window.allColumns = fileData.columns || [];
                                console.log('✅ Initialized allColumns from backend:', window.allColumns.length);
                            } else {
                                console.log('✅ Keeping existing allColumns with engineered features:', window.allColumns.length);
                            }

                            // Save allData to localStorage
                            try {
                                const dataSize = JSON.stringify(window.allData).length;
                                if (dataSize <= 5 * 1024 * 1024) { // 5MB limit
                                    localStorage.setItem('allData', JSON.stringify(window.allData));
                                    console.log('✅ Saved allData to localStorage');
                                } else {
                                    console.warn('⚠️ allData too large for localStorage, skipping save');
                                }
                            } catch (error) {
                                console.error('❌ Error saving allData to localStorage:', error);
                            }

                            // CRITICAL: Recalculate all engineered features after loading fresh data
                            if (window.recalculateAllEngineeredFeatures) {
                                console.log('Recalculating engineered features for cleaning interface...');
                                window.recalculateAllEngineeredFeatures();
                            }

                            // Save allColumns to localStorage after features are recalculated
                            if (window.allColumns && window.allColumns.length > 0) {
                                localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
                                console.log('✅ Saved allColumns to localStorage:', window.allColumns.length, 'columns');
                            }

                            // Initialize history
                            if (window.allData && window.allData.length > 0) {
                                initializeHistory();
                            }

                            window.currentVariableIndex = 0;
                            window.displayCleaningInterface();
                        } else {
                            const errorMsg = fileData.type !== 'tabular'
                                ? 'Only tabular data can be cleaned. Your uploaded file is not a CSV/TSV file.'
                                : 'Failed to load data: Data is not in tabular format or is empty.';
                            console.error('❌', errorMsg);
                            alert(errorMsg);
                            if (window.navigateToStep) {
                                window.navigateToStep('viewer');
                            } else if (window.goBackToViewer) {
                                window.goBackToViewer();
                            }
                        }
                    } else {
                        const errorText = await response.text();
                        console.error('❌ Failed to load data from backend:', response.status, errorText);
                        console.error('   Full error details:', { status: response.status, statusText: response.statusText, body: errorText });

                        if (response.status === 404) {
                            throw new Error('File not found in backend. The uploaded file may have been lost. Please upload again.');
                        } else {
                            throw new Error(`Failed to load data from backend: ${response.status} ${errorText}`);
                        }
                    }
                } else {
                    // We already have full dataset in memory, just display the interface
                    console.log('✅ Using existing full dataset in memory:', window.allData.length, 'rows');
                    window.currentVariableIndex = 0;
                    window.displayCleaningInterface();
                }
            }
        } catch (error) {
            console.error('❌ Error loading cleaning interface:', error);
            cleaningContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <div style="font-size: 2rem; margin-bottom: 20px;">❌</div>
                <h4 style="color: #e53e3e; margin-bottom: 15px;">Error Loading Data</h4>
                <p style="color: #718096; margin-bottom: 20px;">${error.message}</p>
                <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
                    Please make sure you have uploaded a dataset and it's loaded correctly.
                </p>
                <button onclick="window.proceedToCleaning()" style="margin-top: 10px; padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
                <button onclick="window.navigateToStep && window.navigateToStep('viewer')" style="margin-top: 10px; margin-left: 10px; padding: 10px 20px; background: #718096; color: white; border: none; border-radius: 4px; cursor: pointer;">Go to Dataset Viewer</button>
            </div>
        `;
        }
    }

    function displayCleaningInterface() {
        const cleaningContent = document.getElementById('cleaningContent');

        cleaningContent.innerHTML = `
        <div style="display: flex; flex-direction: column; height: calc(100vh - 120px); gap: 10px; padding: 15px;">
            <!-- Horizontal Variable List -->
            <div style="background: linear-gradient(135deg, #F8FEFF 0%, #E8F8FF 100%); border: 2px solid #87CEEB; border-radius: 12px; padding: 15px;">
                <div style="margin-bottom: 10px;">
                    <h4 style="color: #1E40AF; font-size: 1.1rem; margin: 0;">Variables to Clean</h4>
                </div>
                <p style="color: #64748B; font-size: 0.85rem; margin-bottom: 10px;">
                    Click on any variable to start cleaning its values.
                </p>
                
                <div style="display: flex; gap: 8px; overflow-x: auto; padding: 5px 0; scrollbar-width: thin;">
                    ${window.allColumns.map((column, index) => `
                        <div id="variable-${index}" onclick="selectVariable(${index})" 
                             style="min-width: 160px; padding: 10px; border: 2px solid ${index === window.currentVariableIndex ? '#3B82F6' : '#E0F2FE'}; 
                                    border-radius: 8px; cursor: pointer; transition: all 0.3s ease; flex-shrink: 0;
                                    background: ${index === window.currentVariableIndex ? '#EBF8FF' : 'white'};
                                    ${index === window.currentVariableIndex ? 'box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);' : 'box-shadow: 0 1px 3px rgba(0,0,0,0.1);'}">
                            <div style="font-weight: 600; color: #1E40AF; margin-bottom: 4px; font-size: 0.8rem; line-height: 1.2;">
                                ${column}
                            </div>
                            <div style="font-size: 0.7rem; color: #64748B; margin-bottom: 6px;">
                                Variable ${index + 1} of ${window.allColumns.length}
                            </div>
                            <div>
                                <span class="sidebarVariableTypeBadge" style="background: #E0F2FE; color: #1E40AF; padding: 2px 6px; border-radius: 10px; font-size: 0.65rem; font-weight: 600;">
                                    CATEGORICAL
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
            </div>
            
            <!-- Main content area -->
            <div style="flex: 1; padding: 0; overflow: auto; background: white; min-width: 0; border-radius: 12px; border: 2px solid #E0F2FE;">
                <div id="variableContent" style="width: 100%; padding: 20px;">
                    <div style="text-align: center; padding: 60px 20px; color: #64748B;">
                        <h2 style="color: #1E40AF; margin-bottom: 15px; font-size: 1.8rem; font-weight: 700;">Select a Variable to Clean</h2>
                        <p style="font-size: 1rem; margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                            Click on any variable from the horizontal list above to start cleaning its values.
                        </p>
                        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 25px; max-width: 400px; margin: 0 auto;">
                            <h4 style="color: #374151; margin-bottom: 15px; font-size: 1rem; font-weight: 600;">Available Actions:</h4>
                            <div style="text-align: left; color: #6B7280; font-size: 0.9rem; line-height: 1.6;">
                                <div style="margin-bottom: 8px;">• Select/deselect values to include or exclude</div>
                                <div style="margin-bottom: 8px;">• Rename values for better clarity</div>
                                <div style="margin-bottom: 8px;">• Remove leading zeros (01 → 1, 02 → 2)</div>
                                <div style="margin-bottom: 8px;">• View real statistics from your dataset</div>
                                <div style="margin-bottom: 0;">• All variables default to categorical</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            </div>
            
        </div>
    `;
    }

    function selectVariable(index) {
        window.currentVariableIndex = index;
        updateSidebarSelection();
        loadCurrentVariable();
    }

    function updateSidebarSelection() {
        // Update the sidebar to show which variable is selected
        for (let i = 0; i < window.allColumns.length; i++) {
            const element = document.getElementById(`variable-${i}`);
            if (element) {
                if (i === window.currentVariableIndex) {
                    element.style.borderColor = '#3B82F6';
                    element.style.background = '#EBF8FF';
                    element.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                } else {
                    element.style.borderColor = '#E0F2FE';
                    element.style.background = 'white';
                    element.style.boxShadow = 'none';
                }
            }
        }
    }

    function loadCurrentVariable() {
        const currentColumn = window.allColumns[window.currentVariableIndex];

        if (!currentColumn) {
            alert('No column data available');
            return;
        }

        // Show loading state in the main content area
        const variableContent = document.getElementById('variableContent');
        variableContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 2rem; margin-bottom: 20px;">⏳</div>
            <h4 style="color: #1E40AF; margin-bottom: 15px;">Loading Variable Data...</h4>
            <p style="color: #64748B;">Analyzing ${currentColumn} values...</p>
        </div>
    `;

        // Fetch the actual data for this column to get value counts
        fetchColumnData(currentColumn);
    }

    async function fetchColumnData(column) {
        try {
            let columnData;

            // Check if we have saved changes for this variable
            if (window.variableChanges[column] && window.variableChanges[column].value_counts) {
                // Full saved data exists
                console.log('Loading saved changes for variable:', column);
                columnData = window.variableChanges[column];
            } else if (window.variableChanges[column] && window.variableChanges[column].variable_type) {
                // Only variable_type is saved, need to fetch fresh data but preserve the type
                console.log('Variable type preserved for:', column, 'type:', window.variableChanges[column].variable_type);
                // Fall through to calculate fresh data, then merge variable_type
                if (window.allData && window.allData.length > 0) {
                    columnData = window.calculateLocalColumnData(column);
                    // Merge in the preserved variable_type
                    columnData.variable_type = window.variableChanges[column].variable_type;
                    // Save the merged data back
                    window.variableChanges[column] = JSON.parse(JSON.stringify(columnData));
                    localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));
                } else {
                    // Fallback to backend
                    const fileId = window.uploadedData.file_ids[0];
                    const encodedColumn = encodeURIComponent(column);
                    const response = await fetch(`${window.API_BASE_URL || ""}/api/column-analysis/${fileId}?column_name=${encodedColumn}`);
                    if (response.ok) {
                        columnData = await response.json();
                        // Merge in the preserved variable_type
                        columnData.variable_type = window.variableChanges[column].variable_type;
                        // Save the merged data back
                        window.variableChanges[column] = JSON.parse(JSON.stringify(columnData));
                        localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));
                    } else {
                        throw new Error('Failed to fetch column data');
                    }
                }
            } else {
                // Check if this is an engineered feature (not in original backend columns)
                const originalColumns = window.uploadedData.original_columns || [];
                const isEngineeredFeature = !originalColumns.includes(column);

                if (window.allData && window.allData.length > 0) {
                    console.log('Calculating column data from window.allData for:', column);
                    // Always calculate from window.allData to get the latest changes
                    columnData = window.calculateLocalColumnData(column);
                } else {
                    // Fallback to backend only if window.allData is not available
                    const fileId = window.uploadedData.file_ids[0];
                    const encodedColumn = encodeURIComponent(column);

                    const response = await fetch(`${window.API_BASE_URL || ""}/api/column-analysis/${fileId}?column_name=${encodedColumn}`);

                    if (response.ok) {
                        columnData = await response.json();
                    } else {
                        throw new Error('Failed to fetch column data');
                    }
                }
            }

            displayVariableCleaning(column, columnData);
        } catch (error) {
            console.error('Error fetching column data:', error);
            const variableContent = document.getElementById('variableContent');
            variableContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #EF4444;">
                <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: #FEF2F2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h4 style="color: #1F2937; margin-bottom: 15px; font-weight: 600; font-size: 1.25rem;">Failed to Load Variable Data</h4>
                <p style="color: #6B7280; margin-bottom: 20px;">Error: ${error.message}</p>
                <button onclick="loadCurrentVariable()" style="background: #3B82F6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 0.875rem; transition: all 0.2s;" onmouseover="this.style.background='#2563EB';" onmouseout="this.style.background='#3B82F6';">
                    Try Again
                </button>
            </div>
        `;
        }
    }

    function displayVariableCleaning(column, columnData) {
        const variableContent = document.getElementById('variableContent');

        // Store the ORIGINAL column data (before any changes) so we can always show all labels
        if (!window.originalColumnData[column]) {
            window.originalColumnData[column] = JSON.parse(JSON.stringify(columnData));
            console.log(`Stored original column data for ${column}`);
        }

        // Merge original data with current state to show all labels
        // Use original as base, but update counts from current data
        const originalData = window.originalColumnData[column];
        const mergedData = {
            ...originalData,
            value_counts: originalData.value_counts.map(originalItem => {
                // Find matching item in current data
                const currentItem = columnData.value_counts.find(item =>
                    String(item.original_value) === String(originalItem.original_value)
                );

                // If found in current data, use current count; otherwise use 0 (excluded)
                return {
                    ...originalItem,
                    count: currentItem ? currentItem.count : 0,
                    value: currentItem ? currentItem.value : originalItem.value,
                    isNaN: currentItem ? (currentItem.isNaN || false) : false
                };
            })
        };

        // Store the column data globally for this variable
        window.variableData = mergedData;

        variableContent.innerHTML = `
        <div style="background: #fbfbfd; border: 1px solid #d2d2d7; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
            <h4 style="color: #1d1d1f; margin-bottom: 12px; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.01em;">Variable Cleaning</h4>
            <p style="color: #86868b; margin-bottom: 0; font-size: 0.9375rem;">
                Clean and preprocess each variable in your dataset. Select/deselect values, rename them, and remove leading zeros.
            </p>
        </div>

        <!-- Variable Navigation -->
        <div style="background: white; border: 1px solid #d2d2d7; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h3 style="color: #1d1d1f; margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em;">${column}</h3>
                    <p style="color: #86868b; margin: 8px 0 0 0; font-size: 0.9375rem;">
                        Variable ${window.currentVariableIndex + 1} of ${window.allColumns.length}
                    </p>
                </div>
                
                <div>
                    <span id="variableTypeBadge" style="background: #e8f0fe; color: #0071e3; padding: 8px 16px; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                        CATEGORICAL
                    </span>
                </div>
            </div>
        </div>

        <!-- Variable Stats -->
        <div style="background: white; border: 1px solid #d2d2d7; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
            <h5 style="color: #1d1d1f; margin-bottom: 16px; font-weight: 600;">Variable Statistics</h5>
            <div id="variableStatsContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px;">
                <div style="text-center p-3 bg-blue-50 rounded-lg">
                    <div id="totalValues" style="font-size: 1.5rem; font-weight: 600; color: #0071e3;">${columnData.total_values.toLocaleString()}</div>
                    <div style="font-size: 0.8125rem; color: #86868b;">Total Values</div>
                </div>
                <div style="text-center p-3 bg-green-50 rounded-lg">
                    <div id="uniqueValues" style="font-size: 1.5rem; font-weight: 600; color: #34c759;">${columnData.unique_values}</div>
                    <div style="font-size: 0.8125rem; color: #86868b;">Unique Values</div>
                </div>
                <div style="text-center p-3 bg-yellow-50 rounded-lg">
                    <div id="missingValues" style="font-size: 1.5rem; font-weight: 600; color: #ff9500;">${columnData.missing_count}</div>
                    <div style="font-size: 0.8125rem; color: #86868b;">Missing Values</div>
                </div>
            </div>
        </div>

        <!-- Bulk Actions -->
        <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
            <h5 style="color: #1F2937; margin-bottom: 16px; font-weight: 600; font-size: 1rem; letter-spacing: -0.01em;">Bulk Actions</h5>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="selectAllValues()" style="background: #3B82F6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#2563EB'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#3B82F6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                    Select All
                </button>
                <button onclick="deselectAllValues()" style="background: #6B7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#4B5563'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#6B7280'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                    Deselect All
                </button>
                <button onclick="removeLeadingZeros()" style="background: #F59E0B; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#D97706'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#F59E0B'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                    Remove Leading Zeros
                </button>
                <button onclick="combineSelectedLabels()" style="background: #8B5CF6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#7C3AED'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#8B5CF6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                    Combine Selected
                </button>
                <button onclick="setSelectedAsNaN()" style="background: #EF4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#DC2626'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#EF4444'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                    Set Selected as NaN
                </button>
                <button onclick="resetAllNames()" style="background: #6B7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#4B5563'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#6B7280'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                    Reset Names
                </button>
            </div>
        </div>

        <!-- Find and Replace -->
        <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h5 style="color: #1F2937; margin: 0; font-weight: 600; font-size: 1rem; letter-spacing: -0.01em;">Find and Replace</h5>
                <button onclick="toggleFindReplace()" style="background: #F3F4F6; color: #6B7280; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='#E5E7EB';" onmouseout="this.style.background='#F3F4F6';">
                    <span id="findReplaceToggle">−</span>
                </button>
            </div>
            
            <div id="findReplaceContent">
                <p style="color: #6B7280; font-size: 0.875rem; margin-bottom: 20px; line-height: 1.5;">
                    Replace text patterns across all values (e.g., "25 years" → "25", "Male" → "M")
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151; font-size: 0.875rem;">Find:</label>
                        <input type="text" id="findText" placeholder="e.g., ' years', 'Male', 'Female'" 
                               style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; background: white; font-size: 0.875rem; transition: all 0.2s;"
                               onfocus="this.style.borderColor='#3B82F6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)';"
                               onblur="this.style.borderColor='#D1D5DB'; this.style.boxShadow='none';">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151; font-size: 0.875rem;">Replace with:</label>
                        <input type="text" id="replaceText" placeholder="e.g., '', 'M', 'F'" 
                               style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; background: white; font-size: 0.875rem; transition: all 0.2s;"
                               onfocus="this.style.borderColor='#3B82F6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)';"
                               onblur="this.style.borderColor='#D1D5DB'; this.style.boxShadow='none';">
                    </div>
                </div>
                
                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; padding: 16px; background: #F9FAFB; border-radius: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px; color: #374151; font-size: 0.875rem; cursor: pointer;">
                        <input type="checkbox" id="caseSensitive" style="width: 16px; height: 16px; cursor: pointer; accent-color: #3B82F6;">
                        Case sensitive
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; color: #374151; font-size: 0.875rem; cursor: pointer;">
                        <input type="checkbox" id="wholeWord" style="width: 16px; height: 16px; cursor: pointer; accent-color: #3B82F6;">
                        Whole word only
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; color: #374151; font-size: 0.875rem; cursor: pointer;">
                        <input type="checkbox" id="previewMode" checked style="width: 16px; height: 16px; cursor: pointer; accent-color: #3B82F6;">
                        Preview changes first
                    </label>
                </div>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="performFindReplace()" style="background: #F59E0B; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#D97706'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#F59E0B'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                        Find & Replace
                    </button>
                    <button onclick="previewFindReplace()" style="background: #6B7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#4B5563'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#6B7280'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                        Preview
                    </button>
                    <button onclick="clearFindReplace()" style="background: #EF4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" onmouseover="this.style.background='#DC2626'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.background='#EF4444'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                        Clear
                    </button>
                </div>
                
                <!-- Preview Results -->
                <div id="findReplacePreview" style="display: none; margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #d2d2d7;">
                    <h6 style="color: #1d1d1f; margin-bottom: 12px; font-weight: 600;">Preview Changes:</h6>
                    <div id="previewResults"></div>
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button onclick="applyFindReplace()" style="background: #34c759; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 400; cursor: pointer; font-size: 0.875rem;" onmouseover="this.style.background='#30d158'" onmouseout="this.style.background='#34c759'">
                            Apply Changes
                        </button>
                        <button onclick="cancelFindReplace()" style="background: #86868b; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 400; cursor: pointer; font-size: 0.875rem;" onmouseover="this.style.background='#a1a1a6'" onmouseout="this.style.background='#86868b'">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Values List -->
        <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h5 style="color: #1F2937; margin: 0; font-weight: 600; font-size: 1.125rem; letter-spacing: -0.01em;">All Values</h5>
                <span style="background: #F3F4F6; color: #6B7280; padding: 6px 12px; border-radius: 12px; font-size: 0.8125rem; font-weight: 500;">${columnData.value_counts.length} unique</span>
            </div>
            
            <!-- Search Bar -->
            <div style="margin-bottom: 20px; position: relative;">
                <input type="text" id="valueSearch" placeholder="Search values..." 
                       style="width: 100%; padding: 12px 16px 12px 44px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.875rem; background: white; transition: all 0.2s;"
                       oninput="filterValues(this.value)"
                       onfocus="this.style.borderColor='#3B82F6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)';"
                       onblur="this.style.borderColor='#D1D5DB'; this.style.boxShadow='none';">
                <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9CA3AF; pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
            
            <div id="valuesContainer" style="max-height: 500px; overflow-y: auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; background: #F9FAFB;">
                ${columnData.value_counts.map((item, index) => {
            // Determine if this value is currently excluded (count is 0)
            const isExcluded = (item.count === 0);
            // CRITICAL: Preserve selection state - check both selected property and isNaN flag
            // Items marked as NaN should be selected by default
            const isChecked = item.selected !== false || item.isNaN === true || !isExcluded;

            return `
                    <div id="value-row-${index}" style="display: flex; align-items: center; padding: 16px; margin-bottom: 8px; border: 1px solid ${isExcluded ? '#FEE2E2' : '#E5E7EB'}; border-radius: 8px; background: ${isExcluded ? '#FEF2F2' : 'white'}; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); opacity: ${isExcluded ? '0.6' : '1'};" onmouseover="this.style.borderColor='#D1D5DB'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.08)';" onmouseout="this.style.borderColor='${isExcluded ? '#FEE2E2' : '#E5E7EB'}'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';">
                        <input type="checkbox" id="select-${index}" ${isChecked ? 'checked' : ''} onchange="updateValueSelection(${index})" 
                               style="margin-right: 16px; width: 18px; height: 18px; cursor: pointer; accent-color: #3B82F6;">
                        
                        <div style="flex: 1; margin-right: 16px;">
                            <div style="font-weight: 500; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; font-size: 0.875rem;">
                                <span>Original: <span style="background: #EFF6FF; color: #1E40AF; padding: 3px 8px; border-radius: 4px; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace; font-size: 0.8125rem; font-weight: 500;">${item.original_value}</span></span>
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                    <input type="checkbox" id="nan-${index}" onchange="toggleValueAsNaN(${index})" 
                                           ${item.isNaN ? 'checked' : ''}
                                           ${isExcluded ? 'disabled' : ''}
                                           style="width: 16px; height: 16px; cursor: ${isExcluded ? 'not-allowed' : 'pointer'}; accent-color: #F59E0B; opacity: ${isExcluded ? '0.5' : '1'};">
                                    <span style="font-size: 0.75rem; color: #F59E0B; font-weight: 500;">Mark as NaN</span>
                                </label>
                            </div>
                            <input type="text" id="name-${index}" value="${item.value || item.original_value}" onchange="updateValueName(${index})"
                                   ${isExcluded ? 'disabled' : ''}
                                   style="width: 100%; padding: 8px 12px; border: 1px solid ${item.isNaN ? '#FCD34D' : '#D1D5DB'}; border-radius: 6px; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace; font-size: 0.875rem; background: ${item.isNaN ? '#FFFBEB' : (isExcluded ? '#F9FAFB' : 'white')}; transition: all 0.2s; opacity: ${isExcluded ? '0.6' : '1'};"
                                   onfocus="this.style.borderColor='#3B82F6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)';"
                                   onblur="this.style.borderColor='${item.isNaN ? '#FCD34D' : '#D1D5DB'}'; this.style.boxShadow='none';">
                        </div>
                        
                        <div style="text-align: center; min-width: 80px;">
                            <div style="background: ${isExcluded ? '#6B7280' : '#3B82F6'}; color: white; padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; display: inline-block;">
                                ${item.count > 0 ? item.count.toLocaleString() : '0'}
                            </div>
                            <div style="font-size: 0.75rem; color: #6B7280; margin-top: 4px; font-weight: 500;">
                                ${isExcluded ? '(excluded)' : 'count'}
                            </div>
                        </div>
                    </div>
                `;
        }).join('')}
            </div>
        </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 32px; flex-wrap: wrap;">
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <button onclick="saveVariableChanges()" style="background: #34c759; color: white; border: none; padding: 12px 32px; border-radius: 22px; font-weight: 400; cursor: pointer; font-size: 1rem; transition: all 0.2s;" onmouseover="this.style.background='#30d158'; this.style.transform='scale(1.02)';" onmouseout="this.style.background='#34c759'; this.style.transform='scale(1)';">
                    Save Changes
                </button>
                <button id="variableTypeToggleBtn" onclick="toggleVariableType()" style="background: #fbfbfd; color: #0071e3; border: 1px solid #d2d2d7; padding: 12px 32px; border-radius: 22px; font-weight: 400; cursor: pointer; transition: all 0.2s; font-size: 1rem;" onmouseover="this.style.borderColor='#0071e3'; this.style.transform='scale(1.02)';" onmouseout="this.style.borderColor='#d2d2d7'; this.style.transform='scale(1)';">
                    Set as Continuous
                </button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button id="undoBtn" onclick="undoDatasetChange()" style="background: #fbfbfd; color: #0071e3; border: 1px solid #d2d2d7; padding: 12px 24px; border-radius: 22px; font-weight: 400; cursor: not-allowed; transition: all 0.2s; font-size: 0.95rem; opacity: 0.5; min-width: 100px;" disabled title="No changes to undo (Ctrl+Z)" onmouseover="if (!this.disabled) { this.style.borderColor='#0071e3'; this.style.transform='scale(1.02)'; }" onmouseout="if (!this.disabled) { this.style.borderColor='#d2d2d7'; this.style.transform='scale(1)'; }">
                    ↶ Undo
                </button>
                <button id="redoBtn" onclick="redoDatasetChange()" style="background: #fbfbfd; color: #0071e3; border: 1px solid #d2d2d7; padding: 12px 24px; border-radius: 22px; font-weight: 400; cursor: not-allowed; transition: all 0.2s; font-size: 0.95rem; opacity: 0.5; min-width: 100px;" disabled title="No changes to redo (Ctrl+Y)" onmouseover="if (!this.disabled) { this.style.borderColor='#0071e3'; this.style.transform='scale(1.02)'; }" onmouseout="if (!this.disabled) { this.style.borderColor='#d2d2d7'; this.style.transform='scale(1)'; }">
                    ↷ Redo
                </button>
            </div>
        </div>
    `;

        // Update the variable type badge and toggle button after displaying
        const savedType = window.variableChanges[columnData.column_name]?.variable_type || 'categorical';
        updateVariableTypeBadge(savedType);
        updateVariableTypeToggleButton(savedType);

        // Update all sidebar badges to reflect saved types
        window.updateAllSidebarBadges();

        // IMPORTANT: Update stats immediately after HTML is inserted to reflect actual checkbox states
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(function () {
            updateVariableStats();
            // Update undo/redo buttons
            updateUndoRedoButtons();
        }, 50);
    }

    function generateMockValueCounts(column) {
        // Generate realistic mock data based on column name
        const mockData = {
            'age': [
                { value: '25-34', count: 245 },
                { value: '35-44', count: 198 },
                { value: '45-54', count: 156 },
                { value: '55-64', count: 134 },
                { value: '18-24', count: 89 },
                { value: '65+', count: 67 }
            ],
            'gender': [
                { value: 'Female', count: 423 },
                { value: 'Male', count: 387 },
                { value: 'Other', count: 12 }
            ],
            'diagnosis': [
                { value: 'Hypertension', count: 156 },
                { value: 'Diabetes', count: 134 },
                { value: 'Heart Disease', count: 89 },
                { value: 'Asthma', count: 67 },
                { value: 'COPD', count: 45 },
                { value: 'Other', count: 329 }
            ],
            'medication': [
                { value: 'Metformin', count: 89 },
                { value: 'Lisinopril', count: 78 },
                { value: 'Atorvastatin', count: 67 },
                { value: 'Aspirin', count: 56 },
                { value: 'None', count: 234 }
            ]
        };

        // Return mock data for known columns, or generate generic data
        if (mockData[column.toLowerCase()]) {
            return mockData[column.toLowerCase()];
        }

        // Generate generic mock data
        return [
            { value: 'Value A', count: Math.floor(Math.random() * 200) + 100 },
            { value: 'Value B', count: Math.floor(Math.random() * 150) + 80 },
            { value: 'Value C', count: Math.floor(Math.random() * 120) + 60 },
            { value: 'Value D', count: Math.floor(Math.random() * 100) + 40 },
            { value: 'Value E', count: Math.floor(Math.random() * 80) + 20 }
        ];
    }

    function previousVariable() {
        if (window.currentVariableIndex > 0) {
            saveVariableChangesToMemory();
            window.currentVariableIndex--;
            loadCurrentVariable();
        }
    }

    function nextVariable() {
        if (window.currentVariableIndex < window.allColumns.length - 1) {
            saveVariableChangesToMemory();
            window.currentVariableIndex++;
            loadCurrentVariable();
        }
    }

    function updateValueSelection(index) {
        // Update the selection status for a value
        const checkbox = document.getElementById(`select-${index}`);
        const row = document.getElementById(`value-row-${index}`);
        const item = window.variableData.value_counts[index];

        // Track excluded status (unchecked = excluded)
        item.isExcluded = !checkbox.checked;

        if (checkbox.checked) {
            row.style.opacity = '1';
            row.style.backgroundColor = 'white';
            row.style.borderColor = '#E5E7EB';
        } else {
            row.style.opacity = '0.6';
            row.style.backgroundColor = '#FEF2F2';
            row.style.borderColor = '#FEE2E2';
        }

        // Update statistics immediately to reflect excluded rows
        updateVariableStats();

        // Save changes to memory
        saveVariableChangesToMemory();
    }

    function filterValues(searchTerm) {
        const container = document.getElementById('valuesContainer');
        const rows = container.querySelectorAll('[id^="value-row-"]');

        searchTerm = searchTerm.toLowerCase();

        rows.forEach((row, index) => {
            const valueText = window.variableData.value_counts[index].value.toLowerCase();
            const originalText = window.variableData.value_counts[index].original_value.toLowerCase();

            // Show row if search term matches current value or original value
            if (valueText.includes(searchTerm) || originalText.includes(searchTerm)) {
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function updateValueName(index) {
        // Update the name of a value
        const input = document.getElementById(`name-${index}`);
        window.variableData.value_counts[index].value = input.value;

        // Update statistics
        updateVariableStats();

        // Save changes to memory
        saveVariableChangesToMemory();
    }

    function toggleValueAsNaN(index) {
        // Toggle the NaN status for a value
        const checkbox = document.getElementById(`nan-${index}`);
        const input = document.getElementById(`name-${index}`);

        window.variableData.value_counts[index].isNaN = checkbox.checked;

        // Update the input styling to show NaN status
        if (checkbox.checked) {
            input.style.borderColor = '#ff9500';
            input.style.background = '#fff8f0';
        } else {
            input.style.borderColor = '#87CEEB';
            input.style.background = 'white';
        }

        // Update statistics
        updateVariableStats();

        // Save changes to memory
        saveVariableChangesToMemory();
    }

    function selectAllValues() {
        // Select all values
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            if (checkbox) {
                checkbox.checked = true;
                updateValueSelection(i);
            }
        }
    }

    function deselectAllValues() {
        // Deselect all values
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            if (checkbox) {
                checkbox.checked = false;
                updateValueSelection(i);
            }
        }
    }

    function removeLeadingZeros() {
        if (!window.variableData || !window.variableData.value_counts || window.variableData.value_counts.length === 0) {
            alert('No data available for leading zero removal');
            return;
        }

        // First check if there are any values with leading zeros (multi-character)
        let hasLeadingZeros = false;
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const originalValue = window.variableData.value_counts[i].value;
            if (/^0+/.test(originalValue) && originalValue.length > 1) {
                hasLeadingZeros = true;
                break;
            }
        }

        // If no leading zeros found, don't do anything
        if (!hasLeadingZeros) {
            return;
        }

        // Create a backup of the original data
        const originalData = JSON.parse(JSON.stringify(window.variableData.value_counts));

        // Remove leading zeros from all values and combine duplicates
        let updatedCount = 0;
        const valueMap = new Map();

        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const item = window.variableData.value_counts[i];
            const originalValue = item.value;
            let newValue = originalValue;

            // Get the actual checkbox state from the UI
            const checkbox = document.getElementById(`select-${i}`);
            const isSelected = checkbox ? checkbox.checked : false;

            // Check if value starts with 0 and has multiple characters
            if (/^0+/.test(originalValue) && originalValue.length > 1) {
                // Remove all leading zeros, but keep at least one character
                newValue = originalValue.replace(/^0+/, '') || '0';
                updatedCount++;
            }

            // Use the exact newValue as the key to avoid case issues
            if (valueMap.has(newValue)) {
                // Combine counts and preserve selection state
                const existing = valueMap.get(newValue);
                existing.count += item.count;
                existing.selected = existing.selected || isSelected;
            } else {
                // Create new entry
                valueMap.set(newValue, {
                    value: newValue,
                    count: item.count,
                    original_value: item.original_value || originalValue,
                    selected: isSelected
                });
            }
        }

        // Convert map back to array
        const newValueCounts = Array.from(valueMap.values());

        // Validate the new data before applying
        if (newValueCounts.length === 0) {
            window.variableData.value_counts = originalData;
            alert('Error: All values were lost during processing. Changes have been reverted.');
            return;
        }

        // Apply the changes
        window.variableData.value_counts = newValueCounts;

        // Re-display the interface to show the updated values
        displayVariableCleaning(window.variableData.column_name, window.variableData);

        // Update statistics
        updateVariableStats();

        // Save changes to memory
        saveVariableChangesToMemory();
    }

    function resetAllNames() {
        // Reset all names to original values
        if (confirm('Are you sure you want to reset all names to their original values?')) {
            for (let i = 0; i < window.variableData.value_counts.length; i++) {
                const item = window.variableData.value_counts[i];
                item.value = item.original_value;

                // Update the input field
                const input = document.getElementById(`name-${i}`);
                if (input) {
                    input.value = item.original_value;
                }
            }

            // Update statistics
            updateVariableStats();

            // Save changes to memory
            saveVariableChangesToMemory();

            // Silently complete the operation - no popup unless there's an error
        }
    }

    function combineSelectedLabels() {
        // Get all selected values by checking checkboxes
        const selectedValues = [];
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            if (checkbox && checkbox.checked) {
                selectedValues.push({
                    index: i,
                    value: window.variableData.value_counts[i].value,
                    count: window.variableData.value_counts[i].count
                });
            }
        }

        if (selectedValues.length < 2) {
            alert('Please select at least 2 values to combine.');
            return;
        }

        // Show dialog to enter new combined name
        const valueList = selectedValues.map(v => `${v.value} (${v.count} occurrences)`).join('\n');
        const combinedName = prompt(
            `You have selected ${selectedValues.length} values:\n\n${valueList}\n\nEnter the name for the combined value (you can use any name you want):`,
            selectedValues[0].value
        );

        if (combinedName === null || combinedName.trim() === '') {
            return; // User cancelled or entered empty name
        }

        const newCombinedName = combinedName.trim();

        // Calculate total count of all selected values
        const totalCount = selectedValues.reduce((sum, v) => sum + v.count, 0);

        // Get all original values that will be replaced (use original_value if available)
        const originalValuesToReplace = selectedValues.map(v => {
            const item = window.variableData.value_counts[v.index];
            return item.original_value || item.value;
        });
        const currentValuesToReplace = selectedValues.map(v => v.value);

        // Update the dataset - replace all selected values with the new combined name
        const currentColumn = window.variableData.column_name;
        if (window.allData && window.allData.length > 0) {
            let updatedCount = 0;
            window.allData.forEach(row => {
                const cellValue = String(row[currentColumn]);
                // Check both original values and current values to catch any renamed values
                if (originalValuesToReplace.includes(cellValue) || currentValuesToReplace.includes(cellValue)) {
                    row[currentColumn] = newCombinedName;
                    updatedCount++;
                }
            });
            console.log(`Updated ${updatedCount} rows with combined value "${newCombinedName}"`);

            // Mark data as modified
            window.dataModified = true;
            try {
                localStorage.setItem('window.dataModified', 'true');
            } catch (error) {
                console.error('Error saving window.dataModified:', error);
            }
        }

        // Create a new value_counts array with the combined value
        const newValueCounts = [];
        const originalValueKeys = new Set(originalValuesToReplace);

        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            const item = window.variableData.value_counts[i];

            if (!checkbox || !checkbox.checked) {
                // Keep non-selected values
                newValueCounts.push(item);
            }
            // Skip selected values - they're being combined
        }

        // Add the new combined value
        newValueCounts.push({
            value: newCombinedName,
            original_value: originalValuesToReplace[0], // Keep first original for reference
            count: totalCount,
            selected: true,
            isNaN: false
        });

        // Sort by count descending
        newValueCounts.sort((a, b) => b.count - a.count);

        // Update the data
        window.variableData.value_counts = newValueCounts;

        // Clear cached variable data so it recalculates from updated window.allData
        if (currentColumn && window.variableChanges[currentColumn]) {
            delete window.variableChanges[currentColumn];
            localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));
        }

        // Re-display the interface
        displayVariableCleaning(window.variableData.column_name, window.variableData);

        // Update statistics
        updateVariableStats();

        // Save changes to memory
        saveVariableChangesToMemory();

        // Silently complete the operation - no popup unless there's an error
    }

    function setSelectedAsNaN() {
        // Get all selected values by checking checkboxes
        const selectedValues = [];
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            if (checkbox && checkbox.checked) {
                selectedValues.push(window.variableData.value_counts[i]);
            }
        }

        if (selectedValues.length === 0) {
            alert('Please select at least one value to set as NaN.');
            return;
        }

        if (!confirm(`Set ${selectedValues.length} selected value(s) as NaN/Missing?\n\nThis will mark these values as missing data.`)) {
            return;
        }

        // Calculate total count of all selected values
        const totalCount = selectedValues.reduce((sum, v) => sum + v.count, 0);

        // Check if there's already a NaN entry
        let existingNaNIndex = -1;
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            if (window.variableData.value_counts[i].value === 'Missing/NaN' ||
                window.variableData.value_counts[i].value.toLowerCase().includes('missing') ||
                window.variableData.value_counts[i].value.toLowerCase().includes('nan')) {
                existingNaNIndex = i;
                break;
            }
        }

        // Create new array without selected values (check checkboxes)
        const newValueCounts = [];
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            if (!checkbox || !checkbox.checked) {
                newValueCounts.push(window.variableData.value_counts[i]);
            }
        }

        if (existingNaNIndex !== -1) {
            // Find the NaN entry in the new array and update its count
            for (let i = 0; i < newValueCounts.length; i++) {
                if (newValueCounts[i].value === 'Missing/NaN' ||
                    newValueCounts[i].value.toLowerCase().includes('missing') ||
                    newValueCounts[i].value.toLowerCase().includes('nan')) {
                    newValueCounts[i].count += totalCount;
                    newValueCounts[i].selected = true;
                    newValueCounts[i].isNaN = true;  // CRITICAL: Ensure isNaN flag is set
                    break;
                }
            }
        } else {
            // Create a new NaN entry
            const nanEntry = {
                value: 'Missing/NaN',
                count: totalCount,
                original_value: 'Missing/NaN',
                selected: true,
                isNaN: true  // CRITICAL: Mark as NaN
            };
            newValueCounts.unshift(nanEntry); // Add NaN at the beginning
        }

        // Update the data
        window.variableData.value_counts = newValueCounts;

        // CRITICAL: Apply NaN values to dataset immediately
        const currentColumn = window.variableData.column_name;
        applyNaNValuesToDataset(currentColumn);

        // Re-display the interface
        displayVariableCleaning(window.variableData.column_name, window.variableData);

        // Update statistics
        updateVariableStats();

        // Save changes to memory
        saveVariableChangesToMemory();

        // Silently complete the operation - no popup unless there's an error
    }

    function saveVariableChangesToMemory() {
        // Save current variable data to memory so changes persist
        const currentColumn = window.allColumns[window.currentVariableIndex];
        if (currentColumn && window.variableData) {
            // Deep copy the current state
            const savedState = JSON.parse(JSON.stringify(window.variableData));

            // Preserve the variable_type if it was previously set
            if (window.variableChanges[currentColumn] && window.variableChanges[currentColumn].variable_type) {
                savedState.variable_type = window.variableChanges[currentColumn].variable_type;
                console.log(`Preserving variable_type: ${savedState.variable_type} for column ${currentColumn}`);
            }

            window.variableChanges[currentColumn] = savedState;

            // Save variable changes to localStorage
            localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));

            console.log('Saved changes to memory and localStorage for:', currentColumn);
        }
    }

    function showVariableTypeSelection() {
        if (!window.variableData) return;

        // Check if all selected values are numeric
        const selectedValues = window.variableData.value_counts.filter((item, index) => {
            const checkbox = document.getElementById(`select-${index}`);
            return checkbox && checkbox.checked;
        });

        const allNumeric = selectedValues.every(item => {
            const value = item.value.trim();
            return !isNaN(value) && !isNaN(parseFloat(value)) && isFinite(value);
        });

        // Create modal for variable type selection
        const modal = document.createElement('div');
        modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
        align-items: center; z-index: 1000;
    `;

        modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 16px; max-width: 500px; width: 90%;">
            <h3 style="color: #1E40AF; margin-bottom: 20px; text-align: center;">Set Variable Type</h3>
            <p style="color: #64748B; margin-bottom: 20px; text-align: center;">
                Variable: <strong>${window.variableData.column_name}</strong>
            </p>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #374151;">
                    <input type="radio" name="variableType" value="categorical" checked style="margin-right: 8px;">
                    📋 Categorical - For categories, labels, or discrete values
                </label>
                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #374151;">
                    <input type="radio" name="variableType" value="continuous" ${!allNumeric ? 'disabled' : ''} style="margin-right: 8px;">
                    Continuous - For numeric values that can have decimals
                </label>
            </div>

            ${!allNumeric ? `
                <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                    <div style="color: #DC2626; font-weight: 600; margin-bottom: 5px;">Criteria Not Satisfied</div>
                    <div style="color: #7F1D1D; font-size: 0.9rem;">
                        Cannot set as continuous because some selected values are not numeric. 
                        Convert values to numeric format first.
                    </div>
                </div>
            ` : `
                <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                    <div style="color: #166534; font-weight: 600; margin-bottom: 5px;">Criteria Satisfied</div>
                    <div style="color: #14532D; font-size: 0.9rem;">
                        All selected values are numeric. You can set this as continuous.
                    </div>
                </div>
            `}

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="closeVariableTypeModal()" style="background: #6B7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="saveVariableType()" style="background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                    Save Type
                </button>
            </div>
        </div>
    `;

        document.body.appendChild(modal);
    }

    function closeVariableTypeModal() {
        const modal = document.querySelector('div[style*="position: fixed"]');
        if (modal) modal.remove();
    }

    function saveVariableType() {
        const modal = document.querySelector('div[style*="position: fixed"]');
        if (!modal) return;

        const selectedType = modal.querySelector('input[name="variableType"]:checked');
        if (!selectedType) {
            alert('Please select a variable type.');
            return;
        }

        const type = selectedType.value;
        const currentColumn = window.allColumns[window.currentVariableIndex];
        const currentType = window.variableChanges[currentColumn]?.variable_type || 'categorical';

        // If the type is the same, just close the modal
        if (type === currentType) {
            closeVariableTypeModal();
            return;
        }

        // Check if we can set as continuous (all selected values must be numeric)
        if (type === 'continuous') {
            const canBeContinuous = checkIfCanBeContinuous();
            if (!canBeContinuous) {
                alert('Cannot set as continuous: not all selected values are numeric.');
                return;
            }
        }

        // Save the variable type
        if (!window.variableChanges[currentColumn]) {
            window.variableChanges[currentColumn] = JSON.parse(JSON.stringify(window.variableData));
        }
        window.variableChanges[currentColumn].variable_type = type;

        // Convert data types in the actual dataset
        convertColumnDataType(currentColumn, type);

        // Save variable changes to localStorage
        localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));

        // Update the badge display
        updateVariableTypeBadge(type);

        // Update the toggle button
        updateVariableTypeToggleButton(type);

        // Update sidebar badges
        updateAllSidebarBadges();

        // Close the modal
        closeVariableTypeModal();
    }

    function toggleVariableType() {
        const currentColumn = window.allColumns[window.currentVariableIndex];
        const currentType = window.variableChanges[currentColumn]?.variable_type || 'categorical';
        const newType = currentType === 'categorical' ? 'continuous' : 'categorical';

        // Check if we can set as continuous (all selected values must be numeric or NaN)
        if (newType === 'continuous') {
            const canBeContinuous = checkIfCanBeContinuous();
            if (!canBeContinuous) {
                alert('Cannot set as continuous: not all selected values are numeric. Values marked as NaN are allowed (they will become null).');
                return;
            }
        }

        // Save current state to history for undo
        saveToHistory();

        // BEFORE converting to continuous, apply NaN values to the dataset
        // This ensures that values marked as NaN become null before type conversion
        if (newType === 'continuous') {
            console.log('Applying NaN values before converting to continuous...');
            applyNaNValuesToDataset(currentColumn);
        }

        // Save the variable type
        if (!window.variableChanges[currentColumn]) {
            window.variableChanges[currentColumn] = JSON.parse(JSON.stringify(window.variableData));
        }
        window.variableChanges[currentColumn].variable_type = newType;

        // Convert data types in the actual dataset
        convertColumnDataType(currentColumn, newType);

        // Save variable changes to localStorage
        localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));

        // Update the badge display
        updateVariableTypeBadge(newType);

        // Update the toggle button
        updateVariableTypeToggleButton(newType);

        // Update sidebar badges
        window.updateAllSidebarBadges();

        // Refresh the display to show updated values
        setTimeout(() => {
            loadCurrentVariable();
        }, 100);
    }

    function convertColumnDataType(columnName, newType) {
        console.log(`Converting column "${columnName}" to ${newType} type`);

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available for type conversion');
            return;
        }

        let convertedCount = 0;
        let invalidCount = 0;

        window.allData.forEach((row, index) => {
            const currentValue = row[columnName];

            if (currentValue === null || currentValue === undefined || currentValue === '') {
                // Keep null/empty values as null
                row[columnName] = null;
                return;
            }

            if (newType === 'continuous') {
                // Convert to numeric
                const numericValue = parseFloat(currentValue);
                if (!isNaN(numericValue)) {
                    // Determine if it should be integer or float
                    if (Number.isInteger(numericValue)) {
                        row[columnName] = parseInt(currentValue);
                    } else {
                        row[columnName] = numericValue;
                    }
                    convertedCount++;
                } else {
                    // Keep as string if can't convert
                    row[columnName] = currentValue;
                    invalidCount++;
                }
            } else if (newType === 'categorical') {
                // Convert to string
                row[columnName] = String(currentValue);
                convertedCount++;
            }
        });

        console.log(`Converted ${convertedCount} values, ${invalidCount} invalid values`);
        console.log(`Sample converted values:`, window.allData.slice(0, 5).map(row => `${row[columnName]} (${typeof row[columnName]})`));

        // Update the global dataset reference
        if (window.originalDataset) {
            window.originalDataset = window.allData;
        }
    }

    function checkIfCanBeContinuous() {
        // Check if all selected values are numeric (or marked as NaN, which will become null)
        const valueCounts = window.variableData.value_counts || [];

        // Get checkboxes if available
        const selectedValues = valueCounts.filter((item, index) => {
            const checkbox = document.getElementById(`select-${index}`);
            // If checkboxes exist, use checkbox state; otherwise use item.selected
            if (checkbox !== null) {
                return checkbox.checked;
            }
            return item.selected !== false;
        });

        return selectedValues.every(item => {
            // If marked as NaN, allow it (it will become null)
            const nanCheckbox = document.getElementById(`nan-${valueCounts.indexOf(item)}`);
            const isMarkedAsNaN = item.isNaN || (nanCheckbox && nanCheckbox.checked);
            if (isMarkedAsNaN) {
                return true; // NaN values are allowed (they become null)
            }

            // Check if numeric
            const value = (item.value || item.original_value || '').toString().trim();
            return value === '' || (!isNaN(value) && !isNaN(parseFloat(value)));
        });
    }

    function updateVariableTypeToggleButton(variableType) {
        const toggleBtn = document.getElementById('variableTypeToggleBtn');
        if (!toggleBtn) return;

        if (variableType === 'continuous') {
            toggleBtn.textContent = 'Set as Categorical';
            toggleBtn.style.background = 'linear-gradient(135deg, #059669 0%, #10B981 100%)';
            toggleBtn.style.color = 'white';
            toggleBtn.style.border = '2px solid #10B981';
        } else {
            toggleBtn.textContent = 'Set as Continuous';
            toggleBtn.style.background = '#E0F2FE';
            toggleBtn.style.color = '#1E40AF';
            toggleBtn.style.border = '2px solid #B8E6FF';
        }
    }

    function updateVariableTypeBadge(variableType) {
        // Update the main badge
        const badge = document.getElementById('variableTypeBadge');
        if (badge) {
            if (variableType === 'continuous') {
                badge.textContent = 'CONTINUOUS';
                badge.style.background = 'linear-gradient(135deg, #059669 0%, #10B981 100%)';
                badge.style.color = 'white';
            } else {
                badge.textContent = 'CATEGORICAL';
                badge.style.background = '#E0F2FE';
                badge.style.color = '#1E40AF';
            }
        }

        // Update the sidebar badge for the current variable
        const currentColumn = window.allColumns[window.currentVariableIndex];
        updateSidebarBadge(currentColumn, variableType);
    }

    function updateSidebarBadge(columnName, variableType) {
        // Find the sidebar badge for this specific column
        const sidebarBadges = document.querySelectorAll('.sidebarVariableTypeBadge');
        const currentColumnIndex = window.allColumns.indexOf(columnName);

        if (currentColumnIndex >= 0 && sidebarBadges[currentColumnIndex]) {
            const sidebarBadge = sidebarBadges[currentColumnIndex];

            if (variableType === 'continuous') {
                sidebarBadge.textContent = 'CONTINUOUS';
                sidebarBadge.style.background = 'linear-gradient(135deg, #059669 0%, #10B981 100%)';
                sidebarBadge.style.color = 'white';
            } else {
                sidebarBadge.textContent = 'CATEGORICAL';
                sidebarBadge.style.background = '#E0F2FE';
                sidebarBadge.style.color = '#1E40AF';
            }
        }
    }

    function updateAllSidebarBadges() {
        // Update all sidebar badges based on saved variable types
        window.allColumns.forEach((columnName, index) => {
            const savedType = window.variableChanges[columnName]?.variable_type;
            if (savedType) {
                updateSidebarBadge(columnName, savedType);
            }
        });
    }


    function showFeatureEngineeringInterface() {
        // Hide all other elements and show only feature engineering page
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const dataViewer = document.getElementById('dataViewer');
        const cleaningPage = document.getElementById('cleaningPage');
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const visualizationPage = document.getElementById('visualizationPage');
        const result = document.getElementById('result');
        const newUploadBtn = document.getElementById('newUploadBtn');

        // Hide all sections except feature engineering
        if (uploadSection) {
            uploadSection.style.display = 'none';
            uploadSection.style.visibility = 'hidden';
        }
        if (modelSelection) {
            modelSelection.style.display = 'none';
            modelSelection.style.visibility = 'hidden';
        }
        if (dataViewer) {
            dataViewer.style.display = 'none';
            dataViewer.style.visibility = 'hidden';
        }
        if (cleaningPage) {
            cleaningPage.style.display = 'none';
            cleaningPage.style.visibility = 'hidden';
        }
        if (visualizationPage) {
            visualizationPage.style.display = 'none';
            visualizationPage.style.visibility = 'hidden';
        }
        if (result) {
            result.style.display = 'none';
            result.style.visibility = 'hidden';
        }
        if (newUploadBtn) {
            newUploadBtn.style.display = 'none';
            newUploadBtn.style.visibility = 'hidden';
        }
        if (featureEngineeringPage) {
            featureEngineeringPage.style.display = 'block';
            featureEngineeringPage.style.visibility = 'visible';
        }

        // Always re-initialize feature engineering interface to get latest variable types
        initializeFeatureEngineeringInterface();
    }

    async function initializeFeatureEngineeringInterface() {
        // Load current dataset data
        let currentColumns = [];
        if (window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0) {
            try {
                const fileId = window.uploadedData.file_ids[0];
                // Fetch full dataset to get all columns
                const response = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}?full=true`);
                if (response.ok) {
                    const fileData = await response.json();
                    if (fileData.type === 'tabular' && fileData.columns) {
                        currentColumns = fileData.columns;
                    }
                }
            } catch (error) {
                console.error('Error loading data for feature engineering:', error);
            }
        }

        // Get continuous variables for rule-based features
        const continuousVariables = currentColumns.filter(column =>
            window.variableChanges[column]?.variable_type === 'continuous'
        );

        // Create feature engineering interface
        const featureEngineeringHTML = `
        <div style="display: flex; height: 100vh;">
            <!-- Sidebar -->
            <div style="width: 300px; background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-right: 1px solid #E2E8F0; padding: 20px; overflow-y: auto;">
                <h3 style="color: #1E40AF; margin-bottom: 20px; font-weight: 700;">Feature Engineering</h3>
                
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #374151; margin-bottom: 15px; font-weight: 600;">Available Variables</h4>
                    <div id="availableVariables" style="space-y: 8px;">
                        ${currentColumns.map(column => {
            const varType = window.variableChanges[column]?.variable_type || 'categorical';
            const isContinuous = varType === 'continuous';
            return `
                            <div style="background: white; border: 1px solid ${isContinuous ? '#10B981' : '#E5E7EB'}; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                                <div style="font-weight: 600; color: #1F2937; font-size: 0.9rem;">${column}</div>
                                <div style="font-size: 0.8rem; color: ${isContinuous ? '#059669' : '#6B7280'}; font-weight: 600;">
                                    ${varType.toUpperCase()}
                                </div>
                            </div>
                            `;
        }).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h4 style="color: #374151; margin-bottom: 15px; font-weight: 600;">Created Features</h4>
                    <div id="createdFeatures" style="min-height: 100px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px;">
                        <p style="color: #9CA3AF; font-size: 0.9rem; text-align: center;">No features created yet</p>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div style="flex: 1; padding: 30px; overflow-y: auto;">
                <div style="max-width: 800px; margin: 0 auto;">
                    <h2 style="color: #1E40AF; margin-bottom: 30px; font-weight: 700;">Create New Features</h2>
                    
                    <!-- Rule-based Features -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                        <h3 style="color: #374151; margin-bottom: 20px; font-weight: 600;">Rule-Based Features (Binary: 0/1)</h3>
                        <p style="color: #6B7280; margin-bottom: 20px; font-size: 0.9rem;">
                            Create binary features based on conditions. Results will be 0 or 1 for each row.
                            <br><strong>Note:</strong> Only continuous variables can be used for rule-based features.
                        </p>
                        
                        ${continuousVariables.length > 0 ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: end; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 5px;">Variable</label>
                                <select id="ruleVariable" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                                    ${continuousVariables.map(column => `<option value="${column}">${column}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 5px;">Operator</label>
                                <select id="ruleOperator" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                                    <option value=">">Greater than (>)</option>
                                    <option value="<">Less than (<)</option>
                                    <option value="=">Equals (=)</option>
                                    <option value=">=">Greater or equal (>=)</option>
                                    <option value="<=">Less or equal (<=)</option>
                                    <option value="!=">Not equal (!=)</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 5px;">Value</label>
                                <input type="number" id="ruleValue" placeholder="e.g., 25" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;" step="any">
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 5px;">Feature Name</label>
                                <input type="text" id="ruleFeatureName" placeholder="e.g., age_over_25" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                            </div>
                            <div>
                                <button id="createRuleBtn" style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%;">
                                    Create
                                </button>
                            </div>
                        </div>
                        ` : `
                        <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                            <p style="color: #92400E; font-weight: 600; margin: 0;">
                                No continuous variables available for rule-based features.
                                <br>Go to Data Cleaning to set variables as continuous first.
                            </p>
                        </div>
                        `}
                    </div>

                    <!-- Column Combination -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                        <h3 style="color: #374151; margin-bottom: 20px; font-weight: 600;">Combine Columns</h3>
                        <p style="color: #6B7280; margin-bottom: 20px; font-size: 0.9rem;">
                            Combine two columns into a new feature. Non-missing values will be preserved.
                        </p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; align-items: end; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 5px;">Column A</label>
                                <select id="combineColumnA" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                                    ${currentColumns.map(column => `<option value="${column}">${column}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 5px;">Column B</label>
                                <select id="combineColumnB" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                                    ${currentColumns.map(column => `<option value="${column}">${column}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 5px;">Feature Name</label>
                                <input type="text" id="combineFeatureName" placeholder="e.g., combined_feature" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                            </div>
                            <div>
                                <button id="createCombinedBtn" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%;">
                                    Combine
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

        // Add to the feature engineering interface section
        const featureEngineeringContent = document.getElementById('featureEngineeringContent');
        if (featureEngineeringContent) {
            featureEngineeringContent.innerHTML = featureEngineeringHTML;

            // Attach event listeners to dynamically created buttons
            setTimeout(() => {
                const createRuleBtn = document.getElementById('createRuleBtn');
                const createCombineBtn = document.getElementById('createCombinedBtn');

                console.log('Looking for buttons:', { createRuleBtn, createCombineBtn });

                if (createRuleBtn) {
                    console.log('Attaching rule button listener');
                    createRuleBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Rule button clicked via event listener!');
                        createRuleBasedFeature();
                    });
                }
                if (createCombineBtn) {
                    console.log('Attaching combine button listener');
                    createCombineBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Combine button clicked via event listener!');
                        createCombinedFeature();
                    });
                }
            }, 300);
        }
    }

    function createRuleBasedFeature() {
        console.log('createRuleBasedFeature called');
        const variable = document.getElementById('ruleVariable').value;
        const operator = document.getElementById('ruleOperator').value;
        const value = document.getElementById('ruleValue').value;
        const featureName = document.getElementById('ruleFeatureName').value;

        if (!variable || !operator || !value || !featureName) {
            alert('Please fill in all fields for rule-based feature creation.');
            return;
        }

        // Check if feature name already exists
        if (window.allColumns.includes(featureName)) {
            alert('A feature with this name already exists. Please choose a different name.');
            return;
        }

        // Validate that the rule will produce meaningful results
        if (!validateRuleBasedFeature(variable, operator, value)) {
            return; // Validation failed, error message already shown
        }

        // Create the rule-based feature
        const feature = {
            type: 'rule_based',
            variable: variable,
            operator: operator,
            value: value,
            feature_name: featureName,
            created_at: new Date().toISOString()
        };

        // Add to created features
        if (!window.createdFeatures || !Array.isArray(window.createdFeatures)) {
            window.createdFeatures = [];
        }
        window.createdFeatures.push(feature);
        console.log('Added feature to window.createdFeatures:', feature);
        console.log('Total features now:', window.createdFeatures.length);

        // Save to localStorage
        localStorage.setItem('createdFeatures', JSON.stringify(window.createdFeatures));
        console.log('Saved createdFeatures to localStorage');

        // Add to window.allColumns
        window.allColumns.push(featureName);

        // Save window.allColumns to localStorage immediately
        localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
        console.log('Saved window.allColumns to localStorage after feature creation');

        // Calculate the actual feature values and add to dataset
        window.calculateAndAddRuleBasedFeature(variable, operator, value, featureName);

        // Update the interface
        console.log('Calling window.updateCreatedFeaturesDisplay...');
        window.updateCreatedFeaturesDisplay();
        updateAvailableVariablesDisplay();

        // Refresh cleaning interface if it's currently displayed
        refreshCleaningInterfaceIfVisible();

        // Refresh data viewer if it's currently displayed
        window.refreshDataViewerIfVisible();

        // Clear form
        document.getElementById('ruleValue').value = '';
        document.getElementById('ruleFeatureName').value = '';

        // Show success message and force update display
        alert(`Rule-based feature "${featureName}" created successfully!`);

        // Force a visual update
        setTimeout(() => {
            window.updateCreatedFeaturesDisplay();
        }, 100);
    }

    function createCombinedFeature() {
        console.log('createCombinedFeature called');
        const columnA = document.getElementById('combineColumnA').value;
        const columnB = document.getElementById('combineColumnB').value;
        const featureName = document.getElementById('combineFeatureName').value;

        if (!columnA || !columnB || !featureName) {
            alert('Please fill in all fields for column combination.');
            return;
        }

        if (columnA === columnB) {
            alert('Cannot combine a column with itself. Please select different columns.');
            return;
        }

        // Check if feature name already exists
        if (window.allColumns.includes(featureName)) {
            alert('A feature with this name already exists. Please choose a different name.');
            return;
        }

        // Validate that the columns can be safely combined
        if (!validateCombinedFeature(columnA, columnB)) {
            return; // Validation failed, error message already shown
        }

        // Create the combined feature
        const feature = {
            type: 'combined',
            column_a: columnA,
            column_b: columnB,
            feature_name: featureName,
            created_at: new Date().toISOString()
        };

        // Add to created features
        if (!window.createdFeatures || !Array.isArray(window.createdFeatures)) {
            window.createdFeatures = [];
        }
        window.createdFeatures.push(feature);

        // Save to localStorage
        localStorage.setItem('createdFeatures', JSON.stringify(window.createdFeatures));
        console.log('Saved createdFeatures to localStorage');

        // Add to window.allColumns
        window.allColumns.push(featureName);

        // Save window.allColumns to localStorage immediately
        localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
        console.log('Saved window.allColumns to localStorage after feature creation');

        // Calculate the actual combined feature values and add to dataset
        calculateAndAddCombinedFeature(columnA, columnB, featureName);

        // Update the interface
        window.updateCreatedFeaturesDisplay();
        updateAvailableVariablesDisplay();

        // Refresh cleaning interface if it's currently displayed
        refreshCleaningInterfaceIfVisible();

        // Refresh data viewer if it's currently displayed
        window.refreshDataViewerIfVisible();

        // Clear form
        document.getElementById('combineFeatureName').value = '';

        alert(`Combined feature "${featureName}" created successfully!`);
    }

    function updateCreatedFeaturesDisplay() {
        console.log('window.updateCreatedFeaturesDisplay called');
        const container = document.getElementById('createdFeatures');
        console.log('Container found:', container);
        console.log('Created features:', window.createdFeatures);

        if (!container) {
            console.log('No container found!');
            return;
        }

        if (!window.createdFeatures || window.createdFeatures.length === 0) {
            console.log('No features to display');
            container.innerHTML = '<p style="color: #9CA3AF; font-size: 0.9rem; text-align: center;">No features created yet</p>';
            return;
        }

        console.log('Rendering', window.createdFeatures.length, 'features');

        container.innerHTML = window.createdFeatures.map((feature, index) => `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #1F2937; font-size: 0.9rem;">${feature.feature_name}</div>
            <div style="font-size: 0.8rem; color: #6B7280;">
                ${feature.type === 'rule_based'
                ? `${feature.variable} ${feature.operator} ${feature.value}`
                : `${feature.column_a} + ${feature.column_b}`
            }
            </div>
            <div style="font-size: 0.7rem; color: #9CA3AF;">
                ${new Date(feature.created_at).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
    }

    function updateAvailableVariablesDisplay() {
        const container = document.getElementById('availableVariables');
        if (!container) return;

        container.innerHTML = window.allColumns.map(column => `
        <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #1F2937; font-size: 0.9rem;">${column}</div>
            <div style="font-size: 0.8rem; color: #6B7280;">
                ${window.variableChanges[column]?.variable_type || 'categorical'}
            </div>
        </div>
    `).join('');
    }

    function refreshCleaningInterfaceIfVisible() {
        // Check if cleaning interface is currently visible
        const cleaningPage = document.getElementById('cleaningPage');
        if (cleaningPage && cleaningPage.style.display !== 'none') {
            console.log('Refreshing cleaning interface with new columns...');
            // Re-render the variable list in the cleaning interface
            const variableListContainer = document.querySelector('#cleaningContent .variable-list');
            if (variableListContainer) {
                variableListContainer.innerHTML = window.allColumns.map((column, index) => `
                <div class="variable-card" onclick="selectVariable(${index})" style="min-width: 160px; padding: 10px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-weight: 600; color: #1F2937; font-size: 0.85rem; margin-bottom: 4px;">${column}</div>
                    <div style="font-size: 0.75rem; color: #6B7280;">
                        <span class="sidebarVariableTypeBadge" style="padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                            ${window.variableChanges[column]?.variable_type || 'categorical'}
                        </span>
                    </div>
                </div>
            `).join('');

                // Update sidebar badges
                window.updateAllSidebarBadges();
            }
        }
    }

    function refreshDataViewerIfVisible() {
        // Check if data viewer is currently visible
        const dataViewer = document.getElementById('dataViewer');
        if (dataViewer && dataViewer.style.display !== 'none') {
            console.log('Refreshing data viewer with new columns...');
            // Re-render the data table with updated columns
            if (window.allData && window.allData.length > 0) {
                const totalRows = window.allData.length;
                const totalCols = window.allColumns.length;
                window.showPaginatedData(window.allColumns, totalRows, totalCols);
            }
        }
    }

    function recalculateAllEngineeredFeatures() {
        console.log('=== RECALCULATING ALL ENGINEERED FEATURES ===');
        if (!window.createdFeatures || !Array.isArray(window.createdFeatures) || window.createdFeatures.length === 0) {
            console.log('No engineered features to recalculate');
            return;
        }

        console.log(`Recalculating ${window.createdFeatures.length} features...`);
        window.createdFeatures.forEach(feature => {
            if (feature.type === 'rule_based') {
                const variable = feature.variable || feature.feature_name;
                const operator = feature.operator;
                const value = feature.value;
                const featureName = feature.name || feature.feature_name;
                console.log(`Recalculating: ${variable} ${operator} ${value} -> ${featureName}`);
                window.calculateAndAddRuleBasedFeature(variable, operator, value, featureName);
            } else if (feature.type === 'combined') {
                const columnA = feature.columnA || feature.column_a;
                const columnB = feature.columnB || feature.column_b;
                const featureName = feature.name || feature.feature_name;
                console.log(`Recalculating combined: ${columnA} + ${columnB} -> ${featureName}`);
                calculateAndAddCombinedFeature(columnA, columnB, featureName);
            }
        });
        console.log('=== RECALCULATION COMPLETE ===');
    }

    function validateCombinedFeature(columnA, columnB) {
        console.log(`Validating combined feature: ${columnA} + ${columnB}`);

        if (!window.allData || window.allData.length === 0) {
            alert('No data available to validate feature. Please upload a dataset first.');
            return false;
        }

        // Check if both columns exist
        const availableColumns = Object.keys(window.allData[0]);
        if (!availableColumns.includes(columnA)) {
            alert(`Column "${columnA}" not found in the dataset. Please check the column name.`);
            return false;
        }
        if (!availableColumns.includes(columnB)) {
            alert(`Column "${columnB}" not found in the dataset. Please check the column name.`);
            return false;
        }

        // Helper function to check if a value is NaN/missing
        const isNaN = (val) => {
            return val === null || val === undefined || val === '' || val === 'nan' || val === 'NaN';
        };

        // Check for conflicts: rows where both values are valid but different
        let conflictCount = 0;
        let bothNaNCount = 0;
        let oneValidCount = 0;
        let bothMatchCount = 0;

        for (let i = 0; i < window.allData.length; i++) {
            const row = window.allData[i];
            const valueA = row[columnA];
            const valueB = row[columnB];

            const isValidA = !isNaN(valueA);
            const isValidB = !isNaN(valueB);

            if (isValidA && isValidB) {
                // Both values are valid
                if (String(valueA) === String(valueB)) {
                    bothMatchCount++;
                } else {
                    conflictCount++;
                }
            } else if (!isValidA && !isValidB) {
                // Both are NaN
                bothNaNCount++;
            } else {
                // One is valid, one is NaN - this is fine
                oneValidCount++;
            }
        }

        console.log(`Validation results: conflicts=${conflictCount}, bothNaN=${bothNaNCount}, oneValid=${oneValidCount}, bothMatch=${bothMatchCount}`);

        // If there are any conflicts where both values are valid but different, reject
        if (conflictCount > 0) {
            alert(`Cannot combine columns: Found ${conflictCount} row(s) where both columns have different valid values.\n\nCombined features can only be created when:\n- One value is missing and the other has a value, OR\n- Both values are missing, OR\n- Both values match exactly.\n\nThese columns have conflicting values and cannot be safely combined.`);
            return false;
        }

        // If all rows have both NaN, warn that the result will be all NaN
        if (bothNaNCount === window.allData.length && conflictCount === 0 && oneValidCount === 0 && bothMatchCount === 0) {
            if (!confirm(`Warning: Both columns "${columnA}" and "${columnB}" are completely empty.\n\nThis will create a feature with all missing values. Continue anyway?`)) {
                return false;
            }
        }

        return true;
    }

    function validateRuleBasedFeature(variable, operator, value) {
        console.log(`Validating rule-based feature: ${variable} ${operator} ${value}`);

        if (!window.allData || window.allData.length === 0) {
            alert('No data available to validate feature. Please upload a dataset first.');
            return false;
        }

        // Convert value to number for comparison
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            alert('Invalid numeric value for comparison. Please enter a valid number.');
            return false;
        }

        // Try to find the variable with case-insensitive matching
        let actualVariableName = variable;
        const availableColumns = Object.keys(window.allData[0]);
        const matchingColumn = availableColumns.find(col =>
            col.toLowerCase().includes(variable.toLowerCase()) ||
            variable.toLowerCase().includes(col.toLowerCase())
        );

        if (!matchingColumn) {
            alert(`Variable "${variable}" not found in the dataset. Please check the variable name.`);
            return false;
        }

        if (matchingColumn !== variable) {
            console.log(`Found matching column: ${matchingColumn} (was looking for: ${variable})`);
            actualVariableName = matchingColumn;
        }

        // Check a sample of values to predict the outcome
        let trueCount = 0;
        let falseCount = 0;
        let validCount = 0;

        window.allData.forEach((row, index) => {
            const cellValue = row[actualVariableName];

            if (cellValue !== null && cellValue !== undefined && cellValue !== '' && cellValue !== 'nan') {
                const cellNumeric = parseFloat(cellValue);

                if (!isNaN(cellNumeric)) {
                    validCount++;
                    // Perform the comparison
                    switch (operator) {
                        case '>':
                            if (cellNumeric > numericValue) trueCount++; else falseCount++;
                            break;
                        case '>=':
                            if (cellNumeric >= numericValue) trueCount++; else falseCount++;
                            break;
                        case '<':
                            if (cellNumeric < numericValue) trueCount++; else falseCount++;
                            break;
                        case '<=':
                            if (cellNumeric <= numericValue) trueCount++; else falseCount++;
                            break;
                        case '==':
                            if (cellNumeric === numericValue) trueCount++; else falseCount++;
                            break;
                        case '!=':
                            if (cellNumeric !== numericValue) trueCount++; else falseCount++;
                            break;
                    }
                }
            }
        });

        console.log(`Validation results: validCount=${validCount}, trueCount=${trueCount}, falseCount=${falseCount}`);

        // Warn if all values would be the same
        if (validCount > 0 && (trueCount === 0 || falseCount === 0)) {
            const result = trueCount > 0 ? 'true (1)' : 'false (0)';
            alert(`Warning: This rule would set ALL ${validCount} valid values to ${result}.\n\nThis feature would have no variation and may not be useful. Consider adjusting the rule or value.`);
            return false;
        }

        if (validCount === 0) {
            alert(`No valid numeric values found in "${actualVariableName}". Cannot create feature.`);
            return false;
        }

        return true;
    }

    function calculateAndAddRuleBasedFeature(variable, operator, value, featureName) {
        console.log(`Calculating rule-based feature: ${variable} ${operator} ${value} -> ${featureName}`);

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available to calculate feature');
            return;
        }

        console.log(`window.allData length: ${window.allData.length}`);
        console.log(`Sample row keys:`, Object.keys(window.allData[0]));

        // Convert value to number for comparison
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            console.error('Invalid numeric value for comparison');
            return;
        }

        console.log(`Looking for variable: ${variable}`);
        console.log(`First row has this variable:`, window.allData[0][variable]);
        console.log(`All available column names:`, Object.keys(window.allData[0]));

        // Try to find the variable with case-insensitive matching
        let actualVariableName = variable;
        const availableColumns = Object.keys(window.allData[0]);
        const matchingColumn = availableColumns.find(col =>
            col.toLowerCase().includes(variable.toLowerCase()) ||
            variable.toLowerCase().includes(col.toLowerCase())
        );

        if (matchingColumn && matchingColumn !== variable) {
            console.log(`Found matching column: ${matchingColumn} (was looking for: ${variable})`);
            actualVariableName = matchingColumn;
        }

        let calculatedCount = 0;
        let trueCount = 0;
        let falseCount = 0;
        let invalidCount = 0;

        // Calculate the feature values for each row
        window.allData.forEach((row, index) => {
            const cellValue = row[actualVariableName];
            let featureValue = 0; // Default to 0

            console.log(`Row ${index}: ${actualVariableName} = "${cellValue}" (type: ${typeof cellValue})`);

            if (cellValue !== null && cellValue !== undefined && cellValue !== '' && cellValue !== 'nan') {
                // Convert cell value to number
                const cellNumeric = parseFloat(cellValue);

                console.log(`Row ${index}: parsed value = ${cellNumeric} (isNaN: ${isNaN(cellNumeric)})`);

                if (!isNaN(cellNumeric)) {
                    // Perform the comparison
                    switch (operator) {
                        case '>':
                            featureValue = cellNumeric > numericValue ? 1 : 0;
                            break;
                        case '>=':
                            featureValue = cellNumeric >= numericValue ? 1 : 0;
                            break;
                        case '<':
                            featureValue = cellNumeric < numericValue ? 1 : 0;
                            break;
                        case '<=':
                            featureValue = cellNumeric <= numericValue ? 1 : 0;
                            break;
                        case '==':
                            featureValue = cellNumeric === numericValue ? 1 : 0;
                            break;
                        case '!=':
                            featureValue = cellNumeric !== numericValue ? 1 : 0;
                            break;
                        default:
                            featureValue = 0;
                    }
                    calculatedCount++;
                    if (featureValue === 1) trueCount++;
                    else falseCount++;

                    console.log(`Row ${index}: ${cellNumeric} ${operator} ${numericValue} = ${featureValue}`);
                } else {
                    invalidCount++;
                    console.log(`Row ${index}: Invalid numeric value: ${cellValue}`);
                }
            } else {
                invalidCount++;
                console.log(`Row ${index}: Empty/null value: ${cellValue}`);
            }

            // Add the calculated value to the row
            row[featureName] = featureValue;

            // Debug: verify the value was actually added
            if (index < 5) {
                console.log(`Row ${index}: Added ${featureName} = ${featureValue}, row now has:`, row[featureName]);
            }
        });

        console.log(`Successfully calculated feature ${featureName} for ${window.allData.length} rows`);
        console.log(`Calculated values: ${calculatedCount}, True (1): ${trueCount}, False (0): ${falseCount}, Invalid: ${invalidCount}`);
        console.log(`Sample calculated values:`, window.allData.slice(0, 5).map(row => row[featureName]));

        // Verify the data was actually added to the dataset
        const hasFeature = window.allData[0].hasOwnProperty(featureName);
        console.log(`Verification: Does first row have ${featureName}?`, hasFeature);
        if (hasFeature) {
            console.log(`Verification: First row ${featureName} value:`, window.allData[0][featureName]);
        }

        // Force a complete data refresh to ensure all references are updated
        console.log('Forcing data refresh...');

        // Update the global dataset reference
        if (window.originalDataset) {
            window.originalDataset = window.allData;
        }

        // Force refresh all interfaces that might be using the data
        setTimeout(() => {
            console.log('Post-calculation verification:');
            console.log('window.allData[0] has yes?', window.allData[0].hasOwnProperty(featureName));
            console.log('window.allData[0].yes value:', window.allData[0][featureName]);
        }, 100);
    }

    function calculateAndAddCombinedFeature(columnA, columnB, featureName) {
        console.log(`Calculating combined feature: ${columnA} + ${columnB} -> ${featureName}`);

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available to calculate combined feature');
            return;
        }

        // Calculate the combined feature values for each row
        window.allData.forEach((row, index) => {
            const valueA = row[columnA];
            const valueB = row[columnB];
            let combinedValue = null; // Default to null (missing)

            // Helper function to check if a value is NaN/missing
            const isNaN = (val) => {
                return val === null || val === undefined || val === '' || val === 'nan' || val === 'NaN';
            };

            const isValidA = !isNaN(valueA);
            const isValidB = !isNaN(valueB);

            // Logic: If one is valid and the other is NaN, use the valid one
            // If both are valid, they should match (validated earlier) - use either
            // If both are NaN, leave as null
            if (isValidA && !isValidB) {
                combinedValue = valueA;
            } else if (isValidB && !isValidA) {
                combinedValue = valueB;
            } else if (isValidA && isValidB) {
                // Both valid - use the first one (they should match per validation)
                combinedValue = valueA;
            } else {
                // Both are NaN - leave as null
                combinedValue = null;
            }

            // Add the combined value to the row
            row[featureName] = combinedValue;
        });

        console.log(`Successfully calculated combined feature ${featureName} for ${window.allData.length} rows`);

        // Update the global dataset reference
        if (window.originalDataset) {
            window.originalDataset = window.allData;
        }
    }

    function calculateLocalColumnData(column) {
        console.log(`Calculating local column data for: ${column}`);

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available for column calculation');
            return null;
        }

        // Count values for this column
        const valueCounts = {};
        let totalValues = 0;
        let missingValues = 0;

        // Debug: check first few rows for this column
        console.log(`Debug: First 5 rows for column ${column}:`);
        for (let i = 0; i < Math.min(5, window.allData.length); i++) {
            console.log(`Row ${i}: ${column} = "${window.allData[i][column]}" (type: ${typeof window.allData[i][column]})`);
        }

        window.allData.forEach(row => {
            const value = row[column];
            totalValues++;

            if (value === null || value === undefined || value === '') {
                missingValues++;
            } else {
                const stringValue = String(value);
                valueCounts[stringValue] = (valueCounts[stringValue] || 0) + 1;
            }
        });

        console.log(`Debug: Column ${column} statistics:`);
        console.log(`- Total values: ${totalValues}`);
        console.log(`- Missing values: ${missingValues}`);
        console.log(`- Unique values: ${Object.keys(valueCounts).length}`);
        console.log(`- Value counts:`, valueCounts);
        console.log(`- Sample values processed:`, Object.keys(valueCounts).slice(0, 10));

        // Convert to the format expected by the cleaning interface
        const value_counts = Object.entries(valueCounts).map(([value, count]) => ({
            value: value,
            original_value: value, // Store original value for reference
            count: count,
            selected: true, // All values selected by default
            isNaN: false // Track if marked as NaN
        })).sort((a, b) => b.count - a.count); // Sort by count descending

        // Determine the actual data type from the first non-null value
        let actualDataType = 'string'; // Default
        if (window.allData.length > 0) {
            for (let i = 0; i < window.allData.length; i++) {
                const value = window.allData[i][column];
                if (value !== null && value !== undefined && value !== '') {
                    actualDataType = typeof value;
                    break;
                }
            }
        }

        return {
            column_name: column,
            data_type: actualDataType,
            total_values: totalValues,
            unique_values: Object.keys(valueCounts).length,
            missing_values: missingValues,
            missing_count: missingValues, // Also include missing_count for compatibility
            value_counts: value_counts
        };
    }

    function goBackToDataViewer() {
        // Hide feature engineering page and show data viewer with upload section
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const cleaningPage = document.getElementById('cleaningPage');
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const dataViewer = document.getElementById('dataViewer');
        const result = document.getElementById('result');
        const newUploadBtn = document.getElementById('newUploadBtn');

        if (featureEngineeringPage) {
            featureEngineeringPage.style.display = 'none';
            featureEngineeringPage.style.visibility = 'hidden';
        }
        if (cleaningPage) {
            cleaningPage.style.display = 'none';
            cleaningPage.style.visibility = 'hidden';
        }
        if (uploadSection) {
            uploadSection.style.display = 'block';
            uploadSection.style.visibility = 'visible';
        }
        if (modelSelection) {
            modelSelection.style.display = 'block';
            modelSelection.style.visibility = 'visible';
        }
        if (dataViewer) {
            dataViewer.style.display = 'block';
            dataViewer.style.visibility = 'visible';
        }
        if (result) {
            result.style.display = 'block';
            result.style.visibility = 'visible';
        }
        if (newUploadBtn) {
            newUploadBtn.style.display = 'block';
            newUploadBtn.style.visibility = 'visible';
        }

        // Make sure data is still displayed if we have uploaded data
        if (window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0) {
            window.showDataViewer(window.uploadedData);

            // Refresh data viewer to show any new features
            setTimeout(() => {
                window.refreshDataViewerIfVisible();
            }, 100);
        }
    }

    function goBackToCleaning() {
        // Hide feature engineering page and show cleaning page only
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const dataViewer = document.getElementById('dataViewer');
        const cleaningPage = document.getElementById('cleaningPage');

        if (featureEngineeringPage) {
            featureEngineeringPage.style.display = 'none';
            featureEngineeringPage.style.visibility = 'hidden';
        }
        if (uploadSection) {
            uploadSection.style.display = 'none';
            uploadSection.style.visibility = 'hidden';
        }
        if (modelSelection) {
            modelSelection.style.display = 'none';
            modelSelection.style.visibility = 'hidden';
        }
        if (dataViewer) {
            dataViewer.style.display = 'none';
            dataViewer.style.visibility = 'hidden';
        }
        if (cleaningPage) {
            cleaningPage.style.display = 'block';
            cleaningPage.style.visibility = 'visible';
        }
    }

    // Model Training functions moved to js/modelTraining.js module
    // Function definitions preserved there for modularity

    /* Model Training functions now in js/modelTraining.js
    function initializeModelTrainingInterface() {
        const modelTrainingContent = document.getElementById('modelTrainingContent');

        if (!window.allData || window.allData.length === 0 || !window.allColumns || window.allColumns.length === 0) {
        modelTrainingContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748B;">
                <h4 style="color: #1E40AF; margin-bottom: 15px;">No Data Available</h4>
                <p style="font-size: 1rem; margin-bottom: 30px;">Please upload and prepare a dataset first.</p>
            </div>
        `;
        return;
        }

        // Get variable types for display
        const getVariableType = (column) => {
        return window.variableChanges[column]?.variable_type || 'categorical';
        };

        // Create model training interface
        const modelTrainingHTML = `
        <div style="display: flex; gap: 20px; padding: 20px; min-height: calc(100vh - 120px);">
            <!-- Left Sidebar: Feature Selection -->
            <div style="width: 350px; background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0;">
                <h3 style="color: #1E40AF; margin-bottom: 20px; font-weight: 700;">Feature Selection</h3>
                
                <!-- Label Selection -->
                <div style="margin-bottom: 30px;">
                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 10px; font-size: 0.95rem;">
                        Select Label (Target Variable)
                    </label>
                    <select id="labelSelection" onchange="handleLabelSelection(this.value)" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 10px; background: white; font-size: 0.95rem; cursor: pointer;">
                        <option value="">-- Select Label --</option>
                        ${window.allColumns.map(column => `<option value="${column}">${column}</option>`).join('')}
                    </select>
                </div>

                <!-- Feature Checkboxes -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <label style="font-weight: 600; color: #374151; font-size: 0.95rem;">Select Features</label>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="selectAllFeatures()" style="background: #0071e3; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">
                                Select All
                            </button>
                            <button onclick="deselectAllFeatures()" style="background: #86868b; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">
                                Deselect All
                            </button>
                        </div>
                    </div>
                    <div style="max-height: 500px; overflow-y: auto; background: white; border-radius: 10px; padding: 12px; border: 1px solid #E5E7EB;">
                        ${window.allColumns.map((column, index) => {
        const varType = getVariableType(column);
        const isContinuous = varType === 'continuous';
        return `
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.2s; margin-bottom: 4px;" 
                                       onmouseover="this.style.background='#F9FAFB'" 
                                       onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="feature-${index}" value="${column}" class="feature-checkbox" checked
                                           style="width: 18px; height: 18px; cursor: pointer; accent-color: #0071e3;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: #1F2937; font-size: 0.9rem; margin-bottom: 2px;">${column}</div>
                                        <div style="font-size: 0.75rem; color: ${isContinuous ? '#059669' : '#6B7280'}; font-weight: 600;">
                                            ${varType.toUpperCase()}
                                        </div>
                                    </div>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
                <!-- Action Buttons -->
                <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px;">
                    <h4 style="color: #1E40AF; margin-bottom: 20px; font-weight: 700;">Data Processing</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <button onclick="convertCategoricalToNumerical()" 
                                style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            Convert Categorical → Numerical
                        </button>
                        <button onclick="saveEmbeddings()" 
                                style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            Save Embeddings
                        </button>
                        <button onclick="saveProcessedDataset()" 
                                style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            Save Dataset
                        </button>
                        <button onclick="previewTrainingDataset()" 
                                style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            Preview Training Dataset
                        </button>
                    </div>
                </div>

                <!-- Dataset Viewer -->
                <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; flex: 1; min-height: 400px;">
                    <h4 style="color: #1E40AF; margin-bottom: 20px; font-weight: 700;">Training Dataset Preview</h4>
                    <div id="trainingDatasetViewer" style="min-height: 300px;">
                        <div style="text-align: center; padding: 60px 20px; color: #9CA3AF;">
                            <p style="font-size: 1.1rem;">Select features and label, then click "Preview Training Dataset" to see the processed data</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modelTrainingContent.innerHTML = modelTrainingHTML;
        }

    function selectAllFeatures() {
        document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.checked = true;
        });
        }

    function deselectAllFeatures() {
        document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.checked = false;
        });
        }

    function handleLabelSelection(labelValue) {
        // Uncheck the label from feature selection if it's selected
        if (labelValue) {
        document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
            if (checkbox.value === labelValue) {
                checkbox.checked = false;
            }
        });
        }
        }

    function convertCategoricalToNumerical() {
        if (!window.allData || window.allData.length === 0) {
        alert('No data available to convert');
        return;
        }

        // Get all categorical columns
        const categoricalColumns = window.allColumns.filter(column => {
        const varType = window.variableChanges[column]?.variable_type || 'categorical';
        return varType === 'categorical';
        });

        if (categoricalColumns.length === 0) {
        alert('No categorical variables to convert. All variables are already continuous.');
        return;
        }

        // Ask user for conversion method
        const method = confirm(
        `Convert ${categoricalColumns.length} categorical variable(s) to numerical?\n\n` +
        `Click OK for One-Hot Encoding (creates binary columns)\n` +
        `Click Cancel for Label Encoding (maps to integers)`
    ) ? 'onehot' : 'label';

    console.log(`Converting categorical variables using ${method} encoding...`);

    let conversionCount = 0;
        const newColumns = [];

    categoricalColumns.forEach(column => {
        // Get unique values
        const uniqueValues = new Set();
        window.allData.forEach(row => {
            const value = row[column];
            if (value !== null && value !== undefined && value !== '') {
                uniqueValues.add(String(value));
            }
        });

        if (method === 'onehot') {
            // One-hot encoding: create binary columns for each category
            const categories = Array.from(uniqueValues).sort();

            categories.forEach(category => {
                const newColumnName = `${column}_${category}`.replace(/[^a-zA-Z0-9_]/g, '_');
                newColumns.push(newColumnName);

                // Add new column to window.allColumns if not already there
                if (!window.allColumns.includes(newColumnName)) {
                    window.allColumns.push(newColumnName);
                }

                // Set values
                window.allData.forEach(row => {
                    const value = String(row[column] || '');
                    row[newColumnName] = (value === category) ? 1 : 0;
                });
            });

            // Mark original column as converted (could hide it or mark it)
            conversionCount += categories.length;
        } else {
            // Label encoding: map categories to integers
            const categories = Array.from(uniqueValues).sort();
            const labelMap = {};
            categories.forEach((cat, index) => {
                labelMap[cat] = index;
            });

            // Update the column in place
            window.allData.forEach(row => {
                const value = String(row[column] || '');
                row[column] = labelMap[value] !== undefined ? labelMap[value] : null;
            });

            // Update variable type to continuous
            if (!window.variableChanges[column]) {
                window.variableChanges[column] = {};
            }
            window.variableChanges[column].variable_type = 'continuous';
            conversionCount++;
        }
        });

        // Save updated columns to localStorage (with error handling for quota)
        try {
            localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
            localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));
            // Try to save allData, but don't fail if quota is exceeded
            try {
                localStorage.setItem('window.allData', JSON.stringify(window.allData));
            } catch (quotaError) {
                console.warn('Could not save allData to localStorage (quota exceeded). Data will remain in memory.');
            }
            window.dataModified = true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            window.dataModified = true;
        }

    alert(`Successfully converted ${conversionCount} categorical variable(s) using ${method === 'onehot' ? 'One-Hot Encoding' : 'Label Encoding'}.\n\n` +
        `${method === 'onehot' ? `Created ${newColumns.length} new binary columns.` : 'Updated columns to numerical values.'}`);

        // Refresh the interface
    initializeModelTrainingInterface();
    console.log('Categorical to numerical conversion complete');
        }

    function saveEmbeddings() {
        try {
        if (!window.allData || window.allData.length === 0) {
            alert('No data available to save embeddings.');
            return;
        }

        // Get selected features and label
        const label = document.getElementById('labelSelection')?.value || null;
        const selectedFeatures = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
            .map(cb => cb.value)
            .filter(feature => feature && feature !== label);

        if (selectedFeatures.length === 0) {
            alert('Please select at least one feature before saving embeddings.');
            return;
        }

        // Extract embeddings (feature vectors) for each row
        const embeddings = window.allData.map((row, index) => {
            const embedding = {
                row_id: index,
                features: {},
                feature_vector: []
            };

            // Extract feature values
            selectedFeatures.forEach(feature => {
                const value = row[feature];
                embedding.features[feature] = value;
                // Add to feature vector (convert to number)
                const numValue = parseFloat(value);
                embedding.feature_vector.push(isNaN(numValue) ? 0 : numValue);
            });

            // Include label if available
            if (label) {
                embedding.label = row[label];
            }

            return embedding;
        });

        // Create embeddings export object
        const embeddingsExport = {
            metadata: {
                exported_at: new Date().toISOString(),
                features: selectedFeatures,
                label: label || null,
                total_rows: embeddings.length,
                feature_dimension: selectedFeatures.length,
                embedding_format: 'feature_vector'
            },
            embeddings: embeddings,
            feature_names: selectedFeatures
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(embeddingsExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `embeddings_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Embeddings saved successfully!\n\nFeatures: ${selectedFeatures.length}\nRows: ${embeddings.length}\nDimension: ${selectedFeatures.length}`);
        console.log('Embeddings exported successfully', embeddingsExport);
        } catch (error) {
        console.error('Error saving embeddings:', error);
        alert('Error saving embeddings: ' + error.message);
        }
        }

    function saveProcessedDataset() {
        try {
        // Get selected features and label
        const label = document.getElementById('labelSelection')?.value || null;
        const selectedFeatures = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
            .map(cb => cb.value)
            .filter(feature => feature && feature !== label); // Remove empty values and label

        if (selectedFeatures.length === 0) {
            alert('Please select at least one feature to save.');
            return;
        }

        if (!label) {
            alert('Please select a label (target variable) before saving.');
            return;
        }

        // Create processed dataset with only selected features and label
        const processedData = window.allData.map(row => {
            const processedRow = {};
            // Include all selected features (excluding label)
            selectedFeatures.forEach(feature => {
                processedRow[feature] = row[feature];
            });
            // Include label separately
            processedRow[label] = row[label];
            return processedRow;
        });

        // Create export object
        const datasetExport = {
            metadata: {
                exported_at: new Date().toISOString(),
                features: selectedFeatures,
                label: label,
                total_rows: processedData.length,
                total_features: selectedFeatures.length
            },
            data: processedData,
            features: selectedFeatures,
            label: label
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(datasetExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `training_dataset_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Dataset saved successfully!\n\nFeatures: ${selectedFeatures.length}\nLabel: ${label}\nRows: ${processedData.length}`);
        console.log('Processed dataset exported successfully');
        } catch (error) {
        console.error('Error saving processed dataset:', error);
        alert('Error saving dataset: ' + error.message);
        }
        }

    function previewTrainingDataset() {
        const viewer = document.getElementById('trainingDatasetViewer');

        if (!viewer) {
        alert('Dataset viewer not found');
        return;
        }

        // Get selected features and label
        const label = document.getElementById('labelSelection')?.value || null;
        const selectedFeatures = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
        .map(cb => cb.value)
        .filter(feature => feature && feature !== label); // Exclude label from features

        if (selectedFeatures.length === 0) {
        viewer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #EF4444;">
                <h4>No Features Selected</h4>
                <p>Please select at least one feature to preview.</p>
            </div>
        `;
        return;
        }

        if (!label) {
        viewer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #F59E0B;">
                <h4>No Label Selected</h4>
                <p>Please select a label (target variable) to preview the training dataset.</p>
            </div>
        `;
        return;
        }

        // Create preview with selected features and label (label shown last)
        const displayColumns = [...selectedFeatures, label];
        const previewData = window.allData.slice(0, Math.min(100, window.allData.length)); // Show first 100 rows

        // Create table
    let tableHTML = `
        <div style="margin-bottom: 15px; padding: 12px; background: #F0F9FF; border-radius: 8px; border: 1px solid #BAE6FD;">
            <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.9rem;">
                <div><strong>Selected Features:</strong> ${selectedFeatures.length}</div>
                <div><strong>Label:</strong> ${label}</div>
                <div><strong>Total Rows:</strong> ${window.allData.length.toLocaleString()}</div>
                <div><strong>Preview Rows:</strong> ${previewData.length}</div>
            </div>
        </div>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                <thead>
                    <tr style="background: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
                        ${displayColumns.map(col => `
                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; position: sticky; top: 0; background: #F9FAFB; ${col === label ? 'background: #FEF3C7;' : ''}">
                                ${col === label ? '[LABEL] ' : ''}${col}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    previewData.forEach((row, rowIndex) => {
        tableHTML += '<tr style="border-bottom: 1px solid #E5E7EB;">';
        displayColumns.forEach(col => {
            const value = row[col];
            const displayValue = value === null || value === undefined || value === '' ?
                '<span style="color: #9CA3AF; font-style: italic;">null</span>' :
                String(value);
            tableHTML += `<td style="padding: 10px 12px; color: #1F2937;">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
        });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    viewer.innerHTML = tableHTML;
        }

    function proceedToActualTraining() {
        alert('Model training interface will be implemented next!');
        // TODO: Implement actual model training
        }
    */ // End of commented model training functions


    function updateVariableStats() {
        if (!window.variableData || !window.variableData.value_counts) {
            console.log('updateVariableStats: No variableData or value_counts');
            return;
        }

        const currentColumn = window.allColumns[window.currentVariableIndex];

        // Get original counts from originalColumnData if available (to preserve true counts)
        const originalData = window.originalColumnData && window.originalColumnData[currentColumn]
            ? window.originalColumnData[currentColumn].value_counts
            : null;

        // Calculate statistics based on actual checkbox states
        let selectedCount = 0;
        let selectedTotal = 0;
        let excludedCount = 0;
        let excludedTotal = 0;
        let missingCount = 0;
        let nanCount = 0;

        // Go through all value rows and check actual checkbox states
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            const nanCheckbox = document.getElementById(`nan-${i}`);
            const item = window.variableData.value_counts[i];

            if (!item) continue;

            // Get the original count for this value (before any exclusions)
            // ALWAYS use originalColumnData if available to get the true original count
            let originalCount = 0;
            if (originalData && item.original_value !== undefined) {
                const originalItem = originalData.find(orig =>
                    String(orig.original_value || orig.value || '') === String(item.original_value || '')
                );
                if (originalItem) {
                    originalCount = originalItem.count || 0;
                }
            }

            // Use the original count if available, otherwise fall back to item.count
            // The original count is the TRUE count before any exclusions or modifications
            const actualCount = originalCount > 0 ? originalCount : (item.count || 0);

            // Debug logging for problematic cases
            if (actualCount === 0 && item.original_value !== undefined) {
                console.log(`Warning: actualCount is 0 for value "${item.original_value}", originalCount=${originalCount}, item.count=${item.count}`);
            }

            // Check if the selection checkbox exists and is checked
            const isSelected = checkbox !== null ? checkbox.checked : (item.count > 0);

            if (isSelected) {
                // This item is SELECTED (will be included in dataset)
                selectedCount++;
                selectedTotal += actualCount;

                // Count NaN values ONLY if "Mark as NaN" checkbox is checked
                const isNaN = (nanCheckbox && nanCheckbox.checked) || item.isNaN;
                if (isNaN) {
                    nanCount += actualCount;
                }

                // Count actual missing/NaN values in the value text (not from checkbox)
                // These are values that were already missing/null in the original data
                const originalValue = item.original_value;
                if (originalValue === null || originalValue === undefined ||
                    originalValue === '' || originalValue === 'Missing/NaN' ||
                    String(originalValue).toLowerCase().includes('missing') ||
                    String(originalValue).toLowerCase().includes('nan')) {
                    missingCount += actualCount;
                }
            } else {
                // This item is EXCLUDED (will be removed from dataset)
                excludedCount++;
                excludedTotal += actualCount;
            }
        }

        // Update the display
        const totalValuesEl = document.getElementById('totalValues');
        const uniqueValuesEl = document.getElementById('uniqueValues');
        const missingValuesEl = document.getElementById('missingValues');

        // Total Values = sum of counts for all SELECTED items (left checkbox checked)
        // This reflects the number of rows that will remain in the dataset
        if (totalValuesEl) {
            totalValuesEl.textContent = selectedTotal.toLocaleString();
        }
        if (uniqueValuesEl) {
            uniqueValuesEl.textContent = selectedCount.toLocaleString();
        }

        // Missing Values = actual missing values + NaN-converted values (from "Mark as NaN" checkbox)
        // This counts values that are marked as NaN OR were originally missing
        if (missingValuesEl) {
            missingValuesEl.textContent = (missingCount + nanCount).toLocaleString();
        }

        // Update the window.variableData object with new stats
        window.variableData.total_values = selectedTotal;
        window.variableData.unique_values = selectedCount;
        window.variableData.missing_count = missingCount + nanCount;
        window.variableData.excluded_count = excludedTotal;
        window.variableData.excluded_unique = excludedCount;

        console.log(`Stats updated: Total=${selectedTotal}, Unique=${selectedCount}, Missing=${missingCount + nanCount} (missingCount=${missingCount}, nanCount=${nanCount}), Excluded=${excludedTotal}`);
    }

    function saveVariableChanges() {
        // Save changes for current variable
        const currentColumn = window.allColumns[window.currentVariableIndex];

        // Save current state to history for undo
        saveToHistory();

        // Save to memory first
        saveVariableChangesToMemory();

        // Collect all selected values and their new names
        const selectedValues = [];
        const excludedValues = [];

        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            const nanCheckbox = document.getElementById(`nan-${i}`);
            const item = window.variableData.value_counts[i];

            // Update item.isNaN from checkbox state
            if (nanCheckbox) {
                item.isNaN = nanCheckbox.checked;
            }

            if (checkbox && checkbox.checked) {
                selectedValues.push({
                    original: item.original_value,
                    new: item.value, // Keep the edited value (NaN will be handled separately)
                    count: item.count,
                    isNaN: item.isNaN || false
                });
            } else {
                excludedValues.push({
                    original: item.original_value,
                    new: item.value,
                    count: item.count
                });
            }
        }

        // Apply renamed values to the actual dataset FIRST (before excluding or setting NaN)
        applyRenamedValuesToDataset(currentColumn);

        // EXCLUDE rows (remove completely from dataset) - this is different from NaN
        // Excluded rows are tracked separately so they can be restored
        excludeRowsFromDataset(currentColumn, excludedValues);

        // Apply NaN values to the actual dataset LAST (after renaming and excluding)
        // NaN keeps the rows but sets the value to null
        // This ensures NaN values become null in the dataset
        applyNaNValuesToDataset(currentColumn);

        // Verify changes were applied to window.allData
        console.log('========== VERIFICATION: Changes applied to window.allData ==========');
        console.log(`Column: ${currentColumn}`);
        console.log(`Total rows in window.allData: ${window.allData.length}`);
        console.log(`Sample of first 5 values in window.allData for this column:`);
        for (let i = 0; i < Math.min(5, window.allData.length); i++) {
            console.log(`  Row ${i}: ${window.allData[i][currentColumn]}`);
        }
        console.log('===============================================================');

        // Show summary of changes
        const summary = `
    Changes saved for variable: ${currentColumn}

    Selected values: ${selectedValues.length}
    Excluded values: ${excludedValues.length}
    Total values: ${window.variableData.value_counts.length}

    Selected values will be kept in the dataset.
    Excluded values will be removed from the dataset.
    `;

        // Silently complete the operation - no popup unless there's an error

        // Update the sidebar to show this variable is processed
        updateVariableStatus(window.currentVariableIndex, 'completed');

        // Preserve variable_type before clearing cache
        let preservedVariableType = null;
        if (currentColumn && window.variableChanges[currentColumn] && window.variableChanges[currentColumn].variable_type) {
            preservedVariableType = window.variableChanges[currentColumn].variable_type;
            console.log(`Preserving variable_type "${preservedVariableType}" before clearing cache`);

            // Keep only the variable_type in the cache, clear the rest so it recalculates
            window.variableChanges[currentColumn] = {
                variable_type: preservedVariableType
            };
        } else {
            // No variable_type to preserve, delete entirely
            delete window.variableChanges[currentColumn];
        }

        localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));
        console.log('Cleared cached variable data (preserved variable_type) to force recalculation from updated window.allData');

        // Refresh the current variable display immediately with updated values
        // BUT: Don't recalculate from allData - use the original data and merge with current state
        // This way we always show all labels
        const refreshColumn = window.allColumns[window.currentVariableIndex];
        if (window.originalColumnData && window.originalColumnData[refreshColumn]) {
            // Recalculate current counts from allData
            const currentData = calculateLocalColumnData(refreshColumn);
            if (currentData) {
                // Merge with original to show all labels
                displayVariableCleaning(refreshColumn, currentData);
            } else {
                loadCurrentVariable();
            }
        } else {
            loadCurrentVariable();
        }

        // Refresh the data viewer to show updated values
        window.refreshDataViewerIfVisible();
    }

    function updateVariableStatus(index, status) {
        const element = document.getElementById(`variable-${index}`);
        if (element) {
            if (status === 'completed') {
                element.style.borderColor = '#10B981';
                element.style.background = '#F0FDF4';

                // Add a checkmark indicator
                const statusSpan = element.querySelector('.status-indicator');
                if (!statusSpan) {
                    const statusDiv = document.createElement('div');
                    statusDiv.className = 'status-indicator';
                    statusDiv.style.cssText = 'margin-top: 8px; font-size: 0.7rem; color: #10B981; font-weight: 600;';
                    statusDiv.innerHTML = '<span style="color: #10B981; font-weight: 500;">Completed</span>';
                    element.appendChild(statusDiv);
                }
            }
        }
    }

    function applyNaNValuesToDataset(column) {
        console.log(`Applying NaN values to dataset for column: ${column}`);
        console.log(`window.variableData.value_counts length: ${window.variableData.value_counts.length}`);

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available to apply NaN values');
            return;
        }

        // Initialize NaN tracking
        if (!window.nanValues) {
            window.nanValues = {};
        }
        if (!window.nanValues[column]) {
            window.nanValues[column] = {};
        }

        let updatedCount = 0;
        let nanItems = [];

        // Loop through each value in value_counts
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const checkbox = document.getElementById(`select-${i}`);
            const nanCheckbox = document.getElementById(`nan-${i}`);
            const item = window.variableData.value_counts[i];

            // Check if marked as NaN (either from item.isNaN or checkbox state)
            const isMarkedAsNaN = item.isNaN || (nanCheckbox && nanCheckbox.checked);

            // Apply NaN to SELECTED values (checked checkboxes) that are marked as NaN
            // OR apply to all values marked as NaN if no checkbox exists (e.g., when called from toggleVariableType)
            if (isMarkedAsNaN && (!checkbox || checkbox.checked)) {
                nanItems.push(item);
                // Use the current value (after renaming) to match against dataset
                // Try multiple variations to catch the value
                const valueToMatch = item.value || item.original_value;
                const valueVariations = [
                    valueToMatch,
                    String(valueToMatch),
                    item.original_value,
                    String(item.original_value)
                ];

                console.log(`Setting "${valueToMatch}" to null in column "${column}" (NaN conversion)`);

                // Track which values were set to NaN
                window.nanValues[column][String(valueToMatch)] = {
                    originalValue: item.original_value,
                    currentValue: item.value,
                    count: item.count
                };

                // Update all rows where this value appears (set to null, but keep the row)
                window.allData.forEach(row => {
                    const rowValue = row[column];
                    // Match against any variation of the value
                    if (rowValue !== null && rowValue !== undefined && valueVariations.some(v => String(rowValue) === String(v))) {
                        row[column] = null;
                        updatedCount++;
                    }
                });
            } else if (!isMarkedAsNaN && checkbox && checkbox.checked) {
                // If not marked as NaN anymore, restore the value if it was previously NaN
                const valueToMatch = item.value || item.original_value;
                const valueKey = String(valueToMatch);
                if (window.nanValues[column] && window.nanValues[column][valueKey]) {
                    // Restore from original value
                    const originalValue = window.nanValues[column][valueKey].originalValue;
                    console.log(`Restoring "${originalValue}" from NaN in column "${column}"`);

                    window.allData.forEach(row => {
                        if (row[column] === null) {
                            // Restore based on the current value mapping
                            // We need to check if this null was from this specific value
                            row[column] = item.value || item.original_value;
                        }
                    });

                    delete window.nanValues[column][valueKey];
                }
            }
        }

        console.log(`Found ${nanItems.length} NaN items, updated ${updatedCount} rows with NaN values for column ${column}`);

        // Mark data as modified and save to localStorage
        window.dataModified = true;
        try {
            localStorage.setItem('window.dataModified', 'true');
            console.log('Saved window.dataModified to localStorage');
            // Don't save window.allData to localStorage if it's too large
            const dataSize = JSON.stringify(window.allData).length;
            if (dataSize > 5 * 1024 * 1024) { // 5MB limit
                console.warn('window.allData is too large (' + (dataSize / 1024 / 1024).toFixed(2) + 'MB), skipping localStorage save');
            } else {
                localStorage.setItem('window.allData', JSON.stringify(window.allData));
                console.log('Saved window.allData to localStorage');
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    function applyRenamedValuesToDataset(column) {
        console.log(`Applying renamed values to dataset for column: ${column}`);

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available to apply renamed values');
            return;
        }

        let updatedCount = 0;

        // Loop through each value in value_counts
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const item = window.variableData.value_counts[i];
            const checkbox = document.getElementById(`select-${i}`);

            // Only apply if checked and not marked as NaN
            if (checkbox && checkbox.checked && !item.isNaN) {
                const originalValue = item.original_value || item.value;
                const newValue = item.value;

                // Only update if the value has changed
                if (String(originalValue) !== String(newValue)) {
                    console.log(`Renaming "${originalValue}" to "${newValue}" in column "${column}"`);

                    // Update all rows where this value appears
                    window.allData.forEach(row => {
                        if (String(row[column]) === String(originalValue)) {
                            row[column] = newValue;
                            updatedCount++;
                        }
                    });
                }
            }
        }

        console.log(`Updated ${updatedCount} rows with renamed values for column ${column}`);

        // Mark data as modified and save to localStorage
        window.dataModified = true;
        try {
            localStorage.setItem('window.dataModified', 'true');
            console.log('Saved window.dataModified to localStorage');
            // Don't save window.allData to localStorage if it's too large
            const dataSize = JSON.stringify(window.allData).length;
            if (dataSize > 5 * 1024 * 1024) { // 5MB limit
                console.warn('window.allData is too large (' + (dataSize / 1024 / 1024).toFixed(2) + 'MB), skipping localStorage save');
            } else {
                localStorage.setItem('window.allData', JSON.stringify(window.allData));
                console.log('Saved window.allData to localStorage');
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Track excluded rows separately so they can be restored
    // Format: { columnName: [array of row data] }
    if (!window.excludedRows) {
        window.excludedRows = {};
    }
    // Track NaN values separately so they can be restored
    // Format: { columnName: { originalValue: { originalValue, currentValue, count } } }
    if (!window.nanValues) {
        window.nanValues = {};
    }
    // Store original column data so we can always show all labels
    // Format: { columnName: { value_counts: [...], total_values: X, unique_values: Y } }
    window.originalColumnData = window.originalColumnData || {};

    function excludeRowsFromDataset(column, excludedValues) {
        console.log(`Excluding rows from dataset for column: ${column}`);

        if (!window.allData || window.allData.length === 0) {
            console.error('No data available to exclude rows');
            return;
        }

        // Initialize excluded rows tracking for this column
        if (!window.excludedRows[column]) {
            window.excludedRows[column] = [];
        }

        // First, restore any previously excluded rows that should now be included
        restoreExcludedRows(column);

        if (!excludedValues || excludedValues.length === 0) {
            console.log('No excluded values to remove');
            return;
        }

        let excludedCount = 0;
        const rowsToExclude = [];

        // Find all rows with excluded values and store them before removing
        excludedValues.forEach(excludedItem => {
            const originalValue = excludedItem.original || excludedItem.original_value;
            console.log(`Excluding rows with "${originalValue}" from column "${column}"`);

            window.allData.forEach((row, index) => {
                if (String(row[column]) === String(originalValue)) {
                    // Store the full row data to restore later
                    const rowCopy = JSON.parse(JSON.stringify(row));
                    rowsToExclude.push({
                        index: index,
                        rowData: rowCopy,
                        originalValue: originalValue
                    });
                    excludedCount++;
                }
            });
        });

        // Remove rows from dataset (backwards to maintain indices)
        rowsToExclude.sort((a, b) => b.index - a.index);
        rowsToExclude.forEach(item => {
            window.allData.splice(item.index, 1);
        });

        // Store excluded rows for potential restoration
        window.excludedRows[column] = rowsToExclude.map(item => item.rowData);

        console.log(`Excluded ${excludedCount} rows from dataset for column ${column}`);
        console.log(`Total rows in dataset: ${window.allData.length}`);
        console.log(`Stored ${window.excludedRows[column].length} rows for potential restoration`);

        // Mark data as modified and save to localStorage
        window.dataModified = true;
        try {
            localStorage.setItem('dataModified', 'true');
            localStorage.setItem('excludedRows', JSON.stringify(window.excludedRows));
            console.log('Saved excludedRows to localStorage');
            // Don't save allData to localStorage if it's too large
            const dataSize = JSON.stringify(window.allData).length;
            if (dataSize > 5 * 1024 * 1024) { // 5MB limit
                console.warn('allData is too large (' + (dataSize / 1024 / 1024).toFixed(2) + 'MB), skipping localStorage save');
            } else {
                localStorage.setItem('allData', JSON.stringify(window.allData));
                console.log('Saved allData to localStorage');
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    function restoreExcludedRows(column) {
        // Check if there are excluded rows to restore
        if (!window.excludedRows || !window.excludedRows[column] || window.excludedRows[column].length === 0) {
            return;
        }

        console.log(`Restoring ${window.excludedRows[column].length} excluded rows for column ${column}`);

        // Restore rows back to dataset
        window.excludedRows[column].forEach(rowData => {
            window.allData.push(rowData);
        });

        // Clear excluded rows for this column
        window.excludedRows[column] = [];

        // Save to localStorage
        try {
            localStorage.setItem('excludedRows', JSON.stringify(window.excludedRows));
            localStorage.setItem('allData', JSON.stringify(window.allData));
            console.log('Restored excluded rows and saved to localStorage');
        } catch (error) {
            console.error('Error saving restored rows:', error);
        }
    }

    // Keep old function name for backward compatibility
    function removeExcludedValuesFromDataset(column, excludedValues) {
        excludeRowsFromDataset(column, excludedValues);
    }


    // Find and Replace Functions
    function performFindReplace() {
        const findText = document.getElementById('findText').value.trim();
        const replaceText = document.getElementById('replaceText').value;
        const previewMode = document.getElementById('previewMode').checked;

        if (!findText) {
            alert('Please enter text to find');
            return;
        }

        if (previewMode) {
            previewFindReplace();
        } else {
            applyFindReplaceChanges();
        }
    }

    function previewFindReplace() {
        const findText = document.getElementById('findText').value.trim();
        const replaceText = document.getElementById('replaceText').value;
        const caseSensitive = document.getElementById('caseSensitive').checked;
        const wholeWord = document.getElementById('wholeWord').checked;

        if (!findText) {
            alert('Please enter text to find');
            return;
        }

        const matches = [];
        const regex = buildFindRegex(findText, caseSensitive, wholeWord);

        // Find all matches
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const item = window.variableData.value_counts[i];
            const originalValue = item.value;

            if (regex.test(originalValue)) {
                const newValue = originalValue.replace(regex, replaceText);
                if (originalValue !== newValue) {
                    matches.push({
                        index: i,
                        original: originalValue,
                        new: newValue,
                        count: item.count
                    });
                }
            }
        }

        if (matches.length === 0) {
            alert(`No matches found for "${findText}"`);
            return;
        }

        // Show preview
        const previewDiv = document.getElementById('findReplacePreview');
        const resultsDiv = document.getElementById('previewResults');

        resultsDiv.innerHTML = `
        <div style="margin-bottom: 10px; color: #92400E; font-weight: 600;">
            Found ${matches.length} values that will be changed:
        </div>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #F1F5F9; border-radius: 6px;">
            ${matches.map(match => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #F1F5F9;">
                    <div style="flex: 1;">
                        <span style="color: #1E40AF; font-weight: 500;">${match.original}</span>
                        <span style="color: #64748B; margin: 0 8px;">→</span>
                        <span style="color: #10B981; font-weight: 500;">${match.new}</span>
                    </div>
                    <div style="background: #87CEEB; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                        ${match.count}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

        previewDiv.style.display = 'block';
    }

    function buildFindRegex(findText, caseSensitive, wholeWord) {
        // Escape special regex characters
        const escapedText = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build regex pattern
        let pattern = escapedText;
        if (wholeWord) {
            pattern = `\\b${escapedText}\\b`;
        }

        const flags = caseSensitive ? 'g' : 'gi';
        return new RegExp(pattern, flags);
    }

    function applyFindReplace() {
        applyFindReplaceChanges();
        cancelFindReplace();
    }

    function applyFindReplaceChanges() {
        const findText = document.getElementById('findText').value.trim();
        const replaceText = document.getElementById('replaceText').value;
        const caseSensitive = document.getElementById('caseSensitive').checked;
        const wholeWord = document.getElementById('wholeWord').checked;

        if (!findText) {
            alert('Please enter text to find');
            return;
        }

        const regex = buildFindRegex(findText, caseSensitive, wholeWord);
        let updatedCount = 0;

        // Apply changes
        for (let i = 0; i < window.variableData.value_counts.length; i++) {
            const item = window.variableData.value_counts[i];
            const originalValue = item.value;

            if (regex.test(originalValue)) {
                const newValue = originalValue.replace(regex, replaceText);
                if (originalValue !== newValue) {
                    item.value = newValue;

                    // Update the input field
                    const input = document.getElementById(`name-${i}`);
                    if (input) {
                        input.value = newValue;
                    }
                    updatedCount++;
                }
            }
        }

        // Save changes to memory
        saveVariableChangesToMemory();

        // Silently complete the operation - no popup unless there's an error
    }

    function cancelFindReplace() {
        document.getElementById('findReplacePreview').style.display = 'none';
    }

    function clearFindReplace() {
        document.getElementById('findText').value = '';
        document.getElementById('replaceText').value = '';
        document.getElementById('caseSensitive').checked = false;
        document.getElementById('wholeWord').checked = false;
        document.getElementById('previewMode').checked = true;
        cancelFindReplace();
    }

    function toggleFindReplace() {
        const content = document.getElementById('findReplaceContent');
        const toggle = document.getElementById('findReplaceToggle');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '−';
        } else {
            content.style.display = 'none';
            toggle.textContent = '+';
        }
    }

    function goBackToViewer() {
        // Show upload section and data viewer, hide cleaning page
        const cleaningPage = document.getElementById('cleaningPage');
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const dataViewer = document.getElementById('dataViewer');
        const result = document.getElementById('result');
        const newUploadBtn = document.getElementById('newUploadBtn');

        if (cleaningPage) {
            cleaningPage.style.display = 'none';
            cleaningPage.style.visibility = 'hidden';
        }
        if (featureEngineeringPage) {
            featureEngineeringPage.style.display = 'none';
            featureEngineeringPage.style.visibility = 'hidden';
        }
        if (uploadSection) {
            uploadSection.style.display = 'block';
            uploadSection.style.visibility = 'visible';
        }
        if (modelSelection) {
            modelSelection.style.display = 'block';
            modelSelection.style.visibility = 'visible';
        }
        if (dataViewer) {
            dataViewer.style.display = 'block';
            dataViewer.style.visibility = 'visible';
        }
        if (result) {
            result.style.display = 'block';
            result.style.visibility = 'visible';
        }
        if (newUploadBtn) {
            newUploadBtn.style.display = 'block';
            newUploadBtn.style.visibility = 'visible';
        }

        // Make sure data is still displayed if we have uploaded data
        if (window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0) {
            window.showDataViewer(window.uploadedData);
        }
    }

    function previewCleaning() {
        // Show a preview of what will be cleaned
        alert('Preview feature coming soon! This will show you exactly what changes will be made to your dataset before applying them.');
    }

    function startCleaning() {
        // Start the actual cleaning process
        const cleaningContent = document.getElementById('cleaningContent');
        // Note: This function's implementation was incomplete in original
        // Keeping stub for now
    }

    // Export all functions to window
    window.proceedToCleaning = proceedToCleaning;
    window.loadCleaningInterface = loadCleaningInterface;
    window.displayCleaningInterface = displayCleaningInterface;
    window.selectVariable = selectVariable;
    window.updateSidebarSelection = updateSidebarSelection;
    window.loadCurrentVariable = loadCurrentVariable;
    window.fetchColumnData = fetchColumnData;
    window.displayVariableCleaning = displayVariableCleaning;
    window.previousVariable = previousVariable;
    window.nextVariable = nextVariable;
    window.updateValueSelection = updateValueSelection;
    window.filterValues = filterValues;
    window.updateValueName = updateValueName;
    window.toggleValueAsNaN = toggleValueAsNaN;
    window.selectAllValues = selectAllValues;
    window.deselectAllValues = deselectAllValues;
    window.removeLeadingZeros = removeLeadingZeros;
    window.resetAllNames = resetAllNames;
    window.combineSelectedLabels = combineSelectedLabels;
    window.setSelectedAsNaN = setSelectedAsNaN;
    window.saveVariableChangesToMemory = saveVariableChangesToMemory;
    window.saveVariableChanges = saveVariableChanges;
    window.showVariableTypeSelection = showVariableTypeSelection;
    window.closeVariableTypeModal = closeVariableTypeModal;
    window.toggleVariableType = toggleVariableType;
    window.convertColumnDataType = convertColumnDataType;
    window.updateVariableTypeToggleButton = updateVariableTypeToggleButton;
    window.updateVariableTypeBadge = updateVariableTypeBadge;
    window.updateSidebarBadge = updateSidebarBadge;
    window.updateAllSidebarBadges = updateAllSidebarBadges;
    window.refreshCleaningInterfaceIfVisible = refreshCleaningInterfaceIfVisible;
    window.refreshDataViewerIfVisible = refreshDataViewerIfVisible;
    window.calculateLocalColumnData = calculateLocalColumnData;
    window.updateVariableStatus = updateVariableStatus;
    window.applyNaNValuesToDataset = applyNaNValuesToDataset;
    window.applyRenamedValuesToDataset = applyRenamedValuesToDataset;
    window.excludeRowsFromDataset = excludeRowsFromDataset;
    window.restoreExcludedRows = restoreExcludedRows;
    window.removeExcludedValuesFromDataset = excludeRowsFromDataset; // Keep for backward compatibility
    window.performFindReplace = performFindReplace;
    window.previewFindReplace = previewFindReplace;
    window.buildFindRegex = buildFindRegex;
    window.applyFindReplace = applyFindReplace;
    window.applyFindReplaceChanges = applyFindReplaceChanges;
    window.cancelFindReplace = cancelFindReplace;
    window.clearFindReplace = clearFindReplace;
    window.toggleFindReplace = toggleFindReplace;
    window.goBackToViewer = goBackToViewer;
    window.goBackToDataViewer = goBackToDataViewer;
    window.goBackToCleaning = goBackToCleaning;
    window.saveVariableType = saveVariableType;

    // ========== UNDO/REDO SYSTEM ==========
    // Initialize history tracking
    if (typeof window.dataHistory === 'undefined') {
        window.dataHistory = [];
        window.dataHistoryIndex = -1;
        window.maxHistorySize = 50; // Maximum number of history entries
    }

    function saveToHistory() {
        if (!window.allData || window.allData.length === 0) {
            return;
        }

        // Deep clone the current dataset state
        const snapshot = {
            data: JSON.parse(JSON.stringify(window.allData)),
            variableChanges: JSON.parse(JSON.stringify(window.variableChanges || {})),
            nanValues: JSON.parse(JSON.stringify(window.nanValues || {})),
            excludedRows: JSON.parse(JSON.stringify(window.excludedRows || {})),
            timestamp: Date.now(),
            description: `Edit at ${new Date().toLocaleTimeString()}`
        };

        // Remove any history entries after current index (when we're in the middle of history and make a new change)
        if (window.dataHistoryIndex < window.dataHistory.length - 1) {
            window.dataHistory = window.dataHistory.slice(0, window.dataHistoryIndex + 1);
        }

        // Add new snapshot
        window.dataHistory.push(snapshot);

        // Limit history size
        if (window.dataHistory.length > window.maxHistorySize) {
            window.dataHistory.shift(); // Remove oldest entry
        } else {
            window.dataHistoryIndex = window.dataHistory.length - 1;
        }

        console.log(`History saved: ${window.dataHistory.length} entries, current index: ${window.dataHistoryIndex}`);

        // Update undo/redo button states
        updateUndoRedoButtons();
    }

    function undoDatasetChange() {
        if (window.dataHistoryIndex <= 0) {
            console.log('No history to undo');
            return;
        }

        // Decrement index
        window.dataHistoryIndex--;

        // Restore previous state
        const snapshot = window.dataHistory[window.dataHistoryIndex];
        window.allData = JSON.parse(JSON.stringify(snapshot.data));
        window.variableChanges = JSON.parse(JSON.stringify(snapshot.variableChanges));
        window.nanValues = JSON.parse(JSON.stringify(snapshot.nanValues));
        window.excludedRows = JSON.parse(JSON.stringify(snapshot.excludedRows));

        console.log(`Undo: Restored state from index ${window.dataHistoryIndex}`);

        // Mark data as modified
        window.dataModified = true;
        localStorage.setItem('window.dataModified', 'true');

        // Save to localStorage
        try {
            const dataSize = JSON.stringify(window.allData).length;
            if (dataSize <= 5 * 1024 * 1024) { // 5MB limit
                localStorage.setItem('window.allData', JSON.stringify(window.allData));
            }
            localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }

        // Refresh the display
        if (window.refreshCleaningInterfaceIfVisible) {
            window.refreshCleaningInterfaceIfVisible();
        }
        if (window.refreshDataViewerIfVisible) {
            window.refreshDataViewerIfVisible();
        }

        // Reload current variable if in cleaning interface
        if (window.loadCurrentVariable) {
            setTimeout(() => {
                window.loadCurrentVariable();
            }, 100);
        }

        // Update undo/redo button states
        updateUndoRedoButtons();
    }

    function redoDatasetChange() {
        if (window.dataHistoryIndex >= window.dataHistory.length - 1) {
            console.log('No history to redo');
            return;
        }

        // Increment index
        window.dataHistoryIndex++;

        // Restore next state
        const snapshot = window.dataHistory[window.dataHistoryIndex];
        window.allData = JSON.parse(JSON.stringify(snapshot.data));
        window.variableChanges = JSON.parse(JSON.stringify(snapshot.variableChanges));
        window.nanValues = JSON.parse(JSON.stringify(snapshot.nanValues));
        window.excludedRows = JSON.parse(JSON.stringify(snapshot.excludedRows));

        console.log(`Redo: Restored state from index ${window.dataHistoryIndex}`);

        // Mark data as modified
        window.dataModified = true;
        localStorage.setItem('window.dataModified', 'true');

        // Save to localStorage
        try {
            const dataSize = JSON.stringify(window.allData).length;
            if (dataSize <= 5 * 1024 * 1024) { // 5MB limit
                localStorage.setItem('window.allData', JSON.stringify(window.allData));
            }
            localStorage.setItem('variableChanges', JSON.stringify(window.variableChanges));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }

        // Refresh the display
        if (window.refreshCleaningInterfaceIfVisible) {
            window.refreshCleaningInterfaceIfVisible();
        }
        if (window.refreshDataViewerIfVisible) {
            window.refreshDataViewerIfVisible();
        }

        // Reload current variable if in cleaning interface
        if (window.loadCurrentVariable) {
            setTimeout(() => {
                window.loadCurrentVariable();
            }, 100);
        }

        // Update undo/redo button states
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            const canUndo = window.dataHistoryIndex > 0;
            undoBtn.disabled = !canUndo;
            undoBtn.style.opacity = canUndo ? '1' : '0.5';
            undoBtn.style.cursor = canUndo ? 'pointer' : 'not-allowed';
            undoBtn.title = canUndo ? 'Undo last change (Ctrl+Z)' : 'No changes to undo';
        }

        if (redoBtn) {
            const canRedo = window.dataHistoryIndex < window.dataHistory.length - 1;
            redoBtn.disabled = !canRedo;
            redoBtn.style.opacity = canRedo ? '1' : '0.5';
            redoBtn.style.cursor = canRedo ? 'pointer' : 'not-allowed';
            redoBtn.title = canRedo ? 'Redo last change (Ctrl+Y)' : 'No changes to redo';
        }
    }

    // Initialize history with current state on first load
    function initializeHistory() {
        if (window.allData && window.allData.length > 0 && window.dataHistory.length === 0) {
            saveToHistory();
        }
    }

    // Export functions
    window.saveToHistory = saveToHistory;
    window.undoDatasetChange = undoDatasetChange;
    window.redoDatasetChange = redoDatasetChange;
    window.updateUndoRedoButtons = updateUndoRedoButtons;
    window.initializeHistory = initializeHistory;

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        // Ctrl+Z or Cmd+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (window.dataHistoryIndex > 0) {
                undoDatasetChange();
            }
        }
        // Ctrl+Y or Cmd+Shift+Z for redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if (window.dataHistoryIndex < window.dataHistory.length - 1) {
                redoDatasetChange();
            }
        }
    });

    console.log('Data Cleaning module loaded');
})();
