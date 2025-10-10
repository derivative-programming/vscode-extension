// Description: Helper functions for working hours configuration
// Created: October 10, 2025
// Last Modified: October 10, 2025

/**
 * Parse time string (e.g., "09:00 AM") to hour (0-23)
 * @param {string} timeStr - Time string in format "HH:MM AM/PM"
 * @returns {number} Hour in 24-hour format
 */
function parseTimeToHour(timeStr) {
    if (!timeStr) {
        return 9; // Default to 9 AM
    }
    
    const parts = timeStr.trim().toUpperCase().match(/(\d+):(\d+)\s*(AM|PM)/);
    if (!parts) {
        return 9;
    }
    
    let hour = parseInt(parts[1]);
    const minute = parseInt(parts[2]);
    const meridiem = parts[3];
    
    // Convert to 24-hour format
    if (meridiem === "PM" && hour !== 12) {
        hour += 12;
    } else if (meridiem === "AM" && hour === 12) {
        hour = 0;
    }
    
    // Add fraction for minutes
    return hour + (minute / 60);
}

/**
 * Parse time string to get hour and minute separately
 * @param {string} timeStr - Time string in format "HH:MM AM/PM"
 * @returns {Object} Object with hour and minute
 */
function parseTime(timeStr) {
    if (!timeStr) {
        return { hour: 9, minute: 0 }; // Default to 9:00 AM
    }
    
    const parts = timeStr.trim().toUpperCase().match(/(\d+):(\d+)\s*(AM|PM)/);
    if (!parts) {
        return { hour: 9, minute: 0 };
    }
    
    let hour = parseInt(parts[1]);
    const minute = parseInt(parts[2]);
    const meridiem = parts[3];
    
    // Convert to 24-hour format
    if (meridiem === "PM" && hour !== 12) {
        hour += 12;
    } else if (meridiem === "AM" && hour === 12) {
        hour = 0;
    }
    
    return { hour, minute };
}

/**
 * Format hour (0-23) to time string (e.g., "09:00 AM")
 * @param {number} hour - Hour in 24-hour format
 * @param {number} minute - Minute (optional, defaults to 0)
 * @returns {string} Formatted time string
 */
