/**
 * User Story Dev Data Helper Utilities
 * Common data transformation, validation, and calculation functions
 * Last Modified: October 5, 2025
 */

/**
 * Safely parse story points value
 * @param {string|number} value - Story points value
 * @returns {number} Parsed integer or 0 if invalid
 */
function parseStoryPoints(value) {
    if (value === null || value === undefined || value === "" || value === "?") {
        return 0;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate total story points for an array of items
 * @param {Array} items - Array of story items
 * @returns {number} Total story points
 */
function calculateTotalPoints(items) {
    if (!Array.isArray(items)) {
        return 0;
    }
    return items.reduce((sum, item) => sum + parseStoryPoints(item.storyPoints), 0);
}

/**
 * Get stories filtered by status
 * @param {Array} items - All story items
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered stories
 */
function getStoriesByStatus(items, status) {
    if (!Array.isArray(items)) {
        return [];
    }
    return items.filter(item => item.status === status);
}

/**
 * Get stories filtered by priority
 * @param {Array} items - All story items
 * @param {string} priority - Priority to filter by
 * @returns {Array} Filtered stories
 */
function getStoriesByPriority(items, priority) {
    if (!Array.isArray(items)) {
        return [];
    }
    return items.filter(item => item.priority === priority);
}

/**
 * Get stories assigned to a specific sprint
 * @param {Array} items - All story items
 * @param {string} sprintId - Sprint ID to filter by
 * @returns {Array} Stories in the sprint
 */
function getStoriesBySprint(items, sprintId) {
    if (!Array.isArray(items)) {
        return [];
    }
    return items.filter(item => item.assignedSprint === sprintId);
}

/**
 * Get stories assigned to a specific developer
 * @param {Array} items - All story items
 * @param {string} developer - Developer name
 * @returns {Array} Stories assigned to developer
 */
function getStoriesByDeveloper(items, developer) {
    if (!Array.isArray(items)) {
        return [];
    }
    return items.filter(item => item.developer === developer);
}

/**
 * Calculate completion percentage
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {number} Percentage (0-100)
 */
function calculateCompletionPercentage(completed, total) {
    if (total === 0) {
        return 0;
    }
    return Math.round((completed / total) * 100);
}

/**
 * Format date as short string (MMM DD, YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateShort(date) {
    if (!date) {
        return "N/A";
    }
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        return "Invalid Date";
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Format date as long string (Month DD, YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateLong(date) {
    if (!date) {
        return "N/A";
    }
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        return "Invalid Date";
    }
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Calculate days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days
 */
function calculateDaysBetween(startDate, endDate) {
    const start = typeof startDate === "string" ? new Date(startDate) : startDate;
    const end = typeof endDate === "string" ? new Date(endDate) : endDate;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
    }
    
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is valid
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid date
 */
function isValidDate(date) {
    if (!date) {
        return false;
    }
    const d = typeof date === "string" ? new Date(date) : date;
    return !isNaN(d.getTime());
}

/**
 * Get unique values from array of objects by key
 * @param {Array} items - Array of objects
 * @param {string} key - Key to extract
 * @returns {Array} Array of unique values
 */
function getUniqueValues(items, key) {
    if (!Array.isArray(items)) {
        return [];
    }
    const values = items.map(item => item[key]).filter(Boolean);
    return [...new Set(values)].sort();
}

/**
 * Safely get nested property value
 * @param {Object} obj - Object to query
 * @param {string} path - Dot-notation path (e.g., "config.sprint.capacity")
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} Property value or default
 */
function getNestedProperty(obj, path, defaultValue = null) {
    if (!obj || !path) {
        return defaultValue;
    }
    
    const keys = path.split(".");
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined || !(key in current)) {
            return defaultValue;
        }
        current = current[key];
    }
    
    return current;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix for truncated text (default "...")
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength, suffix = "...") {
    if (!text || text.length <= maxLength) {
        return text || "";
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) {
        return "";
    }
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize story number (remove # prefix if present)
 * @param {string} storyNumber - Story number to sanitize
 * @returns {string} Sanitized story number
 */
function sanitizeStoryNumber(storyNumber) {
    if (!storyNumber) {
        return "";
    }
    return storyNumber.toString().replace(/^#/, "");
}

/**
 * Generate unique ID with prefix
 * @param {string} prefix - Prefix for ID
 * @returns {string} Unique ID
 */
function generateUniqueId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sort items by priority (Critical > High > Medium > Low)
 * @param {Array} items - Items to sort
 * @returns {Array} Sorted items
 */
function sortByPriority(items) {
    if (!Array.isArray(items)) {
        return [];
    }
    
    const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
    
    return items.slice().sort((a, b) => {
        const aPriority = priorityOrder[a.priority] ?? 4;
        const bPriority = priorityOrder[b.priority] ?? 4;
        return aPriority - bPriority;
    });
}

/**
 * Sort items by status (order: To Do, In Progress, In Review, Done, Blocked)
 * @param {Array} items - Items to sort
 * @returns {Array} Sorted items
 */
function sortByStatus(items) {
    if (!Array.isArray(items)) {
        return [];
    }
    
    const statusOrder = {
        "To Do": 0,
        "In Progress": 1,
        "In Review": 2,
        "Done": 3,
        "Blocked": 4
    };
    
    return items.slice().sort((a, b) => {
        const aStatus = statusOrder[a.status] ?? 5;
        const bStatus = statusOrder[b.status] ?? 5;
        return aStatus - bStatus;
    });
}

/**
 * Group items by a specified field
 * @param {Array} items - Items to group
 * @param {string} field - Field to group by
 * @returns {Object} Object with grouped items
 */
function groupItemsBy(items, field) {
    if (!Array.isArray(items)) {
        return {};
    }
    
    return items.reduce((groups, item) => {
        const key = item[field] || "Unspecified";
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Calculate average of numeric array
 * @param {Array} values - Array of numbers
 * @returns {number} Average value
 */
function calculateAverage(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return 0;
    }
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
}

/**
 * Calculate median of numeric array
 * @param {Array} values - Array of numbers
 * @returns {number} Median value
 */
function calculateMedian(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return 0;
    }
    
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
        return "0";
    }
    return num.toLocaleString("en-US");
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    if (!email) {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get status color class
 * @param {string} status - Story status
 * @returns {string} CSS class name for status color
 */
function getStatusColorClass(status) {
    const colorMap = {
        "To Do": "status-todo",
        "In Progress": "status-in-progress",
        "In Review": "status-in-review",
        "Done": "status-done",
        "Blocked": "status-blocked"
    };
    return colorMap[status] || "status-default";
}

/**
 * Get priority color class
 * @param {string} priority - Story priority
 * @returns {string} CSS class name for priority color
 */
function getPriorityColorClass(priority) {
    const colorMap = {
        "Critical": "priority-critical",
        "High": "priority-high",
        "Medium": "priority-medium",
        "Low": "priority-low"
    };
    return colorMap[priority] || "priority-default";
}
