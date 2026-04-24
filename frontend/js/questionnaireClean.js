/**
 * Questionnaire-Driven Data Cleaning for ResearcherML
 * Interactive, guided cleaning with live visualization
 */

const QuestionnaireClean = (function() {
    let state = {
        fileId: null,
        columns: [],
        currentColumnIndex: 0,
        answers: {}, // { columnName: { q1: 'answer', q2: 'answer', ... } }
        transformations: [],
        columnData: null,
        splitPosition: 50 // Percentage
    };

    /**
     * Initialize questionnaire cleaning for a file
     */
    async function init(fileId, columns) {
        state.fileId = fileId;
        state.columns = columns;
        state.currentColumnIndex = 0;
        state.answers = {};
        state.transformations = [];
        
        // Show questionnaire section
        Navigation.navigateTo('questionnaireCleanPage');
        
        // Setup UI
        setupSplitLayout();
        renderColumnMiniMap();
        
        // Load first column
        await loadColumn(0);
    }

    /**
     * Setup split-screen layout with resizable divider
     */
    function setupSplitLayout() {
        const container = document.getElementById('splitContainer');
        if (!container) return;
        
        const divider = document.getElementById('splitDivider');
        const leftPanel = document.getElementById('questionPanel');
        const rightPanel = document.getElementById('vizPanel');
        
        let isDragging = false;
        
        divider.addEventListener('mousedown', () => {
            isDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerRect = container.getBoundingClientRect();
            const leftPct = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            const clamped = Math.min(Math.max(leftPct, 25), 75);
            
            leftPanel.style.flex = `0 0 ${clamped}%`;
            rightPanel.style.flex = `0 0 ${100 - clamped}%`;
            
            state.splitPosition = clamped;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                localStorage.setItem('questionnaire_split_position', state.splitPosition);
            }
        });
        
        // Restore saved position
        const savedPosition = localStorage.getItem('questionnaire_split_position');
        if (savedPosition) {
            const pos = parseFloat(savedPosition);
            leftPanel.style.flex = `0 0 ${pos}%`;
            rightPanel.style.flex = `0 0 ${100 - pos}%`;
            state.splitPosition = pos;
        }
    }

    /**
     * Load and analyze a column
     */
    async function loadColumn(index) {
        if (index < 0 || index >= state.columns.length) return;
        
        state.currentColumnIndex = index;
        const columnName = state.columns[index];
        
        // Show loading
        showLoading('Analyzing column...');
        
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/questionnaire/column/${state.fileId}/${encodeURIComponent(columnName)}`
            );
            
            if (!response.ok) throw new Error('Failed to analyze column');
            
            const result = await response.json();
            state.columnData = result.analysis;
            
            // Render question UI
            renderQuestionPanel();
            renderVisualization();
            updateColumnMiniMap();
            
        } catch (error) {
            console.error('Error loading column:', error);
            showError('Failed to analyze column. Please try again.');
        } finally {
            hideLoading();
        }
    }

    /**
     * Render the question panel based on column type
     */
    function renderQuestionPanel() {
        const panel = document.getElementById('questionContent');
        if (!panel || !state.columnData) return;
        
        const data = state.columnData;
        const columnName = data.column_name;
        
        // Progress header
        const progress = `
            <div class="progress-header">
                <div class="progress-text">
                    Column <span class="current">${state.currentColumnIndex + 1}</span> of ${state.columns.length}
                </div>
                <div style="font-size: 14px; color: #6b7280;">
                    ${data.detected_type} • ${data.unique_count} unique values
                </div>
            </div>
        `;
        
        // Column info
        const columnInfo = `
            <div class="question-card">
                <div class="question-header">${columnName}</div>
                <div class="question-subtitle">
                    ${data.total_rows} rows • ${data.missing_count} missing (${data.missing_pct}%)
                </div>
                <div class="sample-values">
                    <strong>Sample values:</strong><br>
                    ${data.sample_values.map(v => `<span class="sample-value-chip">${v}</span>`).join('')}
                </div>
            </div>
        `;
        
        // Question based on branch
        const questions = getQuestionsForBranch(data.suggested_branch, data);
        
        panel.innerHTML = progress + columnInfo + questions;
        
        // Attach event listeners
        attachQuestionListeners();
    }

    /**
     * Get questions HTML for a specific branch
     */
    function getQuestionsForBranch(branch, data) {
        const columnAnswers = state.answers[data.column_name] || {};
        
        if (branch.startsWith('numeric')) {
            return renderNumericQuestions(data, columnAnswers);
        } else if (branch.startsWith('categorical')) {
            return renderCategoricalQuestions(data, columnAnswers);
        } else if (branch === 'date_standard') {
            return renderDateQuestions(data, columnAnswers);
        } else if (branch === 'mixed_standard') {
            return renderMixedQuestions(data, columnAnswers);
        }
        
        return '<p>Unknown column type</p>';
    }

    /**
     * Render questions for numeric columns
     */
    function renderNumericQuestions(data, answers) {
        const hasOutliers = (data.potential_outliers || 0) > 0;
        const hasMissing = data.missing_count > 0;
        
        let html = `
            <div class="question-card">
                <div class="question-header">Q1: What does this column represent?</div>
                <div class="answer-options">
                    <button class="answer-button ${answers.q1 === 'measurement' ? 'selected' : ''}" 
                            data-question="q1" data-answer="measurement">
                        A measurement or test result
                    </button>
                    <button class="answer-button ${answers.q1 === 'count' ? 'selected' : ''}" 
                            data-question="q1" data-answer="count">
                        A count (e.g., number of medications)
                    </button>
                    <button class="answer-button ${answers.q1 === 'score' ? 'selected' : ''}" 
                            data-question="q1" data-answer="score">
                        A score or rating
                    </button>
                    <button class="answer-button ${answers.q1 === 'id_code' ? 'selected' : ''}" 
                            data-question="q1" data-answer="id_code">
                        An ID or code → exclude this column
                    </button>
                </div>
            </div>
        `;
        
        if (answers.q1 && answers.q1 !== 'id_code' && hasOutliers) {
            html += `
                <div class="question-card">
                    <div class="question-header">Q2: Are there values that look wrong?</div>
                    <div class="question-subtitle">
                        Range: ${data.min?.toFixed(2)} to ${data.max?.toFixed(2)} 
                        • ${data.potential_outliers} potential outliers detected
                    </div>
                    <div class="answer-options">
                        <button class="answer-button ${answers.q2 === 'ok' ? 'selected' : ''}" 
                                data-question="q2" data-answer="ok">
                            These values look fine
                        </button>
                        <button class="answer-button ${answers.q2 === 'set_range' ? 'selected' : ''}" 
                                data-question="q2" data-answer="set_range">
                            Let me set a valid range
                        </button>
                    </div>
                    ${answers.q2 === 'set_range' ? `
                        <div style="margin-top: 16px;">
                            <label style="display: block; margin-bottom: 8px;">Minimum valid value:</label>
                            <input type="number" id="outlierMin" value="${data.min}" 
                                   style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">
                            <label style="display: block; margin: 16px 0 8px;">Maximum valid value:</label>
                            <input type="number" id="outlierMax" value="${data.max}"
                                   style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        if (answers.q1 && answers.q1 !== 'id_code' && hasMissing) {
            html += `
                <div class="question-card">
                    <div class="question-header">Q${hasOutliers ? 3 : 2}: What should happen to missing values?</div>
                    <div class="question-subtitle">${data.missing_count} values are missing</div>
                    <div class="answer-options">
                        <button class="answer-button ${answers.missing_strategy === 'fill_median' ? 'selected' : ''}" 
                                data-question="missing_strategy" data-answer="fill_median">
                            Fill with average value (median)
                        </button>
                        <button class="answer-button ${answers.missing_strategy === 'fill_mean' ? 'selected' : ''}" 
                                data-question="missing_strategy" data-answer="fill_mean">
                            Fill with mean value
                        </button>
                        <button class="answer-button ${answers.missing_strategy === 'remove_rows' ? 'selected' : ''}" 
                                data-question="missing_strategy" data-answer="remove_rows">
                            Remove rows with missing values
                        </button>
                        <button class="answer-button ${answers.missing_strategy === 'leave' ? 'selected' : ''}" 
                                data-question="missing_strategy" data-answer="leave">
                            Leave as-is
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (data.unique_count < 10) {
            html += `
                <div class="question-card">
                    <div class="question-header">Q: Treat as categories or continuous number?</div>
                    <div class="question-subtitle">This column has only ${data.unique_count} unique values</div>
                    <div class="answer-options">
                        <button class="answer-button ${answers.treat_as === 'numeric' ? 'selected' : ''}" 
                                data-question="treat_as" data-answer="numeric">
                            Treat as numbers (keep as-is)
                        </button>
                        <button class="answer-button ${answers.treat_as === 'categorical' ? 'selected' : ''}" 
                                data-question="treat_as" data-answer="categorical">
                            Treat as categories (one-hot encode)
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += renderNavigationButtons();
        return html;
    }

    /**
     * Render questions for categorical columns
     */
    function renderCategoricalQuestions(data, answers) {
        const hasMissing = data.missing_count > 0;
        const uniqueCount = data.unique_count;
        
        let html = `
            <div class="question-card">
                <div class="question-header">Q1: What kind of information is in this column?</div>
                <div class="answer-options">
                    <button class="answer-button ${answers.q1 === 'binary' ? 'selected' : ''}" 
                            data-question="q1" data-answer="binary">
                        Yes/No or True/False answers
                    </button>
                    <button class="answer-button ${answers.q1 === 'small_category' ? 'selected' : ''}" 
                            data-question="q1" data-answer="small_category">
                        Category with few options (${uniqueCount} categories)
                    </button>
                    ${uniqueCount > 10 ? `
                    <button class="answer-button ${answers.q1 === 'many_category' ? 'selected' : ''}" 
                            data-question="q1" data-answer="many_category">
                        Category with many options
                    </button>
                    ` : ''}
                    <button class="answer-button ${answers.q1 === 'free_text' ? 'selected' : ''}" 
                            data-question="q1" data-answer="free_text">
                        Free text → exclude this column
                    </button>
                    <button class="answer-button ${answers.q1 === 'id_code' ? 'selected' : ''}" 
                            data-question="q1" data-answer="id_code">
                        An ID or code → exclude this column
                    </button>
                </div>
            </div>
        `;
        
        if (answers.q1 && !['free_text', 'id_code'].includes(answers.q1)) {
            html += `
                <div class="question-card">
                    <div class="question-header">Q2: How should we represent these as numbers?</div>
                    <div class="question-subtitle">ML models need numeric values</div>
                    <div class="answer-options">
                        ${answers.q1 === 'binary' ? `
                        <button class="answer-button ${answers.encoding === 'binary' ? 'selected' : ''}" 
                                data-question="encoding" data-answer="binary">
                            Map Yes→1, No→0
                        </button>
                        ` : ''}
                        <button class="answer-button ${answers.encoding === 'onehot' ? 'selected' : ''}" 
                                data-question="encoding" data-answer="onehot">
                            Create separate column for each category (recommended)
                        </button>
                        <button class="answer-button ${answers.encoding === 'label' ? 'selected' : ''}" 
                                data-question="encoding" data-answer="label">
                            Assign each category a number (0, 1, 2...)
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (answers.q1 && !['free_text', 'id_code'].includes(answers.q1) && hasMissing) {
            html += `
                <div class="question-card">
                    <div class="question-header">Q3: What should happen to missing values?</div>
                    <div class="question-subtitle">${data.missing_count} values are missing</div>
                    <div class="answer-options">
                        <button class="answer-button ${answers.missing_strategy === 'fill_mode' ? 'selected' : ''}" 
                                data-question="missing_strategy" data-answer="fill_mode">
                            Fill with most common value
                        </button>
                        <button class="answer-button ${answers.missing_strategy === 'fill_unknown' ? 'selected' : ''}" 
                                data-question="missing_strategy" data-answer="fill_unknown">
                            Treat missing as "Unknown" category
                        </button>
                        <button class="answer-button ${answers.missing_strategy === 'remove_rows' ? 'selected' : ''}" 
                                data-question="missing_strategy" data-answer="remove_rows">
                            Remove rows with missing values
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += renderNavigationButtons();
        return html;
    }

    /**
     * Render questions for date columns
     */
    function renderDateQuestions(data, answers) {
        let html = `
            <div class="question-card">
                <div class="question-header">Q1: What should we do with this date column?</div>
                <div class="answer-options">
                    <button class="answer-button ${answers.date_transform === 'extract_year' ? 'selected' : ''}" 
                            data-question="date_transform" data-answer="extract_year">
                        Extract the year only
                    </button>
                    <button class="answer-button ${answers.date_transform === 'days_elapsed' ? 'selected' : ''}" 
                            data-question="date_transform" data-answer="days_elapsed">
                        Calculate days elapsed from a reference date
                    </button>
                    <button class="answer-button ${answers.date_transform === 'exclude' ? 'selected' : ''}" 
                            data-question="date_transform" data-answer="exclude">
                        Exclude this column
                    </button>
                </div>
            </div>
        `;
        
        html += renderNavigationButtons();
        return html;
    }

    /**
     * Render questions for mixed columns
     */
    function renderMixedQuestions(data, answers) {
        let html = `
            <div class="question-card">
                <div class="question-header">Q1: This column has mixed numbers and text</div>
                <div class="question-subtitle">What should we do?</div>
                <div class="answer-options">
                    <button class="answer-button ${answers.q1 === 'numbers_only' ? 'selected' : ''}" 
                            data-question="q1" data-answer="numbers_only">
                        Treat text like "N/A" as missing, keep numbers
                    </button>
                    <button class="answer-button ${answers.q1 === 'as_categories' ? 'selected' : ''}" 
                            data-question="q1" data-answer="as_categories">
                        Treat whole column as categories
                    </button>
                    <button class="answer-button ${answers.q1 === 'exclude' ? 'selected' : ''}" 
                            data-question="q1" data-answer="exclude">
                        Exclude this column
                    </button>
                </div>
            </div>
        `;
        
        html += renderNavigationButtons();
        return html;
    }

    /**
     * Render navigation buttons
     */
    function renderNavigationButtons() {
        const isFirst = state.currentColumnIndex === 0;
        const isLast = state.currentColumnIndex === state.columns.length - 1;
        
        return `
            <div class="question-navigation">
                <button class="nav-button nav-button-back" 
                        onclick="QuestionnaireClean.previousColumn()" 
                        ${isFirst ? 'disabled' : ''}>
                    ← Previous
                </button>
                <button class="nav-button nav-button-next" 
                        onclick="QuestionnaireClean.${isLast ? 'finishQuestionnaire' : 'nextColumn'}()">
                    ${isLast ? 'Finish →' : 'Next →'}
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners to answer buttons
     */
    function attachQuestionListeners() {
        const buttons = document.querySelectorAll('.answer-button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const question = this.dataset.question;
                const answer = this.dataset.answer;
                handleAnswer(question, answer);
            });
        });
    }

    /**
     * Handle answer selection
     */
    function handleAnswer(question, answer) {
        const columnName = state.columnData.column_name;
        
        if (!state.answers[columnName]) {
            state.answers[columnName] = {};
        }
        
        state.answers[columnName][question] = answer;
        
        // Re-render to show updated state
        renderQuestionPanel();
        
        // Update visualization
        renderVisualization();
    }

    /**
     * Navigate to next column
     */
    async function nextColumn() {
        // Apply current column's cleaning
        await applyCurrentColumnCleaning();
        
        // Move to next
        if (state.currentColumnIndex < state.columns.length - 1) {
            await loadColumn(state.currentColumnIndex + 1);
        }
    }

    /**
     * Navigate to previous column
     */
    async function previousColumn() {
        if (state.currentColumnIndex > 0) {
            await loadColumn(state.currentColumnIndex - 1);
        }
    }

    /**
     * Apply cleaning for current column
     */
    async function applyCurrentColumnCleaning() {
        const columnName = state.columnData.column_name;
        const answers = state.answers[columnName] || {};
        
        // Skip if no answers or column excluded
        if (Object.keys(answers).length === 0 || answers.q1 === 'id_code' || answers.q1 === 'free_text') {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/questionnaire/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_id: state.fileId,
                    column_name: columnName,
                    answers: answers,
                    branch: state.columnData.suggested_branch
                })
            });
            
            if (!response.ok) throw new Error('Failed to apply cleaning');
            
            const result = await response.json();
            state.transformations.push(result.transformation_summary);
            
        } catch (error) {
            console.error('Error applying cleaning:', error);
            showError('Failed to apply cleaning transformations');
        }
    }

    /**
     * Finish questionnaire and show summary
     */
    async function finishQuestionnaire() {
        // Apply last column
        await applyCurrentColumnCleaning();
        
        // Show summary screen
        showCleaningSummary();
    }

    /**
     * Show cleaning summary screen
     */
    function showCleaningSummary() {
        const panel = document.getElementById('questionContent');
        if (!panel) return;
        
        let readyCount = 0;
        let excludedCount = 0;
        let newColumnsCount = 0;
        
        state.transformations.forEach(trans => {
            if (trans.excluded) {
                excludedCount++;
            } else {
                readyCount++;
            }
            newColumnsCount += (trans.new_columns || []).length;
        });
        
        const html = `
            <div class="question-card" style="text-align: center; padding: 40px;">
                <h2 style="font-size: 28px; margin-bottom: 24px;">🎉 Cleaning Complete!</h2>
                
                <div style="display: flex; gap: 24px; justify-content: center; margin: 32px 0;">
                    <div style="padding: 20px; background: #d1fae5; border-radius: 12px;">
                        <div style="font-size: 32px; font-weight: bold; color: #065f46;">${readyCount}</div>
                        <div style="color: #065f46;">Columns Ready</div>
                    </div>
                    <div style="padding: 20px; background: #dbeafe; border-radius: 12px;">
                        <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${newColumnsCount}</div>
                        <div style="color: #1e40af;">New Columns</div>
                    </div>
                    <div style="padding: 20px; background: #fee2e2; border-radius: 12px;">
                        <div style="font-size: 32px; font-weight: bold; color: #991b1b;">${excludedCount}</div>
                        <div style="color: #991b1b;">Excluded</div>
                    </div>
                </div>
                
                <button onclick="QuestionnaireClean.proceedToFeatures()" 
                        style="padding: 16px 48px; background: #3b82f6; color: white; 
                               border: none; border-radius: 10px; font-size: 16px; 
                               font-weight: 600; cursor: pointer; margin-top: 24px;">
                    Proceed to Feature Selection →
                </button>
            </div>
        `;
        
        panel.innerHTML = html;
        
        // Clear visualization panel
        document.getElementById('vizContent').innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">Cleaning complete! Ready for next steps.</p>';
    }

    /**
     * Proceed to feature engineering
     */
    function proceedToFeatures() {
        Navigation.navigateTo('featureEngineeringPage');
    }

    /**
     * Render column mini-map
     */
    function renderColumnMiniMap() {
        const container = document.getElementById('columnMiniMap');
        if (!container) return;
        
        const chips = state.columns.map((col, index) => {
            let status = 'pending';
            if (index < state.currentColumnIndex) {
                status = 'completed';
            } else if (index === state.currentColumnIndex) {
                status = 'current';
            }
            
            // Check if excluded
            const answers = state.answers[col];
            if (answers && (answers.q1 === 'id_code' || answers.q1 === 'free_text')) {
                status = 'excluded';
            }
            
            return `<div class="column-chip ${status}" onclick="QuestionnaireClean.jumpToColumn(${index})">${col}</div>`;
        }).join('');
        
        container.innerHTML = chips;
    }

    /**
     * Update column mini-map
     */
    function updateColumnMiniMap() {
        renderColumnMiniMap();
    }

    /**
     * Jump to specific column
     */
    async function jumpToColumn(index) {
        await loadColumn(index);
    }

    /**
     * Render visualization panel with data table + chart
     */
    function renderVisualization() {
        const container = document.getElementById('vizContent');
        if (!container || !state.columnData) return;
        
        const data = state.columnData;
        const answers = state.answers[data.column_name] || {};
        
        // Header
        const header = `
            <div class="viz-header">
                <div class="viz-column-name">${data.column_name}</div>
                <div class="viz-stats">
                    <div class="viz-stat-item">
                        <div class="viz-stat-label">Rows</div>
                        <div class="viz-stat-value">${data.total_rows}</div>
                    </div>
                    <div class="viz-stat-item">
                        <div class="viz-stat-label">Unique</div>
                        <div class="viz-stat-value">${data.unique_count}</div>
                    </div>
                    <div class="viz-stat-item">
                        <div class="viz-stat-label">Type</div>
                        <div class="viz-stat-value">${data.detected_type}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Missing indicator
        const missingResolved = answers.missing_strategy && answers.missing_strategy !== 'leave';
        const missingIndicator = data.missing_count > 0 ? `
            <div class="missing-indicator ${missingResolved ? 'resolved' : ''}">
                <div>● ${data.missing_count} missing (${data.missing_pct}%)</div>
                <div class="missing-bar">
                    <div class="missing-bar-fill ${missingResolved ? 'resolved' : ''}" 
                         style="width: ${data.missing_pct}%"></div>
                </div>
                ${missingResolved ? '<div style="color: #065f46; font-weight: 600;">✓ Will be handled</div>' : ''}
            </div>
        ` : '';
        
        // Data table showing actual column values (scrollable)
        const dataTable = renderDataTable(data);
        
        // Chart placeholder (will be enhanced with Chart.js)
        const chart = `
            <div class="viz-canvas" style="margin-top: 24px;">
                <h4 style="color: var(--text); margin-bottom: 12px; font-size: 0.9rem;">Distribution</h4>
                <canvas id="vizChart" width="400" height="300"></canvas>
            </div>
        `;
        
        container.innerHTML = header + missingIndicator + dataTable + chart;
        
        // Render actual chart
        renderChart(data, answers);
    }
    
    /**
     * Render scrollable data table for current column
     */
    function renderDataTable(data) {
        if (!data.sample_rows || data.sample_rows.length === 0) {
            return '<div style="color: var(--muted); padding: 20px;">No data preview available</div>';
        }
        
        const columnName = data.column_name;
        
        // Build table rows
        const rows = data.sample_rows.map((row, idx) => {
            const value = row[columnName];
            const displayValue = value === null || value === undefined || value === '' ? 
                '<span style="color: #f59e0b; font-style: italic;">missing</span>' : 
                String(value);
            return `
                <tr>
                    <td style="color: var(--muted); font-size: 0.75rem;">${idx + 1}</td>
                    <td style="color: var(--text); font-family: var(--font-mono); font-size: 0.85rem;">${displayValue}</td>
                </tr>
            `;
        }).join('');
        
        return `
            <div style="margin-top: 24px;">
                <h4 style="color: var(--text); margin-bottom: 12px; font-size: 0.9rem;">Data Preview (${data.sample_rows.length} rows)</h4>
                <div style="max-height: 300px; overflow-y: auto; overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; background: rgba(0,0,0,0.2);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; background: var(--surface); z-index: 1;">
                            <tr>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--border); color: var(--muted); font-size: 0.75rem; font-weight: 500;">#</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--border); color: var(--text); font-size: 0.85rem; font-weight: 500;">${columnName}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render chart using Chart.js
     */
    function renderChart(data, answers) {
        const canvas = document.getElementById('vizChart');
        if (!canvas) return;
        
        // Destroy existing chart
        if (window.questionnaireChart) {
            window.questionnaireChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        // Different charts based on type
        if (data.detected_type === 'numeric') {
            // Histogram placeholder
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(50, 50, 100, 200);
            ctx.fillRect(160, 100, 100, 150);
            ctx.fillRect(270, 75, 100, 175);
            
            ctx.fillStyle = '#111827';
            ctx.font = '14px sans-serif';
            ctx.fillText('Distribution (histogram)', 10, 30);
            
        } else if (data.detected_type === 'categorical') {
            // Bar chart for categories
            const categories = Object.keys(data.value_counts || {}).slice(0, 5);
            const counts = Object.values(data.value_counts || {}).slice(0, 5);
            const maxCount = Math.max(...counts);
            
            categories.forEach((cat, i) => {
                const barHeight = (counts[i] / maxCount) * 200;
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(50 + i * 70, 250 - barHeight, 50, barHeight);
                
                ctx.fillStyle = '#111827';
                ctx.font = '12px sans-serif';
                ctx.save();
                ctx.translate(75 + i * 70, 260);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText(String(cat).substring(0, 10), 0, 0);
                ctx.restore();
            });
            
            ctx.fillStyle = '#111827';
            ctx.font = '14px sans-serif';
            ctx.fillText('Category distribution', 10, 30);
        }
    }

    // Helper functions
    function showLoading(message) {
        // TODO: Implement loading overlay
        console.log('Loading:', message);
    }

    function hideLoading() {
        // TODO: Hide loading overlay
    }

    function showError(message) {
        alert(message);
    }

    // Public API
    return {
        init,
        nextColumn,
        previousColumn,
        jumpToColumn,
        finishQuestionnaire,
        proceedToFeatures
    };
})();

// Export to window
if (typeof window !== 'undefined') {
    window.QuestionnaireClean = QuestionnaireClean;
}
