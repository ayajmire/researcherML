// Time Series Viewer Module - Handles time series data viewing
(function () {
    'use strict';

    // Ensure global variables exist
    if (typeof window.timeSeriesData === 'undefined') {
        window.timeSeriesData = {
            rawData: null,
            frequency: null,
            timestamps: [],
            signals: {},
            uploadId: null,
            metadata: {
                taskType: null,
                originalFrequency: null,
                currentFrequency: null
            }
        };
    }

    window.showTimeSeriesViewer = async function (data) {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) {
            console.error('viewerContent not found');
            return;
        }

        console.log('⏱️ Showing time series viewer for data:', data);

        // Show loading state
        viewerContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="spinner" style="margin: 0 auto 20px;"></div>
                <div>Loading time series data...</div>
            </div>
        `;

        const fileId = data.file_ids && data.file_ids.length > 0 ? data.file_ids[0] : null;
        if (!fileId) {
            viewerContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                    <h4>Error</h4>
                    <p>No file ID found in uploaded data</p>
                </div>
            `;
            return;
        }

        try {
            // Fetch time series data from backend
            const response = await fetch(`http://localhost:8000/api/data/${fileId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const fileData = await response.json();
            console.log('⏱️ Time series file data:', fileData);

            // Time series data can be stored as 'tabular' - check if user selected time_series model type
            const isTimeSeriesModel = data.selected_model_type === 'time_series' || data.detected_type === 'time_series';
            const isTabularData = fileData.type === 'tabular' || fileData.type === 'time_series';
            
            if (!isTabularData && fileData.type !== 'time_series') {
                viewerContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #e53e3e;">
                        <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                        <h4>Error</h4>
                        <p>Cannot display time series data. File type: ${fileData.type}</p>
                    </div>
                `;
                return;
            }

            // If it's tabular data but user selected time_series, treat it as time series
            // Time series IS tabular data, just organized as signal data
            if (fileData.type === 'tabular' && isTimeSeriesModel) {
                console.log('✅ Treating tabular data as time series (user selected time_series model type)');
                // Convert tabular data structure to time series structure
                fileData.type = 'time_series';
                // Detect signal columns (numeric columns that aren't time-related)
                if (!fileData.signal_columns && fileData.columns) {
                    fileData.signal_columns = fileData.columns.filter(col => {
                        const colLower = col.toLowerCase();
                        return !colLower.includes('time') && 
                               !colLower.includes('timestamp') && 
                               !colLower.includes('date') &&
                               !colLower.includes('sample') &&
                               !colLower.includes('index');
                    });
                }
                // Estimate frequency if not provided (default to 1 Hz)
                if (!fileData.frequency) {
                    fileData.frequency = 1.0;
                    console.log('⚠️ Frequency not detected, defaulting to 1 Hz');
                }
            }

            // Store time series data globally
            // Handle both time_series and tabular data formats
            // Time series data IS tabular data, just organized as signal data
            const timeSeriesData = fileData.data || fileData.preview_data || [];
            const sampleCount = fileData.sample_count || fileData.shape?.[0] || timeSeriesData.length;
            const columns = fileData.columns || [];
            
            // Auto-detect signal columns if not provided (numeric columns excluding time-related)
            let signalColumns = fileData.signal_columns || [];
            if (signalColumns.length === 0 && columns.length > 0) {
                signalColumns = columns.filter(col => {
                    const colLower = col.toLowerCase();
                    return !colLower.includes('time') && 
                           !colLower.includes('timestamp') && 
                           !colLower.includes('date') &&
                           !colLower.includes('sample') &&
                           !colLower.includes('index') &&
                           !colLower.includes('id');
                });
                // If all columns are filtered out, use all columns except first (likely time/index)
                if (signalColumns.length === 0 && columns.length > 1) {
                    signalColumns = columns.slice(1);
                } else if (signalColumns.length === 0 && columns.length === 1) {
                    // Only one column - use it as signal
                    signalColumns = columns;
                }
            }

            // Estimate frequency if not provided
            // Try to detect from data if possible, otherwise default to 1 Hz
            let frequency = fileData.frequency || 1.0;
            if (!fileData.frequency && timeSeriesData.length > 1) {
                // Try to detect frequency from timestamps if available
                const timeColumn = columns.find(col => {
                    const colLower = col.toLowerCase();
                    return colLower.includes('time') || colLower.includes('timestamp') || colLower.includes('date');
                });
                
                if (timeColumn && timeSeriesData.length > 1) {
                    try {
                        const firstTime = parseFloat(timeSeriesData[0][timeColumn]);
                        const secondTime = parseFloat(timeSeriesData[1][timeColumn]);
                        if (!isNaN(firstTime) && !isNaN(secondTime) && secondTime > firstTime) {
                            const timeDiff = secondTime - firstTime;
                            if (timeDiff > 0) {
                                frequency = 1.0 / timeDiff;
                                console.log('✅ Detected frequency from timestamps:', frequency, 'Hz');
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ Could not detect frequency from timestamps, using default 1 Hz');
                    }
                }
            }

            window.timeSeriesData = {
                rawData: timeSeriesData,
                fullData: fileData.data || null,
                frequency: frequency,
                sampleCount: sampleCount,
                signalColumns: signalColumns,
                columns: columns,
                uploadId: fileId,
                metadata: {
                    taskType: data.selected_model_action || 'classification',
                    originalFrequency: frequency,
                    currentFrequency: frequency,
                    timeUnit: 'seconds' // Default time unit
                }
            };

            console.log('✅ Time series data initialized:', {
                sampleCount: window.timeSeriesData.sampleCount,
                frequency: window.timeSeriesData.frequency,
                signalColumns: window.timeSeriesData.signalColumns.length,
                columns: window.timeSeriesData.columns.length,
                dataRows: window.timeSeriesData.rawData.length,
                dataType: fileData.type,
                modelType: data.selected_model_type
            });

            // Display time series data table immediately with available data
            window.renderTimeSeriesTable();

            // If we only have preview data, try to load full dataset in background
            // Check if we have full data or just preview
            const hasFullData = fileData.data && fileData.data.length > 0;
            const hasPreviewOnly = fileData.preview_data && (!fileData.data || fileData.data.length === 0);
            
            if (hasPreviewOnly) {
                console.log('📊 Loading full dataset in background...');
                window.loadFullTimeSeriesData(fileId).then(() => {
                    // Update table with full data once loaded
                    console.log('✅ Full dataset loaded, updating table');
                    window.renderTimeSeriesTable();
                });
            } else if (hasFullData) {
                console.log('✅ Full dataset already loaded:', fileData.data.length, 'rows');
            }

        } catch (error) {
            console.error('Error loading time series data:', error);
            viewerContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                    <h4>Error Loading Time Series Data</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    };

    window.loadFullTimeSeriesData = async function (fileId) {
        try {
            // Fetch full dataset from backend
            const response = await fetch(`http://localhost:8000/api/data/${fileId}?full=true`);
            if (!response.ok) {
                // If full data endpoint doesn't exist, use preview data
                console.warn('Full data endpoint not available, using preview data');
                return;
            }

            const fileData = await response.json();
            if (fileData.data) {
                window.timeSeriesData.fullData = fileData.data;
                window.timeSeriesData.rawData = fileData.data;
                console.log('✅ Loaded full time series data:', fileData.data.length, 'rows');
            }
        } catch (error) {
            console.warn('Could not load full dataset, using preview:', error);
            // Continue with preview data
        }
    };

    window.renderTimeSeriesTable = function () {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;

        const data = window.timeSeriesData.rawData || [];
        const columns = window.timeSeriesData.columns || [];
        const frequency = window.timeSeriesData.frequency || 1;
        const sampleCount = window.timeSeriesData.sampleCount || window.timeSeriesData.sample_count || data.length;

        if (data.length === 0) {
            viewerContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">📊</div>
                    <h4>No Data Available</h4>
                    <p>Time series data is empty</p>
                </div>
            `;
            return;
        }

        // Create scrollable table with all data
        let tableHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 10px;">Time Series Dataset</h3>
                <div style="display: flex; gap: 20px; margin-bottom: 15px; flex-wrap: wrap; align-items: center;">
                    <div style="padding: 10px; background: #f7fafc; border-radius: 8px;">
                        <strong>Sample Count:</strong> ${sampleCount.toLocaleString()}
                    </div>
                    <div style="padding: 10px; background: #f7fafc; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
                        <strong>Frequency:</strong> 
                        <input type="number" 
                               id="frequencyInput" 
                               value="${frequency}" 
                               step="0.01" 
                               min="0.01" 
                               max="1000000"
                               style="width: 100px; padding: 4px 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 0.9rem; text-align: right;"
                               onchange="window.updateFrequency(this.value)">
                        <span>Hz</span>
                        <button onclick="window.applyFrequencyChange()" 
                                id="applyFreqBtn"
                                style="margin-left: 8px; padding: 4px 12px; background: #0071e3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 500; display: none;">
                            Apply
                        </button>
                    </div>
                    <div style="padding: 10px; background: #f7fafc; border-radius: 8px;">
                        <strong>Duration:</strong> <span id="durationDisplay">${(sampleCount / frequency).toFixed(2)}</span> seconds
                    </div>
                    <div style="padding: 10px; background: #f7fafc; border-radius: 8px;">
                        <strong>Signal Columns:</strong> ${(window.timeSeriesData.signalColumns || []).length}
                    </div>
                    <div style="padding: 10px; background: #f7fafc; border-radius: 8px;">
                        <strong>Displayed Rows:</strong> ${data.length.toLocaleString()}
                    </div>
                </div>
            </div>
            <div style="overflow-x: auto; overflow-y: auto; max-height: 70vh; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
                <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                    <thead style="position: sticky; top: 0; background: #f7fafc; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <tr>
                            ${columns.map((col, idx) => `<th style="padding: 12px 16px; text-align: ${idx === 0 ? 'left' : 'right'}; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #2d3748; white-space: nowrap;">${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Add all rows - allow scrolling through full dataset
        data.forEach((row, index) => {
            const rowStyle = index % 2 === 0 ? 'background: #ffffff;' : 'background: #f9fafb;';
            tableHTML += `<tr style="border-bottom: 1px solid #e8e8ed; ${rowStyle}">`;
            columns.forEach((col, colIdx) => {
                const value = row[col];
                let displayValue = value;
                const textAlign = colIdx === 0 ? 'left' : 'right';
                
                // Format numeric values
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        displayValue = value.toLocaleString();
                    } else {
                        displayValue = value.toFixed(6);
                    }
                } else if (value === null || value === undefined || value === '') {
                    displayValue = '<span style="color: #a0aec0;">—</span>';
                } else {
                    displayValue = String(value);
                    // Escape HTML to prevent XSS
                    displayValue = displayValue.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                
                tableHTML += `<td style="padding: 10px 16px; color: #4a5568; text-align: ${textAlign}; font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;">${displayValue}</td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 15px; padding: 12px; background: #f7fafc; border-radius: 8px; font-size: 0.9rem; color: #718096; display: flex; justify-content: space-between; align-items: center;">
                <span>Showing ${data.length.toLocaleString()} of ${sampleCount.toLocaleString()} samples</span>
                ${data.length < sampleCount ? '<span style="color: #d69e2e;">⚠️ Showing preview - scroll to view all data</span>' : '<span style="color: #34c759;">✅ All data loaded</span>'}
            </div>
        `;

        viewerContent.innerHTML = tableHTML;
        
        // Add event listeners for frequency input
        const frequencyInput = document.getElementById('frequencyInput');
        const initialFrequency = frequency; // Store initial frequency for comparison
        if (frequencyInput) {
            // Update duration in real-time as user types
            frequencyInput.addEventListener('input', function() {
                const newFreq = parseFloat(this.value);
                if (isNaN(newFreq) || newFreq <= 0) return;
                
                const currentSampleCount = window.timeSeriesData.sampleCount || window.timeSeriesData.rawData.length;
                const duration = currentSampleCount / newFreq;
                const durationDisplay = document.getElementById('durationDisplay');
                if (durationDisplay) {
                    durationDisplay.textContent = duration.toFixed(2);
                }
                
                // Show apply button if frequency changed from initial
                const applyBtn = document.getElementById('applyFreqBtn');
                const currentFreq = window.timeSeriesData.frequency || initialFrequency;
                if (applyBtn && Math.abs(newFreq - currentFreq) > 0.001) {
                    applyBtn.style.display = 'inline-block';
                } else if (applyBtn) {
                    applyBtn.style.display = 'none';
                }
            });
            
            // Also update on blur (when user leaves the field)
            frequencyInput.addEventListener('blur', function() {
                const newFreq = parseFloat(this.value);
                if (!isNaN(newFreq) && newFreq > 0) {
                    const currentFreq = window.timeSeriesData.frequency || initialFrequency;
                    if (Math.abs(newFreq - currentFreq) > 0.001) {
                        window.updateFrequency(newFreq);
                    }
                }
            });
            
            // Update on Enter key
            frequencyInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const newFreq = parseFloat(this.value);
                    if (!isNaN(newFreq) && newFreq > 0) {
                        window.updateFrequency(newFreq);
                        this.blur(); // Remove focus
                    }
                }
            });
        }
    };

    // Update frequency function
    window.updateFrequency = function(newFrequency) {
        if (!window.timeSeriesData) {
            console.error('Time series data not initialized');
            return;
        }
        
        const freq = parseFloat(newFrequency);
        if (isNaN(freq) || freq <= 0) {
            alert('Frequency must be a positive number');
            return;
        }
        
        // Update frequency in global data
        window.timeSeriesData.frequency = freq;
        window.timeSeriesData.metadata.currentFrequency = freq;
        
        // Update duration display
        const sampleCount = window.timeSeriesData.sampleCount || window.timeSeriesData.rawData.length;
        const duration = sampleCount / freq;
        const durationDisplay = document.getElementById('durationDisplay');
        if (durationDisplay) {
            durationDisplay.textContent = duration.toFixed(2);
        }
        
        // Hide apply button
        const applyBtn = document.getElementById('applyFreqBtn');
        if (applyBtn) {
            applyBtn.style.display = 'none';
        }
        
        // Save to localStorage
        localStorage.setItem('timeSeriesData', JSON.stringify(window.timeSeriesData));
        
        console.log('✅ Frequency updated to:', freq, 'Hz');
    };

    // Apply frequency change function (called by button)
    window.applyFrequencyChange = function() {
        const frequencyInput = document.getElementById('frequencyInput');
        if (frequencyInput) {
            window.updateFrequency(frequencyInput.value);
        }
    };

    console.log('Time Series Viewer module loaded');
})();





