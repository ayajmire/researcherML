// Feature Engineering Module - All feature engineering functionality
(function () {
    'use strict';

    // Ensure globals exist
    if (typeof window.allData === 'undefined') window.allData = [];
    if (typeof window.allColumns === 'undefined') window.allColumns = [];
    if (typeof window.variableChanges === 'undefined') window.variableChanges = {};
    if (typeof window.uploadedData === 'undefined') window.uploadedData = null;
    if (!window.createdFeatures || !Array.isArray(window.createdFeatures)) {
        window.createdFeatures = [];
    }

    function showFeatureEngineeringInterface() {
        // Check if this is imaging data - feature engineering is not applicable for imaging
        if (window.isImagingData && window.isImagingData()) {
            alert('Feature engineering is only available for tabular/EHR data. For imaging data, please use preprocessing and model training features.');
            return;
        }

        if (window.hideAllSections) window.hideAllSections();
        // Hide all other elements and show only feature engineering page
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const dataViewer = document.getElementById('dataViewer');
        const cleaningPage = document.getElementById('cleaningPage');
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const visualizationPage = document.getElementById('visualizationPage');
        const modelTrainingPage = document.getElementById('modelTrainingPage');
        const result = document.getElementById('result');
        const newUploadBtn = document.getElementById('newUploadBtn');
        const uploadBtn = document.getElementById('uploadBtn');

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
        if (featureEngineeringPage) {
            featureEngineeringPage.style.display = 'block';
            featureEngineeringPage.style.visibility = 'visible';
        }

        if (window.setActiveStep) {
            window.setActiveStep('engineering');
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
                // For feature engineering, we only need columns initially (fast)
                // Full dataset is already in window.allData if available
                const response = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}`);
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
        // Check in window.allColumns
        if (window.allColumns.includes(featureName)) {
            alert('A feature with this name already exists. Please choose a different name.');
            return;
        }
        // Also check in window.createdFeatures (in case it was created but not yet applied)
        if (window.createdFeatures && window.createdFeatures.some(f => f.feature_name === featureName)) {
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
        // Use window reference to ensure it's available (exported at end of module)
        if (window.calculateAndAddRuleBasedFeature && typeof window.calculateAndAddRuleBasedFeature === 'function') {
            window.calculateAndAddRuleBasedFeature(variable, operator, value, featureName);
        } else {
            // Fallback: call directly if in same scope
            if (typeof calculateAndAddRuleBasedFeature === 'function') {
                calculateAndAddRuleBasedFeature(variable, operator, value, featureName);
            } else {
                console.error('calculateAndAddRuleBasedFeature is not available!');
                alert('Error: Feature calculation function not available. Please refresh the page.');
                return;
            }
        }

        // Update the interface
        console.log('Calling window.updateCreatedFeaturesDisplay...');
        window.updateCreatedFeaturesDisplay();
        updateAvailableVariablesDisplay();

        // Refresh cleaning interface if it's currently displayed
        window.refreshCleaningInterfaceIfVisible();

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
        // Check in window.allColumns
        if (window.allColumns.includes(featureName)) {
            alert('A feature with this name already exists. Please choose a different name.');
            return;
        }
        // Also check in window.createdFeatures (in case it was created but not yet applied)
        if (window.createdFeatures && window.createdFeatures.some(f => f.feature_name === featureName)) {
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
        // Use window reference to ensure it's available (exported at end of module)
        if (window.calculateAndAddCombinedFeature && typeof window.calculateAndAddCombinedFeature === 'function') {
            window.calculateAndAddCombinedFeature(columnA, columnB, featureName);
        } else {
            // Fallback: call directly if in same scope
            if (typeof calculateAndAddCombinedFeature === 'function') {
                calculateAndAddCombinedFeature(columnA, columnB, featureName);
            } else {
                console.error('calculateAndAddCombinedFeature is not available!');
                alert('Error: Feature calculation function not available. Please refresh the page.');
                return;
            }
        }

        // Update the interface
        window.updateCreatedFeaturesDisplay();
        updateAvailableVariablesDisplay();

        // Refresh cleaning interface if it's currently displayed
        window.refreshCleaningInterfaceIfVisible();

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
                updateAllSidebarBadges();
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
                window.calculateAndAddCombinedFeature(columnA, columnB, featureName);
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

            // Check if value is null/empty - keep as null for rule-based features
            // IMPORTANT: Check for null/undefined/empty string explicitly, NOT falsy values
            // This ensures that 0 (zero) is treated as a valid value, not as null
            const isNullOrEmpty = (
                cellValue === null ||
                cellValue === undefined ||
                cellValue === '' ||
                String(cellValue).toLowerCase() === 'nan' ||
                String(cellValue).toLowerCase() === 'null'
            );

            if (isNullOrEmpty) {
                // Keep as null - don't convert to 0 for missing values
                row[featureName] = null;
                invalidCount++;
                console.log(`Row ${index}: Source value is null/empty ("${cellValue}"), setting feature to null`);
            } else {
                // Convert cell value to number
                // Note: parseFloat("0") = 0, parseFloat(0) = 0, both are valid
                const cellNumeric = parseFloat(cellValue);

                console.log(`Row ${index}: parsed value = ${cellNumeric} (isNaN: ${isNaN(cellNumeric)}, type: ${typeof cellNumeric})`);

                // Check if parsing resulted in a valid number
                // IMPORTANT: isNaN(0) = false, so 0 is a valid number
                if (!isNaN(cellNumeric) && isFinite(cellNumeric)) {
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

                    console.log(`Row ${index}: ${cellNumeric} ${operator} ${numericValue} = ${featureValue} (setting to row)`);

                    // Add the calculated value to the row - EXPLICITLY set 0 if featureValue is 0
                    row[featureName] = featureValue === 0 ? 0 : featureValue;
                    console.log(`Row ${index}: Set ${featureName} = ${row[featureName]} (type: ${typeof row[featureName]})`);
                } else {
                    // Invalid numeric value - set to null
                    row[featureName] = null;
                    invalidCount++;
                    console.log(`Row ${index}: Invalid numeric value: "${cellValue}" (parsed as ${cellNumeric}), setting feature to null`);
                }
            }

            // Debug: verify the value was actually added
            if (index < 5) {
                const finalValue = row[featureName];
                console.log(`Row ${index}: Final value for ${featureName} = ${finalValue} (type: ${typeof finalValue}, is null: ${finalValue === null}, is 0: ${finalValue === 0}, is falsy: ${!finalValue})`);
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

    // Export functions to window IMMEDIATELY after they're defined (before they're used)
    // This ensures window references work even if called before module fully loads
    window.calculateAndAddRuleBasedFeature = calculateAndAddRuleBasedFeature;
    window.calculateAndAddCombinedFeature = calculateAndAddCombinedFeature;

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

    // Export functions to window
    window.showFeatureEngineeringInterface = showFeatureEngineeringInterface;
    window.calculateAndAddRuleBasedFeature = calculateAndAddRuleBasedFeature;
    window.calculateAndAddCombinedFeature = calculateAndAddCombinedFeature;
    window.refreshDataViewerIfVisible = refreshDataViewerIfVisible;
    window.refreshCleaningInterfaceIfVisible = refreshCleaningInterfaceIfVisible;

    console.log('Feature Engineering module loaded');
})();