function formatHourToTime(hour, minute = 0) {
    const h = Math.floor(hour);
    const m = minute || Math.floor((hour - h) * 60);
    
    let displayHour = h;
    let meridiem = "AM";
    
    if (h >= 12) {
        meridiem = "PM";
        if (h > 12) {
            displayHour = h - 12;
        }
    }
    if (h === 0) {
        displayHour = 12;
    }
    
    return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`;
}

/**
 * Calculate hours between start and end time
 * @param {string} startTime - Start time string
 * @param {string} endTime - End time string
 * @returns {number} Hours between times
 */
function calculateHoursBetween(startTime, endTime) {
    const start = parseTimeToHour(startTime);
    const end = parseTimeToHour(endTime);
    
    if (end <= start) {
        return 0; // Invalid or overnight (not supported)
    }
    
    return end - start;
}

/**
 * Get working hours configuration for a specific day of week
 * @param {Object} config - Forecast configuration
 * @param {number} dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {Object} Working hours config for the day
 */
function getWorkingHoursForDay(config, dayOfWeek) {
    // If new workingHours array exists, use it
    if (config.workingHours && Array.isArray(config.workingHours)) {
        // Map day of week to array index
        // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        // Our array: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
        let index;
        if (dayOfWeek === 0) {
            index = 6; // Sunday
        } else {
            index = dayOfWeek - 1; // Monday=0, ..., Saturday=5
        }
        
        const dayConfig = config.workingHours[index];
        if (dayConfig) {
            return {
                enabled: dayConfig.enabled,
                startHour: parseTimeToHour(dayConfig.startTime),
                endHour: parseTimeToHour(dayConfig.endTime),
                hours: dayConfig.hours || calculateHoursBetween(dayConfig.startTime, dayConfig.endTime),
                startTime: parseTime(dayConfig.startTime),
                endTime: parseTime(dayConfig.endTime)
            };
        }
    }
    
    // Fallback to legacy configuration
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const enabled = config.excludeWeekends !== false ? !isWeekend : true;
    
    return {
        enabled: enabled,
        startHour: 9,
        endHour: 17,
        hours: 8,
        startTime: { hour: 9, minute: 0 },
        endTime: { hour: 17, minute: 0 }
    };
}

/**
 * Check if a given date/time is within working hours
 * @param {Date} date - Date to check
 * @param {Object} config - Forecast configuration
 * @returns {boolean} True if within working hours
 */
function isWithinWorkingHours(date, config) {
    const dayOfWeek = date.getDay();
    const workingHours = getWorkingHoursForDay(config, dayOfWeek);
    
    if (!workingHours.enabled) {
        return false;
    }
    
    const hour = date.getHours() + (date.getMinutes() / 60);
    return hour >= workingHours.startHour && hour < workingHours.endHour;
}

/**
 * Get next working date/time
 * @param {Date} date - Starting date
 * @param {Object} config - Forecast configuration
 * @returns {Date} Next working date/time
 */
function getNextWorkingDateTime(date, config) {
    const result = new Date(date);
    let iterations = 0;
    const maxIterations = 14; // Prevent infinite loop (2 weeks max)
    
    while (iterations < maxIterations) {
        const dayOfWeek = result.getDay();
        const workingHours = getWorkingHoursForDay(config, dayOfWeek);
        
        if (!workingHours.enabled) {
            // Skip to next day
            result.setDate(result.getDate() + 1);
            result.setHours(0, 0, 0, 0);
            iterations++;
            continue;
        }
        
        const currentHour = result.getHours() + (result.getMinutes() / 60);
        
        // If before working hours, jump to start time
        if (currentHour < workingHours.startHour) {
            result.setHours(workingHours.startTime.hour, workingHours.startTime.minute, 0, 0);
            return result;
        }
        
        // If after working hours, jump to next day's start time
        if (currentHour >= workingHours.endHour) {
            result.setDate(result.getDate() + 1);
            result.setHours(0, 0, 0, 0);
            iterations++;
            continue;
        }
        
        // We're in working hours
        return result;
    }
    
    // Fallback if we couldn't find working hours (all days disabled?)
    return result;
}

/**
 * Calculate total working hours per week based on configuration
 * @param {Object} config - Forecast configuration
 * @returns {number} Total working hours per week
 */
function calculateWeeklyWorkingHours(config) {
    if (config.workingHours && Array.isArray(config.workingHours)) {
        return config.workingHours.reduce((total, day) => {
            return total + (day.enabled ? (day.hours || 0) : 0);
        }, 0);
    }
    
    // Fallback to legacy calculation
    const daysPerWeek = config.excludeWeekends !== false ? 5 : 7;
    const hoursPerDay = config.workingHoursPerDay || 8;
    return daysPerWeek * hoursPerDay;
}

/**
 * Calculate average working hours per day based on enabled days
 * @param {Object} config - Forecast configuration
 * @returns {number} Average working hours per day
 */
function calculateAverageWorkingHoursPerDay(config) {
    if (config.workingHours && Array.isArray(config.workingHours)) {
        const enabledDays = config.workingHours.filter(day => day.enabled);
        if (enabledDays.length === 0) {
            return 8; // Fallback
        }
        
        const totalHours = enabledDays.reduce((sum, day) => sum + (day.hours || 0), 0);
        return totalHours / enabledDays.length;
    }
    
    // Fallback
    return config.workingHoursPerDay || 8;
}

/**
 * Validate that end time is after start time
 * @param {string} startTime - Start time string (HH:MM AM/PM)
 * @param {string} endTime - End time string (HH:MM AM/PM)
 * @returns {boolean} True if valid (end > start)
 */
function isValidTimeRange(startTime, endTime) {
    const startHour = parseTimeToHour(startTime);
    const endHour = parseTimeToHour(endTime);
    return endHour > startHour;
}

/**
 * Get validation message for time range
 * @param {string} startTime - Start time string
 * @param {string} endTime - End time string
 * @returns {string} Validation message or empty string if valid
 */
function getTimeRangeValidationMessage(startTime, endTime) {
    const startHour = parseTimeToHour(startTime);
    const endHour = parseTimeToHour(endTime);
    const hours = endHour - startHour;
    
    if (hours <= 0) {
        return "End time must be after start time";
    }
    
    if (hours > 24) {
        return "Time range cannot exceed 24 hours";
    }
    
    if (hours > 16) {
        return `Warning: ${hours.toFixed(1)} hours is unusually long`;
    }
    
    return ""; // Valid
}
