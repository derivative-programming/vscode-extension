/**
 * Configuration Validation and Loading Utilities
 * Validates and normalizes configuration data for the dev view
 * Last Modified: October 5, 2025
 */

/**
 * Get default dev configuration
 * @returns {Object} Default configuration object
 */
function getDefaultDevConfig() {
    return {
        sprints: [],
        forecastConfig: getDefaultForecastConfig(),
        viewPreferences: {
            defaultTab: "details",
            tableColumnsVisible: {
                storyNumber: true,
                priority: true,
                story: true,
                acceptanceCriteria: true,
                storyPoints: true,
                status: true,
                developer: true,
                startDate: true,
                targetDate: true,
                actualEndDate: true,
                notes: true,
                assignedSprint: true,
                tags: true
            },
            chartPreferences: {
                defaultChartType: "bar"
            }
        }
    };
}

/**
 * Get default forecast configuration
 * @returns {Object} Default forecast configuration
 */
function getDefaultForecastConfig() {
    return {
        hoursPerPoint: 4,
        defaultDeveloperRate: 60,
        workingHoursPerDay: 8, // Legacy field, kept for backward compatibility
        workingDaysPerWeek: 5, // Legacy field, kept for backward compatibility
        excludeWeekends: true, // Legacy field, kept for backward compatibility
        excludeNonWorkingHours: true,
        workingHours: [
            { day: "Monday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
            { day: "Tuesday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
            { day: "Wednesday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
            { day: "Thursday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
            { day: "Friday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
            { day: "Saturday", enabled: false, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
            { day: "Sunday", enabled: false, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 }
        ],
        holidays: [],
        velocityOverride: null,
        parallelWorkFactor: 1.0,
        useActualDates: false,
        accountForBlockers: true,
        confidenceLevel: "75"
    };
}

/**
 * Validate dev configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateDevConfig(config) {
    const errors = [];
    
    if (!config || typeof config !== "object") {
        return {
            isValid: false,
            errors: ["Configuration must be an object"]
        };
    }
    
    // Validate sprints array
    if (config.sprints !== undefined) {
        if (!Array.isArray(config.sprints)) {
            errors.push("sprints must be an array");
        } else {
            config.sprints.forEach((sprint, index) => {
                const sprintErrors = validateSprint(sprint);
                if (sprintErrors.length > 0) {
                    errors.push(`Sprint ${index}: ${sprintErrors.join(", ")}`);
                }
            });
        }
    }
    
    // Validate forecast config
    if (config.forecastConfig !== undefined) {
        const forecastErrors = validateForecastConfig(config.forecastConfig);
        errors.push(...forecastErrors);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate a sprint object
 * @param {Object} sprint - Sprint to validate
 * @returns {Array} Array of error messages
 */
function validateSprint(sprint) {
    const errors = [];
    
    if (!sprint || typeof sprint !== "object") {
        return ["Sprint must be an object"];
    }
    
    // Required fields
    if (!sprint.sprintId) {
        errors.push("sprintId is required");
    }
    if (!sprint.sprintName) {
        errors.push("sprintName is required");
    }
    if (!sprint.startDate) {
        errors.push("startDate is required");
    } else if (!isValidDate(sprint.startDate)) {
        errors.push("startDate must be a valid date");
    }
    if (!sprint.endDate) {
        errors.push("endDate is required");
    } else if (!isValidDate(sprint.endDate)) {
        errors.push("endDate must be a valid date");
    }
    
    // Validate date order
    if (sprint.startDate && sprint.endDate) {
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        if (end <= start) {
            errors.push("endDate must be after startDate");
        }
    }
    
    // Validate status
    const validStatuses = ["planned", "active", "completed"];
    if (sprint.status && !validStatuses.includes(sprint.status)) {
        errors.push(`status must be one of: ${validStatuses.join(", ")}`);
    }
    
    // Validate capacity
    if (sprint.capacity !== undefined && sprint.capacity !== null) {
        const capacity = parseInt(sprint.capacity);
        if (isNaN(capacity) || capacity < 0) {
            errors.push("capacity must be a positive number");
        }
    }
    
    return errors;
}

/**
 * Validate forecast configuration
 * @param {Object} forecastConfig - Forecast config to validate
 * @returns {Array} Array of error messages
 */
function validateForecastConfig(forecastConfig) {
    const errors = [];
    
    if (!forecastConfig || typeof forecastConfig !== "object") {
        return ["Forecast configuration must be an object"];
    }
    
    // Validate hoursPerPoint
    if (forecastConfig.hoursPerPoint !== undefined) {
        const hours = parseFloat(forecastConfig.hoursPerPoint);
        if (isNaN(hours) || hours < 0.5 || hours > 40) {
            errors.push("hoursPerPoint must be between 0.5 and 40");
        }
    }
    
    // Validate workingHoursPerDay
    if (forecastConfig.workingHoursPerDay !== undefined) {
        const hours = parseFloat(forecastConfig.workingHoursPerDay);
        if (isNaN(hours) || hours < 1 || hours > 24) {
            errors.push("workingHoursPerDay must be between 1 and 24");
        }
    }
    
    // Validate workingDaysPerWeek
    if (forecastConfig.workingDaysPerWeek !== undefined) {
        const days = parseInt(forecastConfig.workingDaysPerWeek);
        if (isNaN(days) || days < 1 || days > 7) {
            errors.push("workingDaysPerWeek must be between 1 and 7");
        }
    }
    
    // Validate holidays
    if (forecastConfig.holidays !== undefined) {
        if (!Array.isArray(forecastConfig.holidays)) {
            errors.push("holidays must be an array");
        } else {
            forecastConfig.holidays.forEach((holiday, index) => {
                if (!isValidDate(holiday)) {
                    errors.push(`Holiday at index ${index} is not a valid date`);
                }
            });
        }
    }
    
    // Validate velocityOverride
    if (forecastConfig.velocityOverride !== null && forecastConfig.velocityOverride !== undefined) {
        const velocity = parseFloat(forecastConfig.velocityOverride);
        if (isNaN(velocity) || velocity < 0) {
            errors.push("velocityOverride must be a positive number or null");
        }
    }
    
    // Validate parallelWorkFactor
    if (forecastConfig.parallelWorkFactor !== undefined) {
        const factor = parseFloat(forecastConfig.parallelWorkFactor);
        if (isNaN(factor) || factor < 0.5 || factor > 5) {
            errors.push("parallelWorkFactor must be between 0.5 and 5");
        }
    }
    
    // Validate confidenceLevel
    if (forecastConfig.confidenceLevel !== undefined) {
        const validLevels = ["50", "75", "90"];
        if (!validLevels.includes(forecastConfig.confidenceLevel.toString())) {
            errors.push(`confidenceLevel must be one of: ${validLevels.join(", ")}`);
        }
    }
    
    return errors;
}

/**
 * Normalize configuration by filling in missing values with defaults
 * @param {Object} config - Configuration to normalize
 * @returns {Object} Normalized configuration
 */
function normalizeDevConfig(config) {
    const defaultConfig = getDefaultDevConfig();
    
    if (!config || typeof config !== "object") {
        return defaultConfig;
    }
    
    return {
        sprints: Array.isArray(config.sprints) ? config.sprints : defaultConfig.sprints,
        forecastConfig: normalizeForecastConfig(config.forecastConfig),
        viewPreferences: {
            ...defaultConfig.viewPreferences,
            ...(config.viewPreferences || {}),
            tableColumnsVisible: {
                ...defaultConfig.viewPreferences.tableColumnsVisible,
                ...(config.viewPreferences?.tableColumnsVisible || {})
            },
            chartPreferences: {
                ...defaultConfig.viewPreferences.chartPreferences,
                ...(config.viewPreferences?.chartPreferences || {})
            }
        }
    };
}

/**
 * Normalize forecast configuration
 * @param {Object} forecastConfig - Forecast config to normalize
 * @returns {Object} Normalized forecast config
 */
function normalizeForecastConfig(forecastConfig) {
    const defaultConfig = getDefaultForecastConfig();
    
    if (!forecastConfig || typeof forecastConfig !== "object") {
        return defaultConfig;
    }
    
    return {
        hoursPerPoint: parseFloat(forecastConfig.hoursPerPoint) || defaultConfig.hoursPerPoint,
        workingHoursPerDay: parseFloat(forecastConfig.workingHoursPerDay) || defaultConfig.workingHoursPerDay,
        workingDaysPerWeek: parseInt(forecastConfig.workingDaysPerWeek) || defaultConfig.workingDaysPerWeek,
        excludeWeekends: forecastConfig.excludeWeekends !== undefined ? forecastConfig.excludeWeekends : defaultConfig.excludeWeekends,
        holidays: Array.isArray(forecastConfig.holidays) ? forecastConfig.holidays : defaultConfig.holidays,
        velocityOverride: forecastConfig.velocityOverride || defaultConfig.velocityOverride,
        parallelWorkFactor: parseFloat(forecastConfig.parallelWorkFactor) || defaultConfig.parallelWorkFactor,
        useActualDates: forecastConfig.useActualDates !== undefined ? forecastConfig.useActualDates : defaultConfig.useActualDates,
        accountForBlockers: forecastConfig.accountForBlockers !== undefined ? forecastConfig.accountForBlockers : defaultConfig.accountForBlockers,
        confidenceLevel: forecastConfig.confidenceLevel || defaultConfig.confidenceLevel
    };
}

/**
 * Migrate configuration from older versions
 * @param {Object} config - Configuration to migrate
 * @param {string} fromVersion - Version to migrate from
 * @returns {Object} Migrated configuration
 */
function migrateDevConfig(config, fromVersion) {
    // Currently no migrations needed, but structure in place for future
    // Example: if (fromVersion === "1.0") { ... }
    return config;
}

/**
 * Validate user story data item
 * @param {Object} item - Story item to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateStoryItem(item) {
    const errors = [];
    
    if (!item || typeof item !== "object") {
        return {
            isValid: false,
            errors: ["Story item must be an object"]
        };
    }
    
    // Check required fields
    if (!item.storyNumber) {
        errors.push("storyNumber is required");
    }
    if (!item.story || item.story.trim() === "") {
        errors.push("story text is required");
    }
    
    // Validate priority
    const validPriorities = ["Critical", "High", "Medium", "Low"];
    if (item.priority && !validPriorities.includes(item.priority)) {
        errors.push(`priority must be one of: ${validPriorities.join(", ")}`);
    }
    
    // Validate status
    const validStatuses = ["To Do", "In Progress", "In Review", "Done", "Blocked"];
    if (item.status && !validStatuses.includes(item.status)) {
        errors.push(`status must be one of: ${validStatuses.join(", ")}`);
    }
    
    // Validate story points
    if (item.storyPoints && item.storyPoints !== "?") {
        const points = parseInt(item.storyPoints);
        if (isNaN(points) || points < 0) {
            errors.push("storyPoints must be a positive number or '?'");
        }
    }
    
    // Validate dates
    if (item.startDate && !isValidDate(item.startDate)) {
        errors.push("startDate must be a valid date");
    }
    if (item.targetDate && !isValidDate(item.targetDate)) {
        errors.push("targetDate must be a valid date");
    }
    if (item.actualEndDate && !isValidDate(item.actualEndDate)) {
        errors.push("actualEndDate must be a valid date");
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize and normalize a story item
 * @param {Object} item - Story item to sanitize
 * @returns {Object} Sanitized story item
 */
function sanitizeStoryItem(item) {
    if (!item || typeof item !== "object") {
        return null;
    }
    
    return {
        storyNumber: sanitizeStoryNumber(item.storyNumber) || "",
        priority: item.priority || "Medium",
        story: (item.story || "").trim(),
        acceptanceCriteria: (item.acceptanceCriteria || "").trim(),
        storyPoints: item.storyPoints || "?",
        status: item.status || "To Do",
        developer: (item.developer || "").trim(),
        startDate: item.startDate || "",
        targetDate: item.targetDate || "",
        actualEndDate: item.actualEndDate || "",
        notes: (item.notes || "").trim(),
        assignedSprint: item.assignedSprint || "",
        tags: item.tags || ""
    };
}

/**
 * Check if configuration needs migration
 * @param {Object} config - Configuration to check
 * @returns {boolean} True if migration needed
 */
function configNeedsMigration(config) {
    // Check for missing required fields
    if (!config) {
        return true;
    }
    if (!config.forecastConfig) {
        return true;
    }
    if (!config.viewPreferences) {
        return true;
    }
    return false;
}
