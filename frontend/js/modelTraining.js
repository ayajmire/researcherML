// Model Training Preparation Module
// All functions exposed on window for backward compatibility

(function () {
    'use strict';

    // Ensure global variables exist
    if (typeof window.allData === 'undefined') window.allData = [];
    if (typeof window.allColumns === 'undefined') window.allColumns = [];
    if (typeof window.variableChanges === 'undefined') window.variableChanges = {};
    if (typeof window.dataModified === 'undefined') window.dataModified = false;
    if (typeof window.uploadedData === 'undefined') window.uploadedData = null;
    if (typeof window.selectedModelType === 'undefined') window.selectedModelType = null;
    if (typeof window.selectedModelAction === 'undefined') window.selectedModelAction = null;
    if (typeof window.selectedTrainingModel === 'undefined') window.selectedTrainingModel = null;
    if (typeof window.selectedLabel === 'undefined') window.selectedLabel = null;
    if (typeof window.selectedFeatures === 'undefined') window.selectedFeatures = [];
    if (typeof window.trainingDatasetExport === 'undefined') window.trainingDatasetExport = null;
    if (typeof window.trainSplitPercentage === 'undefined') window.trainSplitPercentage = 80;
    if (typeof window.testSplitPercentage === 'undefined') window.testSplitPercentage = 20;
    if (typeof window.nullHandlingMethod === 'undefined') window.nullHandlingMethod = 'impute'; // 'impute' or 'remove'
    if (typeof window.selectedTrainingModels === 'undefined') window.selectedTrainingModels = [];
    if (typeof window.useOptuna === 'undefined') window.useOptuna = false;
    if (typeof window.nTrials === 'undefined') window.nTrials = 20;
    if (typeof window.saveModels === 'undefined') window.saveModels = true;
    if (typeof window.selectedTaskForTraining === 'undefined') window.selectedTaskForTraining = null;
    if (typeof window.trainingPreviewPage === 'undefined') window.trainingPreviewPage = 1;
    if (typeof window.trainingPreviewPageSize === 'undefined') window.trainingPreviewPageSize = 100;
    if (typeof window.lastPreviewFeatureSignature === 'undefined') window.lastPreviewFeatureSignature = null;

    // Model options by domain and task
    const MODEL_OPTIONS = {
        ehr: {
            classification: [
                { id: 'logreg', name: 'Logistic Regression' },
                { id: 'rf', name: 'Random Forest' },
                { id: 'xgb', name: 'XGBoost' },
                { id: 'lgbm', name: 'LightGBM' },
                { id: 'catboost', name: 'CatBoost' },
                { id: 'gbm', name: 'Gradient Boosting' },
                { id: 'adaboost', name: 'AdaBoost' },
                { id: 'svm', name: 'Support Vector Machine' },
                { id: 'knn', name: 'K-Nearest Neighbors' },
                { id: 'nb', name: 'Naive Bayes' },
                { id: 'mlp', name: 'MLP (Feedforward NN)' },
                { id: 'et', name: 'Extra Trees' }
            ],
            regression: [
                { id: 'linreg', name: 'Linear Regression' },
                { id: 'lasso', name: 'Lasso Regression' },
                { id: 'ridge', name: 'Ridge Regression' },
                { id: 'elastic', name: 'Elastic Net' },
                { id: 'rf_reg', name: 'Random Forest Regressor' },
                { id: 'xgb_reg', name: 'XGBoost Regressor' },
                { id: 'lgbm_reg', name: 'LightGBM Regressor' },
                { id: 'catboost_reg', name: 'CatBoost Regressor' },
                { id: 'gbm_reg', name: 'Gradient Boosting Regressor' },
                { id: 'adaboost_reg', name: 'AdaBoost Regressor' },
                { id: 'svr', name: 'Support Vector Regressor' },
                { id: 'knn_reg', name: 'K-Nearest Neighbors Regressor' },
                { id: 'mlp_reg', name: 'MLP Regressor' },
                { id: 'et_reg', name: 'Extra Trees Regressor' }
            ]
        },
        imaging: {
            classification: [
                { id: 'resnet18', name: 'ResNet-18' },
                { id: 'resnet50', name: 'ResNet-50' },
                { id: 'efficientnet_b0', name: 'EfficientNet-B0' }
            ],
            regression: [
                { id: 'resnet18_reg', name: 'ResNet-18 (Regression Head)' },
                { id: 'efficientnet_b0_reg', name: 'EfficientNet-B0 (Regression Head)' }
            ]
        },
    };

    // Hyperparameter definitions for each model
    const MODEL_HYPERPARAMETERS = {
        // Classification models
        logreg: [
            { name: 'C', type: 'float', default_min: 0.001, default_max: 100, scale: 'log', description: 'Inverse of regularization strength' },
            { name: 'penalty', type: 'categorical', options: ['l1', 'l2', 'elasticnet', 'none'], description: 'Regularization penalty' },
            { name: 'solver', type: 'categorical', options: ['lbfgs', 'liblinear', 'newton-cg', 'sag', 'saga'], description: 'Optimization algorithm' },
            { name: 'max_iter', type: 'int', default_min: 100, default_max: 1000, scale: 'linear', description: 'Maximum iterations' }
        ],
        rf: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of trees' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 30, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'min_samples_split', type: 'int', default_min: 2, default_max: 20, scale: 'linear', description: 'Minimum samples to split' },
            { name: 'min_samples_leaf', type: 'int', default_min: 1, default_max: 10, scale: 'linear', description: 'Minimum samples in leaf' },
            { name: 'max_features', type: 'categorical', options: ['sqrt', 'log2', 'auto', 'None'], description: 'Features to consider' }
        ],
        xgb: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting rounds' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 15, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'subsample', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Subsample ratio' },
            { name: 'colsample_bytree', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Column subsample ratio' },
            { name: 'gamma', type: 'float', default_min: 0, default_max: 5, scale: 'linear', description: 'Minimum loss reduction' },
            { name: 'reg_alpha', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L1 regularization' },
            { name: 'reg_lambda', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L2 regularization' }
        ],
        lgbm: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting rounds' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 15, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'num_leaves', type: 'int', default_min: 31, default_max: 300, scale: 'linear', description: 'Maximum tree leaves' },
            { name: 'subsample', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Subsample ratio' },
            { name: 'colsample_bytree', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Column subsample ratio' },
            { name: 'reg_alpha', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L1 regularization' },
            { name: 'reg_lambda', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L2 regularization' }
        ],
        catboost: [
            { name: 'iterations', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting rounds' },
            { name: 'depth', type: 'int', default_min: 3, default_max: 10, scale: 'linear', description: 'Tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'l2_leaf_reg', type: 'float', default_min: 1, default_max: 10, scale: 'linear', description: 'L2 regularization' },
            { name: 'border_count', type: 'int', default_min: 32, default_max: 255, scale: 'linear', description: 'Border count for features' }
        ],
        gbm: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting stages' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 15, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'subsample', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Subsample ratio' },
            { name: 'min_samples_split', type: 'int', default_min: 2, default_max: 20, scale: 'linear', description: 'Minimum samples to split' },
            { name: 'min_samples_leaf', type: 'int', default_min: 1, default_max: 10, scale: 'linear', description: 'Minimum samples in leaf' }
        ],
        adaboost: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 300, scale: 'linear', description: 'Number of estimators' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 2.0, scale: 'log', description: 'Learning rate' },
            { name: 'algorithm', type: 'categorical', options: ['SAMME', 'SAMME.R'], description: 'Boosting algorithm' }
        ],
        svm: [
            { name: 'C', type: 'float', default_min: 0.1, default_max: 100, scale: 'log', description: 'Regularization parameter' },
            { name: 'kernel', type: 'categorical', options: ['linear', 'poly', 'rbf', 'sigmoid'], description: 'Kernel type' },
            { name: 'gamma', type: 'categorical', options: ['scale', 'auto'], description: 'Kernel coefficient' },
            { name: 'degree', type: 'int', default_min: 2, default_max: 5, scale: 'linear', description: 'Degree for poly kernel' }
        ],
        knn: [
            { name: 'n_neighbors', type: 'int', default_min: 3, default_max: 50, scale: 'linear', description: 'Number of neighbors' },
            { name: 'weights', type: 'categorical', options: ['uniform', 'distance'], description: 'Weight function' },
            { name: 'algorithm', type: 'categorical', options: ['auto', 'ball_tree', 'kd_tree', 'brute'], description: 'Algorithm used' },
            { name: 'p', type: 'int', default_min: 1, default_max: 2, scale: 'linear', description: 'Power parameter for Minkowski' }
        ],
        nb: [
            { name: 'alpha', type: 'float', default_min: 0.1, default_max: 10, scale: 'log', description: 'Smoothing parameter' },
            { name: 'fit_prior', type: 'categorical', options: [true, false], description: 'Learn class prior probabilities' }
        ],
        mlp: [
            { name: 'hidden_layer_sizes', type: 'tuple', default_options: ['(100,)', '(50,50)', '(100,50)', '(200,100)', '(100,100,50)'], description: 'Hidden layer sizes' },
            { name: 'activation', type: 'categorical', options: ['relu', 'tanh', 'logistic'], description: 'Activation function' },
            { name: 'alpha', type: 'float', default_min: 0.0001, default_max: 1.0, scale: 'log', description: 'L2 regularization' },
            { name: 'learning_rate', type: 'categorical', options: ['constant', 'invscaling', 'adaptive'], description: 'Learning rate schedule' },
            { name: 'learning_rate_init', type: 'float', default_min: 0.0001, default_max: 0.1, scale: 'log', description: 'Initial learning rate' },
            { name: 'max_iter', type: 'int', default_min: 100, default_max: 1000, scale: 'linear', description: 'Maximum iterations' }
        ],
        et: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of trees' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 30, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'min_samples_split', type: 'int', default_min: 2, default_max: 20, scale: 'linear', description: 'Minimum samples to split' },
            { name: 'min_samples_leaf', type: 'int', default_min: 1, default_max: 10, scale: 'linear', description: 'Minimum samples in leaf' },
            { name: 'max_features', type: 'categorical', options: ['sqrt', 'log2', 'auto', 'None'], description: 'Features to consider' }
        ],
        // Regression models
        linreg: [
            { name: 'fit_intercept', type: 'categorical', options: [true, false], description: 'Fit intercept term' }
            // Note: 'normalize' parameter is deprecated in sklearn 1.0+, use StandardScaler instead
        ],
        lasso: [
            { name: 'alpha', type: 'float', default_min: 0.001, default_max: 10, scale: 'log', description: 'Regularization strength' },
            { name: 'fit_intercept', type: 'categorical', options: [true, false], description: 'Fit intercept term' },
            { name: 'max_iter', type: 'int', default_min: 1000, default_max: 10000, scale: 'linear', description: 'Maximum iterations' }
        ],
        ridge: [
            { name: 'alpha', type: 'float', default_min: 0.001, default_max: 10, scale: 'log', description: 'Regularization strength' },
            { name: 'fit_intercept', type: 'categorical', options: [true, false], description: 'Fit intercept term' },
            { name: 'solver', type: 'categorical', options: ['auto', 'svd', 'cholesky', 'lsqr', 'sparse_cg', 'sag', 'saga'], description: 'Solver algorithm' }
        ],
        elastic: [
            { name: 'alpha', type: 'float', default_min: 0.001, default_max: 10, scale: 'log', description: 'Regularization strength' },
            { name: 'l1_ratio', type: 'float', default_min: 0.1, default_max: 0.9, scale: 'linear', description: 'ElasticNet mixing parameter' },
            { name: 'fit_intercept', type: 'categorical', options: [true, false], description: 'Fit intercept term' },
            { name: 'max_iter', type: 'int', default_min: 1000, default_max: 10000, scale: 'linear', description: 'Maximum iterations' }
        ],
        rf_reg: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of trees' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 30, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'min_samples_split', type: 'int', default_min: 2, default_max: 20, scale: 'linear', description: 'Minimum samples to split' },
            { name: 'min_samples_leaf', type: 'int', default_min: 1, default_max: 10, scale: 'linear', description: 'Minimum samples in leaf' },
            { name: 'max_features', type: 'categorical', options: ['sqrt', 'log2', 'auto', 'None'], description: 'Features to consider' }
        ],
        xgb_reg: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting rounds' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 15, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'subsample', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Subsample ratio' },
            { name: 'colsample_bytree', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Column subsample ratio' },
            { name: 'gamma', type: 'float', default_min: 0, default_max: 5, scale: 'linear', description: 'Minimum loss reduction' },
            { name: 'reg_alpha', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L1 regularization' },
            { name: 'reg_lambda', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L2 regularization' }
        ],
        lgbm_reg: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting rounds' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 15, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'num_leaves', type: 'int', default_min: 31, default_max: 300, scale: 'linear', description: 'Maximum tree leaves' },
            { name: 'subsample', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Subsample ratio' },
            { name: 'colsample_bytree', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Column subsample ratio' },
            { name: 'reg_alpha', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L1 regularization' },
            { name: 'reg_lambda', type: 'float', default_min: 0, default_max: 10, scale: 'log', description: 'L2 regularization' }
        ],
        catboost_reg: [
            { name: 'iterations', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting rounds' },
            { name: 'depth', type: 'int', default_min: 3, default_max: 10, scale: 'linear', description: 'Tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'l2_leaf_reg', type: 'float', default_min: 1, default_max: 10, scale: 'linear', description: 'L2 regularization' },
            { name: 'border_count', type: 'int', default_min: 32, default_max: 255, scale: 'linear', description: 'Border count for features' }
        ],
        gbm_reg: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of boosting stages' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 15, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 0.3, scale: 'log', description: 'Learning rate' },
            { name: 'subsample', type: 'float', default_min: 0.5, default_max: 1.0, scale: 'linear', description: 'Subsample ratio' },
            { name: 'min_samples_split', type: 'int', default_min: 2, default_max: 20, scale: 'linear', description: 'Minimum samples to split' },
            { name: 'min_samples_leaf', type: 'int', default_min: 1, default_max: 10, scale: 'linear', description: 'Minimum samples in leaf' }
        ],
        adaboost_reg: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 300, scale: 'linear', description: 'Number of estimators' },
            { name: 'learning_rate', type: 'float', default_min: 0.01, default_max: 2.0, scale: 'log', description: 'Learning rate' },
            { name: 'loss', type: 'categorical', options: ['linear', 'square', 'exponential'], description: 'Loss function' }
        ],
        svr: [
            { name: 'C', type: 'float', default_min: 0.1, default_max: 100, scale: 'log', description: 'Regularization parameter' },
            { name: 'kernel', type: 'categorical', options: ['linear', 'poly', 'rbf', 'sigmoid'], description: 'Kernel type' },
            { name: 'gamma', type: 'categorical', options: ['scale', 'auto'], description: 'Kernel coefficient' },
            { name: 'epsilon', type: 'float', default_min: 0.01, default_max: 1.0, scale: 'log', description: 'Epsilon in epsilon-SVR' }
        ],
        knn_reg: [
            { name: 'n_neighbors', type: 'int', default_min: 3, default_max: 50, scale: 'linear', description: 'Number of neighbors' },
            { name: 'weights', type: 'categorical', options: ['uniform', 'distance'], description: 'Weight function' },
            { name: 'algorithm', type: 'categorical', options: ['auto', 'ball_tree', 'kd_tree', 'brute'], description: 'Algorithm used' },
            { name: 'p', type: 'int', default_min: 1, default_max: 2, scale: 'linear', description: 'Power parameter for Minkowski' }
        ],
        mlp_reg: [
            { name: 'hidden_layer_sizes', type: 'tuple', default_options: ['(100,)', '(50,50)', '(100,50)', '(200,100)', '(100,100,50)'], description: 'Hidden layer sizes' },
            { name: 'activation', type: 'categorical', options: ['relu', 'tanh', 'logistic'], description: 'Activation function' },
            { name: 'alpha', type: 'float', default_min: 0.0001, default_max: 1.0, scale: 'log', description: 'L2 regularization' },
            { name: 'learning_rate', type: 'categorical', options: ['constant', 'invscaling', 'adaptive'], description: 'Learning rate schedule' },
            { name: 'learning_rate_init', type: 'float', default_min: 0.0001, default_max: 0.1, scale: 'log', description: 'Initial learning rate' },
            { name: 'max_iter', type: 'int', default_min: 100, default_max: 1000, scale: 'linear', description: 'Maximum iterations' }
        ],
        et_reg: [
            { name: 'n_estimators', type: 'int', default_min: 50, default_max: 500, scale: 'linear', description: 'Number of trees' },
            { name: 'max_depth', type: 'int', default_min: 3, default_max: 30, scale: 'linear', description: 'Maximum tree depth' },
            { name: 'min_samples_split', type: 'int', default_min: 2, default_max: 20, scale: 'linear', description: 'Minimum samples to split' },
            { name: 'min_samples_leaf', type: 'int', default_min: 1, default_max: 10, scale: 'linear', description: 'Minimum samples in leaf' },
            { name: 'max_features', type: 'categorical', options: ['sqrt', 'log2', 'auto', 'None'], description: 'Features to consider' }
        ]
    };

    window.proceedToModelTraining = function () {
        // Hide all other elements and show only model training page
        if (window.hideAllSections) window.hideAllSections();
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

        // Hide all sections except model training
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
        if (visualizationPage) {
            visualizationPage.style.display = 'none';
            visualizationPage.style.visibility = 'hidden';
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
        if (modelTrainingPage) {
            modelTrainingPage.style.display = 'block';
            modelTrainingPage.style.visibility = 'visible';
        }

        if (window.setActiveStep) {
            window.setActiveStep('training');
        }

        // Initialize model training interface
        window.initializeModelTrainingInterface();
    };

    window.initializeModelTrainingInterface = function () {
        const modelTrainingContent = document.getElementById('modelTrainingContent');
        if (!modelTrainingContent) {
            console.error('ModelTraining: #modelTrainingContent not found');
            return;
        }

        if (!window.allData || !Array.isArray(window.allData) || window.allData.length === 0 || !window.allColumns || !Array.isArray(window.allColumns) || window.allColumns.length === 0) {
            modelTrainingContent.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #64748B;">
                    <h4 style="color: #1E40AF; margin-bottom: 15px;">No Data Available</h4>
                    <p style="font-size: 1rem; margin-bottom: 30px;">Please upload and prepare a dataset first.</p>
                </div>
            `;
            return;
        }

        // Restore persisted selections safely
        try {
            const persistedLabel = localStorage.getItem('selectedLabel');
            const persistedFeaturesRaw = localStorage.getItem('selectedFeatures');
            const persistedFeatures = persistedFeaturesRaw ? JSON.parse(persistedFeaturesRaw) : [];
            const persistedTrainSplit = localStorage.getItem('trainSplitPercentage');
            const persistedTestSplit = localStorage.getItem('testSplitPercentage');
            const persistedNullMethod = localStorage.getItem('nullHandlingMethod');
            const persistedSelectedModels = localStorage.getItem('selectedTrainingModels');
            const persistedUseOptuna = localStorage.getItem('useOptuna');
            const persistedNTrials = localStorage.getItem('nTrials');
            const persistedSaveModels = localStorage.getItem('saveModels');
            const persistedTaskForTraining = localStorage.getItem('selectedTaskForTraining');
            const persistedHyperparameterConfigs = localStorage.getItem('hyperparameterConfigs');

            // IMPORTANT: Restore model type and action from uploadedData FIRST (before computing task)
            // This ensures the UI shows the correct selection - always restore from uploadedData if available
            if (window.uploadedData) {
                // Always restore from uploadedData, overriding any stale values
                if (window.uploadedData.selected_model_type !== undefined && window.uploadedData.selected_model_type !== null) {
                    window.selectedModelType = window.uploadedData.selected_model_type;
                    console.log('ModelTraining: Restored selectedModelType from uploadedData:', window.selectedModelType);
                }
                if (window.uploadedData.selected_model_action !== undefined && window.uploadedData.selected_model_action !== null) {
                    window.selectedModelAction = window.uploadedData.selected_model_action;
                    console.log('ModelTraining: Restored selectedModelAction from uploadedData:', window.selectedModelAction);
                }
            }

            if (persistedLabel) window.selectedLabel = persistedLabel;
            if (Array.isArray(persistedFeatures)) window.selectedFeatures = persistedFeatures;
            if (persistedTrainSplit) window.trainSplitPercentage = parseInt(persistedTrainSplit, 10) || 80;
            if (persistedTestSplit) window.testSplitPercentage = parseInt(persistedTestSplit, 10) || 20;
            if (persistedNullMethod) window.nullHandlingMethod = persistedNullMethod;
            if (persistedSelectedModels) window.selectedTrainingModels = JSON.parse(persistedSelectedModels);
            if (persistedUseOptuna !== null) window.useOptuna = persistedUseOptuna === 'true';
            if (persistedNTrials) window.nTrials = parseInt(persistedNTrials, 10) || 20;
            if (persistedSaveModels !== null) window.saveModels = persistedSaveModels === 'true';
            if (persistedTaskForTraining) window.selectedTaskForTraining = persistedTaskForTraining;
            if (persistedHyperparameterConfigs) {
                window.hyperparameterConfigs = JSON.parse(persistedHyperparameterConfigs);
            } else {
                window.hyperparameterConfigs = {};
            }
        } catch (e) {
            console.warn('ModelTraining: restore selections failed', e);
        }

        // Initialize hyperparameter configs if not exists
        if (!window.hyperparameterConfigs) {
            window.hyperparameterConfigs = {};
        }

        // Get variable types for display
        const getVariableType = (column) => {
            return window.variableChanges[column]?.variable_type || 'categorical';
        };

        // Resolve model options for the current selection
        // Use the restored values (should be set above) with fallbacks
        const domain = window.selectedModelType || 'ehr';

        // Task priority: 1) User's explicit selection in model training, 2) Upload selection, 3) Default
        let task = 'classification'; // default
        if (window.selectedTaskForTraining) {
            // User explicitly selected task in model training page
            task = window.selectedTaskForTraining;
        } else if (window.uploadedData && window.uploadedData.selected_model_action) {
            // Use the task selected during upload
            task = window.uploadedData.selected_model_action;
        } else if (window.selectedModelAction) {
            // Fallback to selectedModelAction (should be same as uploadedData, but just in case)
            task = window.selectedModelAction;
        }

        console.log('ModelTraining: Using domain:', domain, 'task:', task);
        console.log('ModelTraining: selectedModelType =', window.selectedModelType);
        console.log('ModelTraining: selectedModelAction =', window.selectedModelAction);
        console.log('ModelTraining: selectedTaskForTraining =', window.selectedTaskForTraining);
        console.log('ModelTraining: uploadedData.selected_model_action =', window.uploadedData?.selected_model_action);
        console.log('ModelTraining: Final resolved task =', task);

        const availableModels = (MODEL_OPTIONS[domain] && MODEL_OPTIONS[domain][task]) ? MODEL_OPTIONS[domain][task] : [];

        // Create model training interface
        let modelTrainingHTML = '';
        try {
            modelTrainingHTML = `
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
                            ${window.allColumns.map(column => `<option value="${column}" ${window.selectedLabel === column ? 'selected' : ''}>${column}</option>`).join('')}
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
                                        <input type="checkbox" id="feature-${index}" value="${column}" class="feature-checkbox" ${(window.selectedFeatures.length === 0 || window.selectedFeatures.includes(column)) ? 'checked' : ''}
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
                    <!-- Model Selection -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px;">
                        <h4 style="color: #1E40AF; margin-bottom: 16px; font-weight: 700;">Model Selection</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; align-items: center; margin-bottom: 20px;">
                            <div>
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 6px;">Domain</div>
                                <div style="font-weight: 600; color: #111827;">${domain}</div>
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 0.95rem;">Task</label>
                                <select id="taskSelection" onchange="handleTaskSelectionChange(this.value)" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 10px; background: white; font-size: 0.95rem; cursor: pointer;">
                                    <option value="classification" ${task === 'classification' ? 'selected' : ''}>Classification</option>
                                    <option value="regression" ${task === 'regression' ? 'selected' : ''}>Regression</option>
                                </select>
                                <div style="font-size: 0.75rem; color: #6B7280; margin-top: 4px;">Select task type for training</div>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 10px; font-size: 0.95rem;">Select Models (Multiple Selection)</label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto; padding: 12px; background: #F9FAFB; border-radius: 8px;">
                                ${availableModels.map(m => {
                const isSelected = (window.selectedTrainingModels || []).includes(m.id);
                return `
                                        <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s;" 
                                               onmouseover="this.style.background='white'" 
                                               onmouseout="this.style.background='transparent'">
                                            <input type="checkbox" class="model-checkbox" value="${m.id}" ${isSelected ? 'checked' : ''}
                                                   style="width: 18px; height: 18px; cursor: pointer; accent-color: #0071e3;">
                                            <span style="font-size: 0.9rem; color: #1F2937; font-weight: 500;">${m.name}</span>
                                        </label>
                                    `;
            }).join('')}
                            </div>
                            ${availableModels.length === 0 ? `<div style=\"margin-top:8px; color:#DC2626; font-size:0.85rem;\">No models available for this selection.</div>` : ''}
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button onclick="selectAllModels()" style="background: #0071e3; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 500;">
                                Select All
                            </button>
                            <button onclick="deselectAllModels()" style="background: #86868b; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 500;">
                                Deselect All
                            </button>
                        </div>
                    </div>
                    <!-- Advanced Options -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px;">
                        <h4 style="color: #1E40AF; margin-bottom: 16px; font-weight: 700;">Advanced Options</h4>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                <input type="checkbox" id="useOptunaCheckbox" ${window.useOptuna ? 'checked' : ''} 
                                       onchange="window.handleOptunaToggle(this.checked);"
                                       style="width: 18px; height: 18px; cursor: pointer; accent-color: #0071e3;">
                                <div>
                                    <div style="font-weight: 600; color: #1F2937; font-size: 0.95rem;">Use Optuna for Hyperparameter Optimization</div>
                                    <div style="font-size: 0.8rem; color: #6B7280;">Automatically find best hyperparameters (slower but more accurate)</div>
                                </div>
                            </label>
                            <div id="optunaOptions" style="display: ${window.useOptuna ? 'block' : 'none'}; margin-left: 30px; padding: 15px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 0.9rem;">Number of Trials</label>
                                <input type="number" id="nTrialsInput" min="5" max="100" value="${window.nTrials || 20}" 
                                       onchange="window.nTrials = parseInt(this.value); localStorage.setItem('nTrials', this.value);"
                                       style="width: 100%; max-width: 200px; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.9rem;">
                                <div style="font-size: 0.75rem; color: #6B7280; margin-top: 4px; margin-bottom: 20px;">More trials = better results but slower (5-100)</div>
                                
                                <!-- Hyperparameter Configuration Section -->
                                <div id="hyperparameterConfigSection" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #D1D5DB; display: block !important; visibility: visible !important;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <h5 style="color: #1E40AF; margin: 0; font-weight: 700; font-size: 1rem;">Hyperparameter Configuration</h5>
                                        <button onclick="window.renderHyperparameterConfigs(); console.log('Manual refresh triggered');" 
                                                style="padding: 6px 12px; background: #0071e3; color: white; border: none; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 500;">
                                            Refresh
                                        </button>
                                    </div>
                                    <p style="font-size: 0.85rem; color: #6B7280; margin-bottom: 15px;">Configure hyperparameter search spaces for each selected model. Select which parameters to tune and set their ranges.</p>
                                    <div id="modelHyperparameterConfigs" style="display: flex; flex-direction: column; gap: 15px; min-height: 100px; padding: 10px; background: white; border-radius: 8px; border: 1px solid #E5E7EB; visibility: visible !important;">
                                        <div style="padding: 15px; background: #F3F4F6; border-radius: 8px; border: 1px solid #D1D5DB; text-align: center;">
                                            <p style="margin: 0; color: #6B7280; font-size: 0.9rem; font-weight: 500;">Select models above to configure hyperparameters</p>
                                            <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 0.8rem;">Or click "Refresh" button to reload</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                <input type="checkbox" id="saveModelsCheckbox" ${window.saveModels !== false ? 'checked' : ''} 
                                       onchange="window.saveModels = this.checked; localStorage.setItem('saveModels', this.checked);"
                                       style="width: 18px; height: 18px; cursor: pointer; accent-color: #0071e3;">
                                <div>
                                    <div style="font-weight: 600; color: #1F2937; font-size: 0.95rem;">Save Trained Models</div>
                                    <div style="font-size: 0.8rem; color: #6B7280;">Save models to disk for later use</div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <!-- Train/Test Split Configuration -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px;">
                        <h4 style="color: #1E40AF; margin-bottom: 16px; font-weight: 700;">Train/Test Split</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; align-items: end;">
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 0.95rem;">Training Set (%)</label>
                                <input type="number" id="trainSplitInput" min="1" max="99" value="${window.trainSplitPercentage}" 
                                       onchange="handleTrainSplitChange(this.value)" 
                                       oninput="handleTrainSplitChange(this.value)"
                                       style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 10px; font-size: 0.95rem;">
                                <div style="font-size: 0.8rem; color: #6B7280; margin-top: 4px;">Used for model training</div>
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 0.95rem;">Test Set (%)</label>
                                <input type="number" id="testSplitInput" min="1" max="99" value="${window.testSplitPercentage}" 
                                       readonly
                                       style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 10px; font-size: 0.95rem; background: #F9FAFB; color: #6B7280;">
                                <div style="font-size: 0.8rem; color: #6B7280; margin-top: 4px;">Automatically calculated</div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 8px;">Total</div>
                                <div id="splitTotal" style="font-weight: 600; color: #111827; font-size: 1.1rem; padding: 10px 14px; background: #F0F9FF; border-radius: 10px; text-align: center;">
                                    ${window.trainSplitPercentage + window.testSplitPercentage}%
                                </div>
                            </div>
                        </div>
                        <div id="splitWarning" style="margin-top: 12px; font-size: 0.85rem; color: #DC2626; display: none;">
                            Warning: Train and Test percentages must sum to 100%
                        </div>
                    </div>
                    <!-- Null Value Handling Configuration -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px;">
                        <h4 style="color: #1E40AF; margin-bottom: 16px; font-weight: 700;">Null Value Handling</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border-radius: 8px; transition: background 0.2s;" 
                                   onmouseover="this.style.background='#F9FAFB'" 
                                   onmouseout="this.style.background='transparent'">
                                <input type="radio" name="nullHandling" value="impute" ${window.nullHandlingMethod === 'impute' ? 'checked' : ''} 
                                       onchange="handleNullHandlingChange('impute')"
                                       style="width: 18px; height: 18px; cursor: pointer; accent-color: #0071e3;">
                                <div>
                                    <div style="font-weight: 600; color: #1F2937; font-size: 0.95rem;">Impute Values</div>
                                    <div style="font-size: 0.8rem; color: #6B7280;">Use average for numerical features, mode for categorical</div>
                                </div>
                            </label>
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border-radius: 8px; transition: background 0.2s;" 
                                   onmouseover="this.style.background='#F9FAFB'" 
                                   onmouseout="this.style.background='transparent'">
                                <input type="radio" name="nullHandling" value="remove" ${window.nullHandlingMethod === 'remove' ? 'checked' : ''} 
                                       onchange="handleNullHandlingChange('remove')"
                                       style="width: 18px; height: 18px; cursor: pointer; accent-color: #0071e3;">
                                <div>
                                    <div style="font-weight: 600; color: #1F2937; font-size: 0.95rem;">Remove Rows</div>
                                    <div style="font-size: 0.8rem; color: #6B7280;">Drop rows containing any null values</div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <!-- Action Buttons -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px;">
                        <h4 style="color: #1E40AF; margin-bottom: 20px; font-weight: 700;">Data Processing Workflow</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <!-- Step 1: Preview Training Dataset (shows original data) -->
                            <button onclick="previewTrainingDataset()" 
                                    style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.3)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                Step 1: Preview Training Dataset
                            </button>
                            <!-- Step 2: Create Training Dataset (creates copy, applies null handling) -->
                            <button onclick="createTrainingDataset()" 
                                    style="background: linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(14,165,233,0.3)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                Step 2: Create Training Dataset
                            </button>
                            <!-- Step 3: Apply Null Value Handling (on dataset copy) -->
                            <button onclick="applyNullValueHandlingToTrainingDataset()" 
                                    style="background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(236, 72, 153, 0.3)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                Step 3: Apply Null Value Handling
                            </button>
                            <!-- Step 4: Convert Categorical to Numerical (on dataset copy) -->
                            <button onclick="convertCategoricalToNumericalInTrainingDataset()" 
                                    style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.3)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                Step 4: Convert to Numerical
                            </button>
                        </div>
                        <div style="margin-top: 16px; padding: 12px; background: #F0F9FF; border-radius: 8px; border-left: 4px solid #0EA5E9;">
                            <p style="margin: 0; color: #0369A1; font-size: 0.875rem; line-height: 1.5;">
                                <strong>Note:</strong> The original cleaned dataset will not be modified. All conversions are applied only to the training dataset copy.
                            </p>
                        </div>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                            <h5 style="color: #6B7280; margin-bottom: 12px; font-weight: 600; font-size: 0.9rem;">Additional Actions</h5>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                <button onclick="saveEmbeddings()" 
                                        style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                    Save Embeddings
                                </button>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <select id="datasetFormat" style="padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.9rem; background: white;">
                                        <option value="json">JSON</option>
                                        <option value="csv">CSV</option>
                                        <option value="tsv">TSV</option>
                                        <option value="xlsx">Excel (XLSX)</option>
                                    </select>
                                    <button onclick="saveProcessedDataset()" 
                                            style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;"
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'"
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                        Save Training Dataset
                                    </button>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <select id="originalDatasetFormat" style="padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.9rem; background: white;">
                                        <option value="json">JSON</option>
                                        <option value="csv">CSV</option>
                                        <option value="tsv">TSV</option>
                                        <option value="xlsx">Excel (XLSX)</option>
                                    </select>
                                    <button onclick="saveOriginalDataset()" 
                                            style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;"
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.3)'"
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                        Save Original Dataset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Dataset Viewer -->
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; flex: 1; min-height: 400px;">
                        <h4 style="color: #1E40AF; margin-bottom: 20px; font-weight: 700;">Training Dataset Preview</h4>
                        <div id="trainingDatasetViewer" style="min-height: 300px;">
                            <div style="text-align: center; padding: 60px 20px; color: #9CA3AF;">
                                <p style="font-size: 1.1rem;">Workflow: 1) Select features/label → 2) Convert Categorical → 3) Preview → 4) Apply Null Handling → 5) Create Training Dataset</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Start Training Button -->
            <div style="margin-top: 30px; display: flex; justify-content: center; padding: 20px;">
                <button onclick="window.proceedToActualTraining()" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
                    Start Training
                </button>
            </div>
        `;
        } catch (e) {
            console.error('ModelTraining: render error', e);
            modelTrainingContent.innerHTML = `<div style="padding:24px; color:#B91C1C;">Error rendering Model Training: ${e.message}</div>`;
            return;
        }

        modelTrainingContent.innerHTML = modelTrainingHTML;

        // Wait for DOM to be ready, then initialize hyperparameter configuration UI if Optuna is enabled
        setTimeout(() => {
            console.log('🔄 Initializing hyperparameter configs, useOptuna:', window.useOptuna);
            const section = document.getElementById('hyperparameterConfigSection');
            const container = document.getElementById('modelHyperparameterConfigs');
            console.log('📍 Section found:', !!section, 'Container found:', !!container);

            if (window.useOptuna) {
                console.log('✅ Optuna enabled, calling renderHyperparameterConfigs');
                if (section) {
                    section.style.display = 'block';
                    section.style.visibility = 'visible';
                    section.style.opacity = '1';
                    console.log('✅ Section made visible');
                } else {
                    console.error('❌ Section not found in DOM!');
                }
                if (container) {
                    container.style.display = 'flex';
                    container.style.visibility = 'visible';
                    console.log('✅ Container made visible');
                } else {
                    console.error('❌ Container not found in DOM!');
                }
                window.renderHyperparameterConfigs();
            } else {
                console.log('⚠️ Optuna not enabled');
            }
        }, 300);

        // Update Optuna options visibility when checkbox changes
        // Use inline onchange handler (already in HTML) plus event listener for compatibility
        setTimeout(() => {
            const useOptunaCheckbox = document.getElementById('useOptunaCheckbox');
            if (useOptunaCheckbox) {
                // The inline onchange handler should handle it, but add listener as backup
                useOptunaCheckbox.addEventListener('change', function () {
                    window.handleOptunaToggle(this.checked);
                });
            }
        }, 100);
    };

    // Handle Optuna toggle
    window.handleOptunaToggle = function (enabled) {
        window.useOptuna = enabled;
        localStorage.setItem('useOptuna', enabled);

        const optunaOptions = document.getElementById('optunaOptions');
        if (optunaOptions) {
            optunaOptions.style.display = enabled ? 'block' : 'none';
        }

        if (enabled) {
            // Make sure section is visible
            const section = document.getElementById('hyperparameterConfigSection');
            const container = document.getElementById('modelHyperparameterConfigs');
            if (section) {
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.opacity = '1';
            }
            if (container) {
                container.style.display = 'flex';
                container.style.visibility = 'visible';
            }
            // Wait a bit for the DOM to update, then render hyperparameter configs
            setTimeout(() => {
                window.renderHyperparameterConfigs();
            }, 150);
        } else {
            // Clear the hyperparameter configs section when disabled
            const container = document.getElementById('modelHyperparameterConfigs');
            if (container) {
                container.innerHTML = '<p style="color: #6B7280; font-size: 0.85rem; margin: 0;">Enable Optuna and select models to configure hyperparameters.</p>';
            }
        }
    };

    // Render hyperparameter configuration UI for selected models
    window.renderHyperparameterConfigs = function () {
        console.log('🔧 renderHyperparameterConfigs called');
        const container = document.getElementById('modelHyperparameterConfigs');
        if (!container) {
            console.error('❌ Hyperparameter configs container not found - DOM might not be ready');
            // Try to find it again after a delay
            setTimeout(() => {
                const retryContainer = document.getElementById('modelHyperparameterConfigs');
                if (retryContainer) {
                    console.log('✅ Container found on retry');
                    window.renderHyperparameterConfigs();
                } else {
                    console.error('❌ Container still not found after retry');
                }
            }, 500);
            return;
        }
        console.log('✅ Container found');

        // Get selected models - try multiple selectors
        let selectedModels = Array.from(document.querySelectorAll('.model-checkbox:checked'))
            .map(cb => cb.value);
        console.log('📋 Selected models from checkboxes:', selectedModels);

        // If no models found, try to get from window.selectedTrainingModels
        if (selectedModels.length === 0 && window.selectedTrainingModels && window.selectedTrainingModels.length > 0) {
            selectedModels = window.selectedTrainingModels;
            console.log('📋 Using selectedTrainingModels from window:', selectedModels);
        }

        if (selectedModels.length === 0) {
            console.log('⚠️ No models selected - showing placeholder');
            container.innerHTML = `
                <div style="padding: 15px; background: #FEF3C7; border-radius: 8px; border: 1px solid #FCD34D;">
                    <p style="margin: 0; color: #92400E; font-size: 0.9rem; font-weight: 600;">⚠️ Please select at least one model above to configure hyperparameters.</p>
                    <p style="margin: 8px 0 0 0; color: #92400E; font-size: 0.85rem;">Selected models will appear here with their configurable hyperparameters.</p>
                </div>
            `;
            return;
        }

        console.log('🎯 Rendering hyperparameters for models:', selectedModels);

        // Initialize hyperparameter config storage if not exists
        if (!window.hyperparameterConfigs) {
            window.hyperparameterConfigs = {};
        }

        let html = '';
        console.log('📊 Processing', selectedModels.length, 'models');
        selectedModels.forEach((modelId, idx) => {
            console.log(`  [${idx + 1}/${selectedModels.length}] Processing model: ${modelId}`);
            const hyperparams = MODEL_HYPERPARAMETERS[modelId] || [];
            console.log(`    Found ${hyperparams.length} hyperparameters for ${modelId}`);

            if (hyperparams.length === 0) {
                html += `
                    <div style="padding: 12px; background: #F3F4F6; border-radius: 8px; border: 1px solid #D1D5DB;">
                        <h6 style="margin: 0 0 8px 0; color: #374151; font-weight: 600; font-size: 0.9rem;">${modelId}</h6>
                        <p style="margin: 0; color: #6B7280; font-size: 0.85rem;">No hyperparameters available for this model.</p>
                    </div>
                `;
                return;
            }

            // Get model name
            const modelName = MODEL_OPTIONS.ehr.classification.find(m => m.id === modelId)?.name ||
                MODEL_OPTIONS.ehr.regression.find(m => m.id === modelId)?.name ||
                modelId;

            // Initialize config for this model if not exists
            if (!window.hyperparameterConfigs[modelId]) {
                window.hyperparameterConfigs[modelId] = {};
                hyperparams.forEach(param => {
                    window.hyperparameterConfigs[modelId][param.name] = {
                        type: param.type || 'float',  // Include type information
                        enabled: false,
                        scale: param.scale || 'linear',
                        min: param.default_min || 0,
                        max: param.default_max || 100,
                        options: param.options || [],
                        default_options: param.default_options || [],
                        selected_option: param.options ? param.options[0] : null
                    };
                });
            } else {
                // Ensure type is set for existing configs
                hyperparams.forEach(param => {
                    if (window.hyperparameterConfigs[modelId][param.name]) {
                        if (!window.hyperparameterConfigs[modelId][param.name].type) {
                            window.hyperparameterConfigs[modelId][param.name].type = param.type || 'float';
                        }
                        if (!window.hyperparameterConfigs[modelId][param.name].default_options && param.default_options) {
                            window.hyperparameterConfigs[modelId][param.name].default_options = param.default_options;
                        }
                    }
                });
            }

            html += `
                <div style="padding: 15px; background: white; border-radius: 8px; border: 1px solid #D1D5DB;">
                    <h6 style="margin: 0 0 12px 0; color: #1E40AF; font-weight: 600; font-size: 0.95rem;">${modelName}</h6>
                    <div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
            `;

            hyperparams.forEach(param => {
                const config = window.hyperparameterConfigs[modelId][param.name];
                const paramId = `param-${modelId}-${param.name}`;

                if (param.type === 'categorical') {
                    html += `
                        <div style="padding: 10px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer;">
                                <input type="checkbox" class="param-enable-checkbox" data-model="${modelId}" data-param="${param.name}"
                                       ${config.enabled ? 'checked' : ''}
                                       onchange="window.toggleHyperparameter('${modelId}', '${param.name}', this.checked)"
                                       style="width: 16px; height: 16px; cursor: pointer; accent-color: #0071e3;">
                                <span style="font-weight: 600; color: #374151; font-size: 0.9rem;">${param.name}</span>
                                <span style="font-size: 0.75rem; color: #6B7280; margin-left: auto;">${param.description}</span>
                            </label>
                            <div id="${paramId}-options" style="display: ${config.enabled ? 'block' : 'none'}; margin-left: 26px;">
                                <select class="param-option-select" data-model="${modelId}" data-param="${param.name}"
                                        onchange="window.updateHyperparameterOption('${modelId}', '${param.name}', this.value)"
                                        style="width: 100%; padding: 6px 10px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem; background: white;">
                                    ${param.options.map(opt => `
                                        <option value="${opt}" ${config.selected_option === opt ? 'selected' : ''}>${opt}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    `;
                } else if (param.type === 'tuple') {
                    html += `
                        <div style="padding: 10px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer;">
                                <input type="checkbox" class="param-enable-checkbox" data-model="${modelId}" data-param="${param.name}"
                                       ${config.enabled ? 'checked' : ''}
                                       onchange="window.toggleHyperparameter('${modelId}', '${param.name}', this.checked)"
                                       style="width: 16px; height: 16px; cursor: pointer; accent-color: #0071e3;">
                                <span style="font-weight: 600; color: #374151; font-size: 0.9rem;">${param.name}</span>
                                <span style="font-size: 0.75rem; color: #6B7280; margin-left: auto;">${param.description}</span>
                            </label>
                            <div id="${paramId}-options" style="display: ${config.enabled ? 'block' : 'none'}; margin-left: 26px;">
                                <select class="param-option-select" data-model="${modelId}" data-param="${param.name}"
                                        onchange="window.updateHyperparameterOption('${modelId}', '${param.name}', this.value)"
                                        style="width: 100%; padding: 6px 10px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem; background: white;">
                                    ${param.default_options.map(opt => `
                                        <option value="${opt}" ${config.selected_option === opt ? 'selected' : ''}>${opt}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    `;
                } else {
                    // Numeric parameter (int or float)
                    html += `
                        <div style="padding: 10px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer;">
                                <input type="checkbox" class="param-enable-checkbox" data-model="${modelId}" data-param="${param.name}"
                                       ${config.enabled ? 'checked' : ''}
                                       onchange="window.toggleHyperparameter('${modelId}', '${param.name}', this.checked)"
                                       style="width: 16px; height: 16px; cursor: pointer; accent-color: #0071e3;">
                                <span style="font-weight: 600; color: #374151; font-size: 0.9rem;">${param.name}</span>
                                <span style="font-size: 0.75rem; color: #6B7280; margin-left: auto;">${param.description}</span>
                            </label>
                            <div id="${paramId}-controls" style="display: ${config.enabled ? 'block' : 'none'}; margin-left: 26px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                                    <div>
                                        <label style="display: block; font-size: 0.75rem; color: #6B7280; margin-bottom: 4px;">Scale</label>
                                        <select class="param-scale-select" data-model="${modelId}" data-param="${param.name}"
                                                onchange="window.updateHyperparameterScale('${modelId}', '${param.name}', this.value)"
                                                style="width: 100%; padding: 6px 8px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem; background: white;">
                                            <option value="linear" ${config.scale === 'linear' ? 'selected' : ''}>Linear</option>
                                            <option value="log" ${config.scale === 'log' ? 'selected' : ''}>Log</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.75rem; color: #6B7280; margin-bottom: 4px;">Min</label>
                                        <input type="number" class="param-min-input" data-model="${modelId}" data-param="${param.name}"
                                               value="${config.min}" step="${param.type === 'int' ? '1' : 'any'}"
                                               onchange="window.updateHyperparameterRange('${modelId}', '${param.name}', 'min', this.value)"
                                               style="width: 100%; padding: 6px 8px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem;">
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.75rem; color: #6B7280; margin-bottom: 4px;">Max</label>
                                        <input type="number" class="param-max-input" data-model="${modelId}" data-param="${param.name}"
                                               value="${config.max}" step="${param.type === 'int' ? '1' : 'any'}"
                                               onchange="window.updateHyperparameterRange('${modelId}', '${param.name}', 'max', this.value)"
                                               style="width: 100%; padding: 6px 8px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            html += `
                    </div>
                </div>
            `;
        });

        console.log('📝 Setting container HTML, length:', html.length, 'models:', selectedModels);
        if (html.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; background: #FEF3C7; border-radius: 8px; border: 1px solid #FCD34D;">
                    <p style="margin: 0; color: #92400E; font-size: 0.9rem;">No hyperparameters found for selected models: ${selectedModels.join(', ')}</p>
                </div>
            `;
        } else {
            container.innerHTML = html;
        }
        console.log('✅ Hyperparameter configs rendered');

        // Scroll to the section to make it visible
        const section = document.getElementById('hyperparameterConfigSection');
        if (section) {
            setTimeout(() => {
                section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    };

    // Toggle hyperparameter enable/disable
    window.toggleHyperparameter = function (modelId, paramName, enabled) {
        if (!window.hyperparameterConfigs[modelId]) {
            window.hyperparameterConfigs[modelId] = {};
        }
        if (!window.hyperparameterConfigs[modelId][paramName]) {
            window.hyperparameterConfigs[modelId][paramName] = {};
        }

        window.hyperparameterConfigs[modelId][paramName].enabled = enabled;

        // Show/hide parameter controls
        const controlsId = `param-${modelId}-${paramName}-controls`;
        const optionsId = `param-${modelId}-${paramName}-options`;
        const controls = document.getElementById(controlsId);
        const options = document.getElementById(optionsId);

        if (controls) controls.style.display = enabled ? 'block' : 'none';
        if (options) options.style.display = enabled ? 'block' : 'none';

        // Save to localStorage
        try {
            localStorage.setItem('hyperparameterConfigs', JSON.stringify(window.hyperparameterConfigs));
        } catch (e) {
            console.warn('Could not save hyperparameter configs to localStorage:', e);
        }
    };

    // Update hyperparameter scale
    window.updateHyperparameterScale = function (modelId, paramName, scale) {
        if (!window.hyperparameterConfigs[modelId] || !window.hyperparameterConfigs[modelId][paramName]) return;

        window.hyperparameterConfigs[modelId][paramName].scale = scale;

        try {
            localStorage.setItem('hyperparameterConfigs', JSON.stringify(window.hyperparameterConfigs));
        } catch (e) {
            console.warn('Could not save hyperparameter configs to localStorage:', e);
        }
    };

    // Update hyperparameter range
    window.updateHyperparameterRange = function (modelId, paramName, rangeType, value) {
        if (!window.hyperparameterConfigs[modelId] || !window.hyperparameterConfigs[modelId][paramName]) return;

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        window.hyperparameterConfigs[modelId][paramName][rangeType] = numValue;

        try {
            localStorage.setItem('hyperparameterConfigs', JSON.stringify(window.hyperparameterConfigs));
        } catch (e) {
            console.warn('Could not save hyperparameter configs to localStorage:', e);
        }
    };

    // Update hyperparameter option (for categorical/tuple)
    window.updateHyperparameterOption = function (modelId, paramName, value) {
        if (!window.hyperparameterConfigs[modelId] || !window.hyperparameterConfigs[modelId][paramName]) return;

        window.hyperparameterConfigs[modelId][paramName].selected_option = value;

        try {
            localStorage.setItem('hyperparameterConfigs', JSON.stringify(window.hyperparameterConfigs));
        } catch (e) {
            console.warn('Could not save hyperparameter configs to localStorage:', e);
        }
    };

    window.selectAllFeatures = function () {
        document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
    };

    window.deselectAllFeatures = function () {
        document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    };

    window.handleLabelSelection = function (labelValue) {
        // Persist label and uncheck it in features
        if (labelValue) {
            window.selectedLabel = labelValue;
            try { localStorage.setItem('selectedLabel', window.selectedLabel); } catch (e) { }
            document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
                if (checkbox.value === labelValue) {
                    checkbox.checked = false;
                }
            });
        }
    };

    function getSelectedFeaturesFromUI() {
        const selected = Array.from(document.querySelectorAll('.feature-checkbox:checked')).map(cb => cb.value);
        window.selectedFeatures = selected;
        try { localStorage.setItem('selectedFeatures', JSON.stringify(window.selectedFeatures)); } catch (e) { }
        return selected;
    }

    window.createTrainingDataset = async function () {
        // Check if we need to fetch full dataset
        let dataToUse = window.allData;

        // If we have uploadedData, check if we need to fetch full dataset
        if (window.uploadedData && window.uploadedData.file_ids && window.uploadedData.file_ids.length > 0) {
            // Check if we have full dataset by comparing with backend shape
            try {
                const fileId = window.uploadedData.file_ids[0];
                const shapeResponse = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}`);
                if (shapeResponse.ok) {
                    const shapeData = await shapeResponse.json();
                    const backendRowCount = shapeData.shape ? shapeData.shape[0] : 0;
                    const currentRowCount = window.allData ? window.allData.length : 0;

                    // If we don't have the full dataset, fetch it
                    if (backendRowCount > currentRowCount && backendRowCount > 1000) {
                        console.log(`Fetching full dataset: backend has ${backendRowCount} rows, we have ${currentRowCount} rows`);
                        // Show loading message
                        const loadingMsg = document.createElement('div');
                        loadingMsg.id = 'datasetLoadingMsg';
                        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000;';
                        loadingMsg.innerHTML = `
                            <div style="text-align: center;">
                                <div class="spinner" style="margin: 0 auto 10px;"></div>
                                <div>Loading full dataset (${backendRowCount.toLocaleString()} rows)...</div>
                                <div style="font-size: 0.85rem; color: #6B7280; margin-top: 8px;">This may take a moment for large datasets</div>
                            </div>
                        `;
                        document.body.appendChild(loadingMsg);

                        try {
                            const fullDataResponse = await fetch(`${window.API_BASE_URL || ""}/api/data/${fileId}?full=true`);
                            if (fullDataResponse.ok) {
                                const fullData = await fullDataResponse.json();
                                if (fullData.data && fullData.data.length > 0) {
                                    window.allData = fullData.data;
                                    window.allColumns = fullData.columns || window.allColumns;
                                    window.fullDatasetLoaded = true;
                                    console.log(`✅ Loaded full dataset: ${window.allData.length} rows`);

                                    // Recalculate engineered features on the full dataset if any exist
                                    if (window.createdFeatures && window.createdFeatures.length > 0) {
                                        console.log(`Recalculating ${window.createdFeatures.length} engineered feature(s) on full dataset...`);
                                        if (window.recalculateAllEngineeredFeatures) {
                                            window.recalculateAllEngineeredFeatures({ logPrefix: '[training-prep]' });
                                        }
                                        // Wait a moment for features to be recalculated
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                    }

                                    // Try to save to localStorage (may fail if too large)
                                    try {
                                        localStorage.setItem('allData', JSON.stringify(window.allData));
                                        localStorage.setItem('allColumns', JSON.stringify(window.allColumns));
                                    } catch (e) {
                                        console.warn('Dataset too large for localStorage');
                                    }
                                }
                            }
                        } finally {
                            // Remove loading message
                            const msg = document.getElementById('datasetLoadingMsg');
                            if (msg) msg.remove();
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking dataset size:', error);
            }
        }

        if (!window.allData || window.allData.length === 0) {
            alert('No data available. Please upload a dataset first.');
            return;
        }

        const label = document.getElementById('labelSelection')?.value || window.selectedLabel || null;
        if (!label) {
            alert('Please select a label (target variable).');
            return;
        }
        const selected = getSelectedFeaturesFromUI().filter(f => f && f !== label);
        if (selected.length === 0) {
            alert('Please select at least one feature.');
            return;
        }

        // Create a DEEP COPY of the original cleaned data - do NOT modify window.allData
        // This ensures the original cleaned dataset remains unchanged
        const originalDataCopy = JSON.parse(JSON.stringify(window.allData));

        // Identify categorical and continuous features based on ORIGINAL variable types
        const categorical = selected.filter(c => (window.variableChanges[c]?.variable_type || 'categorical') === 'categorical');
        const continuous = selected.filter(c => (window.variableChanges[c]?.variable_type || 'categorical') === 'continuous');

        // Build label-safe map of categories per categorical feature from original data
        const categoriesMap = {};
        categorical.forEach(col => {
            const set = new Set();
            originalDataCopy.forEach(row => {
                const v = row[col];
                if (v !== null && v !== undefined && v !== '') set.add(String(v));
            });
            categoriesMap[col] = Array.from(set).sort();
        });

        // For now, create dataset with original features (not one-hot encoded yet)
        // One-hot encoding will happen later if needed, or we'll use label encoding instead
        // Build data rows with original values (deep copy)
        let data = originalDataCopy.map(src => {
            const row = {};
            // Copy selected features and label
            selected.forEach(c => {
                row[c] = src[c];
            });
            row[label] = src[label];
            return row;
        });

        // Remove rows where label is null (labels cannot be null)
        data = data.filter(row => {
            const labelVal = row[label];
            return labelVal !== null && labelVal !== undefined && labelVal !== '';
        });

        const exportObj = {
            metadata: {
                exported_at: new Date().toISOString(),
                features_original: selected,
                features_continuous: continuous,
                features_categorical: categorical,
                categories_map: categoriesMap,
                label: label,
                train_split_percentage: window.trainSplitPercentage,
                test_split_percentage: window.testSplitPercentage,
                null_handling_method: window.nullHandlingMethod || 'impute',
                note: 'Training dataset created from original cleaned data. Original dataset remains unchanged.',
            },
            data: data,
            features: selected, // Original feature names (will be converted later if needed)
            label: label,
            null_handling_applied: false,
            conversion_applied: false
        };

        window.trainingDatasetExport = exportObj;
        try { localStorage.setItem('trainingDatasetExport', JSON.stringify(exportObj)); } catch (e) { }
        alert(`Training dataset created from original cleaned data.\n\nFeatures: ${selected.length}\nRows: ${data.length}\n\nNote: The original cleaned dataset was NOT modified. You can now apply null handling and conversion to this dataset.`);

        // Update preview
        window.previewTrainingDataset();
    };

    // DEPRECATED: This function modifies the original data - use convertCategoricalToNumericalInTrainingDataset instead
    window.convertCategoricalToNumerical = function () {
        alert('This function is deprecated. Please use the new workflow:\n1. Create Training Dataset\n2. Apply Null Value Handling\n3. Convert to Numerical\n\nThe original cleaned dataset will remain unchanged.');
        return;
    };

    // Convert categorical to numerical in the training dataset (does NOT modify original data)
    window.convertCategoricalToNumericalInTrainingDataset = function () {
        if (!window.trainingDatasetExport || !window.trainingDatasetExport.data || window.trainingDatasetExport.data.length === 0) {
            alert('Please create the training dataset first (Step 2).');
            return;
        }

        const trainingData = window.trainingDatasetExport.data;
        const features = window.trainingDatasetExport.features;
        const label = window.trainingDatasetExport.label;

        // Get categorical columns from the selected features (based on original variable types)
        const categoricalColumns = features.filter(column => {
            const varType = window.variableChanges[column]?.variable_type || 'categorical';
            return varType === 'categorical';
        });

        if (categoricalColumns.length === 0) {
            alert('No categorical variables to convert. All selected features are already continuous.');
            return;
        }

        console.log(`Converting ${categoricalColumns.length} categorical variable(s) to numerical in training dataset using Label Encoding...`);

        let conversionCount = 0;

        categoricalColumns.forEach(column => {
            // Get unique values from training dataset
            const uniqueValues = new Set();
            trainingData.forEach(row => {
                const value = row[column];
                if (value !== null && value !== undefined && value !== '') {
                    uniqueValues.add(String(value));
                }
            });

            // Label encoding: map categories to integers (0, 1, 2, ...)
            const categories = Array.from(uniqueValues).sort();
            const labelMap = {};
            categories.forEach((cat, index) => {
                labelMap[cat] = index;
            });

            // Update the column in training dataset only
            trainingData.forEach(row => {
                const value = String(row[column] ?? '');
                row[column] = labelMap[value] !== undefined ? labelMap[value] : null;
            });

            conversionCount++;
        });

        // Update training dataset export
        window.trainingDatasetExport.data = trainingData;
        window.trainingDatasetExport.conversion_applied = true;
        window.trainingDatasetExport.converted_categorical = categoricalColumns;

        alert(`Successfully converted ${conversionCount} categorical variable(s) to numerical in the training dataset.\n\n` +
            `The original cleaned dataset remains unchanged.`);

        // Refresh preview if visible
        if (window.trainingDatasetExport) {
            window.previewTrainingDataset();
        }

        console.log('Categorical to numerical conversion complete on training dataset');
    };

    window.saveEmbeddings = function () {
        try {
            if (!window.trainingDatasetExport) {
                alert('Please create the training dataset first.');
                return;
            }
            const td = window.trainingDatasetExport;
            if (!td.data || td.data.length === 0) {
                alert('No data available to save embeddings.');
                return;
            }

            // Get selected features and label
            const label = td.label;
            const selectedFeatures = td.features.slice();

            if (selectedFeatures.length === 0) {
                alert('Please select at least one feature before saving embeddings.');
                return;
            }

            // Extract embeddings (feature vectors) for each row
            const embeddings = td.data.map((row, index) => {
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
    };

    window.saveOriginalDataset = function () {
        try {
            if (!window.allData || window.allData.length === 0) {
                alert('No original dataset available to save.');
                return;
            }

            const formatSelect = document.getElementById('originalDatasetFormat');
            const format = formatSelect ? formatSelect.value : 'json';

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            let blob, filename, dataToExport;

            // Prepare data with all columns
            const columns = window.allColumns || [];
            const data = window.allData;

            if (format === 'json') {
                const exportObj = {
                    metadata: {
                        exported_at: new Date().toISOString(),
                        columns: columns,
                        total_rows: data.length,
                        note: 'Original cleaned dataset (before training dataset processing)'
                    },
                    data: data,
                    columns: columns
                };
                dataToExport = JSON.stringify(exportObj, null, 2);
                blob = new Blob([dataToExport], { type: 'application/json' });
                filename = `original_dataset_${timestamp}.json`;
            } else if (format === 'csv' || format === 'tsv') {
                const delimiter = format === 'csv' ? ',' : '\t';
                const header = columns.map(col => `"${String(col).replace(/"/g, '""')}"`).join(delimiter);
                const rows = data.map(row => {
                    return columns.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return '""';
                        const strVal = String(val).replace(/"/g, '""');
                        return `"${strVal}"`;
                    }).join(delimiter);
                });
                dataToExport = [header, ...rows].join('\n');
                blob = new Blob([dataToExport], { type: format === 'csv' ? 'text/csv' : 'text/tab-separated-values' });
                filename = `original_dataset_${timestamp}.${format}`;
            } else if (format === 'xlsx') {
                alert('Excel export requires backend conversion. Saving as JSON for now. Please use CSV/TSV for spreadsheet-compatible format.');
                const exportObj = {
                    metadata: {
                        exported_at: new Date().toISOString(),
                        columns: columns,
                        total_rows: data.length,
                        note: 'Original cleaned dataset (before training dataset processing)'
                    },
                    data: data,
                    columns: columns
                };
                dataToExport = JSON.stringify(exportObj, null, 2);
                blob = new Blob([dataToExport], { type: 'application/json' });
                filename = `original_dataset_${timestamp}.json`;
            } else {
                const exportObj = {
                    metadata: {
                        exported_at: new Date().toISOString(),
                        columns: columns,
                        total_rows: data.length,
                        note: 'Original cleaned dataset (before training dataset processing)'
                    },
                    data: data,
                    columns: columns
                };
                dataToExport = JSON.stringify(exportObj, null, 2);
                blob = new Blob([dataToExport], { type: 'application/json' });
                filename = `original_dataset_${timestamp}.json`;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`Original dataset saved successfully!\n\nFormat: ${format.toUpperCase()}\nColumns: ${columns.length}\nRows: ${data.length}`);
            console.log('Original dataset exported successfully', format);
        } catch (error) {
            console.error('Error saving original dataset:', error);
            alert('Error saving original dataset: ' + error.message);
        }
    };

    window.saveProcessedDataset = function () {
        try {
            if (!window.trainingDatasetExport) {
                alert('Please create the training dataset first.');
                return;
            }
            const datasetExport = window.trainingDatasetExport;
            const formatSelect = document.getElementById('datasetFormat');
            const format = formatSelect ? formatSelect.value : 'json';

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            let blob, mimeType, filename, dataToExport;

            if (format === 'json') {
                dataToExport = JSON.stringify(datasetExport, null, 2);
                blob = new Blob([dataToExport], { type: 'application/json' });
                filename = `training_dataset_${timestamp}.json`;
            } else if (format === 'csv' || format === 'tsv') {
                // Convert to CSV/TSV format
                const delimiter = format === 'csv' ? ',' : '\t';
                const data = datasetExport.data;
                const features = datasetExport.features;
                const label = datasetExport.label;

                // Create header row
                const header = [...features, label].map(col => `"${String(col).replace(/"/g, '""')}"`).join(delimiter);

                // Create data rows
                const rows = data.map(row => {
                    const values = features.map(f => {
                        const val = row[f];
                        if (val === null || val === undefined) return '""';
                        const strVal = String(val).replace(/"/g, '""');
                        return `"${strVal}"`;
                    });
                    const labelVal = row[label] !== null && row[label] !== undefined ?
                        `"${String(row[label]).replace(/"/g, '""')}"` : '""';
                    return [...values, labelVal].join(delimiter);
                });

                dataToExport = [header, ...rows].join('\n');
                blob = new Blob([dataToExport], { type: format === 'csv' ? 'text/csv' : 'text/tab-separated-values' });
                filename = `training_dataset_${timestamp}.${format}`;
            } else if (format === 'xlsx') {
                // For Excel, we'll send to backend to convert
                // For now, save as JSON with instructions
                alert('Excel export requires backend conversion. Saving as JSON for now. Please use CSV/TSV for spreadsheet-compatible format.');
                dataToExport = JSON.stringify(datasetExport, null, 2);
                blob = new Blob([dataToExport], { type: 'application/json' });
                filename = `training_dataset_${timestamp}.json`;
            } else {
                // Default to JSON
                dataToExport = JSON.stringify(datasetExport, null, 2);
                blob = new Blob([dataToExport], { type: 'application/json' });
                filename = `training_dataset_${timestamp}.json`;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`Dataset saved successfully!\n\nFormat: ${format.toUpperCase()}\nFeatures: ${datasetExport.features.length}\nLabel: ${datasetExport.label}\nRows: ${datasetExport.data.length}`);
            console.log('Processed dataset exported successfully', format);
        } catch (error) {
            console.error('Error saving processed dataset:', error);
            alert('Error saving dataset: ' + error.message);
        }
    };

    window.previewTrainingDataset = function () {
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

        // Get data source (use training dataset if available, otherwise original data)
        const dataSource = (window.trainingDatasetExport && window.trainingDatasetExport.data) ? window.trainingDatasetExport.data : window.allData;

        // Track feature selection to reset pagination when it changes
        const featureSignature = JSON.stringify({ features: selectedFeatures, label });
        if (window.lastPreviewFeatureSignature !== featureSignature) {
            window.trainingPreviewPage = 1;
            window.lastPreviewFeatureSignature = featureSignature;
        }

        // Build preview (always original feature space) with pagination
        const displayColumns = [...selectedFeatures, label];
        const pageSize = Math.max(10, window.trainingPreviewPageSize || 100);
        const totalRows = dataSource.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

        if (window.trainingPreviewPage > totalPages) {
            window.trainingPreviewPage = totalPages;
        }
        if (window.trainingPreviewPage < 1) {
            window.trainingPreviewPage = 1;
        }

        const startIndex = (window.trainingPreviewPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalRows);

        const previewData = dataSource.slice(startIndex, endIndex).map(src => {
            const row = {};
            displayColumns.forEach(col => {
                row[col] = src[col];
            });
            return row;
        });

        const categorical = selectedFeatures.filter(c => (window.variableChanges[c]?.variable_type || 'categorical') === 'categorical');
        const continuous = selectedFeatures.filter(c => (window.variableChanges[c]?.variable_type || 'categorical') === 'continuous');

        const summaryCard = `
            <div style="margin-bottom: 15px; padding: 12px; background: #F0FDF4; border-radius: 8px; border: 1px solid #86EFAC;">
                <div style="display: flex; flex-wrap: wrap; gap: 18px; font-size: 0.9rem;">
                    <div><strong>Selected Features:</strong> ${selectedFeatures.length}</div>
                    <div><strong>Continuous:</strong> ${continuous.length}</div>
                    <div><strong>Categorical:</strong> ${categorical.length}</div>
                    <div><strong>Label:</strong> ${label}</div>
                    <div><strong>Total Rows:</strong> ${totalRows.toLocaleString()}</div>
                    <div><strong>Viewing:</strong> ${totalRows === 0 ? '0' : `${(startIndex + 1).toLocaleString()}-${endIndex.toLocaleString()}`} of ${totalRows.toLocaleString()}</div>
                    <div><strong>Page:</strong> ${window.trainingPreviewPage} of ${totalPages}</div>
                </div>
                <div style="margin-top: 12px; padding: 10px; background: #DBEAFE; border-radius: 6px; border: 1px solid #93C5FD; color: #1E3A8A; font-size: 0.9rem; line-height: 1.5;">
                    <strong style="color: #1E40AF;">ℹ️ Original Feature View:</strong>
                    This preview shows the data exactly as it exists in your training dataset copy. Categorical columns remain textual until you run
                    <em>Convert to Numerical</em>. No extra one-hot columns are added here, so your embedding size matches the features you selected.
                </div>
            </div>
        `;

        let tableHTML = summaryCard;
        tableHTML += `
            <div style="overflow-x: auto; max-height: 450px; overflow-y: auto; border: 1px solid #E5E7EB; border-radius: 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; min-width: 800px;">
                    <thead>
                        <tr style="background: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
                            ${displayColumns.map(col => {
            const isLabel = col === label;
            const colDisplay = isLabel ? `[LABEL] ${col}` : col;
            const maxLength = 25;
            const truncated = col.length > maxLength ? col.substring(0, maxLength) + '...' : col;
            return `
                                    <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #374151; position: sticky; top: 0; background: #F9FAFB; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; ${isLabel ? 'background: #FEF3C7;' : ''}" title="${col}">
                                        ${isLabel ? '[LABEL] ' : ''}${truncated}
                                    </th>
                                `;
        }).join('')}
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
                const isNumeric = typeof value === 'number' && !isNaN(value);
                const cellStyle = isNumeric ? 
                    'padding: 8px 12px; color: #1F2937; text-align: right; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis;' : 
                    'padding: 8px 12px; color: #1F2937; white-space: nowrap; max-width: 250px; overflow: hidden; text-overflow: ellipsis;';
                tableHTML += `<td style="${cellStyle}" title="${displayValue}">${displayValue}</td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        // Add pagination controls if there are multiple pages
        if (totalPages > 1) {
            tableHTML += `
                <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px; background: #F9FAFB; border-radius: 8px;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 0.85rem; color: #6B7280;">Rows per page:</span>
                        <select id="trainingPreviewPageSize" onchange="window.trainingPreviewPageSize = parseInt(this.value); window.trainingPreviewPage = 1; window.previewTrainingDataset();" style="padding: 4px 8px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem; background: white;">
                            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
                            <option value="200" ${pageSize === 200 ? 'selected' : ''}>200</option>
                            <option value="500" ${pageSize === 500 ? 'selected' : ''}>500</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button onclick="window.changeTrainingPreviewPage('first')" 
                                style="padding: 6px 12px; border: 1px solid #D1D5DB; border-radius: 6px; background: white; cursor: pointer; font-size: 0.85rem;" 
                                ${window.trainingPreviewPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed; padding:6px 12px; border:1px solid #D1D5DB; border-radius:6px; background:white; font-size:0.85rem;"' : ''}>
                            &laquo; First
                        </button>
                        <button onclick="window.changeTrainingPreviewPage('prev')" 
                                style="padding: 6px 12px; border: 1px solid #D1D5DB; border-radius: 6px; background: white; cursor: pointer; font-size: 0.85rem;" 
                                ${window.trainingPreviewPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed; padding:6px 12px; border:1px solid #D1D5DB; border-radius:6px; background:white; font-size:0.85rem;"' : ''}>
                            &lsaquo; Prev
                        </button>
                        <span style="padding: 6px 12px; font-size: 0.85rem; color: #374151; font-weight: 500;">
                            Page ${window.trainingPreviewPage} of ${totalPages}
                        </span>
                        <button onclick="window.changeTrainingPreviewPage('next')" 
                                style="padding: 6px 12px; border: 1px solid #D1D5DB; border-radius: 6px; background: white; cursor: pointer; font-size: 0.85rem;" 
                                ${window.trainingPreviewPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed; padding:6px 12px; border:1px solid #D1D5DB; border-radius:6px; background:white; font-size:0.85rem;"' : ''}>
                            Next &rsaquo;
                        </button>
                        <button onclick="window.changeTrainingPreviewPage('last')" 
                                style="padding: 6px 12px; border: 1px solid #D1D5DB; border-radius: 6px; background: white; cursor: pointer; font-size: 0.85rem;" 
                                ${window.trainingPreviewPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed; padding:6px 12px; border:1px solid #D1D5DB; border-radius:6px; background:white; font-size:0.85rem;"' : ''}>
                            Last &raquo;
                        </button>
                    </div>
                </div>
            `;
        }

        viewer.innerHTML = tableHTML;
    };

    window.changeTrainingPreviewPage = function (action) {
        if (!window.trainingDatasetExport && (!window.allData || window.allData.length === 0)) {
            return;
        }

        const dataSource = (window.trainingDatasetExport && window.trainingDatasetExport.data) ? window.trainingDatasetExport.data : window.allData;
        const pageSize = Math.max(10, window.trainingPreviewPageSize || 100);
        const totalPages = Math.max(1, Math.ceil(dataSource.length / pageSize));

        switch (action) {
            case 'first':
                window.trainingPreviewPage = 1;
                break;
            case 'prev':
                if (window.trainingPreviewPage > 1) {
                    window.trainingPreviewPage--;
                }
                break;
            case 'next':
                if (window.trainingPreviewPage < totalPages) {
                    window.trainingPreviewPage++;
                }
                break;
            case 'last':
                window.trainingPreviewPage = totalPages;
                break;
        }

        window.previewTrainingDataset();
    };

    // DEPRECATED: This function modifies the original data - use applyNullValueHandlingToTrainingDataset instead
    window.applyNullValueHandling = function () {
        alert('This function is deprecated. Please use the new workflow:\n1. Create Training Dataset\n2. Apply Null Value Handling\n3. Convert to Numerical\n\nThe original cleaned dataset will remain unchanged.');
        return;
    };

    // Apply null value handling to the training dataset (does NOT modify original data)
    window.applyNullValueHandlingToTrainingDataset = function () {
        if (!window.trainingDatasetExport || !window.trainingDatasetExport.data || window.trainingDatasetExport.data.length === 0) {
            alert('Please create the training dataset first (Step 2).');
            return;
        }

        const trainingData = window.trainingDatasetExport.data;
        const features = window.trainingDatasetExport.features;
        const label = window.trainingDatasetExport.label;

        // Get categorical and continuous features based on ORIGINAL variable types
        const categorical = features.filter(c => (window.variableChanges[c]?.variable_type || 'categorical') === 'categorical');
        const continuous = features.filter(c => (window.variableChanges[c]?.variable_type || 'categorical') === 'continuous');

        // Calculate imputation values for FEATURES ONLY (not label) from training dataset
        const imputationValues = {};
        if (window.nullHandlingMethod === 'impute') {
            // Calculate averages for continuous features
            continuous.forEach(col => {
                const values = [];
                trainingData.forEach(row => {
                    const val = row[col];
                    if (val !== null && val !== undefined && val !== '') {
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal) && isFinite(numVal)) {
                            values.push(numVal);
                        }
                    }
                });
                imputationValues[col] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            });

            // Calculate modes for categorical features
            categorical.forEach(col => {
                const valueCounts = {};
                trainingData.forEach(row => {
                    const val = row[col];
                    if (val !== null && val !== undefined && val !== '') {
                        const strVal = String(val);
                        valueCounts[strVal] = (valueCounts[strVal] || 0) + 1;
                    }
                });
                const mode = Object.keys(valueCounts).reduce((a, b) => valueCounts[a] > valueCounts[b] ? a : b, Object.keys(valueCounts)[0] || '');
                imputationValues[col] = mode;
            });
        }

        // Apply null handling to FEATURES ONLY in training dataset
        let processedCount = 0;
        let removedCount = 0;
        const originalLength = trainingData.length;

        if (window.nullHandlingMethod === 'remove') {
            // Remove rows where ANY feature has null
            const filteredData = trainingData.filter(row => {
                return features.every(col => {
                    const val = row[col];
                    return val !== null && val !== undefined && val !== '';
                });
            });
            removedCount = originalLength - filteredData.length;
            window.trainingDatasetExport.data = filteredData;
            processedCount = filteredData.length;
        } else {
            // Impute null values in features only
            trainingData.forEach(row => {
                continuous.forEach(c => {
                    if (row[c] === null || row[c] === undefined || row[c] === '') {
                        row[c] = imputationValues[c] || 0;
                        processedCount++;
                    }
                });
                categorical.forEach(c => {
                    if (row[c] === null || row[c] === undefined || row[c] === '') {
                        row[c] = imputationValues[c] || '';
                        processedCount++;
                    }
                });
            });
            window.trainingDatasetExport.data = trainingData;
        }

        // Mark that null handling has been applied
        window.trainingDatasetExport.null_handling_applied = true;
        window.trainingDatasetExport.null_handling_method = window.nullHandlingMethod;

        // Show result
        const method = window.nullHandlingMethod === 'impute' ? 'Imputed' : 'Removed';
        const message = method === 'Imputed'
            ? `Successfully ${method.toLowerCase()} ${processedCount} null value(s) in features of the training dataset.\n\nNote: The original cleaned dataset was NOT modified.`
            : `Successfully ${method.toLowerCase()} ${removedCount} row(s) with null values from the training dataset.\n\nRemaining rows: ${window.trainingDatasetExport.data.length}\nNote: The original cleaned dataset was NOT modified.`;

        alert(message);

        // Update preview
        if (window.trainingDatasetExport) {
            window.previewTrainingDataset();
        }
    };

    window.handleTrainingModelSelection = function (modelId) {
        window.selectedTrainingModel = modelId || null;
        try {
            localStorage.setItem('selectedTrainingModel', window.selectedTrainingModel || '');
        } catch (e) {
            console.warn('Could not persist selectedTrainingModel');
        }
    };

    window.selectAllModels = function () {
        const checkboxes = document.querySelectorAll('.model-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        window.selectedTrainingModels = Array.from(checkboxes).map(cb => cb.value);
        try {
            localStorage.setItem('selectedTrainingModels', JSON.stringify(window.selectedTrainingModels));
        } catch (e) {
            console.warn('Could not persist selectedTrainingModels');
        }
        // Refresh hyperparameter configs if Optuna is enabled
        if (window.useOptuna) {
            setTimeout(() => {
                window.renderHyperparameterConfigs();
            }, 100);
        }
    };

    window.deselectAllModels = function () {
        const checkboxes = document.querySelectorAll('.model-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        window.selectedTrainingModels = [];
        try {
            localStorage.setItem('selectedTrainingModels', JSON.stringify(window.selectedTrainingModels));
        } catch (e) {
            console.warn('Could not persist selectedTrainingModels');
        }
        // Refresh hyperparameter configs if Optuna is enabled
        if (window.useOptuna) {
            setTimeout(() => {
                window.renderHyperparameterConfigs();
            }, 100);
        }
    };

    // Add event listener for model checkboxes after DOM is ready
    setTimeout(() => {
        document.querySelectorAll('.model-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const selected = Array.from(document.querySelectorAll('.model-checkbox:checked')).map(cb => cb.value);
                window.selectedTrainingModels = selected;
                try {
                    localStorage.setItem('selectedTrainingModels', JSON.stringify(window.selectedTrainingModels));
                } catch (e) {
                    console.warn('Could not persist selectedTrainingModels');
                }

                // Refresh hyperparameter configs if Optuna is enabled
                if (window.useOptuna) {
                    setTimeout(() => {
                        window.renderHyperparameterConfigs();
                    }, 100);
                }
            });
        });
    }, 100);

    window.handleTrainSplitChange = function (value) {
        const trainPercent = parseInt(value, 10) || 80;
        if (trainPercent < 1) {
            window.trainSplitPercentage = 1;
            window.testSplitPercentage = 99;
        } else if (trainPercent > 99) {
            window.trainSplitPercentage = 99;
            window.testSplitPercentage = 1;
        } else {
            window.trainSplitPercentage = trainPercent;
            window.testSplitPercentage = 100 - trainPercent;
        }

        // Update UI
        const trainInput = document.getElementById('trainSplitInput');
        const testInput = document.getElementById('testSplitInput');
        const totalDiv = document.getElementById('splitTotal');
        const warningDiv = document.getElementById('splitWarning');

        if (trainInput) trainInput.value = window.trainSplitPercentage;
        if (testInput) testInput.value = window.testSplitPercentage;
        if (totalDiv) totalDiv.textContent = `${window.trainSplitPercentage + window.testSplitPercentage}%`;

        // Show warning if not 100%
        if (warningDiv) {
            if (window.trainSplitPercentage + window.testSplitPercentage !== 100) {
                warningDiv.style.display = 'block';
            } else {
                warningDiv.style.display = 'none';
            }
        }

        // Persist to localStorage
        try {
            localStorage.setItem('trainSplitPercentage', window.trainSplitPercentage.toString());
            localStorage.setItem('testSplitPercentage', window.testSplitPercentage.toString());
        } catch (e) {
            console.warn('Could not persist train/test split');
        }
    };

    window.handleNullHandlingChange = function (method) {
        window.nullHandlingMethod = method;
        try {
            localStorage.setItem('nullHandlingMethod', window.nullHandlingMethod);
        } catch (e) {
            console.warn('Could not persist null handling method');
        }
    };

    window.handleTaskSelectionChange = function (selectedTask) {
        window.selectedTaskForTraining = selectedTask;
        try {
            localStorage.setItem('selectedTaskForTraining', window.selectedTaskForTraining);
        } catch (e) {
            console.warn('Could not persist selected task for training');
        }

        // Re-initialize the interface to update available models based on new task
        setTimeout(() => {
            window.initializeModelTrainingInterface();
        }, 100);
    };

    // Helper function to get model display name
    function getModelName(modelId) {
        const modelNames = {
            'logreg': 'Logistic Regression',
            'lr': 'Logistic Regression',
            'rf': 'Random Forest',
            'random_forest': 'Random Forest',
            'xgb': 'XGBoost',
            'xgboost': 'XGBoost',
            'svm': 'SVM',
            'mlp': 'MLP',
            'neural_network': 'MLP',
            'linear': 'Linear Regression',
            'linear_regression': 'Linear Regression',
            'lasso': 'Lasso',
            'ridge': 'Ridge',
            'lgbm': 'LightGBM',
            'lightgbm': 'LightGBM',
            'catboost': 'CatBoost',
            'gbm': 'Gradient Boosting',
            'gradient_boosting': 'Gradient Boosting',
            'adaboost': 'AdaBoost',
            'knn': 'K-Nearest Neighbors',
            'naive_bayes': 'Naive Bayes',
            'extra_trees': 'Extra Trees',
            'elastic_net': 'Elastic Net',
            'svr': 'Support Vector Regressor'
        };
        return modelNames[modelId] || modelId.charAt(0).toUpperCase() + modelId.slice(1).replace(/_/g, ' ');
    }

    // Helper function to show progress modal
    window.showTrainingProgressModal = function (modelIds) {
        // Remove existing progress modal if any
        const existingModal = document.getElementById('trainingProgressModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'trainingProgressModal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;';

        // Create progress items HTML
        const progressItems = modelIds.map((modelId, index) => {
            const modelName = getModelName(modelId);
            return `
                <div id="progress-${modelId}" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #1F2937; font-size: 1rem;">${modelName}</span>
                        <span id="status-${modelId}" style="font-size: 0.9rem; color: #6B7280; font-weight: 500;">Pending</span>
                    </div>
                    <div style="background: #E5E7EB; border-radius: 8px; height: 12px; overflow: hidden;">
                        <div id="bar-${modelId}" style="background: linear-gradient(90deg, #3B82F6 0%, #2563EB 100%); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 8px;"></div>
                    </div>
                </div>
            `;
        }).join('');

        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background: white; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);';
        modalContent.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h2 style="color: #1E40AF; font-weight: 700; margin: 0 0 8px 0; font-size: 1.5rem;">Training Models</h2>
                <p style="color: #6B7280; margin: 0; font-size: 0.95rem;">Training ${modelIds.length} model${modelIds.length > 1 ? 's' : ''}... Please wait.</p>
            </div>
            <div id="progressContainer">
                ${progressItems}
            </div>
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Overall Progress</div>
                        <div id="overallProgress" style="font-size: 1.1rem; font-weight: 600; color: #1E40AF;">0%</div>
                    </div>
                    <div id="overallProgressBar" style="flex: 1; margin-left: 20px; background: #E5E7EB; border-radius: 8px; height: 12px; overflow: hidden;">
                        <div id="overallProgressBarFill" style="background: linear-gradient(90deg, #10B981 0%, #059669 100%); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 8px;"></div>
                    </div>
                </div>
                <div id="overallEta" style="margin-top: 12px; font-size: 0.85rem; color: #6B7280; font-weight: 500;">Estimating time remaining...</div>
            </div>
            <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
                <button id="cancelTrainingBtn" 
                        onclick="window.cancelTraining()"
                        style="padding: 10px 24px; background: #EF4444; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s;"
                        onmouseover="this.style.background='#DC2626'"
                        onmouseout="this.style.background='#EF4444'">
                    Cancel Training
                </button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Force modal to be visible and on top
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '10001';

        // Scroll to top to ensure modal is visible
        window.scrollTo(0, 0);

        console.log('Training progress modal created and appended to body');

        return modal;
    };

    // Helper function to update progress for a specific model
    window.updateModelProgress = function (modelId, progress, status) {
        const bar = document.getElementById(`bar-${modelId}`);
        const statusEl = document.getElementById(`status-${modelId}`);
        const numericProgress = Math.max(0, Math.min(100, Number(progress) || 0));

        if (bar) {
            bar.style.width = `${numericProgress}%`;
        }

        if (window.trainingProgressState) {
            if (!window.trainingProgressState.modelProgress) {
                window.trainingProgressState.modelProgress = {};
            }
            window.trainingProgressState.modelProgress[modelId] = numericProgress;
            if (status) {
                if (!window.trainingProgressState.statuses) {
                    window.trainingProgressState.statuses = {};
                }
                window.trainingProgressState.statuses[modelId] = status;
            }
        }

        if (statusEl) {
            statusEl.textContent = status;
            // Update color based on status
            if (status === 'Complete' || status === 'Success' || status === 'Completed') {
                statusEl.style.color = '#10B981';
                statusEl.style.fontWeight = '600';
            } else if (status === 'Error' || status === 'Failed') {
                statusEl.style.color = '#DC2626';
                statusEl.style.fontWeight = '600';
            } else if (status === 'Cancelled') {
                statusEl.style.color = '#F59E0B';
                statusEl.style.fontWeight = '600';
            } else if (status === 'Training...' || status === 'Initializing...' || status === 'Processing results...' || status === 'Sending request...' || (status && status.includes('Optuna'))) {
                statusEl.style.color = '#3B82F6';
                statusEl.style.fontWeight = '500';
            } else {
                statusEl.style.color = '#6B7280';
                statusEl.style.fontWeight = '500';
            }
        }
    };

    function formatTimeRemaining(ms) {
        if (!ms || !isFinite(ms) || ms <= 0) {
            return 'Estimating time remaining...';
        }
        const totalSeconds = Math.round(ms / 1000);
        if (totalSeconds < 5) {
            return '<5s remaining';
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${seconds.toString().padStart(2, '0')}s remaining`;
        }
        return `${seconds}s remaining`;
    }

    // Helper function to update overall progress
    window.updateOverallProgress = function (completed, total) {
        const percentage = typeof total === 'number'
            ? (total > 0 ? Math.round((completed / total) * 100) : 0)
            : Math.max(0, Math.min(100, Math.round(completed)));
        const progressEl = document.getElementById('overallProgress');
        const progressBarFill = document.getElementById('overallProgressBarFill');
        const etaEl = document.getElementById('overallEta');

        if (progressEl) {
            progressEl.textContent = `${percentage}%`;
        }

        if (progressBarFill) {
            progressBarFill.style.width = `${percentage}%`;
        }

        if (etaEl) {
            if (percentage >= 100) {
                etaEl.textContent = 'Completed';
            } else if (window.trainingProgressState && window.trainingProgressState.startTime && typeof total === 'number' && total > 0) {
                // Calculate ETA based on completed models and elapsed time
                const elapsed = Date.now() - window.trainingProgressState.startTime;
                const completed = Math.round((percentage / 100) * total);

                if (completed > 0) {
                    // Estimate: time per model = elapsed / completed
                    // Remaining models = total - completed
                    const timePerModel = elapsed / completed;
                    const remainingModels = total - completed;
                    const estimatedRemaining = timePerModel * remainingModels;
                    etaEl.textContent = formatTimeRemaining(estimatedRemaining);
                } else {
                    // If no models completed yet, estimate based on total models and Optuna settings
                    const useOptuna = window.trainingProgressState.useOptuna || false;
                    const nTrials = window.trainingProgressState.nTrials || 20;
                    const baseTimePerModel = useOptuna ? (nTrials * 3000) : 20000; // 3s per trial or 20s base
                    const estimatedTotal = baseTimePerModel * total;
                    etaEl.textContent = formatTimeRemaining(estimatedTotal);
                }
            } else {
                etaEl.textContent = 'Estimating time remaining...';
            }
        }
    };

    // Helper function to close progress modal
    window.closeTrainingProgressModal = function () {
        const modal = document.getElementById('trainingProgressModal');
        if (modal) {
            modal.remove();
        }
    };

    // Cancel training function - cancels all training and closes modal
    window.cancelTraining = function () {
        console.log('Cancel training button clicked');

        // Confirm with user
        const confirmed = confirm('Are you sure you want to cancel training? All progress will be lost.');
        if (!confirmed) {
            return;
        }

        console.log('Cancelling all training...');

        // Set cancellation flag so training loop knows to stop
        window.trainingCancelled = true;

        // Abort all active fetch requests
        if (window.trainingAbortControllers) {
            Object.keys(window.trainingAbortControllers).forEach(modelId => {
                try {
                    if (window.trainingAbortControllers[modelId] && typeof window.trainingAbortControllers[modelId].abort === 'function') {
                        console.log(`Aborting request for model: ${modelId}`);
                        window.trainingAbortControllers[modelId].abort();
                    }
                } catch (e) {
                    console.error(`Error aborting request for ${modelId}:`, e);
                }
            });
        }

        // Clear all progress intervals
        if (window.trainingProgressIntervals) {
            Object.keys(window.trainingProgressIntervals).forEach(modelId => {
                try {
                    if (window.trainingProgressIntervals[modelId]) {
                        clearInterval(window.trainingProgressIntervals[modelId]);
                    }
                } catch (e) {
                    console.error(`Error clearing interval for ${modelId}:`, e);
                }
            });
        }

        // Clear auto interval if exists
        if (window.trainingProgressState && window.trainingProgressState.autoInterval) {
            clearInterval(window.trainingProgressState.autoInterval);
        }

        // Update all pending/training models to "Cancelled" status
        if (window.trainingProgressState && window.trainingProgressState.selectedModels) {
            window.trainingProgressState.selectedModels.forEach(modelId => {
                const status = window.trainingProgressState.statuses[modelId];
                // Only cancel models that aren't already complete or errored
                if (!status || status === 'Pending' || status === 'Training...' || status === 'Initializing...' || status.includes('Optuna')) {
                    window.updateModelProgress(modelId, 0, 'Cancelled');
                }
            });
        }

        // Close the modal after a short delay
        setTimeout(() => {
            window.closeTrainingProgressModal();

            // Re-enable the training button
            const trainingBtn = document.querySelector('button[onclick*="proceedToActualTraining"]');
            if (trainingBtn) {
                trainingBtn.disabled = false;
                trainingBtn.textContent = 'Start Training';
            }

            // Clear all training state
            window.trainingAbortControllers = {};
            window.trainingProgressIntervals = {};
            window.trainingProgressState = null;
            window.trainingCancelled = false;

            console.log('Training cancelled and modal closed');
        }, 1000);
    };

    window.proceedToActualTraining = async function () {
        // Clear training state at the start
        console.log('🔄 Starting training - clearing previous state...');
        window.trainingAbortControllers = {};
        window.trainingProgressIntervals = {};
        window.trainingCancelled = false; // Reset cancellation flag

        if (!window.trainingDatasetExport) {
            alert('Please create the training dataset first by clicking "Create Training Dataset".');
            return;
        }

        const td = window.trainingDatasetExport;
        const label = td.label;
        const features = td.features;
        const data = td.data;

        // Get selected models from checkboxes
        const selectedModels = Array.from(document.querySelectorAll('.model-checkbox:checked')).map(cb => cb.value);
        if (selectedModels.length === 0) {
            alert('Please select at least one model before starting training.');
            return;
        }
        if (!label) {
            alert('Please select a label (target variable) before starting training.');
            return;
        }
        if (features.length === 0) {
            alert('Please select at least one feature before starting training.');
            return;
        }
        if (!data || data.length === 0) {
            alert('No data available for training. Please create the training dataset first.');
            return;
        }

        // Check if domain is EHR (only implemented for EHR currently)
        // Try to restore from uploadedData if not set
        if (!window.selectedModelType && window.uploadedData && window.uploadedData.selected_model_type) {
            window.selectedModelType = window.uploadedData.selected_model_type;
            console.log('Restored selectedModelType from uploadedData:', window.selectedModelType);
        }
        if (!window.selectedModelAction && window.uploadedData && window.uploadedData.selected_model_action) {
            window.selectedModelAction = window.uploadedData.selected_model_action;
            console.log('Restored selectedModelAction from uploadedData:', window.selectedModelAction);
        }

        if (!window.selectedModelType || window.selectedModelType !== 'ehr') {
            const modelType = window.selectedModelType || 'unknown';
            alert(`Training for "${modelType}" domain is not yet implemented. Please use EHR domain.\n\n` +
                `To use EHR domain:\n` +
                `1. Go back to the upload page\n` +
                `2. Select "EHR" as the model type\n` +
                `3. Upload your dataset again`);
            return;
        }

        // Show loading state on button FIRST
        const trainingBtn = document.querySelector('button[onclick*="proceedToActualTraining"]');
        const originalText = trainingBtn ? trainingBtn.textContent : 'Start Training';
        if (trainingBtn) {
            trainingBtn.disabled = true;
            trainingBtn.textContent = 'Training...';
        }

        // Initialize shared training progress state
        // Clear any existing intervals
        if (window.trainingProgressState && window.trainingProgressState.autoInterval) {
            clearInterval(window.trainingProgressState.autoInterval);
        }

        // Get Optuna settings for ETA calculation
        const useOptunaCheckbox = document.getElementById('useOptunaCheckbox');
        const nTrialsInput = document.getElementById('nTrialsInput');
        const useOptuna = useOptunaCheckbox ? useOptunaCheckbox.checked : window.useOptuna || false;
        const nTrials = nTrialsInput ? parseInt(nTrialsInput.value, 10) : window.nTrials || 20;

        // Initialize fresh training progress state
        window.trainingProgressState = {
            startTime: Date.now(),
            totalModels: selectedModels.length,
            modelProgress: {},
            statuses: {},
            autoInterval: null,
            selectedModels: [...selectedModels],
            useOptuna: useOptuna,
            nTrials: nTrials
        };
        selectedModels.forEach((modelId) => {
            window.trainingProgressState.modelProgress[modelId] = 0;
        });

        // Show progress modal IMMEDIATELY and SYNCHRONOUSLY before any async operations
        console.log('Showing training progress modal for models:', selectedModels);

        try {
            const progressModal = window.showTrainingProgressModal(selectedModels);

            // Ensure modal is visible and on top
            if (!progressModal) {
                console.error('Failed to create progress modal - showTrainingProgressModal returned null');
                alert('Error: Could not create progress modal. Please check the console for errors.');
                if (trainingBtn) {
                    trainingBtn.disabled = false;
                    trainingBtn.textContent = originalText;
                }
                return;
            }

            // Force modal to be visible - these should already be set in showTrainingProgressModal, but ensure they are
            progressModal.style.display = 'flex';
            progressModal.style.visibility = 'visible';
            progressModal.style.opacity = '1';
            progressModal.style.zIndex = '10001';
            progressModal.style.position = 'fixed';
            progressModal.style.top = '0';
            progressModal.style.left = '0';
            progressModal.style.right = '0';
            progressModal.style.bottom = '0';
            progressModal.style.background = 'rgba(0,0,0,0.75)';

            console.log('Progress modal created and displayed:', progressModal.id);

            // Initialize progress display
            window.updateOverallProgress(0, selectedModels.length);

            // Initialize all models to "Pending" status
            selectedModels.forEach((modelId) => {
                window.updateModelProgress(modelId, 0, 'Pending');
            });

            // Scroll to top to ensure modal is visible
            window.scrollTo(0, 0);

            // Force a reflow to ensure modal is rendered
            progressModal.offsetHeight;

        } catch (error) {
            console.error('Error creating progress modal:', error);
            alert('Error creating progress modal: ' + error.message);
            if (trainingBtn) {
                trainingBtn.disabled = false;
                trainingBtn.textContent = originalText;
            }
            return;
        }

        try {
            // Get task from task selection dropdown, or fall back to selectedModelAction
            const taskSelect = document.getElementById('taskSelection');
            const task = taskSelect ? taskSelect.value : (window.selectedTaskForTraining || window.selectedModelAction || (window.uploadedData && window.uploadedData.selected_model_action) || 'classification');
            console.log('Training with task:', task, 'selectedTaskForTraining:', window.selectedTaskForTraining, 'selectedModelAction:', window.selectedModelAction);

            // Get Optuna settings
            const useOptunaCheckbox = document.getElementById('useOptunaCheckbox');
            const nTrialsInput = document.getElementById('nTrialsInput');
            const saveModelsCheckbox = document.getElementById('saveModelsCheckbox');
            const useOptuna = useOptunaCheckbox ? useOptunaCheckbox.checked : window.useOptuna || false;
            const nTrials = nTrialsInput ? parseInt(nTrialsInput.value, 10) : window.nTrials || 20;
            const saveModels = saveModelsCheckbox ? saveModelsCheckbox.checked : window.saveModels !== false;

            const requestData = {
                data: data,
                features: features,
                label: label,
                model_ids: selectedModels,  // Multiple models
                task: task,
                train_split_percentage: window.trainSplitPercentage,
                test_split_percentage: window.testSplitPercentage,
                null_handling_method: window.nullHandlingMethod || 'impute',
                use_optuna: useOptuna,
                n_trials: nTrials,
                save_models: saveModels,
                hyperparameter_configs: window.hyperparameterConfigs || {}  // Model-specific hyperparameter search spaces
            };

            console.log('Sending training request:', {
                model_ids: selectedModels,
                task: task,
                features_count: features.length,
                data_rows: data.length,
                train_split: window.trainSplitPercentage,
                use_optuna: useOptuna,
                n_trials: nTrials,
                save_models: saveModels
            });

            // Train models sequentially - one at a time
            // This way each model's progress bar completes before the next starts
            const allResults = [];
            let completedCount = 0;

            // Training loop - train models sequentially

            // Calculate base estimated duration (adjust for Optuna)
            // Without Optuna: ~15-30 seconds per model
            // With Optuna: ~(nTrials * 2-5 seconds) per model, depends on model complexity
            const baseDurationPerModel = 20000; // 20 seconds base
            const optunaMultiplier = useOptuna ? (nTrials * 3) : 1; // ~3 seconds per Optuna trial
            const estimatedDurationPerModel = baseDurationPerModel * optunaMultiplier;

            for (let i = 0; i < selectedModels.length; i++) {
                // Check if training was cancelled
                if (window.trainingCancelled) {
                    console.log('Training was cancelled, stopping loop');
                    break;
                }

                const modelId = selectedModels[i];

                // Update the current model status
                window.updateModelProgress(modelId, 5, 'Initializing...');

                await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for visual feedback

                // Start simulated progress animation for THIS model only
                let currentProgress = 15;
                const targetProgress = 90;
                const modelStartTime = Date.now();
                let progressInterval = null;

                progressInterval = setInterval(() => {
                    // Check if training was cancelled
                    if (window.trainingCancelled) {
                        clearInterval(progressInterval);
                        if (window.trainingProgressIntervals && window.trainingProgressIntervals[modelId]) {
                            delete window.trainingProgressIntervals[modelId];
                        }
                        return;
                    }
                    const elapsed = Date.now() - modelStartTime;
                    const progressRatio = Math.min(elapsed / estimatedDurationPerModel, 1);
                    const easedProgress = 1 - Math.pow(1 - progressRatio, 3);
                    currentProgress = 15 + (targetProgress - 15) * easedProgress;
                    window.updateModelProgress(modelId, Math.min(currentProgress, targetProgress), useOptuna ? `Training (Optuna: ${nTrials} trials)...` : 'Training...');
                }, 500);

                // Store progress interval so we can clear it on cancel
                if (!window.trainingProgressIntervals) {
                    window.trainingProgressIntervals = {};
                }
                window.trainingProgressIntervals[modelId] = progressInterval;

                // Create request for this single model
                const singleModelRequest = {
                    ...requestData,
                    model_ids: [modelId] // Only train one model at a time
                };

                // Create AbortController for this request
                const abortController = new AbortController();
                window.trainingAbortControllers[modelId] = abortController;

                try {
                    // Call backend training endpoint for this single model
                    let response;
                    try {
                        response = await fetch(`${window.API_BASE_URL || ""}/api/train`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(singleModelRequest),
                            signal: abortController.signal
                        });
                    } catch (fetchError) {
                        // If fetch was aborted (cancelled), handle it here
                        if (fetchError.name === 'AbortError') {
                            // Stop progress interval
                            if (progressInterval) {
                                clearInterval(progressInterval);
                                progressInterval = null;
                            }
                            if (window.trainingProgressIntervals && window.trainingProgressIntervals[modelId]) {
                                delete window.trainingProgressIntervals[modelId];
                            }
                            // Mark as cancelled and break out of loop
                            window.updateModelProgress(modelId, 0, 'Cancelled');
                            console.log(`Training cancelled for ${modelId}`);
                            // Break out of the loop - training was cancelled
                            break;
                        }
                        // Re-throw other errors to be caught by outer catch block
                        throw fetchError;
                    }

                    // Stop progress interval for this model
                    if (progressInterval) {
                        clearInterval(progressInterval);
                        progressInterval = null;
                    }
                    // Also clear from stored intervals
                    if (window.trainingProgressIntervals && window.trainingProgressIntervals[modelId]) {
                        delete window.trainingProgressIntervals[modelId];
                    }

                    // Update progress to 90% while processing response
                    window.updateModelProgress(modelId, 90, 'Processing results...');

                    // Check if response is ok
                    if (!response.ok) {
                        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                        try {
                            const errorResult = await response.json();
                            errorMessage = errorResult.detail || errorResult.message || errorMessage;
                            if (errorMessage.includes('\n\nFull traceback:')) {
                                errorMessage = errorMessage.split('\n\nFull traceback:')[0];
                            }
                        } catch (e) {
                            const text = await response.text();
                            errorMessage = text || errorMessage;
                        }

                        window.updateModelProgress(modelId, 100, 'Error');
                        allResults.push({ model_id: modelId, error: errorMessage });
                        completedCount++;
                        window.updateOverallProgress(completedCount, selectedModels.length);
                        continue; // Move to next model
                    }

                    const result = await response.json();

                    // Handle backend response
                    if (!result.success) {
                        // Backend returned success:false - this is a general error
                        const errorMsg = result.error || result.detail || result.message || 'Training failed';
                        console.error(`Model ${modelId} failed:`, errorMsg);
                        window.updateModelProgress(modelId, 100, 'Error');
                        allResults.push({ model_id: modelId, error: errorMsg });
                        completedCount++;
                        window.updateOverallProgress(completedCount, selectedModels.length);
                    } else if (result.results && result.results.length > 0) {
                        // Backend returned results - process each one
                        const modelResult = result.results[0];
                        // Check if this specific model had an error
                        if (modelResult.error) {
                            console.error(`Model ${modelId} error:`, modelResult.error);
                            window.updateModelProgress(modelId, 100, 'Error');
                            allResults.push(modelResult);
                            // Update status in progress state
                            if (window.trainingProgressState) {
                                window.trainingProgressState.statuses[modelId] = 'Error';
                            }
                        } else if (modelResult.metrics) {
                            console.log(`Model ${modelId} completed successfully with metrics:`, modelResult.metrics);
                            window.updateModelProgress(modelId, 100, 'Complete');
                            allResults.push(modelResult);
                            // Update status in progress state
                            if (window.trainingProgressState) {
                                window.trainingProgressState.statuses[modelId] = 'Complete';
                            }
                        } else {
                            // Model result exists but no metrics and no error - something went wrong
                            console.error(`Model ${modelId}: No metrics returned`);
                            window.updateModelProgress(modelId, 100, 'Error');
                            allResults.push({
                                model_id: modelId,
                                error: 'Model training completed but no metrics returned'
                            });
                            // Update status in progress state
                            if (window.trainingProgressState) {
                                window.trainingProgressState.statuses[modelId] = 'Error';
                            }
                        }
                        // Model completed (with success or error)
                        completedCount++;
                        window.updateOverallProgress(completedCount, selectedModels.length);
                    } else {
                        // Backend returned success:true but no results
                        const errorMsg = result.error || result.detail || result.message || 'No results returned';
                        console.error(`Model ${modelId}: No results in response:`, errorMsg);
                        window.updateModelProgress(modelId, 100, 'Error');
                        allResults.push({ model_id: modelId, error: errorMsg });
                        // Update status in progress state
                        if (window.trainingProgressState) {
                            window.trainingProgressState.statuses[modelId] = 'Error';
                        }
                        completedCount++;
                        window.updateOverallProgress(completedCount, selectedModels.length);
                    }
                } catch (error) {
                    // Stop progress interval on error
                    if (progressInterval) {
                        clearInterval(progressInterval);
                    }
                    if (window.trainingProgressIntervals && window.trainingProgressIntervals[modelId]) {
                        delete window.trainingProgressIntervals[modelId];
                    }

                    // Check if error is due to abort (cancelled)
                    if (error.name === 'AbortError') {
                        console.log('Model', modelId, 'training was cancelled');
                        window.updateModelProgress(modelId, 0, 'Cancelled');
                        // Break out of loop - training was cancelled
                        break;
                    } else {
                        console.error('Error training model', modelId, ':', error);
                        window.updateModelProgress(modelId, 100, 'Error');
                        const errorMessage = error.message || error.toString() || 'Unknown error';
                        allResults.push({ model_id: modelId, error: errorMessage });
                        completedCount++;
                        window.updateOverallProgress(completedCount, selectedModels.length);
                    }
                } finally {
                    // Clean up
                    if (window.trainingAbortControllers) {
                        delete window.trainingAbortControllers[modelId];
                    }
                }

                // Small delay before starting next model (for visual clarity)
                if (i < selectedModels.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Clear the auto interval if it exists (we're managing progress manually now)
            if (window.trainingProgressState && window.trainingProgressState.autoInterval) {
                clearInterval(window.trainingProgressState.autoInterval);
                window.trainingProgressState.autoInterval = null;
            }

            // Create a result object that matches the expected format
            // Consider it successful if we have results (even if some have errors)
            // We'll display both successful and failed models
            const hasAnyResults = allResults.length > 0;
            const hasSuccessfulModels = allResults.some(r => !r.error && r.metrics);

            const result = {
                success: hasAnyResults,  // Success if we got any results back
                results: allResults
            };

            console.log('Training response received:', result);
            console.log('Response structure:', {
                success: result.success,
                hasResults: !!result.results,
                resultsLength: result.results ? result.results.length : 0,
                hasSuccessfulModels: hasSuccessfulModels,
                firstResult: result.results && result.results.length > 0 ? result.results[0] : null
            });

            // Progress has already been updated in the sequential loop above

            // Wait a moment before closing modal and showing results
            await new Promise(resolve => setTimeout(resolve, 500));

            if (result.success && result.results && result.results.length > 0) {
                // Close progress modal
                window.closeTrainingProgressModal();

                // Stop overall progress interval now that we're complete
                if (window.trainingProgressState && window.trainingProgressState.autoInterval) {
                    clearInterval(window.trainingProgressState.autoInterval);
                    window.trainingProgressState.autoInterval = null;
                }
                window.updateOverallProgress(100);

                // Display results with visualizations (will show errors for failed models)
                displayTrainingResults(result, task);
                console.log('Training completed successfully', result);
            } else {
                // No results at all - this is a real failure
                window.closeTrainingProgressModal();
                const errorDetails = allResults.map(r => `${r.model_id}: ${r.error || 'Unknown error'}`).join('; ');
                throw new Error(`Training failed: ${errorDetails || 'No results returned. Please check the backend logs.'}`);
            }
        } catch (error) {
            console.error('Training error:', error);

            // Stop any running progress intervals
            if (typeof progressIntervals !== 'undefined') {
                selectedModels.forEach((modelId) => {
                    if (progressIntervals[modelId]) {
                        clearInterval(progressIntervals[modelId]);
                    }
                });
            }
            if (window.trainingProgressState && window.trainingProgressState.autoInterval) {
                clearInterval(window.trainingProgressState.autoInterval);
                window.trainingProgressState.autoInterval = null;
            }

            // Mark all models as error and close modal
            selectedModels.forEach((modelId, index) => {
                setTimeout(() => {
                    window.updateModelProgress(modelId, 100, 'Error');
                }, index * 100);
            });

            // Wait a moment before closing
            setTimeout(() => {
                window.closeTrainingProgressModal();
            }, 1500);

            alert(`Error training model: ${error.message}\n\nPlease check the console for details.`);
        } finally {
            // Restore button state
            if (trainingBtn) {
                trainingBtn.disabled = false;
                trainingBtn.textContent = originalText;
            }
            if (window.trainingProgressState && window.trainingProgressState.autoInterval) {
                clearInterval(window.trainingProgressState.autoInterval);
                window.trainingProgressState.autoInterval = null;
            }
        }
    };

    window.displayTrainingResults = function (result, task) {
        // Validate input
        if (!result) {
            console.error('displayTrainingResults: result is null or undefined');
            alert('Error: No training results received. Please check the backend logs.');
            return;
        }

        console.log('displayTrainingResults called with:', { result, task });

        // Create results display container
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'trainingResultsContainer';
        resultsContainer.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; overflow-y: auto; padding: 20px;';

        const resultsContent = document.createElement('div');
        resultsContent.style.cssText = 'background: white; border-radius: 16px; padding: 24px; max-width: 1200px; margin: 20px auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);';

        let resultsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="color: #1E40AF; font-weight: 700; margin: 0;">Training Results</h2>
                <button onclick="document.getElementById('trainingResultsContainer').remove()" 
                        style="background: #DC2626; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Close
                </button>
            </div>
        `;

        // Display Download All Models section prominently at the top
        if (result.saved_models && result.saved_models.length > 0) {
            resultsHTML += `
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <svg style="width: 24px; height: 24px; fill: white;" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        <h3 style="color: white; margin: 0; font-weight: 700; font-size: 1.1rem;">Download Trained Models (.pkl files)</h3>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            `;
            result.saved_models.forEach(sm => {
                const modelName = MODEL_OPTIONS.ehr.classification.find(m => m.id === sm.model_id)?.name ||
                    MODEL_OPTIONS.ehr.regression.find(m => m.id === sm.model_id)?.name ||
                    sm.model_id.toUpperCase();
                resultsHTML += `
                    <a href="${window.API_BASE_URL || ""}/api/download-model/${sm.filename}" 
                       download="${sm.filename}"
                       style="background: white; color: #059669; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;"
                       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                        <svg style="width: 16px; height: 16px; fill: currentColor;" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        ${modelName}
                    </a>
                `;
            });
            resultsHTML += `
                    </div>
                    <div style="margin-top: 12px; font-size: 0.85rem; color: rgba(255,255,255,0.9);">
                        💡 Tip: These .pkl files can be loaded with joblib.load() in Python for making predictions
                    </div>
                </div>
            `;
        }

        // Display comparison chart if multiple models
        if (result.comparison_chart && result.results && result.results.length > 1) {
            const chartTitle = task === 'classification' ? 'Model Comparison - Test Accuracy' : 'Model Comparison - Test R² Score';
            resultsHTML += `
                <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="color: #1E40AF; margin-bottom: 16px; font-weight: 700;">${chartTitle}</h3>
                    <img src="data:image/png;base64,${result.comparison_chart}" style="width: 100%; max-width: 800px; border-radius: 8px; border: 1px solid #E5E7EB;" alt="Model Comparison Chart">
                </div>
            `;
        }

        // Display results for each model
        // Handle both old format (single result) and new format (results array)
        let results = [];
        if (Array.isArray(result.results)) {
            results = result.results;
        } else if (result.results) {
            results = [result.results];
        } else if (result.metrics) {
            // Old format: single result object
            results = [result];
        } else {
            console.error('Invalid result structure:', result);
            resultsContent.innerHTML = resultsHTML + `
                <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px;">
                    <h4 style="color: #DC2626; margin: 0 0 8px 0;">Invalid Response Structure</h4>
                    <p style="color: #991B1B; margin: 0;">The backend returned an unexpected response format. Please check the console for details.</p>
                    <pre style="margin-top: 12px; font-size: 0.8rem; overflow-x: auto;">${JSON.stringify(result, null, 2)}</pre>
                </div>
            `;
            resultsContainer.appendChild(resultsContent);
            document.body.appendChild(resultsContainer);
            return;
        }

        console.log('Displaying training results. Total results:', results.length);
        console.log('Result structure:', result);

        results.forEach((modelResult, index) => {
            console.log(`Processing result ${index}:`, modelResult);

            // Validate modelResult
            if (!modelResult || typeof modelResult !== 'object') {
                console.error(`Invalid modelResult at index ${index}:`, modelResult);
                resultsHTML += `
                    <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                        <h4 style="color: #DC2626; margin: 0 0 8px 0;">Model ${index + 1} - Invalid Result</h4>
                        <p style="color: #991B1B; margin: 0;">Invalid result structure received.</p>
                    </div>
                `;
                return;
            }

            if (modelResult.error) {
                resultsHTML += `
                    <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                        <h4 style="color: #DC2626; margin: 0 0 8px 0;">${modelResult.model_id || 'Model'} - Error</h4>
                        <p style="color: #991B1B; margin: 0;">${modelResult.error}</p>
                    </div>
                `;
                return;
            }

            // Get metrics - ensure it exists
            const metrics = modelResult.metrics;
            const modelId = modelResult.model_id || 'Model';

            if (!metrics) {
                console.warn(`No metrics found for model ${modelId}. Result:`, modelResult);
                resultsHTML += `
                    <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                        <h4 style="color: #DC2626; margin: 0 0 8px 0;">${modelId} - No Metrics</h4>
                        <p style="color: #991B1B; margin: 0;">No metrics were returned for this model. Please check the backend logs.</p>
                    </div>
                `;
                return;
            }
            resultsHTML += `
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #1E40AF; margin-bottom: 16px; font-weight: 700;">${modelId.toUpperCase()}</h3>
            `;

            if (task === 'classification' && metrics) {
                // Safely access metrics with fallbacks
                const trainAccuracy = metrics.train_accuracy !== undefined ? metrics.train_accuracy : null;
                const testAccuracy = metrics.test_accuracy !== undefined ? metrics.test_accuracy : null;
                const testPrecision = metrics.test_precision !== undefined ? metrics.test_precision : null;
                const testRecall = metrics.test_recall !== undefined ? metrics.test_recall : null;
                const testF1 = metrics.test_f1 !== undefined ? metrics.test_f1 : null;

                if (trainAccuracy === null || testAccuracy === null) {
                    console.error('Missing required metrics for classification:', metrics);
                    resultsHTML += `
                        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                            <h4 style="color: #DC2626; margin: 0 0 8px 0;">${modelId} - Incomplete Metrics</h4>
                            <p style="color: #991B1B; margin: 0;">Required metrics (train_accuracy, test_accuracy) are missing. Metrics received: ${JSON.stringify(metrics)}</p>
                        </div>
                    `;
                } else {
                    resultsHTML += `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Train Accuracy</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">${(trainAccuracy * 100).toFixed(2)}%</div>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Test Accuracy</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #0071e3;">${(testAccuracy * 100).toFixed(2)}%</div>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Precision</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #8B5CF6;">${testPrecision !== null ? (testPrecision * 100).toFixed(2) + '%' : 'N/A'}</div>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Recall</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #F59E0B;">${testRecall !== null ? (testRecall * 100).toFixed(2) + '%' : 'N/A'}</div>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">F1-Score</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #10B981;">${testF1 !== null ? (testF1 * 100).toFixed(2) + '%' : 'N/A'}</div>
                            </div>
                        </div>
                    `;
                }

                // Confusion matrix
                if (metrics.confusion_matrix_image) {
                    resultsHTML += `
                        <div style="margin-bottom: 16px;">
                            <h4 style="color: #374151; margin-bottom: 12px; font-weight: 600;">Confusion Matrix</h4>
                            <img src="data:image/png;base64,${metrics.confusion_matrix_image}" 
                                 style="width: 100%; max-width: 600px; border-radius: 8px; border: 1px solid #E5E7EB;" 
                                 alt="Confusion Matrix">
                        </div>
                    `;
                }

                // Best parameters if Optuna was used
                if (modelResult.best_params) {
                    resultsHTML += `
                        <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 12px; margin-top: 16px;">
                            <div style="font-weight: 600; color: #0369A1; margin-bottom: 8px;">Optuna Best Parameters:</div>
                            <pre style="margin: 0; font-size: 0.85rem; color: #1E40AF; overflow-x: auto;">${JSON.stringify(modelResult.best_params, null, 2)}</pre>
                        </div>
                    `;
                }

            } else if (task === 'regression' && metrics) {
                // Safely access regression metrics with fallbacks
                const trainRmse = metrics.train_rmse !== undefined ? metrics.train_rmse : null;
                const testRmse = metrics.test_rmse !== undefined ? metrics.test_rmse : null;
                const testMae = metrics.test_mae !== undefined ? metrics.test_mae : null;
                const testR2 = metrics.test_r2 !== undefined ? metrics.test_r2 : null;

                if (testRmse === null || testR2 === null) {
                    console.error('Missing required metrics for regression:', metrics);
                    resultsHTML += `
                        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                            <h4 style="color: #DC2626; margin: 0 0 8px 0;">${modelId} - Incomplete Metrics</h4>
                            <p style="color: #991B1B; margin: 0;">Required metrics (test_rmse, test_r2) are missing. Metrics received: ${JSON.stringify(metrics)}</p>
                        </div>
                    `;
                } else {
                    resultsHTML += `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Train RMSE</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #059669;">${trainRmse !== null ? trainRmse.toFixed(4) : 'N/A'}</div>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Test RMSE</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #0071e3;">${testRmse.toFixed(4)}</div>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Test MAE</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #8B5CF6;">${testMae !== null ? testMae.toFixed(4) : 'N/A'}</div>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: #6B7280; margin-bottom: 4px;">Test R²</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #10B981;">${testR2.toFixed(4)}</div>
                            </div>
                        </div>
                    `;
                }
            }

            // Model download link if saved
            if (result.saved_models && result.saved_models.length > 0) {
                const savedModel = result.saved_models.find(sm => sm.model_id === modelId);
                if (savedModel) {
                    resultsHTML += `
                        <div style="margin-top: 16px;">
                            <a href="${window.API_BASE_URL || ""}/api/download-model/${savedModel.filename}" 
                               download="${savedModel.filename}"
                               style="background: #10B981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-right: 10px;">
                                Download Model
                            </a>
                        </div>
                    `;
                }
            }

            const trainSize = modelResult.train_size || result.train_size || 0;
            const testSize = modelResult.test_size || result.test_size || 0;
            const featureCount = modelResult.feature_count || result.feature_count || 0;

            resultsHTML += `
                    <div style="margin-top: 12px; font-size: 0.85rem; color: #6B7280;">
                        Train Size: ${trainSize} | Test Size: ${testSize} | Features: ${featureCount}
                    </div>
            `;

            // Display model parameters (state dict)
            if (modelResult.model_params && Object.keys(modelResult.model_params).length > 0) {
                const paramsId = `model-params-${modelId}-${Date.now()}`;
                resultsHTML += `
                    <div style="margin-top: 16px;">
                        <button onclick="toggleModelParams('${paramsId}')" 
                                style="background: #F3F4F6; color: #374151; border: 1px solid #D1D5DB; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 8px;"
                                onmouseover="this.style.background='#E5E7EB';" 
                                onmouseout="this.style.background='#F3F4F6';">
                            <span id="${paramsId}-icon">▶</span>
                            <span>View Model Parameters (State Dict)</span>
                        </button>
                        <div id="${paramsId}" style="display: none; margin-top: 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; max-height: 400px; overflow-y: auto;">
                            <pre style="margin: 0; font-size: 0.8rem; color: #1F2937; white-space: pre-wrap; word-wrap: break-word; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;">${JSON.stringify(modelResult.model_params, null, 2)}</pre>
                        </div>
                    </div>
                `;
            }

            resultsHTML += `</div>`;
        });

        resultsContent.innerHTML = resultsHTML;
        resultsContainer.appendChild(resultsContent);
        document.body.appendChild(resultsContainer);
    };

    // Toggle model parameters display
    window.toggleModelParams = function (paramsId) {
        const paramsDiv = document.getElementById(paramsId);
        const icon = document.getElementById(paramsId + '-icon');
        if (paramsDiv && icon) {
            if (paramsDiv.style.display === 'none') {
                paramsDiv.style.display = 'block';
                icon.textContent = '▼';
            } else {
                paramsDiv.style.display = 'none';
                icon.textContent = '▶';
            }
        }
    };

    // Update Optuna checkbox to show/hide options
    setTimeout(() => {
        const optunaCheckbox = document.getElementById('useOptunaCheckbox');
        const optunaOptions = document.getElementById('optunaOptions');
        if (optunaCheckbox && optunaOptions) {
            optunaCheckbox.addEventListener('change', function () {
                optunaOptions.style.display = this.checked ? 'block' : 'none';
            });
        }
    }, 200);

    console.log('Model Training module loaded');
})();

