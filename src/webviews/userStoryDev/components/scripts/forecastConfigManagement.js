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
    
    // Collect working hours from the table
    const workingHours = collectWorkingHoursFromTable();
    
    // Validate working hours first
    const validation = validateWorkingHours(workingHours);
    
    if (!validation.isValid) {
        // Show validation errors
        const errorMessage = "Working Hours Configuration Errors:\n\n" + 
            validation.errors.map((err, i) => `${i + 1}. ${err}`).join('\n');
        
        vscode.postMessage({ 
            command: "showError", 
            message: errorMessage
        });
        return;
    }
    
    // Show warnings if any (but don't block save)
    if (validation.warnings.length > 0) {
        const warningMessage = "Working Hours Warnings:\n\n" + 
            validation.warnings.map((warn, i) => `${i + 1}. ${warn}`).join('\n') +
            "\n\nDo you want to continue saving?";
        
        if (!confirm(warningMessage)) {
            return;
        }
    }
    
    // Build config object
    const forecastConfig = {
        hoursPerPoint: parseFloat(formData.get("hoursPerPoint")) || 4,
        workingHours: workingHours, // New: per-day working hours configuration
        workingHoursPerDay: calculateAverageFromWorkingHours(workingHours), // Legacy field for compatibility
        workingDaysPerWeek: workingHours.filter(day => day.enabled && day.hours > 0).length, // Legacy field for compatibility
        excludeWeekends: !workingHours[5].enabled && !workingHours[6].enabled, // Legacy field for compatibility
        excludeNonWorkingHours: formData.get("excludeNonWorkingHours") === "on",
        velocityOverride: formData.get("velocityOverride") ? parseFloat(formData.get("velocityOverride")) : null,
        parallelWorkFactor: parseFloat(formData.get("parallelWorkFactor")) || 1.0,
        holidays: currentHolidays,
        useActualDates: formData.get("useActualDates") === "on",
        accountForBlockers: formData.get("accountForBlockers") === "on",
        confidenceLevel: formData.get("confidenceLevel") || "75"
    };
    
    // Validate other fields
    if (forecastConfig.hoursPerPoint < 0.5 || forecastConfig.hoursPerPoint > 40) {
        vscode.postMessage({ 
            command: "showError", 
            message: "Hours per point must be between 0.5 and 40" 
        });
        return;
    }
    
    // Note: workingHoursPerDay validation is now handled by working hours table validation
    
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

/**
 * Collect working hours configuration from the table
 * @returns {Array} Array of working hours for each day
 */
function collectWorkingHoursFromTable() {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const workingHours = [];
    
    for (let i = 0; i < 7; i++) {
        const enabledCheckbox = document.querySelector(`.working-hours-enabled-checkbox[data-day-index="${i}"]`);
        const startTimeInput = document.querySelector(`.working-hours-time-input[data-day-index="${i}"][data-time-type="start"]`);
        const endTimeInput = document.querySelector(`.working-hours-time-input[data-day-index="${i}"][data-time-type="end"]`);
        const hoursDisplay = document.querySelector(`.working-hours-display[data-day-index="${i}"]`);
        
        const enabled = enabledCheckbox ? enabledCheckbox.checked : false;
        const startTime = startTimeInput ? convert24HourTo12Hour(startTimeInput.value) : "09:00 AM";
        const endTime = endTimeInput ? convert24HourTo12Hour(endTimeInput.value) : "05:00 PM";
        const hours = hoursDisplay ? parseFloat(hoursDisplay.textContent) : 8.0;
        
        workingHours.push({
            day: dayNames[i],
            enabled: enabled,
            startTime: startTime,
            endTime: endTime,
            hours: hours
        });
    }
    
    return workingHours;
}

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param {string} time24 - Time in HH:MM format
 * @returns {string} Time in "HH:MM AM/PM" format
 */
function convert24HourTo12Hour(time24) {
    if (!time24) {
        return "09:00 AM";
    }
    
    const [hourStr, minuteStr] = time24.split(':');
    let hour = parseInt(hourStr);
    const minute = minuteStr || "00";
    
    let meridiem = "AM";
    if (hour >= 12) {
        meridiem = "PM";
        if (hour > 12) {
            hour -= 12;
        }
    }
    if (hour === 0) {
        hour = 12;
    }
    
    return `${String(hour).padStart(2, '0')}:${minute} ${meridiem}`;
}

/**
 * Calculate average working hours per day from working hours array
 * @param {Array} workingHours - Array of working hours configuration
 * @returns {number} Average hours per enabled day
 */
function calculateAverageFromWorkingHours(workingHours) {
    const enabledDays = workingHours.filter(day => day.enabled);
    if (enabledDays.length === 0) {
        return 8;
    }
    
    // Filter out invalid hours (0 or negative)
    const validHours = enabledDays.filter(day => day.hours > 0);
    if (validHours.length === 0) {
        return 8;
    }
    
    const totalHours = validHours.reduce((sum, day) => sum + day.hours, 0);
    return totalHours / validHours.length;
}

