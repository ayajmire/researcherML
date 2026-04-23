/**
 * Navigation Controller for ResearcherML
 * Centralized section navigation to replace duplicated show/hide logic
 */

const Navigation = (function() {
    // Define all sections in the application
    const SECTIONS = [
        'uploadSection',
        'modelSelection',
        'dataViewer',
        'cleaningPage',
        'questionnaireCleanPage',
        'featureEngineeringPage',
        'visualizationPage',
        'modelTrainingPage',
        'timeSeriesPage'
    ];

    /**
     * Navigate to a specific section, hiding all others
     * @param {string} sectionId - ID of the section to show
     */
    function navigateTo(sectionId) {
        console.log(`Navigating to: ${sectionId}`);
        
        // Hide all sections
        SECTIONS.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
            }
        });
        
        // Show the target section
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
            targetElement.style.display = 'block';
            targetElement.style.visibility = 'visible';
        } else {
            console.warn(`Section not found: ${sectionId}`);
        }
        
        // Update sidebar active state
        updateSidebarActiveState(sectionId);
    }

    /**
     * Update sidebar to highlight the active section
     * @param {string} sectionId - ID of the active section
     */
    function updateSidebarActiveState(sectionId) {
        // Map section IDs to sidebar items
        const sectionToSidebarMap = {
            'uploadSection': 'upload',
            'modelSelection': 'model',
            'dataViewer': 'viewer',
            'cleaningPage': 'cleaning',
            'featureEngineeringPage': 'features',
            'visualizationPage': 'visualization',
            'modelTrainingPage': 'training',
            'timeSeriesPage': 'timeseries'
        };
        
        const sidebarId = sectionToSidebarMap[sectionId];
        
        // Remove active class from all sidebar items
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to the current item
        if (sidebarId) {
            const sidebarItem = document.querySelector(`.sidebar-item[data-section="${sidebarId}"]`);
            if (sidebarItem) {
                sidebarItem.classList.add('active');
            }
        }
    }

    /**
     * Check if a section exists
     * @param {string} sectionId - ID of the section to check
     * @returns {boolean}
     */
    function sectionExists(sectionId) {
        return SECTIONS.includes(sectionId) && document.getElementById(sectionId) !== null;
    }

    /**
     * Get the currently visible section
     * @returns {string|null} ID of the visible section or null
     */
    function getCurrentSection() {
        for (const sectionId of SECTIONS) {
            const element = document.getElementById(sectionId);
            if (element && element.style.display !== 'none') {
                return sectionId;
            }
        }
        return null;
    }

    // Public API
    return {
        navigateTo,
        sectionExists,
        getCurrentSection,
        SECTIONS
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Navigation = Navigation;
}
