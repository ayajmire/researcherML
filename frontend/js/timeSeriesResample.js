// Time Series Resample Module - Handles time series cleaning, resampling, and feature engineering
(function () {
    'use strict';

    window.showTimeSeriesResample = async function () {
        console.log('⏱️ Showing time series resample/cleaning page');

        // Hide all sections
        if (window.hideAllSections) {
            window.hideAllSections();
        }

        // Show resample page
        const resamplePage = document.getElementById('resamplePage');
        const resampleContent = document.getElementById('resampleContent');

        if (!resamplePage || !resampleContent) {
            console.error('Resample page elements not found');
            return;
        }

        resamplePage.style.display = 'block';
        resamplePage.style.visibility = 'visible';

        // Set active step
        if (window.setActiveStep) {
            window.setActiveStep('resample');
        }

        // Check if time series data exists
        if (!window.timeSeriesData || !window.timeSeriesData.uploadId) {
            resampleContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                    <h4>No Time Series Data</h4>
                    <p>Please upload a time series dataset first</p>
                </div>
            `;
            return;
        }

        // Load time series data if not already loaded
        if (!window.timeSeriesData.rawData || window.timeSeriesData.rawData.length === 0) {
            resampleContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner" style="margin: 0 auto 20px;"></div>
                    <div>Loading time series data...</div>
                </div>
            `;

            try {
                const fileId = window.timeSeriesData.uploadId;
                const response = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}?full=true`);
                if (response.ok) {
                    const fileData = await response.json();
                    if (fileData.data) {
                        window.timeSeriesData.rawData = fileData.data;
                        window.timeSeriesData.fullData = fileData.data;
                    } else if (fileData.preview_data) {
                        window.timeSeriesData.rawData = fileData.preview_data;
                    }
                }
            } catch (error) {
                console.error('Error loading time series data:', error);
            }
        }

        // Render resample interface
        window.renderTimeSeriesResampleInterface();
    };

    window.renderTimeSeriesResampleInterface = function () {
        const resampleContent = document.getElementById('resampleContent');
        if (!resampleContent) return;

        const data = window.timeSeriesData;
        const frequency = data.frequency || 1;
        const sampleCount = data.sample_count || (data.rawData ? data.rawData.length : 0);
        const columns = data.columns || [];
        const signalColumns = data.signal_columns || [];

        // Initialize feature engineering data structure for time series
        if (!window.timeSeriesFeatures) {
            window.timeSeriesFeatures = {
                createdFeatures: [],
                timeUnit: 'seconds',
                originalTimeUnit: 'seconds',
                timeUnitMultiplier: 1.0
            };
        }

        let html = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <h3 style="margin-bottom: 20px;">Time Series Cleaning & Resampling</h3>
                
                <!-- Dataset Info -->
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 15px;">Dataset Information</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <strong>Sample Count:</strong> ${sampleCount.toLocaleString()}
                        </div>
                        <div>
                            <strong>Frequency:</strong> ${frequency.toFixed(2)} Hz
                        </div>
                        <div>
                            <strong>Duration:</strong> ${(sampleCount / frequency).toFixed(2)} seconds
                        </div>
                        <div>
                            <strong>Signal Columns:</strong> ${signalColumns.length}
                        </div>
                    </div>
                </div>

                <!-- Time Unit Selection -->
                <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 15px;">Time Unit Configuration</h4>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                            Current Time Unit in Dataset:
                            <select id="timeUnitSelect" style="margin-left: 10px; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;">
                                <option value="seconds" ${(window.timeSeriesFeatures && window.timeSeriesFeatures.timeUnit === 'seconds') ? 'selected' : ''}>Seconds (s)</option>
                                <option value="milliseconds" ${(window.timeSeriesFeatures && window.timeSeriesFeatures.timeUnit === 'milliseconds') ? 'selected' : ''}>Milliseconds (ms)</option>
                                <option value="microseconds" ${(window.timeSeriesFeatures && window.timeSeriesFeatures.timeUnit === 'microseconds') ? 'selected' : ''}>Microseconds (μs)</option>
                                <option value="minutes" ${(window.timeSeriesFeatures && window.timeSeriesFeatures.timeUnit === 'minutes') ? 'selected' : ''}>Minutes (min)</option>
                                <option value="hours" ${(window.timeSeriesFeatures && window.timeSeriesFeatures.timeUnit === 'hours') ? 'selected' : ''}>Hours (hr)</option>
                            </select>
                        </label>
                        <p style="color: #718096; font-size: 0.9rem; margin-top: 5px;">
                            Select the unit of time currently used in your dataset (e.g., if timestamps are in milliseconds, select "Milliseconds")
                        </p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                            Convert To Time Unit:
                            <select id="convertTimeUnitSelect" style="margin-left: 10px; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;">
                                <option value="seconds">Seconds (s)</option>
                                <option value="milliseconds">Milliseconds (ms)</option>
                                <option value="microseconds">Microseconds (μs)</option>
                                <option value="minutes">Minutes (min)</option>
                                <option value="hours">Hours (hr)</option>
                            </select>
                        </label>
                        <p style="color: #718096; font-size: 0.9rem; margin-top: 5px;">
                            Select the target time unit you want to convert to
                        </p>
                    </div>
                    <div style="margin-bottom: 20px; padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                            Resample to Custom Time Interval:
                        </label>
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <input type="number" id="customTimeInterval" step="any" placeholder="e.g., 2, 5, 10" 
                                   style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; width: 120px;">
                            <select id="customTimeUnit" style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;">
                                <option value="ms">Milliseconds (ms)</option>
                                <option value="s">Seconds (s)</option>
                                <option value="us">Microseconds (μs)</option>
                                <option value="min">Minutes (min)</option>
                            </select>
                            <button onclick="window.applyTimeResampling()" 
                                    style="background: #0071e3; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                Apply Resampling
                            </button>
                        </div>
                        <p style="color: #718096; font-size: 0.9rem; margin-top: 8px;">
                            Specify a custom sampling interval (e.g., 2ms, 5ms, 0.5s) to resample your data. This will downsample to the specified interval.
                        </p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <button onclick="window.convertTimeUnit()" 
                                style="background: #34c759; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 10px;">
                            Convert Time Unit (Metadata Only)
                        </button>
                        <span style="color: #718096; font-size: 0.85rem;">
                            This updates the time unit metadata without resampling the data
                        </span>
                    </div>
                </div>

                <!-- Feature Engineering -->
                <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 15px;">Binary Feature Engineering</h4>
                    <p style="color: #718096; margin-bottom: 15px; font-size: 0.9rem;">
                        Create binary features based on signal values (e.g., threshold crossings, ranges)
                    </p>
                    
                    <div id="timeSeriesFeatureEngineeringContent">
                        <!-- Feature engineering UI will be rendered here -->
                    </div>
                </div>

                <!-- Save Changes Button -->
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="window.saveTimeSeriesChanges()" 
                            style="background: #34c759; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 500;">
                        Save Changes
                    </button>
                </div>
            </div>
        `;

        resampleContent.innerHTML = html;

        // Render feature engineering interface
        window.renderTimeSeriesFeatureEngineering();
    };

    window.renderTimeSeriesFeatureEngineering = function () {
        const content = document.getElementById('timeSeriesFeatureEngineeringContent');
        if (!content) return;

        const signalColumns = window.timeSeriesData.signal_columns || [];
        const createdFeatures = window.timeSeriesFeatures.createdFeatures || [];

        let html = `
            <div style="margin-bottom: 20px;">
                <h5 style="margin-bottom: 10px;">Create Binary Feature</h5>
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 2fr; gap: 10px; margin-bottom: 10px; align-items: end;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Signal Column:</label>
                        <select id="tsSignalColumn" style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;">
                            <option value="">Select column...</option>
                            ${signalColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Operator:</label>
                        <select id="tsOperator" style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;">
                            <option value=">">Greater than (>)</option>
                            <option value="<">Less than (<)</option>
                            <option value=">=">Greater than or equal (>=)</option>
                            <option value="<=">Less than or equal (<=)</option>
                            <option value="==">Equal to (==)</option>
                            <option value="!=">Not equal to (!=)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Value:</label>
                        <input type="number" id="tsThresholdValue" step="any" 
                               style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;" 
                               placeholder="Threshold">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Feature Name:</label>
                        <input type="text" id="tsFeatureName" 
                               style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;" 
                               placeholder="e.g., high_signal">
                    </div>
                </div>
                <button onclick="window.createTimeSeriesBinaryFeature()" 
                        style="background: #0071e3; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                    Create Binary Feature
                </button>
            </div>

            ${createdFeatures.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h5 style="margin-bottom: 10px;">Created Features (${createdFeatures.length})</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${createdFeatures.map((feature, idx) => `
                            <div style="background: #e8f0fe; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e0;">
                                <strong>${feature.feature_name}</strong>: ${feature.variable} ${feature.operator} ${feature.value}
                                <button onclick="window.removeTimeSeriesFeature(${idx})" 
                                        style="margin-left: 10px; background: #e53e3e; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                                    Remove
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        content.innerHTML = html;
    };

    window.createTimeSeriesBinaryFeature = function () {
        const signalColumn = document.getElementById('tsSignalColumn').value;
        const operator = document.getElementById('tsOperator').value;
        const thresholdValue = parseFloat(document.getElementById('tsThresholdValue').value);
        const featureName = document.getElementById('tsFeatureName').value;

        if (!signalColumn || !operator || isNaN(thresholdValue) || !featureName) {
            alert('Please fill in all fields to create a binary feature');
            return;
        }

        // Check if feature name already exists
        const existingFeatures = window.timeSeriesFeatures.createdFeatures || [];
        if (existingFeatures.some(f => f.feature_name === featureName)) {
            alert('A feature with this name already exists. Please choose a different name.');
            return;
        }

        // Add feature to list
        if (!window.timeSeriesFeatures.createdFeatures) {
            window.timeSeriesFeatures.createdFeatures = [];
        }

        window.timeSeriesFeatures.createdFeatures.push({
            type: 'binary',
            variable: signalColumn,
            operator: operator,
            value: thresholdValue,
            feature_name: featureName
        });

        // Recalculate features
        window.calculateTimeSeriesFeatures();

        // Re-render feature engineering interface
        window.renderTimeSeriesFeatureEngineering();
    };

    window.removeTimeSeriesFeature = function (index) {
        if (window.timeSeriesFeatures.createdFeatures) {
            window.timeSeriesFeatures.createdFeatures.splice(index, 1);
            window.calculateTimeSeriesFeatures();
            window.renderTimeSeriesFeatureEngineering();
        }
    };

    window.calculateTimeSeriesFeatures = function () {
        if (!window.timeSeriesData || !window.timeSeriesData.rawData) {
            return;
        }

        const data = window.timeSeriesData.rawData;
        const features = window.timeSeriesFeatures.createdFeatures || [];

        // Calculate each feature
        features.forEach(feature => {
            data.forEach(row => {
                const signalValue = parseFloat(row[feature.variable]);
                let featureValue = false;

                if (!isNaN(signalValue)) {
                    switch (feature.operator) {
                        case '>':
                            featureValue = signalValue > feature.value;
                            break;
                        case '<':
                            featureValue = signalValue < feature.value;
                            break;
                        case '>=':
                            featureValue = signalValue >= feature.value;
                            break;
                        case '<=':
                            featureValue = signalValue <= feature.value;
                            break;
                        case '==':
                            featureValue = Math.abs(signalValue - feature.value) < 0.0001;
                            break;
                        case '!=':
                            featureValue = Math.abs(signalValue - feature.value) >= 0.0001;
                            break;
                    }
                }

                // Convert to binary (0 or 1)
                row[feature.feature_name] = featureValue ? 1 : 0;
            });
        });

        console.log('✅ Calculated time series features:', features.length);
    };

    window.convertTimeUnit = function () {
        const currentUnit = document.getElementById('timeUnitSelect').value;
        const targetUnit = document.getElementById('convertTimeUnitSelect').value;
        const customInterval = document.getElementById('customTimeInterval').value;
        const customUnit = document.getElementById('customTimeUnit').value;

        // Time unit multipliers (to seconds)
        const multipliers = {
            'seconds': 1,
            'milliseconds': 0.001,
            'microseconds': 0.000001,
            'minutes': 60,
            'hours': 3600
        };

        const currentMultiplier = multipliers[currentUnit] || 1;
        const targetMultiplier = multipliers[targetUnit] || 1;
        const conversionFactor = currentMultiplier / targetMultiplier;

        // Update time unit in features
        window.timeSeriesFeatures.timeUnit = targetUnit;
        window.timeSeriesFeatures.timeUnitMultiplier = conversionFactor;

        // If custom interval is specified, perform resampling
        if (customInterval && !isNaN(parseFloat(customInterval))) {
            const intervalValue = parseFloat(customInterval);
            let intervalSeconds = intervalValue;

            // Convert custom unit to seconds
            if (customUnit === 'ms') {
                intervalSeconds = intervalValue * 0.001;
            } else if (customUnit === 'us') {
                intervalSeconds = intervalValue * 0.000001;
            } else if (customUnit === 's') {
                intervalSeconds = intervalValue;
            }

            // Convert from current unit to seconds
            intervalSeconds = intervalSeconds * currentMultiplier;

            // Calculate target frequency
            const targetFrequency = 1.0 / intervalSeconds;
            const originalFrequency = window.timeSeriesData.frequency || 1;

            if (targetFrequency > originalFrequency) {
                alert(`Cannot upsample: target frequency (${targetFrequency.toFixed(2)} Hz) exceeds original frequency (${originalFrequency.toFixed(2)} Hz).`);
                return;
            }

            // Perform resampling
            window.resampleTimeSeriesData(targetFrequency, originalFrequency);
        } else {
            // Just update time unit metadata
            alert(`Time unit updated to ${targetUnit}. Data will be converted when saved.`);
        }
    };

    window.resampleTimeSeriesData = async function (targetFrequency, originalFrequency) {
        try {
            const fileId = window.timeSeriesData.uploadId;
            const response = await fetch(`${window.API_BASE_URL || ""}/api/time-series/resample`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: fileId,
                    target_frequency: targetFrequency,
                    original_frequency: originalFrequency,
                    method: 'average'
                })
            });

            if (response.ok) {
                const result = await response.json();
                window.timeSeriesData.rawData = result.data;
                window.timeSeriesData.frequency = targetFrequency;
                window.timeSeriesData.currentFrequency = targetFrequency;
                
                alert(`Data resampled to ${targetFrequency.toFixed(2)} Hz (${(1/targetFrequency).toFixed(4)} seconds per sample)`);
                window.renderTimeSeriesResampleInterface();
            } else {
                const error = await response.json();
                alert(`Error resampling data: ${error.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error resampling time series data:', error);
            alert(`Error resampling data: ${error.message}`);
        }
    };

    window.saveTimeSeriesChanges = function () {
        // Calculate features if any
        if (window.timeSeriesFeatures.createdFeatures && window.timeSeriesFeatures.createdFeatures.length > 0) {
            window.calculateTimeSeriesFeatures();
        }

        // Update time series data
        window.timeSeriesData.metadata.timeUnit = window.timeSeriesFeatures.timeUnit;
        window.timeSeriesData.metadata.currentFrequency = window.timeSeriesData.frequency;

        // Save to localStorage
        localStorage.setItem('timeSeriesData', JSON.stringify(window.timeSeriesData));
        localStorage.setItem('timeSeriesFeatures', JSON.stringify(window.timeSeriesFeatures));

        alert('Time series changes saved successfully!');
    };

    console.log('Time Series Resample module loaded');
})();