/**
 * Validate working hours configuration before saving
 * @param {Array} workingHours - Array of working hours to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateWorkingHours(workingHours) {
    const errors = [];
    const warnings = [];
    
    // Check if at least one day is enabled
    const enabledDays = workingHours.filter(day => day.enabled);
    if (enabledDays.length === 0) {
        errors.push("At least one working day must be enabled");
    }
    
    // Validate each enabled day
    enabledDays.forEach((day, index) => {
        const dayName = day.day;
        
        // Check for invalid hours (end time before or equal to start time)
        if (day.hours <= 0) {
            errors.push(`${dayName}: End time must be after start time`);
        }
        
        // Warn about unrealistic hours
        if (day.hours > 16) {
            warnings.push(`${dayName}: ${day.hours.toFixed(1)} hours is unusually long (over 16 hours)`);
        }
        
        // Validate time format
        if (!day.startTime || !day.endTime) {
            errors.push(`${dayName}: Missing start or end time`);
        }
    });
    
    // Check for reasonable total weekly hours
    const totalWeeklyHours = workingHours.reduce((sum, day) => {
        return sum + (day.enabled && day.hours > 0 ? day.hours : 0);
    }, 0);
    
    if (totalWeeklyHours < 8) {
        warnings.push(`Total weekly hours (${totalWeeklyHours.toFixed(1)}) is very low (under 8 hours)`);
    } else if (totalWeeklyHours > 80) {
        warnings.push(`Total weekly hours (${totalWeeklyHours.toFixed(1)}) is very high (over 80 hours)`);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Update working hours row when enabled checkbox changes
 * @param {number} dayIndex - Index of the day (0-6)
 */
function updateWorkingHoursRow(dayIndex) {
    const enabledCheckbox = document.querySelector(`.working-hours-enabled-checkbox[data-day-index="${dayIndex}"]`);
    const startTimeInput = document.querySelector(`.working-hours-time-input[data-day-index="${dayIndex}"][data-time-type="start"]`);
    const endTimeInput = document.querySelector(`.working-hours-time-input[data-day-index="${dayIndex}"][data-time-type="end"]`);
    const row = enabledCheckbox ? enabledCheckbox.closest('tr') : null;
    
    if (!enabledCheckbox || !startTimeInput || !endTimeInput || !row) {
        return;
    }
    
    const isEnabled = enabledCheckbox.checked;
    
    // Enable/disable time inputs
    startTimeInput.disabled = !isEnabled;
    endTimeInput.disabled = !isEnabled;
    
    // Update row styling
    if (isEnabled) {
        row.classList.remove('disabled-row');
    } else {
        row.classList.add('disabled-row');
    }
}

/**
 * Update calculated hours when time inputs change
 * @param {number} dayIndex - Index of the day (0-6)
 */
function updateWorkingHoursCalculation(dayIndex) {
    const startTimeInput = document.querySelector(`.working-hours-time-input[data-day-index="${dayIndex}"][data-time-type="start"]`);
    const endTimeInput = document.querySelector(`.working-hours-time-input[data-day-index="${dayIndex}"][data-time-type="end"]`);
    const hoursDisplay = document.querySelector(`.working-hours-display[data-day-index="${dayIndex}"]`);
    const row = startTimeInput ? startTimeInput.closest('tr') : null;
    
    if (!startTimeInput || !endTimeInput || !hoursDisplay) {
        return;
    }
    
    const startTime = startTimeInput.value; // HH:MM format
    const endTime = endTimeInput.value; // HH:MM format
    
    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Calculate hours
    const startDecimal = startHour + (startMin / 60);
    const endDecimal = endHour + (endMin / 60);
    
    let hours = endDecimal - startDecimal;
    
    // Validate time range
    if (hours <= 0) {
        // Invalid time range: end time is before or equal to start time
        hoursDisplay.textContent = "Invalid";
        hoursDisplay.style.color = "var(--vscode-errorForeground)";
        
        // Add error styling to inputs
        startTimeInput.style.borderColor = "var(--vscode-inputValidation-errorBorder)";
        endTimeInput.style.borderColor = "var(--vscode-inputValidation-errorBorder)";
        
        // Add error class to row
        if (row) {
            row.classList.add('invalid-time-range');
        }
    } else if (hours > 24) {
        // Unrealistic time range
        hoursDisplay.textContent = "Too Long";
        hoursDisplay.style.color = "var(--vscode-inputValidation-warningForeground)";
        
        // Add warning styling to inputs
        startTimeInput.style.borderColor = "var(--vscode-inputValidation-warningBorder)";
        endTimeInput.style.borderColor = "var(--vscode-inputValidation-warningBorder)";
        
        // Add warning class to row
        if (row) {
            row.classList.remove('invalid-time-range');
            row.classList.add('warning-time-range');
        }
    } else {
        // Valid time range
        hoursDisplay.textContent = hours.toFixed(1);
        hoursDisplay.style.color = "var(--vscode-charts-blue)";
        
        // Remove error styling
        startTimeInput.style.borderColor = "";
        endTimeInput.style.borderColor = "";
        
        // Remove error/warning classes
        if (row) {
            row.classList.remove('invalid-time-range');
            row.classList.remove('warning-time-range');
        }
    }
}

// Ensure functions are available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.toggleProjectOverview = toggleProjectOverview;
}
