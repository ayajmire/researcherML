// Upload Module - Handles file upload, drag & drop, and upload UI
(function () {
    'use strict';

    // Initialize upload event listeners
    function initUploadListeners() {
        const uploadBox = document.getElementById('uploadBox');
        const fileInput = document.getElementById('fileInput');

        if (!uploadBox || !fileInput) return;

        // Helper function to check if we're on the upload tab
        function isUploadTabActive() {
            // Check if upload section is visible
            const uploadSection = document.getElementById('uploadSection');
            if (!uploadSection) return false;
            const style = window.getComputedStyle(uploadSection);
            return style.display !== 'none' && style.visibility !== 'hidden';
        }

        // Drag and drop functionality - only work on upload tab
        uploadBox.addEventListener('dragover', (e) => {
            if (!isUploadTabActive()) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            uploadBox.classList.add('dragover');
        });

        uploadBox.addEventListener('dragleave', () => {
            if (!isUploadTabActive()) return;
            uploadBox.classList.remove('dragover');
        });

        uploadBox.addEventListener('drop', (e) => {
            if (!isUploadTabActive()) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            uploadBox.classList.remove('dragover');
            window.handleFiles(e.dataTransfer.files);
        });

        // Upload box click - if upload box is visible and clickable, user is on upload tab
        uploadBox.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change - process files immediately
        // The upload box is only visible on upload tab, so if user clicks it, they're on upload tab
        fileInput.addEventListener('change', (e) => {
            console.log('File input changed, files:', e.target.files);
            if (e.target.files && e.target.files.length > 0) {
                console.log('Processing files...');
                window.handleFiles(e.target.files);
            } else {
                console.log('No files selected');
            }
        });

    }

    window.handleFiles = function (files) {
        console.log('handleFiles called with', files.length, 'files');

        window.selectedFiles = []; // Clear previous files

        if (files.length > 0) {
            // Only allow single file for all model types
            if (files.length > 1) {
                alert('Please select only one file.');
                return;
            }
            window.selectedFiles.push(files[0]);
            console.log('File selected:', files[0].name, 'Size:', files[0].size);
        }

        window.updateFileList();
        window.updateUploadButton();
        console.log('Upload button state after file selection. selectedFiles:', window.selectedFiles.length, 'modelType:', window.selectedModelType, 'modelAction:', window.selectedModelAction);
    };

    window.openFilePicker = function () {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    };

    // Background full dataset fetching -------------------------------------------------
    function showBackgroundDatasetNotice(message) {
        const existing = document.getElementById('backgroundDatasetNotice');
        if (existing) {
            existing.querySelector('span').textContent = message;
            return existing;
        }
        const notice = document.createElement('div');
        notice.id = 'backgroundDatasetNotice';
        notice.style.cssText = 'position: fixed; bottom: 24px; right: 24px; background: rgba(17, 24, 39, 0.92); color: white; padding: 14px 18px; border-radius: 10px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25); display: flex; align-items: center; gap: 10px; font-size: 0.9rem; z-index: 12000; max-width: 320px;';
        notice.innerHTML = `
            <div class="spinner" style="border: 3px solid rgba(255,255,255,0.2); border-top: 3px solid #38bdf8; border-radius: 999px; width: 22px; height: 22px; animation: spin 1s linear infinite;"></div>
            <span>${message}</span>
        `;
        document.body.appendChild(notice);
        return notice;
    }

    function removeBackgroundDatasetNotice() {
        const existing = document.getElementById('backgroundDatasetNotice');
        if (existing) {
            existing.remove();
        }
    }

    window.fetchFullDatasetInBackground = function (fileId, options = {}) {
        const { showNotice = true } = options;
        if (!fileId) return null;

        if (window.fullDatasetLoaded && window.fullDatasetFileId === fileId && window.allData && window.allData.length > 1000) {
            return Promise.resolve(window.allData);
        }

        if (window.fullDatasetPromise) {
            return window.fullDatasetPromise;
        }

        console.log('📥 Starting background fetch for full dataset...');
        window.fullDatasetLoaded = false;
        window.fullDatasetFileId = fileId;

        let noticeEl = null;
        if (showNotice) {
            noticeEl = showBackgroundDatasetNotice('Loading full dataset in the background...');
        }

        window.fullDatasetPromise = (async () => {
            try {
                const fullResponse = await fetch(`http://localhost:8000/api/data/${fileId}?full=true`);
                if (!fullResponse.ok) {
                    throw new Error(`Full dataset fetch failed with status ${fullResponse.status}`);
                }
                const fullData = await fullResponse.json();
                if (fullData && fullData.type === 'tabular' && Array.isArray(fullData.data) && fullData.data.length > 0) {
                    console.log(`✅ Full dataset loaded in background: ${fullData.data.length} rows, ${fullData.columns ? fullData.columns.length : 'unknown'} columns`);
                    window.allData = fullData.data;
                    window.allColumns = fullData.columns || window.allColumns || [];
                    window.fullDatasetLoaded = true;
                    try {
                        const serialized = JSON.stringify(window.allData);
                        if (serialized.length <= 5 * 1024 * 1024) {
                            localStorage.setItem('allData', serialized);
                            localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
                        }
                    } catch (storageError) {
                        console.warn('Full dataset too large for localStorage');
                    }

                    // Only refresh UI, don't recalculate features automatically
                    // Feature recalculation will happen when user performs actions that need it
                    if (window.refreshNavigationAvailability) {
                        window.refreshNavigationAvailability();
                    }
                    if (window.refreshDataViewerIfVisible) {
                        window.refreshDataViewerIfVisible();
                    }
                    if (window.refreshCleaningInterfaceIfVisible) {
                        window.refreshCleaningInterfaceIfVisible();
                    }
                } else {
                    console.warn('Full dataset response missing data array, keeping preview data.');
                }
            } catch (error) {
                console.error('❌ Error fetching full dataset in background:', error);
            } finally {
                if (noticeEl) {
                    noticeEl.querySelector('span').textContent = window.fullDatasetLoaded ? 'Full dataset loaded successfully.' : 'Unable to load full dataset.';
                    setTimeout(removeBackgroundDatasetNotice, 2500);
                }
                window.fullDatasetPromise = null;
            }
        })();

        return window.fullDatasetPromise;
    };

    // -------------------------------------------------------------------------------


    window.updateFileList = function () {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        fileList.innerHTML = window.selectedFiles.map(file => `
            <div class="file-item">
                <div class="file-icon">${window.getFileIcon(file.name)}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${window.formatFileSize(file.size)}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="reupload-btn" onclick="window.reuploadFile()" style="background: #0071e3; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Reupload</button>
                    <button class="remove-btn" onclick="removeFile('${file.name}')">Remove</button>
                </div>
            </div>
        `).join('');
    };

    window.removeFile = function (filename) {
        window.selectedFiles = [];
        window.updateFileList();
        window.updateUploadButton();
        // Clear the file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    };

    window.reuploadFile = function () {
        // Clear old data and state
        window.allData = [];
        window.allColumns = [];
        window.fullDatasetLoaded = false;
        window.fullDatasetFileId = null;
        window.fullDatasetPromise = null;
        window.uploadedData = null;
        
        // Clear localStorage
        try {
            localStorage.removeItem('allData');
            localStorage.removeItem('allColumns');
            localStorage.removeItem('uploadedData');
        } catch (e) {
            console.warn('Error clearing localStorage:', e);
        }
        
        // Remove background dataset notice if visible
        removeBackgroundDatasetNotice();
        
        // Clear file input and open file picker
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    };

    window.selectModelType = function (type) {
        window.selectedModelType = type;
        document.querySelectorAll('[data-type]').forEach(option => {
            option.classList.remove('selected');
        });
        const selected = document.querySelector(`[data-type="${type}"]`);
        if (selected) selected.classList.add('selected');

        // Store selected model type in localStorage so it persists
        localStorage.setItem('selectedModelType', type);
        console.log('💾 Stored selected model type in localStorage:', type);

        // Update upload subtext
        const uploadSubtext = document.getElementById('uploadSubtext');
        if (uploadSubtext) {
            uploadSubtext.textContent = 'or click to browse (single file only)';
        }

        // Render navigation based on model type IMMEDIATELY when selected
        if (window.renderNavigation) {
            console.log('🎯 User selected model type:', type, '- Rendering navigation...');
            window.renderNavigation(type);
        }

        // Show model type confirmation/verification
        window.showModelTypeVerification(type);

        window.updateUploadButton();
    };

    // Show model type verification message
    window.showModelTypeVerification = function (type) {
        const modelSelection = document.getElementById('modelSelection');
        if (!modelSelection) return;

        // Remove any existing verification message
        const existingVerification = document.getElementById('modelTypeVerification');
        if (existingVerification) {
            existingVerification.remove();
        }

        // Create verification message
        const verificationDiv = document.createElement('div');
        verificationDiv.id = 'modelTypeVerification';
        verificationDiv.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: #e6fffa;
            border: 2px solid #38b2ac;
            border-radius: 8px;
            color: #234e52;
            font-size: 0.95rem;
        `;

        let message = '';
        let workflow = '';

        if (type === 'ehr') {
            message = '✅ <strong>EHR/Tabular Pipeline Selected</strong>';
            workflow = `
                <div style="margin-top: 10px; font-size: 0.9rem;">
                    <strong>Workflow:</strong> Upload Data → View Dataset → Clean Data → Feature Engineering → Train Model
                </div>
                <div style="margin-top: 8px; font-size: 0.85rem; color: #2c7a7b;">
                    Note: This pipeline is for tabular data. Full data cleaning and feature engineering available.
                </div>
            `;
        } else if (type === 'time_series') {
            message = '✅ <strong>Time Series Pipeline Selected</strong>';
            workflow = `
                <div style="margin-top: 10px; font-size: 0.9rem;">
                    <strong>Workflow:</strong> Upload Time Series Data → View Data → Clean & Resample → Train Model
                </div>
                <div style="margin-top: 8px; font-size: 0.85rem; color: #2c7a7b;">
                    Note: This pipeline supports frequency analysis and conversion (downsampling) for time series data.
                </div>
            `;
        }

        verificationDiv.innerHTML = `
            ${message}
            ${workflow}
        `;

        // Insert after model selection options
        const modelOptions = modelSelection.querySelector('.model-options');
        if (modelOptions && modelOptions.parentNode) {
            modelOptions.parentNode.insertBefore(verificationDiv, modelOptions.nextSibling);
        }
    };

    window.selectModelAction = function (action) {
        window.selectedModelAction = action;
        document.querySelectorAll('[data-action]').forEach(option => {
            option.classList.remove('selected');
        });
        const selected = document.querySelector(`[data-action="${action}"]`);
        if (selected) selected.classList.add('selected');
        window.updateUploadButton();
    };

    window.updateUploadButton = function () {
        const canUpload = window.selectedFiles.length > 0 && window.selectedModelType && window.selectedModelAction;
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = !canUpload;
            console.log('Upload button updated. disabled:', !canUpload, 'canUpload:', canUpload);
        }
    };

    window.uploadFiles = async function () {
        if (window.selectedFiles.length === 0 || !window.selectedModelType || !window.selectedModelAction) return;

        // Check if there's existing data and prompt user to save it
        // BUT preserve the selected model type for navigation consistency
        const preservedModelType = window.selectedModelType || localStorage.getItem('selectedModelType');

        if (window.uploadedData || (window.allData && window.allData.length > 0)) {
            const shouldSave = confirm(
                'You have existing data loaded. Would you like to save the current dataset to your device before uploading a new file?\n\n' +
                'Click "OK" to download the current dataset as JSON, or "Cancel" to proceed without saving.'
            );

            if (shouldSave) {
                window.saveCurrentDataset();
            }

            window.clearAllCachedData();

            // Restore the preserved model type after clearing
            if (preservedModelType) {
                window.selectedModelType = preservedModelType;
                localStorage.setItem('selectedModelType', preservedModelType);
                // Re-render navigation with preserved type
                if (window.renderNavigation) {
                    window.renderNavigation(preservedModelType);
                }
            }
        }

        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const uploadBtn = document.getElementById('uploadBtn');

        // Set upload in progress flag
        window.isUploadInProgress = true;

        // Disable upload button to prevent double uploads
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = 'Processing...';
        }

        if (loading) loading.style.display = 'block';
        if (result) result.style.display = 'none';

        try {
            const formData = new FormData();
            window.selectedFiles.forEach(file => {
                formData.append('files', file);
                console.log(`Adding file to upload: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            });
            formData.append('model_type', window.selectedModelType);
            formData.append('model_action', window.selectedModelAction);

            console.log('Starting upload request...');
            const startTime = Date.now();

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 120000); // 2 minute timeout

            let response;
            try {
                response = await fetch('http://localhost:8000/api/upload', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`Upload request completed in ${elapsed}s`);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                // Clear loading state immediately on error
                if (loading) loading.style.display = 'none';
                window.isUploadInProgress = false;
                if (uploadBtn) {
                    uploadBtn.disabled = false;
                    uploadBtn.innerHTML = 'Upload & Process File';
                }
                if (fetchError.name === 'AbortError') {
                    throw new Error('Upload timeout: The server took too long to process your file. The file might be too large or the server is overloaded. Please try again or use a smaller file.');
                }
                throw new Error(`Network error: ${fetchError.message}. Please check if the server is running.`);
            }

            if (!response.ok) {
                // Clear loading state immediately on error
                if (loading) loading.style.display = 'none';
                window.isUploadInProgress = false;
                if (uploadBtn) {
                    uploadBtn.disabled = false;
                    uploadBtn.innerHTML = 'Upload & Process File';
                }
                let errorMessage = `Upload failed: HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `${errorMessage} - ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Upload response received:', data);

            // Clear loading state immediately after upload completes
            if (loading) loading.style.display = 'none';
            window.isUploadInProgress = false;
            
            // Re-enable upload button
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = 'Upload & Process File';
            }

            if (response.ok) {
                // Verify model type matches detected type
                const selectedType = data.selected_model_type;
                const detectedType = data.detected_type;

                // Map model types to expected detected types
                const typeMapping = {
                    'ehr': ['ehr', 'tabular'],
                    'imaging': ['imaging'],
                    'time_series': ['time_series', 'signal']
                };

                const expectedTypes = typeMapping[selectedType] || [];
                const typeMatches = expectedTypes.includes(detectedType);

                // Show verification message
                let verificationHtml = '';
                if (typeMatches) {
                    verificationHtml = `<div style="color: #10b981; margin-top: 10px; padding: 8px; background: #d1fae5; border: 1px solid #34d399; border-radius: 4px; font-size: 0.9rem;">
                        ✓ Verified: Selected model type "${selectedType}" matches detected data type "${detectedType}"
                    </div>`;
                } else {
                    verificationHtml = `<div style="color: #dc2626; margin-top: 10px; padding: 8px; background: #fee2e2; border: 1px solid #f87171; border-radius: 4px; font-size: 0.9rem;">
                        ⚠ Warning: Selected model type "${selectedType}" may not match detected data type "${detectedType}". Please verify your selection is correct.
                    </div>`;
                }

                if (result) {
                    result.className = 'result success';
                    let warningHtml = '';
                    if (data.warning) {
                        const warningClass = data.folder_structure_valid === false ? 'error' : 'warning';
                        const warningBg = data.folder_structure_valid === false ? '#fee2e2' : '#fefcbf';
                        const warningBorder = data.folder_structure_valid === false ? '#f87171' : '#f6e05e';
                        warningHtml = `<div style="color: #d69e2e; margin-top: 10px; padding: 8px; background: ${warningBg}; border: 1px solid ${warningBorder}; border-radius: 4px; font-size: 0.9rem;">${data.warning}</div>`;
                    }
                    result.innerHTML = `
                        <strong>Success!</strong><br>
                        ${data.message}<br>
                        <small>Detected type: ${data.detected_type} | Selected model: ${data.selected_model_type} | Action: ${data.selected_model_action}</small>
                        ${verificationHtml}
                        ${warningHtml}
                        <div style="margin-top: 20px; text-align: center;">
                            <button onclick="window.handleNewUploadClick(event)" 
                                    style="background: #0071e3; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                                Upload New Dataset
                            </button>
                        </div>
                    `;
                    result.style.display = 'block';
                }

                // Store uploaded data
                window.uploadedData = data;

                // CRITICAL: Use USER'S SELECTED model type FIRST (from window.selectedModelType or localStorage)
                // This ensures navigation stays as the user selected, not what backend detected
                const userSelectedType = window.selectedModelType || localStorage.getItem('selectedModelType');
                const actualModelType = userSelectedType || selectedType || data.detected_type || data.selected_model_type || 'ehr';

                console.log('📊 Model type determination:', {
                    userSelectedType: userSelectedType,
                    windowSelectedModelType: window.selectedModelType,
                    localStorageSelectedModelType: localStorage.getItem('selectedModelType'),
                    selectedType: selectedType,
                    detected_type: data.detected_type,
                    dataSelectedModelType: data.selected_model_type,
                    actualModelType: actualModelType
                });

                // For tabular/EHR data
                window.dataModified = false;
                localStorage.removeItem('dataModified');
                localStorage.removeItem('timeSeriesData');

                console.log('✅ Tabular/EHR data mode');

                // Persist uploaded data to localStorage (with correct model type)
                data.selected_model_type = actualModelType; // Ensure correct model type is stored
                localStorage.setItem('uploadedData', JSON.stringify(data));
                // Also persist the selected model type separately
                localStorage.setItem('selectedModelType', actualModelType);
                window.uploadedData = data; // Update global variable
                window.selectedModelType = actualModelType; // Keep it in memory

                console.log('💾 Persisted model type:', actualModelType, 'to localStorage and window.selectedModelType');

                // CRITICAL: Render navigation FIRST with correct model type
                // This must happen BEFORE data loading so navigation is ready
                if (window.renderNavigation) {
                    console.log('🎯 Rendering navigation for model type:', actualModelType);
                    window.renderNavigation(actualModelType);
                    // Wait for navigation to be fully rendered
                    await new Promise(resolve => setTimeout(resolve, 200));
                    console.log('✅ Navigation rendered, continuing with data load...');
                } else {
                    console.error('❌ renderNavigation function not available!');
                }

                // For tabular/EHR data, load FULL dataset immediately
                if (actualModelType === 'ehr' || actualModelType === 'tabular') {
                    console.log('📊 Tabular/EHR data detected - loading FULL dataset...');

                    const fileId = data.file_ids[0];
                    
                    // Load FULL dataset immediately
                    try {
                        const fullResponse = await fetch(`http://localhost:8000/api/data/${fileId}?full=true`);
                        if (fullResponse.ok) {
                            const fullData = await fullResponse.json();
                            if (fullData.type === 'tabular' && fullData.data) {
                                window.allData = fullData.data;
                                window.allColumns = fullData.columns || [];
                                window.totalDatasetRows = fullData.shape ? fullData.shape[0] : window.allData.length;
                                window.totalDatasetCols = fullData.shape ? fullData.shape[1] : window.allColumns.length;
                                window.fullDatasetLoaded = true;
                                window.currentFileId = fileId;
                                
                                console.log(`✅ Full dataset loaded: ${window.allData.length} rows, ${window.allColumns.length} columns`);
                                
                                // Try to save to localStorage
                                try {
                                    const serialized = JSON.stringify(window.allData);
                                    if (serialized.length <= 5 * 1024 * 1024) {
                                        localStorage.setItem('allData', serialized);
                                        localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
                                    }
                                } catch (storageError) {
                                    console.warn('Dataset too large for localStorage');
                                }
                                
                                // Show data viewer with full dataset
                                if (window.showDataViewer) {
                                    window.showDataViewer(data);
                                }
                                
                                // Refresh navigation
                                if (window.refreshNavigationAvailability) {
                                    window.refreshNavigationAvailability();
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error loading full dataset:', error);
                        // Show data viewer anyway
                        if (window.showDataViewer) {
                            window.showDataViewer(data);
                        }
                    }
                } else if (window.showDataViewer) {
                    // For other types, show the viewer
                    window.showDataViewer(data);
                }

                if (window.setActiveStep) {
                    window.setActiveStep('viewer');
                }

                // Clear the form (BUT keep selectedModelType for navigation consistency)
                window.selectedFiles = [];
                // DON'T clear selectedModelType - we want navigation to stay the same
                // window.selectedModelType = null; // REMOVED - keep model type for navigation
                window.selectedModelAction = null;
                window.updateFileList();
                // Keep model type selection highlighted
                // document.querySelectorAll('.model-option').forEach(option => {
                //     option.classList.remove('selected');
                // });

                // Hide upload button after successful upload - use sidebar navigation instead
                // The "Upload New Dataset" button is now shown in the result message
                const newUploadBtn = document.getElementById('newUploadBtn');
                if (newUploadBtn) {
                    newUploadBtn.style.display = 'none';
                    newUploadBtn.style.visibility = 'hidden';
                }
                if (uploadBtn) {
                    uploadBtn.style.display = 'none';
                    uploadBtn.style.visibility = 'hidden';
                }

                // Hide the upload box after successful upload to make it clear a new dataset can be uploaded
                const uploadBox = document.getElementById('uploadBox');
                if (uploadBox) {
                    uploadBox.style.display = 'none';
                }
                const fileList = document.getElementById('fileList');
                if (fileList) {
                    fileList.style.display = 'none';
                }

                // Clear file input
                const fileInput = document.getElementById('fileInput');
                if (fileInput) fileInput.value = '';

                window.isUploadInProgress = false;

            } else {
                throw new Error(data.detail || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            window.isUploadInProgress = false;

            // Always hide loading state on error
            if (loading) {
                loading.style.display = 'none';
            }

            // Show error message
            if (result) {
                result.className = 'result error';
                result.innerHTML = `
                    <strong>Upload Error:</strong><br>
                    ${error.message || 'Unknown error occurred'}<br>
                    <small style="color: #6B7280; margin-top: 10px; display: block;">
                        Please check:
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>That the server is running (http://localhost:8000)</li>
                            <li>That your file is not corrupted</li>
                            <li>That your file size is reasonable (try a smaller file if this one is very large)</li>
                            <li>Check the browser console for more details</li>
                        </ul>
                    </small>
                    <button onclick="window.startNewUpload()" 
                            style="margin-top: 15px; padding: 8px 16px; background: #0071e3; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Try Again
                    </button>
                `;
                result.style.display = 'block';
            }

            // Re-enable upload button on error
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = 'Upload & Process File';
                uploadBtn.style.display = 'block';
                uploadBtn.style.visibility = 'visible';
                uploadBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #34D399 100%)';
            }

            // Show upload box again
            const uploadBox = document.getElementById('uploadBox');
            if (uploadBox) {
                uploadBox.style.display = 'block';
            }
            const fileList = document.getElementById('fileList');
            if (fileList) {
                fileList.style.display = 'block';
            }
        }
    };

    window.handleNewUploadClick = function (event) {
        // First, quickly show upload section so file input is accessible
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        if (uploadSection) {
            uploadSection.style.display = 'block';
            uploadSection.style.visibility = 'visible';
        }
        if (modelSelection) {
            modelSelection.style.display = 'block';
            modelSelection.style.visibility = 'visible';
        }

        // IMPORTANT: Open file picker IMMEDIATELY while still in user interaction chain
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
            fileInput.disabled = false;
            fileInput.click();
            console.log('File picker opened from user click');
        }

        // Then do the rest of the reset (after file picker is triggered)
        window.startNewUpload();
    };

    window.startNewUpload = function () {
        // Prompt user to confirm if they want to clear current data
        if (window.uploadedData || (window.allData && window.allData.length > 0)) {
            const shouldProceed = confirm(
                'Uploading a new dataset will clear the current dataset and all unsaved changes.\n\n' +
                'Do you want to continue?'
            );
            if (!shouldProceed) {
                return;
            }
        }

        // Clear all cached data first
        window.clearAllCachedData();

        // Show upload section and model selection
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
        const uploadBox = document.getElementById('uploadBox');
        const fileList = document.getElementById('fileList');

        // Show upload UI
        if (uploadSection) {
            uploadSection.style.display = 'block';
            uploadSection.style.visibility = 'visible';
        }
        if (modelSelection) {
            modelSelection.style.display = 'block';
            modelSelection.style.visibility = 'visible';
        }

        // Show upload box and file list again
        if (uploadBox) {
            uploadBox.style.display = 'block';
        }
        if (fileList) {
            fileList.style.display = 'block';
        }

        // Clear and hide result
        if (result) {
            result.innerHTML = '';
            result.style.display = 'none';
        }

        // Hide all other sections
        if (dataViewer) {
            dataViewer.style.display = 'none';
            dataViewer.style.visibility = 'hidden';
        }
        if (cleaningPage) {
            cleaningPage.style.display = 'none';
            cleaningPage.style.visibility = 'hidden';
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
        }
        if (newUploadBtn) {
            newUploadBtn.style.display = 'none';
        }
        if (uploadBtn) {
            uploadBtn.style.display = 'block';
        }

        // Reset form
        window.selectedFiles = [];
        window.selectedModelType = null;
        window.selectedModelAction = null;
        window.updateFileList();
        window.updateUploadButton();

        // Reset model selection visual state
        document.querySelectorAll('.model-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Clear file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // Ensure upload button is visible and reset properly
        if (uploadBtn) {
            uploadBtn.style.display = 'block';
            uploadBtn.style.visibility = 'visible';
            uploadBtn.disabled = true; // Will be enabled when file/model selected
            uploadBtn.innerHTML = 'Upload & Process File';
            uploadBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #34D399 100%)';
        }

        console.log('Upload form reset complete.');

        if (window.setActiveStep) {
            window.setActiveStep('upload');
        }

        if (window.refreshNavigationAvailability) {
            window.refreshNavigationAvailability();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUploadListeners);
    } else {
        initUploadListeners();
    }

    console.log('Upload module loaded');
})();
