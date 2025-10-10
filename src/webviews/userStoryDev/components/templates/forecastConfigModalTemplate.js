/**
 * Forecast Configuration Modal Template
 * Generates HTML for the forecast configuration modal
 * Last Modified: October 5, 2025
 */

/**
 * Generate forecast configuration modal
 * @param {Object} config - Current forecast configuration
 * @returns {string} HTML for configuration modal
 */
function generateForecastConfigModal(config) {
    const forecastConfig = config || getDefaultForecastConfig();
    
    return `
        <div class="modal-overlay" id="forecast-config-modal" onclick="closeForecastConfigModal(event)">
            <div class="modal-content story-detail-modal" onclick="event.stopPropagation()" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>
                        <span class="codicon codicon-settings-gear"></span>
                        Forecast Configuration
                    </h3>
                    <button class="modal-close" onclick="closeForecastConfigModal()">
                        <span class="codicon codicon-close"></span>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="forecast-config-form" onsubmit="saveForecastConfig(event); return false;">
                        
                        <!-- Estimation Settings -->
                        <div class="config-section">
                            <h4 class="config-section-title">
                                <span class="codicon codicon-symbol-ruler"></span>
                                Estimation Settings
                            </h4>
                            
                            <div class="form-group">
                                <label for="hours-per-point" class="form-label">
                                    Hours per Story Point *
                                    <span class="form-help" title="Average hours of work per story point">
                                        <span class="codicon codicon-question"></span>
                                    </span>
                                </label>
                                <input 
                                    type="number" 
                                    id="hours-per-point" 
                                    name="hoursPerPoint"
                                    class="form-input"
                                    min="0.5"
                                    max="40"
                                    step="0.5"
                                    value="${forecastConfig.hoursPerPoint || 4}"
                                    required
                                />
                                <small class="form-hint">Typical range: 4-16 hours per point</small>
                            </div>
                        </div>
                        
                        <!-- Working Hours -->
                        <div class="config-section">
                            <h4 class="config-section-title">
                                <span class="codicon codicon-calendar"></span>
                                Working Hours
                            </h4>
                            
                            <div class="working-hours-table-container">
                                <table class="working-hours-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 80px;">Enabled</th>
                                            <th style="width: 120px;">Day</th>
                                            <th style="width: 140px;">Start Time</th>
                                            <th style="width: 140px;">End Time</th>
                                            <th style="width: 80px;">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody id="workingHoursTableBody">
                                        ${generateWorkingHoursRows(forecastConfig.workingHours)}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="form-group" style="margin-top: 16px;">
                                <label class="form-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        id="exclude-non-working-hours" 
                                        name="excludeNonWorkingHours"
                                        ${forecastConfig.excludeNonWorkingHours !== false ? "checked" : ""}
                                    />
                                    <span>Hide non-working hours in Gantt chart timeline</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Velocity Settings -->
                        <div class="config-section">
                            <h4 class="config-section-title">
                                <span class="codicon codicon-pulse"></span>
                                Velocity Settings
                            </h4>
                            
                            <div class="form-group">
                                <label for="velocity-override" class="form-label">
                                    Manual Velocity Override (pts/sprint)
                                    <span class="form-help" title="Leave empty to use calculated velocity from completed sprints">
                                        <span class="codicon codicon-question"></span>
                                    </span>
                                </label>
                                <input 
                                    type="number" 
                                    id="velocity-override" 
                                    name="velocityOverride"
                                    class="form-input"
                                    min="0"
                                    step="0.1"
                                    value="${forecastConfig.velocityOverride || ""}"
                                    placeholder="Auto-calculated"
                                />
                                <small class="form-hint">Leave blank to use historical velocity average</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="parallel-work-factor" class="form-label">
                                    Parallel Work Factor
                                    <span class="form-help" title="Multiplier for parallel work capacity (1.0 = serial, >1.0 = parallel)">
                                        <span class="codicon codicon-question"></span>
                                    </span>
                                </label>
                                <input 
                                    type="number" 
                                    id="parallel-work-factor" 
                                    name="parallelWorkFactor"
                                    class="form-input"
                                    min="0.5"
                                    max="5"
                                    step="0.1"
                                    value="${forecastConfig.parallelWorkFactor || 1.0}"
                                />
                                <small class="form-hint">1.0 = serial work, 2.0 = 2 developers working in parallel</small>
                            </div>
                        </div>
                        
                        <!-- Holidays -->
                        <div class="config-section">
                            <h4 class="config-section-title">
                                <span class="codicon codicon-calendar"></span>
                                Holidays & Non-Working Days
                            </h4>
                            
                            <div class="form-group">
                                <label for="holidays-input" class="form-label">
                                    Holiday Dates
                                    <span class="form-help" title="Add dates to exclude from working days">
                                        <span class="codicon codicon-question"></span>
                                    </span>
                                </label>
                                <input 
                                    type="date" 
                                    id="holidays-input" 
                                    class="form-input"
                                />
                                <button type="button" class="form-btn form-btn-secondary" onclick="addHoliday()">
                                    <span class="codicon codicon-add"></span>
                                    Add Holiday
                                </button>
                            </div>
                            
                            <div id="holidays-list" class="holidays-list">
                                ${generateHolidaysList(forecastConfig.holidays || [])}
                            </div>
                            
                            <div class="quick-presets">
                                <label class="form-label">Quick Presets:</label>
                                <button type="button" class="preset-btn" onclick="addUSHolidays2025()">
                                    <span class="codicon codicon-globe"></span>
                                    US Holidays 2025
                                </button>
                                <button type="button" class="preset-btn" onclick="clearAllHolidays()">
                                    <span class="codicon codicon-trash"></span>
                                    Clear All
                                </button>
                            </div>
                        </div>
                        
                        <!-- Advanced Settings -->
                        <div class="config-section">
                            <h4 class="config-section-title">
                                <span class="codicon codicon-beaker"></span>
                                Advanced Settings
                            </h4>
                            
                            <div class="form-group">
                                <label class="form-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        id="use-actual-dates" 
                                        name="useActualDates"
                                        ${forecastConfig.useActualDates ? "checked" : ""}
                                    />
                                    <span>Use actual completion dates for velocity calculation</span>
                                </label>
                                <small class="form-hint">When enabled, uses actualEndDate instead of sprint end date</small>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        id="account-for-blockers" 
                                        name="accountForBlockers"
                                        ${forecastConfig.accountForBlockers !== false ? "checked" : ""}
                                    />
                                    <span>Account for blocked stories in risk assessment</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label for="confidence-level" class="form-label">
                                    Confidence Level
                                </label>
                                <select id="confidence-level" name="confidenceLevel" class="form-select">
                                    <option value="50" ${forecastConfig.confidenceLevel === "50" ? "selected" : ""}>50% (Optimistic)</option>
                                    <option value="75" ${forecastConfig.confidenceLevel === "75" || !forecastConfig.confidenceLevel ? "selected" : ""}>75% (Balanced)</option>
                                    <option value="90" ${forecastConfig.confidenceLevel === "90" ? "selected" : ""}>90% (Conservative)</option>
                                </select>
                                <small class="form-hint">Higher confidence adds buffer for uncertainty</small>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="modal-btn modal-btn-secondary" onclick="resetForecastConfig()">
                                <span class="codicon codicon-discard"></span>
                                Reset to Defaults
                            </button>
                            <button type="button" class="modal-btn modal-btn-secondary" onclick="closeForecastConfigModal()">
                                Cancel
                            </button>
                            <button type="submit" class="modal-btn modal-btn-primary">
                                <span class="codicon codicon-save"></span>
                                Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate holidays list HTML
 * @param {Array} holidays - Array of holiday date strings
 * @returns {string} HTML for holidays list
 */
function generateHolidaysList(holidays) {
    if (!holidays || holidays.length === 0) {
        return '<div class="holidays-empty">No holidays configured</div>';
    }
    
    return holidays.map((date, index) => `
        <div class="holiday-item">
            <span class="holiday-date">${formatHolidayDate(date)}</span>
            <button type="button" class="holiday-remove-btn" onclick="removeHoliday(${index})" title="Remove holiday">
                <span class="codicon codicon-trash"></span>
            </button>
        </div>
    `).join("");
}

/**
 * Format holiday date for display
 * @param {string} date - Date string
 * @returns {string} Formatted date
 */
function formatHolidayDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return date;
    }
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Generate working hours table rows
 * @param {Array} workingHours - Array of working hours configuration for each day
 * @returns {string} HTML for table rows
 */
function generateWorkingHoursRows(workingHours) {
    // Ensure we have default working hours
    const defaultWorkingHours = [
        { day: "Monday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
        { day: "Tuesday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
        { day: "Wednesday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
        { day: "Thursday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
        { day: "Friday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
        { day: "Saturday", enabled: false, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
        { day: "Sunday", enabled: false, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 }
    ];
    
    const hours = workingHours && Array.isArray(workingHours) ? workingHours : defaultWorkingHours;
    
    return hours.map((dayConfig, index) => {
        const dayName = dayConfig.day || defaultWorkingHours[index].day;
        const enabled = dayConfig.enabled !== undefined ? dayConfig.enabled : defaultWorkingHours[index].enabled;
        const startTime = dayConfig.startTime || defaultWorkingHours[index].startTime;
        const endTime = dayConfig.endTime || defaultWorkingHours[index].endTime;
        const hoursValue = dayConfig.hours !== undefined ? dayConfig.hours : defaultWorkingHours[index].hours;
        
        return `
            <tr class="working-hours-row ${!enabled ? 'disabled-row' : ''}">
                <td style="text-align: center;">
                    <input 
                        type="checkbox" 
                        class="working-hours-enabled-checkbox"
                        data-day-index="${index}"
                        ${enabled ? 'checked' : ''}
                        onchange="updateWorkingHoursRow(${index})"
                    />
                </td>
                <td>${dayName}</td>
                <td>
                    <input 
                        type="time" 
                        class="working-hours-time-input"
                        data-day-index="${index}"
                        data-time-type="start"
                        value="${convertTo24Hour(startTime)}"
                        ${!enabled ? 'disabled' : ''}
                        onchange="updateWorkingHoursCalculation(${index})"
                    />
                </td>
                <td>
                    <input 
                        type="time" 
                        class="working-hours-time-input"
                        data-day-index="${index}"
                        data-time-type="end"
                        value="${convertTo24Hour(endTime)}"
                        ${!enabled ? 'disabled' : ''}
                        onchange="updateWorkingHoursCalculation(${index})"
                    />
                </td>
                <td class="working-hours-display" data-day-index="${index}">
                    ${hoursValue.toFixed(1)}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Convert 12-hour time format to 24-hour format for HTML time input
 * @param {string} time12h - Time in format "HH:MM AM/PM"
 * @returns {string} Time in format "HH:MM" (24-hour)
 */
function convertTo24Hour(time12h) {
    if (!time12h) {
        return "09:00";
    }
    
    const parts = time12h.trim().toUpperCase().match(/(\d+):(\d+)\s*(AM|PM)/);
    if (!parts) {
        return "09:00";
    }
    
    let hour = parseInt(parts[1]);
    const minute = parts[2];
    const meridiem = parts[3];
    
    if (meridiem === "PM" && hour !== 12) {
        hour += 12;
    } else if (meridiem === "AM" && hour === 12) {
        hour = 0;
    }
    
    return `${String(hour).padStart(2, '0')}:${minute}`;
}
