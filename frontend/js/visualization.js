// Visualization Module - All visualization functionality
(function () {
    'use strict';

    // Ensure globals exist
    if (typeof window.allData === 'undefined') window.allData = [];
    if (typeof window.allColumns === 'undefined') window.allColumns = [];
    if (typeof window.variableChanges === 'undefined') window.variableChanges = {};
    if (typeof window.currentChart === 'undefined') window.currentChart = null;

    function showVisualizationInterface() {
        if (window.hideAllSections) window.hideAllSections();
        // Hide all other elements and show only visualization page
        const uploadSection = document.getElementById('uploadSection');
        const modelSelection = document.getElementById('modelSelection');
        const dataViewer = document.getElementById('dataViewer');
        const cleaningPage = document.getElementById('cleaningPage');
        const featureEngineeringPage = document.getElementById('featureEngineeringPage');
        const modelTrainingPage = document.getElementById('modelTrainingPage');
        const visualizationPage = document.getElementById('visualizationPage');
        const result = document.getElementById('result');
        const newUploadBtn = document.getElementById('newUploadBtn');
        const uploadBtn = document.getElementById('uploadBtn');

        // Hide all sections except visualization
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
        if (featureEngineeringPage) {
            featureEngineeringPage.style.display = 'none';
            featureEngineeringPage.style.visibility = 'hidden';
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
        if (visualizationPage) {
            visualizationPage.style.display = 'block';
            visualizationPage.style.visibility = 'visible';
        }

        if (window.setActiveStep) {
            window.setActiveStep('visualization');
        }

        // Initialize visualization interface
        initializeVisualizationInterface();
    }

    function initializeVisualizationInterface() {
        const visualizationContent = document.getElementById('visualizationContent');

        if (!window.allData || window.allData.length === 0 || !window.allColumns || window.allColumns.length === 0) {
            visualizationContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748B;">
                <div style="font-size: 3rem; margin-bottom: 20px;"></div>
                <h4 style="color: #1E40AF; margin-bottom: 15px;">No Data Available</h4>
                <p style="font-size: 1rem; margin-bottom: 30px;">Please upload a dataset first to visualize.</p>
            </div>
        `;
            return;
        }

        // Create visualization interface with all columns
        const visualizationHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 30px;">
                <h2 style="color: #1E40AF; margin-bottom: 10px; font-weight: 700;">Data Visualizations</h2>
                <p style="color: #64748B; font-size: 0.95rem;">Select a variable to visualize its distribution</p>
            </div>

            <!-- Variable Selection -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                ${window.allColumns.map(column => {
            const varType = window.variableChanges[column]?.variable_type || 'categorical';
            const isContinuous = varType === 'continuous';
            return `
                        <button onclick="visualizeColumn('${column}')" 
                                style="background: ${isContinuous ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'}; 
                                        color: white; border: none; padding: 15px; border-radius: 10px; 
                                        font-weight: 600; cursor: pointer; text-align: left; transition: all 0.2s;"
                                onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
                                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                            <div style="font-size: 0.9rem; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${column}
                            </div>
                            <div style="font-size: 0.75rem; opacity: 0.9;">
                                ${isContinuous ? 'Histogram' : 'Bar Chart'}
                            </div>
                        </button>
                    `;
        }).join('')}
            </div>

            <!-- Chart Container -->
            <div id="chartContainer" style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 30px; margin-bottom: 20px; min-height: 400px;">
                <div style="text-align: center; padding: 60px 20px; color: #9CA3AF;">
                    <div style="font-size: 3rem; margin-bottom: 15px;"></div>
                    <p style="font-size: 1.1rem;">Select a variable from above to visualize</p>
                </div>
            </div>

        </div>
    `;

        visualizationContent.innerHTML = visualizationHTML;
    }

    function visualizeColumn(column) {
        const chartContainer = document.getElementById('chartContainer');

        if (!window.allData || window.allData.length === 0) {
            alert('No data available for visualization');
            return;
        }

        // Determine if variable is categorical or continuous
        const varType = window.variableChanges[column]?.variable_type || 'categorical';
        const isContinuous = varType === 'continuous';

        // Calculate statistics
        const values = [];
        let nanCount = 0;

        window.allData.forEach(row => {
            const value = row[column];
            if (value === null || value === undefined || value === '' || value === 'nan' || value === 'NaN') {
                nanCount++;
            } else {
                values.push(value);
            }
        });

        // Destroy existing chart if it exists
        if (window.currentChart) {
            window.currentChart.destroy();
        }

        // Create chart based on type
        if (isContinuous) {
            createHistogram(column, values, nanCount);
        } else {
            createBarChart(column, values, nanCount);
        }
    }

    function createBarChart(column, values, nanCount) {
        const chartContainer = document.getElementById('chartContainer');

        // Count frequencies
        const valueCounts = {};
        values.forEach(val => {
            const key = String(val);
            valueCounts[key] = (valueCounts[key] || 0) + 1;
        });

        // Sort by count descending
        const sortedEntries = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]);
        const labels = sortedEntries.map(([label]) => label);
        const data = sortedEntries.map(([, count]) => count);

        // Limit to top 20 categories if too many
        const maxCategories = 20;
        const displayLabels = labels.slice(0, maxCategories);
        const displayData = data.slice(0, maxCategories);

        chartContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #1E40AF; margin-bottom: 10px; font-weight: 700;">${column}</h3>
            <p style="color: #64748B; margin-bottom: 15px;">
                <strong>Total Values:</strong> ${values.length + nanCount} | 
                <strong>Valid Values:</strong> ${values.length} | 
                <strong>NaN/Missing:</strong> ${nanCount} (${((nanCount / (values.length + nanCount)) * 100).toFixed(1)}%)
            </p>
        </div>
        <div style="position: relative; height: 500px;">
            <canvas id="barChart"></canvas>
        </div>
        `;

        const ctx = document.getElementById('barChart').getContext('2d');
        window.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: displayLabels,
                datasets: [{
                    label: 'Count',
                    data: displayData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Count: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    datalabels: false
                }
            },
            plugins: [{
                id: 'datalabels',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = '#1E40AF';
                    ctx.textAlign = 'center';
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const value = dataset.data[index];
                            ctx.fillText(value, bar.x, bar.y - 5);
                        });
                    });
                }
            }]
        });
    }

    function createHistogram(column, values, nanCount) {
        const chartContainer = document.getElementById('chartContainer');

        // Convert to numbers and filter out NaN
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v) && isFinite(v));

        if (numericValues.length === 0) {
            chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #EF4444;">
                <h4>No valid numeric values to display</h4>
                <p>All values are missing or non-numeric.</p>
            </div>
        `;
            return;
        }

        // Calculate histogram bins
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const binCount = Math.min(20, Math.ceil(Math.sqrt(numericValues.length)));
        const binWidth = (max - min) / binCount;

        const bins = Array(binCount).fill(0);
        const binLabels = [];

        for (let i = 0; i < binCount; i++) {
            const binStart = min + i * binWidth;
            const binEnd = min + (i + 1) * binWidth;
            binLabels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
        }

        // Count values in each bin
        numericValues.forEach(val => {
            let binIndex = Math.floor((val - min) / binWidth);
            if (binIndex === binCount) binIndex = binCount - 1; // Handle edge case
            bins[binIndex]++;
        });

        chartContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #1E40AF; margin-bottom: 10px; font-weight: 700;">${column}</h3>
            <p style="color: #64748B; margin-bottom: 15px;">
                <strong>Total Values:</strong> ${values.length + nanCount} | 
                <strong>Valid Values:</strong> ${numericValues.length} | 
                <strong>NaN/Missing:</strong> ${nanCount} (${((nanCount / (values.length + nanCount)) * 100).toFixed(1)}%) | 
                <strong>Min:</strong> ${min.toFixed(2)} | 
                <strong>Max:</strong> ${max.toFixed(2)} | 
                <strong>Mean:</strong> ${(numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2)}
            </p>
        </div>
        <div style="position: relative; height: 500px;">
            <canvas id="histogramChart"></canvas>
        </div>
        `;

        const ctx = document.getElementById('histogramChart').getContext('2d');
        window.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Frequency',
                    data: bins,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Frequency: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            },
            plugins: [{
                id: 'datalabels',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = '#059669';
                    ctx.textAlign = 'center';
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const value = dataset.data[index];
                            if (value > 0) {
                                ctx.fillText(value, bar.x, bar.y - 5);
                            }
                        });
                    });
                }
            }]
        });
    }

    // Export functions to window
    window.showVisualizationInterface = showVisualizationInterface;
    window.visualizeColumn = visualizeColumn;

    console.log('Visualization module loaded');
})();
