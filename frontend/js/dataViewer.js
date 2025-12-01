// Data Viewer Module - Handles data viewing, pagination, and image browsing
(function () {
    'use strict';

    // Ensure global variables exist
    if (typeof window.allData === 'undefined') window.allData = [];
    if (typeof window.allColumns === 'undefined') window.allColumns = [];
    if (typeof window.currentPage === 'undefined') window.currentPage = 1;
    if (typeof window.rowsPerPage === 'undefined') window.rowsPerPage = 50;
    if (typeof window.uploadedData === 'undefined') window.uploadedData = null;
    if (typeof window.dataModified === 'undefined') window.dataModified = false;

    window.showDataViewer = function (data) {
        const dataViewer = document.getElementById('dataViewer');
        const viewerContent = document.getElementById('viewerContent');
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const newUploadBtn = document.getElementById('newUploadBtn');
        const cleaningPage = document.getElementById('cleaningPage');
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const visualizationPage = document.getElementById('visualizationPage');
        const modelTrainingPage = document.getElementById('modelTrainingPage');

        // Hide everything first (centralized)
        if (window.hideAllSections) window.hideAllSections();

        // Hide upload section and model selection
        if (uploadSection) {
            uploadSection.style.display = 'none';
            uploadSection.style.visibility = 'hidden';
        }
        if (modelSelection) {
            modelSelection.style.display = 'none';
            modelSelection.style.visibility = 'hidden';
        }

        // Hide other pages (safety)
        if (cleaningPage) { cleaningPage.style.display = 'none'; cleaningPage.style.visibility = 'hidden'; }
        if (featureEngineeringPage) { featureEngineeringPage.style.display = 'none'; featureEngineeringPage.style.visibility = 'hidden'; }
        if (visualizationPage) { visualizationPage.style.display = 'none'; visualizationPage.style.visibility = 'hidden'; }
        if (modelTrainingPage) { modelTrainingPage.style.display = 'none'; modelTrainingPage.style.visibility = 'hidden'; }

        // Show data viewer (no need for upload button - use sidebar navigation)
        if (dataViewer) {
            dataViewer.style.display = 'block';
            dataViewer.style.visibility = 'visible';
        }

        // Hide ALL upload buttons - they should only be visible on upload tab
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
            uploadBtn.style.visibility = 'hidden';
        }

        if (newUploadBtn) {
            newUploadBtn.style.display = 'none';
            newUploadBtn.style.visibility = 'hidden';
        }

        if (window.setActiveStep) {
            window.setActiveStep('viewer');
        }

        // Determine data type and route accordingly
        const dataToUse = data || window.uploadedData;

        if (!dataToUse) {
            console.error('❌ No data provided to showDataViewer');
            viewerContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📁</div>
                    <div>No data available</div>
                    <div style="font-size: 0.9rem; margin-top: 5px;">Please upload a dataset first</div>
                </div>
            `;
            return;
        }

        const modelType = dataToUse.selected_model_type || dataToUse.detected_type;

        console.log('🔍 Data viewer routing:', {
            hasData: !!dataToUse,
            detected_type: dataToUse.detected_type,
            selected_model_type: dataToUse.selected_model_type,
            modelType: modelType,
            fileIds: dataToUse.file_ids
        });

        {
            console.log('📊 Routing to data table (tabular/EHR)');
            window.showDataTable(dataToUse);
        }
    };

    window.showDataTable = async function (data) {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;

        // Check if data has been modified - if so, use existing allData
        if (window.dataModified && window.allData && window.allData.length > 0) {
            console.log('Data has been modified - using existing allData for viewer');
            // Use stored total or actual length (for modified data, it's the full dataset)
            const totalRows = window.totalDatasetRows || window.allData.length;
            const totalCols = window.totalDatasetCols || window.allColumns.length;

            window.showPaginatedData(window.allColumns, totalRows, totalCols);

            // Refresh navigation availability since allData is already populated
            if (window.refreshNavigationAvailability) {
                console.log('🔄 Refreshing navigation (data already modified)...');
                window.refreshNavigationAvailability();
                // Refresh again to ensure it sticks
                setTimeout(() => {
                    window.refreshNavigationAvailability();
                }, 100);
            }
            if (window.setActiveStep) {
                window.setActiveStep('viewer');
            }

            return;
        }

        viewerContent.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #718096;">
                <div class="spinner" style="margin: 0 auto 10px;"></div>
                Loading data...
            </div>
        `;

        try {
            // Get the first file ID from uploaded files
            if (!data || !data.file_ids || data.file_ids.length === 0) {
                throw new Error('No file IDs available');
            }

            const fileId = data.file_ids[0];
            console.log('📊 Fetching data for file_id:', fileId);
            
            // Check if we already have data in memory (from upload preview)
            if (window.allData && window.allData.length > 0) {
                console.log('✅ Using existing data in memory:', window.allData.length, 'rows');
                // Use existing data - don't fetch again
                // Use stored total dataset size for accurate display
                const totalRows = window.totalDatasetRows || window.allData.length;
                const totalCols = window.totalDatasetCols || window.allColumns.length;
                window.showPaginatedData(window.allColumns, totalRows, totalCols);
                if (window.setActiveStep) {
                    window.setActiveStep('viewer');
                }
                return;
            }
            
            // Load preview first (fast) - full dataset will load in background if needed
            const response = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}`);

            if (response.ok) {
                const fileData = await response.json();
                console.log('📊 File data received:', {
                    type: fileData.type,
                    hasData: !!fileData.data,
                    hasColumns: !!fileData.columns,
                    shape: fileData.shape
                });

                // Check if this is actually imaging data that was misrouted
                if (fileData.type === 'unknown' || (!fileData.type && fileData.extension === '.zip')) {
                    console.log('⚠️ Detected ZIP file in data table - redirecting to image browser');
                    // Check if we have uploadedData to use
                    if (window.uploadedData) {
                        window.showImageBrowser(window.uploadedData);
                        return;
                    }
                }

                if (fileData.type === 'tabular') {
                    // Store all data for pagination
                    window.allData = fileData.data;
                    const totalRows = fileData.shape[0];
                    const totalCols = fileData.shape[1];

                    console.log('✅✅✅ DATA LOADED! allData length:', window.allData.length, 'Type:', typeof window.allData, 'Is Array:', Array.isArray(window.allData));

                    // CRITICAL: Refresh navigation IMMEDIATELY after setting allData
                    // This MUST happen before anything else
                    if (window.refreshNavigationAvailability && window.allData && window.allData.length > 0) {
                        console.log('🚀🚀🚀 IMMEDIATE NAV REFRESH - allData just set to length', window.allData.length);
                        // Call immediately
                        window.refreshNavigationAvailability();
                        // Also call in next tick to be safe
                        requestAnimationFrame(() => {
                            window.refreshNavigationAvailability();
                        });
                    }

                    // Store original columns for reference
                    if (window.uploadedData) {
                        window.uploadedData.original_columns = fileData.columns;
                    }

                    // Initialize allColumns with original columns if not already set
                    if (window.allColumns.length === 0) {
                        window.allColumns = fileData.columns;
                    }

                    // CRITICAL: Recalculate all engineered features after loading fresh data
                    console.log('Recalculating engineered features after loading data...');
                    if (window.recalculateAllEngineeredFeatures) {
                        window.recalculateAllEngineeredFeatures();
                    }

                    // Save allColumns to localStorage after features are recalculated
                    localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
                    console.log('Saved allColumns to localStorage:', window.allColumns);

                    // ALSO save allData to localStorage so navigation works on page refresh
                    try {
                        const dataSize = JSON.stringify(window.allData).length;
                        if (dataSize <= 5 * 1024 * 1024) { // 5MB limit
                            localStorage.setItem('allData', JSON.stringify(window.allData));
                            console.log('Saved allData to localStorage, length:', window.allData.length);
                        } else {
                            console.warn('allData too large for localStorage, skipping save');
                        }
                    } catch (error) {
                        console.error('Error saving allData to localStorage:', error);
                    }

                    // Use updated allColumns array (includes new features) instead of just backend columns
                    const displayColumns = window.allColumns.length > fileData.columns.length ? window.allColumns : fileData.columns;

                    // Show paginated data with updated columns
                    window.showPaginatedData(displayColumns, totalRows, totalCols);

                    // CRITICAL: Refresh navigation availability IMMEDIATELY after allData is set
                    // Call it multiple times at different intervals to ensure it sticks
                    if (window.refreshNavigationAvailability) {
                        // Immediate refresh
                        console.log('🔄 [1/5] Immediate navigation refresh...');
                        window.refreshNavigationAvailability();

                        // Refresh after micro delay
                        setTimeout(() => {
                            console.log('🔄 [2/5] Navigation refresh after 10ms...');
                            window.refreshNavigationAvailability();
                        }, 10);

                        // Refresh after DOM update
                        setTimeout(() => {
                            console.log('🔄 [3/5] Navigation refresh after 50ms...');
                            window.refreshNavigationAvailability();
                        }, 50);

                        // Refresh after render
                        setTimeout(() => {
                            console.log('🔄 [4/5] Navigation refresh after 150ms...');
                            window.refreshNavigationAvailability();
                        }, 150);

                        // Final refresh
                        setTimeout(() => {
                            console.log('🔄 [5/5] Final navigation refresh after 300ms...');
                            window.refreshNavigationAvailability();
                        }, 300);
                    }

                    // Set active step AFTER refreshing navigation
                    setTimeout(() => {
                        if (window.setActiveStep) {
                            window.setActiveStep('viewer');
                        }
                    }, 50);
                } else if (fileData.type === 'text') {
                    viewerContent.innerHTML = `
                        <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                            <h4 style="margin-bottom: 15px; color: #2d3748;">Text Content Preview</h4>
                            <pre style="white-space: pre-wrap; font-family: monospace; color: #4a5568;">${fileData.preview}</pre>
                        </div>
                        <p style="margin-top: 15px; color: #718096; font-size: 0.9rem;">
                            Showing first 500 characters of text file.
                        </p>
                    `;
                } else if (fileData.type === 'imaging' || fileData.is_zip || fileData.extension === '.zip') {
                    // This is imaging data (ZIP file) - redirect to image browser
                    console.log('📸 Detected imaging/ZIP file in data table - redirecting to image browser');
                    if (window.uploadedData) {
                        window.showImageBrowser(window.uploadedData);
                    } else if (data) {
                        // Create a data object with imaging type
                        const imagingData = {
                            ...data,
                            detected_type: 'imaging',
                            selected_model_type: 'imaging'
                        };
                        window.showImageBrowser(imagingData);
                    } else {
                        viewerContent.innerHTML = `
                            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                                <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                                <h4 style="color: #e53e3e; margin-bottom: 15px;">Imaging Data Detected</h4>
                                <p style="color: #718096; margin-bottom: 20px;">
                                    This is a ZIP file containing imaging data, but we couldn't load the browser.
                                </p>
                                <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Reload Page
                                </button>
                            </div>
                        `;
                    }
                } else {
                    viewerContent.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #718096;">
                            <div style="font-size: 3rem; margin-bottom: 15px;">📁</div>
                            <div>File type: ${fileData.type || 'unknown'}</div>
                            <div style="font-size: 0.9rem; margin-top: 5px;">Preview not available for this file type</div>
                        </div>
                    `;
                }
            } else {
                throw new Error('Failed to load data');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Only show error if this was triggered by an actual upload, not data restoration
            if (window.isUploadInProgress) {
                viewerContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #e53e3e;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">Error</div>
                        <div>Error loading data: ${error.message}</div>
                    </div>
                `;
            } else {
                // For data restoration, just show a clean state
                viewerContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #718096;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">Ready to upload data</div>
                    </div>
                `;
            }
        }
    };

    window.showImageBrowser = function (data) {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;

        // Mock folder structure for demo
        const mockFolders = [
            {
                name: 'patient_001', type: 'folder', children: [
                    { name: 'scan_001.jpg', type: 'image' },
                    { name: 'scan_002.jpg', type: 'image' }
                ]
            },
            {
                name: 'patient_002', type: 'folder', children: [
                    { name: 'scan_003.jpg', type: 'image' },
                    { name: 'scan_004.jpg', type: 'image' }
                ]
            },
            {
                name: 'patient_003', type: 'folder', children: [
                    { name: 'scan_005.jpg', type: 'image' }
                ]
            }
        ];

        viewerContent.innerHTML = `
            <div class="folder-browser">
                <div class="folder-tree">
                    <h4 style="margin-bottom: 15px; color: #2d3748;">Image Folders</h4>
                    ${window.renderFolderTree(mockFolders)}
                </div>
                <div class="image-preview" id="imagePreview">
                    <div style="color: #718096;">
                        Click on an image to view it here
                    </div>
                </div>
            </div>
        `;

        // Add click handlers
        setTimeout(() => {
            document.querySelectorAll('.folder-item').forEach(item => {
                item.addEventListener('click', () => {
                    // Remove previous selection
                    document.querySelectorAll('.folder-item').forEach(i => i.classList.remove('selected'));
                    // Add selection to clicked item
                    item.classList.add('selected');

                    if (item.dataset.type === 'image') {
                        window.showImagePreview(item.dataset.name);
                    }
                });
            });
        }, 100);
    };

    window.renderFolderTree = function (folders, level = 0) {
        return folders.map(folder => {
            if (folder.type === 'folder') {
                return `
                    <div class="folder-item" style="margin-left: ${level * 20}px;">
                        <span class="folder-icon">Folder</span>
                        ${folder.name}
                    </div>
                    ${folder.children ? window.renderFolderTree(folder.children, level + 1) : ''}
                `;
            } else {
                return `
                    <div class="folder-item" style="margin-left: ${level * 20}px;" data-type="image" data-name="${folder.name}">
                        <span class="folder-icon">Image</span>
                        ${folder.name}
                    </div>
                `;
            }
        }).join('');
    };

    window.showImagePreview = function (imageName) {
        const imagePreview = document.getElementById('imagePreview');
        if (!imagePreview) return;

        // Mock image preview - in real implementation, you'd load actual images
        imagePreview.innerHTML = `
            <div style="width: 100%; height: 300px; background: #f7fafc; border: 2px dashed #cbd5e0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #718096;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">Image Preview</div>
                    <div>${imageName}</div>
                    <div style="font-size: 0.8rem; margin-top: 5px;">Image preview would load here</div>
                </div>
            </div>
            <div class="image-info">
                <strong>File:</strong> ${imageName}<br>
                <strong>Size:</strong> 1.2 MB<br>
                <strong>Format:</strong> JPEG
            </div>
        `;
    };

    window.showPaginatedData = function (columns, totalRows, totalCols) {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;

        const startIndex = (window.currentPage - 1) * window.rowsPerPage;
        const endIndex = Math.min(startIndex + window.rowsPerPage, totalRows);
        const pageData = window.allData.slice(startIndex, endIndex);

        const headers = columns.map(col => `<th>${col}</th>`).join('');

        // Debug: check if the yes column has data
        if (columns.includes('yes') && pageData.length > 0) {
            console.log('Debug: Checking yes column data in table:');
            console.log('First row yes value:', pageData[0]['yes']);
            console.log('First 5 rows yes values:', pageData.slice(0, 5).map(row => row['yes']));
        }

        const rows = pageData.map((row, index) => `
            <tr>
                <td>${startIndex + index + 1}</td>
                ${columns.map(col => `<td>${row[col] !== undefined ? row[col] : ''}</td>`).join('')}
            </tr>
        `).join('');

        const totalPages = Math.ceil(totalRows / window.rowsPerPage);

        // Use actual column count from allColumns instead of backend totalCols
        const actualColCount = window.allColumns.length;

        viewerContent.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Row</th>
                            ${headers}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            <div class="pagination-controls">
                <div class="pagination-info">
                    Showing ${startIndex + 1}-${endIndex} of ${totalRows.toLocaleString()} rows × ${actualColCount} columns
                </div>
                <div class="pagination-buttons">
                    <button class="pagination-btn" onclick="changePage(1)" ${window.currentPage === 1 ? 'disabled' : ''}>
                        First
                    </button>
                    <button class="pagination-btn" onclick="changePage(${window.currentPage - 1})" ${window.currentPage === 1 ? 'disabled' : ''}>
                        Previous
                    </button>
                    <span style="padding: 8px 16px; color: #1E40AF; font-weight: 500;">
                        Page ${window.currentPage} of ${totalPages}
                    </span>
                    <button class="pagination-btn" onclick="changePage(${window.currentPage + 1})" ${window.currentPage === totalPages ? 'disabled' : ''}>
                        Next
                    </button>
                    <button class="pagination-btn" onclick="changePage(${totalPages})" ${window.currentPage === totalPages ? 'disabled' : ''}>
                        Last
                    </button>
                </div>
            </div>
            <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="color: #64748B;">Rows per page:</span>
                    <select onchange="changeRowsPerPage(this.value)" style="padding: 4px 8px; border: 1px solid #87CEEB; border-radius: 4px; color: #1E40AF;">
                        <option value="25" ${window.rowsPerPage === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${window.rowsPerPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${window.rowsPerPage === 100 ? 'selected' : ''}>100</option>
                        <option value="200" ${window.rowsPerPage === 200 ? 'selected' : ''}>200</option>
                    </select>
                </div>
            </div>
        `;
    };

    window.changePage = function (page) {
        window.currentPage = page;
        // Simply re-render with the new page - we always have full dataset
        const totalRows = window.totalDatasetRows || window.allData.length;
        const totalCols = window.totalDatasetCols || window.allColumns.length;
        window.showPaginatedData(window.allColumns, totalRows, totalCols);
    };

    window.changeRowsPerPage = function (newRowsPerPage) {
        window.rowsPerPage = parseInt(newRowsPerPage);
        window.currentPage = 1; // Reset to first page
        window.changePage(1);
    };

    // ========== IMAGE BROWSER (Finder-like interface) ==========

    window.showImageBrowser = async function (data) {
        const viewerContent = document.getElementById('viewerContent');
        if (!viewerContent) return;

        viewerContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="spinner" style="margin: 0 auto 10px; border: 4px solid #f3f4f6; border-top: 4px solid #3182ce; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                <p style="color: #2d3748; margin-top: 15px;">Extracting ZIP contents...</p>
                <p style="font-size: 0.9rem; color: #718096; margin-top: 10px;">This may take a moment for large files</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        try {
            // Get folder structure from backend
            const fileId = data.file_ids[0];
            console.log('🔍 Loading image browser for file_id:', fileId);
            console.log('   Upload data:', data);

            const structureResponse = await fetch(`${window.API_BASE_URL || ""}/api/images/${fileId}/structure`);
            console.log('   Structure response status:', structureResponse.status);

            if (!structureResponse.ok) {
                const errorText = await structureResponse.text();
                console.error('   ❌ Structure response error:', errorText);
                throw new Error(`Failed to load folder structure: ${structureResponse.status} ${errorText}`);
            }

            const folderStructure = await structureResponse.json();
            console.log('   ✅ Folder structure loaded:', folderStructure);
            console.log('   📁 Children folders:', folderStructure.children?.length || 0);
            console.log('   📄 Root files:', folderStructure.files?.length || 0);

            // Check if structure is empty
            if ((!folderStructure.children || folderStructure.children.length === 0) &&
                (!folderStructure.files || folderStructure.files.length === 0)) {
                throw new Error('ZIP file appears to be empty or files were not extracted properly. Please check the server logs.');
            }

            // Get image-label matches
            const matchesResponse = await fetch(`${window.API_BASE_URL || ""}/api/images/${fileId}/match`);
            const matches = matchesResponse.ok ? await matchesResponse.json() : null;
            console.log('   ✅ Matches loaded:', matches);

            // Render Finder-like browser
            renderImageBrowser(folderStructure, matches, fileId);

        } catch (error) {
            console.error('❌ Error loading image browser:', error);
            viewerContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">❌</div>
                    <h4 style="color: #e53e3e; margin-bottom: 15px;">Error Loading Image Dataset</h4>
                    <p style="color: #718096; margin-bottom: 20px;">${error.message}</p>
                    <p style="font-size: 0.9rem; color: #718096; margin-bottom: 20px;">
                        Please make sure you uploaded a ZIP file with images and labels.<br>
                        Check the browser console and server logs for more details.
                    </p>
                    <button onclick="window.showDataViewer(window.uploadedData)" style="margin-top: 10px; padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    };

    function renderImageBrowser(structure, matches, fileId) {
        const viewerContent = document.getElementById('viewerContent');

        // Initialize browser state
        window.imageBrowserState = {
            currentPath: '',
            selectedFile: null,
            matches: matches || {},
            fileId: fileId
        };

        viewerContent.innerHTML = `
            <div class="image-browser" style="display: flex; height: calc(100vh - 200px); border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <!-- Left Sidebar: Folder Tree -->
                <div class="folder-sidebar" style="width: 250px; background: #f7fafc; border-right: 1px solid #e2e8f0; overflow-y: auto; padding: 15px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 1.2rem; margin-right: 8px;">📁</span>
                        <h4 style="margin: 0; color: #2d3748;">Folders</h4>
                    </div>
                    <div id="folderTree">
                        ${renderFolderTree(structure, '')}
                    </div>
                </div>
                
                <!-- Main Content: File Grid -->
                <div class="file-content" style="flex: 1; display: flex; flex-direction: column; background: white;">
                    <!-- Breadcrumb Navigation -->
                    <div class="breadcrumb" style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0; background: #f7fafc; display: flex; align-items: center; gap: 8px;">
                        <button onclick="navigateToFolder('')" style="background: none; border: none; color: #3182ce; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem;">
                            🏠 Root
                        </button>
                        <span id="breadcrumbPath" style="color: #718096; font-size: 0.9rem;"></span>
                    </div>
                    
                    <!-- File Grid -->
                    <div id="fileGrid" class="file-grid" style="flex: 1; overflow-y: auto; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 20px;">
                        ${renderFileGrid(structure, '', matches)}
                    </div>
                </div>
            </div>
            
            <!-- Image Preview Modal -->
            <div id="imagePreviewModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; align-items: center; justify-content: center;">
                <div style="position: relative; max-width: 90vw; max-height: 90vh;">
                    <button onclick="closeImagePreview()" style="position: absolute; top: -40px; right: 0; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer;">×</button>
                    <img id="previewImage" src="" style="max-width: 90vw; max-height: 90vh; object-fit: contain;">
                    <div id="previewInfo" style="position: absolute; bottom: -50px; left: 0; right: 0; color: white; text-align: center;"></div>
                </div>
            </div>
            
            <!-- Label File Viewer Modal -->
            <div id="labelViewerModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10000; padding: 40px; overflow-y: auto;">
                <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 id="labelViewerTitle" style="margin: 0; color: #2d3748;">Label File</h3>
                        <button onclick="closeLabelViewer()" style="background: #e53e3e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
                    </div>
                    <div id="labelViewerContent" style="background: #f7fafc; padding: 20px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; max-height: 60vh; overflow-y: auto;"></div>
                </div>
            </div>
        `;
    }

    function renderFolderTree(structure, currentPath, level = 0) {
        let html = '';

        // Render folders
        if (structure.children && structure.children.length > 0) {
            structure.children.forEach(folder => {
                const indent = level * 20;
                html += `
                    <div class="folder-item" style="padding: 6px 8px; margin-left: ${indent}px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 6px;" 
                         onclick="navigateToFolder('${folder.path}')"
                         onmouseover="this.style.background='#edf2f7'" 
                         onmouseout="this.style.background='transparent'">
                        <span style="font-size: 1rem;">📁</span>
                        <span style="color: #2d3748; font-size: 0.9rem;">${folder.name}</span>
                    </div>
                `;
                // Recursively render children
                html += renderFolderTree(folder, folder.path, level + 1);
            });
        }

        return html;
    }

    function renderFileGrid(structure, currentPath, matches) {
        // Find current folder based on path
        let currentFolder = structure;
        if (currentPath) {
            const parts = currentPath.split('/').filter(p => p);
            for (const part of parts) {
                if (currentFolder.children) {
                    currentFolder = currentFolder.children.find(c => c.name === part);
                    if (!currentFolder) break;
                }
            }
        }

        if (!currentFolder) {
            return '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #718096;">Folder not found</div>';
        }

        let html = '';

        // Render folders first
        if (currentFolder.children && currentFolder.children.length > 0) {
            currentFolder.children.forEach(folder => {
                html += `
                    <div class="file-item folder" style="text-align: center; cursor: pointer; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; transition: all 0.2s;"
                         onclick="navigateToFolder('${folder.path}')"
                         onmouseover="this.style.borderColor='#3182ce'; this.style.transform='translateY(-2px)'"
                         onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)'">
                        <div style="font-size: 3rem; margin-bottom: 8px;">📁</div>
                        <div style="font-size: 0.85rem; color: #2d3748; word-break: break-word;">${folder.name}</div>
                    </div>
                `;
            });
        }

        // Render files
        const files = currentFolder.files || [];
        files.forEach(file => {
            const fileType = file.type;
            const hasLabel = matches && (
                matches.one_to_one && matches.one_to_one[file.path] ||
                matches.many_to_one && matches.many_to_one[file.path]
            );

            let icon = '📄';
            if (fileType === 'image') icon = '🖼️';
            else if (fileType === 'csv') icon = '📊';
            else if (fileType === 'text') icon = '📝';
            else if (fileType === 'json') icon = '📋';

            html += `
                <div class="file-item ${fileType}" 
                     style="text-align: center; cursor: pointer; padding: 15px; border: 1px solid ${hasLabel ? '#10b981' : '#e2e8f0'}; border-radius: 8px; background: white; transition: all 0.2s; position: relative;"
                     onclick="openFile('${file.path}', '${file.file_id}', '${fileType}')"
                     onmouseover="this.style.borderColor='#3182ce'; this.style.transform='translateY(-2px)'"
                     onmouseout="this.style.borderColor='${hasLabel ? '#10b981' : '#e2e8f0'}'; this.style.transform='translateY(0)'">
                    ${hasLabel ? '<div style="position: absolute; top: 5px; right: 5px; background: #10b981; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">✓</div>' : ''}
                    <div style="font-size: 3rem; margin-bottom: 8px;">${icon}</div>
                    <div style="font-size: 0.85rem; color: #2d3748; word-break: break-word;">${file.name}</div>
                    <div style="font-size: 0.75rem; color: #718096; margin-top: 4px;">${formatFileSize(file.size)}</div>
                </div>
            `;
        });

        if (html === '') {
            html = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #718096;">This folder is empty</div>';
        }

        return html;
    }

    window.navigateToFolder = function (path) {
        window.imageBrowserState.currentPath = path;

        // Update breadcrumb
        const breadcrumbEl = document.getElementById('breadcrumbPath');
        if (breadcrumbEl) {
            if (path) {
                const parts = path.split('/').filter(p => p);
                breadcrumbEl.innerHTML = parts.map((part, i) => {
                    const partPath = parts.slice(0, i + 1).join('/');
                    return `<span onclick="navigateToFolder('${partPath}')" style="color: #3182ce; cursor: pointer; text-decoration: underline;">${part}</span>`;
                }).join(' / ');
            } else {
                breadcrumbEl.innerHTML = '';
            }
        }

        // Reload file grid
        const fileId = window.imageBrowserState.fileId;
        fetch(`${window.API_BASE_URL || ""}/api/images/${fileId}/structure`)
            .then(r => r.json())
            .then(structure => {
                const matches = window.imageBrowserState.matches;
                const fileGrid = document.getElementById('fileGrid');
                if (fileGrid) {
                    fileGrid.innerHTML = renderFileGrid(structure, path, matches);
                }
            });
    };

    window.openFile = async function (filePath, fileId, fileType) {
        const browserState = window.imageBrowserState;
        if (!browserState) return;

        if (fileType === 'image') {
            // Show image preview
            const modal = document.getElementById('imagePreviewModal');
            const previewImg = document.getElementById('previewImage');
            const previewInfo = document.getElementById('previewInfo');

            try {
                const response = await fetch(`${window.API_BASE_URL || ""}/api/images/${browserState.fileId}/file/${encodeURIComponent(filePath)}`);
                const fileData = await response.json();

                if (fileData.base64) {
                    previewImg.src = `data:image/${fileData.extension.replace('.', '')};base64,${fileData.base64}`;
                } else {
                    // Try to load from file_id directly
                    previewImg.src = `${window.API_BASE_URL || ""}/api/images/${fileId}`;
                }

                previewInfo.innerHTML = `
                    <div>${filePath}</div>
                    <div style="font-size: 0.9rem; color: #cbd5e0; margin-top: 5px;">${formatFileSize(fileData.size || 0)}</div>
                `;

                if (modal) modal.style.display = 'flex';
            } catch (error) {
                console.error('Error loading image:', error);
                alert('Failed to load image');
            }
        } else {
            // Show label file viewer
            const modal = document.getElementById('labelViewerModal');
            const title = document.getElementById('labelViewerTitle');
            const content = document.getElementById('labelViewerContent');

            try {
                const response = await fetch(`${window.API_BASE_URL || ""}/api/images/${browserState.fileId}/file/${encodeURIComponent(filePath)}`);
                const fileData = await response.json();

                if (title) title.textContent = filePath;
                if (content) {
                    if (fileType === 'csv') {
                        // Format CSV nicely
                        const lines = fileData.content.split('\n');
                        content.innerHTML = lines.map(line => {
                            const cells = line.split(',');
                            return cells.map(cell => `<span style="padding: 2px 8px; margin: 2px; background: #edf2f7; border-radius: 3px; display: inline-block;">${cell}</span>`).join('');
                        }).join('<br>');
                    } else {
                        content.textContent = fileData.content || 'No content';
                    }
                }

                if (modal) modal.style.display = 'block';
            } catch (error) {
                console.error('Error loading label file:', error);
                alert('Failed to load file');
            }
        }
    };

    window.closeImagePreview = function () {
        const modal = document.getElementById('imagePreviewModal');
        if (modal) modal.style.display = 'none';
    };

    window.closeLabelViewer = function () {
        const modal = document.getElementById('labelViewerModal');
        if (modal) modal.style.display = 'none';
    };

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    console.log('Data Viewer module loaded');
})();

