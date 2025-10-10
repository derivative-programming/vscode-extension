/**
 * Forecast Configuration Management
 * Handles forecast configuration modal and settings
 * Last Modified: October 10, 2025
 */

// Global state for holidays
let currentHolidays = [];

/**
 * Show forecast configuration modal
 */
function showForecastConfigModal() {
    // Get or create modal container
    let modalContainer = document.getElementById("modal-container");
    if (!modalContainer) {
        modalContainer = document.createElement("div");
        modalContainer.id = "modal-container";
        document.body.appendChild(modalContainer);
    }
    
    // Get current config
    const config = devConfig.forecastConfig || getDefaultForecastConfig();
    currentHolidays = [...(config.holidays || [])];
    
    // Generate and show modal
    modalContainer.innerHTML = generateForecastConfigModal(config);
    modalContainer.style.display = "block";
}

/**
 * Close forecast configuration modal
 * @param {Event} event - Click event (optional)
 */
function closeForecastConfigModal(event) {
    if (event && event.target !== event.currentTarget) {
        return; // Only close if clicked on overlay
    }
    
    const modalContainer = document.getElementById("modal-container");
    if (modalContainer) {
        modalContainer.innerHTML = "";
        modalContainer.style.display = "none";
    }
    
    currentHolidays = [];
}

/**
 * Save forecast configuration
 * @param {Event} event - Form submit event
 */
function saveForecastConfig(event) {
    event.preventDefault();
    
    const form = document.getElementById("forecast-config-form");
    if (!form) {
        return;
    }
    
    // Get form data
    const formData = new FormData(form);
    
    // Build config object
    const forecastConfig = {
        hoursPerPoint: parseFloat(formData.get("hoursPerPoint")) || 4,
        workingHoursPerDay: parseFloat(formData.get("workingHoursPerDay")) || 8,
        workingDaysPerWeek: parseInt(formData.get("workingDaysPerWeek")) || 5,
        excludeWeekends: formData.get("excludeWeekends") === "on",
        velocityOverride: formData.get("velocityOverride") ? parseFloat(formData.get("velocityOverride")) : null,
        parallelWorkFactor: parseFloat(formData.get("parallelWorkFactor")) || 1.0,
        holidays: currentHolidays,
        useActualDates: formData.get("useActualDates") === "on",
        accountForBlockers: formData.get("accountForBlockers") === "on",
        confidenceLevel: formData.get("confidenceLevel") || "75"
    };
    
    // Validate
    if (forecastConfig.hoursPerPoint < 0.5 || forecastConfig.hoursPerPoint > 40) {
        vscode.postMessage({ 
            command: "showError", 
            message: "Hours per point must be between 0.5 and 40" 
        });
        return;
    }
    
    if (forecastConfig.workingHoursPerDay < 1 || forecastConfig.workingHoursPerDay > 24) {
        vscode.postMessage({ 
            command: "showError", 
            message: "Working hours per day must be between 1 and 24" 
        });
        return;
    }
    
    // Save to extension
    vscode.postMessage({
        command: "saveForecastConfig",
        config: forecastConfig
    });
    
    // Show spinner
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="codicon codicon-loading codicon-modifier-spin"></span> Saving...';
    }
}

/**
 * Reset forecast configuration to defaults
 */
function resetForecastConfig() {
    if (!confirm("Reset all forecast settings to defaults? This cannot be undone.")) {
        return;
    }
    
    const defaultConfig = getDefaultForecastConfig();
    
    // Save defaults
    vscode.postMessage({
        command: "saveForecastConfig",
        config: defaultConfig
    });
    
    // Close modal
    closeForecastConfigModal();
}

/**
 * Add a holiday date
 */
function addHoliday() {
    const input = document.getElementById("holidays-input");
    if (!input || !input.value) {
        return;
    }
    
    const dateValue = input.value; // YYYY-MM-DD format
    
    // Check if already exists
    if (currentHolidays.includes(dateValue)) {
        vscode.postMessage({ 
            command: "showWarning", 
            message: "This date is already in the holidays list" 
        });
        return;
    }
    
    // Add to list
    currentHolidays.push(dateValue);
    currentHolidays.sort();
    
    // Update UI
    updateHolidaysList();
    
    // Clear input
    input.value = "";
}

/**
 * Remove a holiday by index
 * @param {number} index - Index in holidays array
 */
function removeHoliday(index) {
    if (index >= 0 && index < currentHolidays.length) {
        currentHolidays.splice(index, 1);
        updateHolidaysList();
    }
}

/**
 * Update holidays list UI
 */
function updateHolidaysList() {
    const container = document.getElementById("holidays-list");
    if (container) {
        container.innerHTML = generateHolidaysList(currentHolidays);
    }
}

/**
 * Add US holidays for 2025
 */
function addUSHolidays2025() {
    const usHolidays = [
        "2025-01-01", // New Year's Day
        "2025-01-20", // MLK Day
        "2025-02-17", // Presidents Day
        "2025-05-26", // Memorial Day
        "2025-07-04", // Independence Day
        "2025-09-01", // Labor Day
        "2025-10-13", // Columbus Day
        "2025-11-11", // Veterans Day
        "2025-11-27", // Thanksgiving
        "2025-12-25"  // Christmas
    ];
    
    // Add holidays that aren't already in the list
    usHolidays.forEach(date => {
        if (!currentHolidays.includes(date)) {
            currentHolidays.push(date);
        }
    });
    
    currentHolidays.sort();
    updateHolidaysList();
    
    vscode.postMessage({ 
        command: "showInfo", 
        message: "US holidays added to the list" 
    });
}

/**
 * Clear all holidays
 */
function clearAllHolidays() {
    if (currentHolidays.length === 0) {
        return;
    }
    
    if (!confirm("Remove all holidays from the list?")) {
        return;
    }
    
    currentHolidays = [];
    updateHolidaysList();
}

/**
 * Refresh forecast with current data
 */
function refreshForecast() {
    if (!allItems || allItems.length === 0) {
        vscode.postMessage({ 
            command: "showWarning", 
            message: "No stories available to forecast" 
        });
        return;
    }
    
    // Show spinner overlay
    showSpinner();
    
    // Re-render after brief delay to allow spinner to display
    setTimeout(() => {
        try {
            renderForecastTab();
        } finally {
            // Hide spinner after processing
            hideSpinner();
        }
    }, 50);
}

/**
 * Toggle Project Overview section expansion/contraction
 */
function toggleProjectOverview() {
    const detailsSection = document.getElementById("project-overview-details");
    const toggleIcon = document.getElementById("project-overview-toggle-icon");
    
    if (!detailsSection || !toggleIcon) {
        return;
    }
    
    // Toggle visibility
    if (detailsSection.style.display === "none") {
        detailsSection.style.display = "block";
        toggleIcon.className = "codicon codicon-chevron-down";
    } else {
        detailsSection.style.display = "none";
        toggleIcon.className = "codicon codicon-chevron-right";
    }
}

// Ensure function is available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.toggleProjectOverview = toggleProjectOverview;
}
