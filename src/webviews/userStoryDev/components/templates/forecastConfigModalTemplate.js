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
                        
                        <!-- Working Schedule -->
                        <div class="config-section">
                            <h4 class="config-section-title">
                                <span class="codicon codicon-calendar"></span>
                                Working Schedule
                            </h4>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="working-hours-per-day" class="form-label">
                                        Working Hours per Day *
                                    </label>
                                    <input 
                                        type="number" 
                                        id="working-hours-per-day" 
                                        name="workingHoursPerDay"
                                        class="form-input"
                                        min="1"
                                        max="24"
                                        step="0.5"
                                        value="${forecastConfig.workingHoursPerDay || 8}"
                                        required
                                    />
                                </div>
                                
                                <div class="form-group">
                                    <label for="working-days-per-week" class="form-label">
                                        Working Days per Week *
                                    </label>
                                    <input 
                                        type="number" 
                                        id="working-days-per-week" 
                                        name="workingDaysPerWeek"
                                        class="form-input"
                                        min="1"
                                        max="7"
                                        step="1"
                                        value="${forecastConfig.workingDaysPerWeek || 5}"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        id="exclude-weekends" 
                                        name="excludeWeekends"
                                        ${forecastConfig.excludeWeekends !== false ? "checked" : ""}
                                    />
                                    <span>Exclude weekends from timeline</span>
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
