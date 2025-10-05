/**
 * Error Handling Utilities
 * Centralized error handling, logging, and user notifications
 * Last Modified: October 5, 2025
 */

/**
 * Error severity levels
 */
const ErrorSeverity = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical"
};

/**
 * Log an error with context
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or additional context
 * @param {string} severity - Error severity level
 */
function logError(message, error = null, severity = ErrorSeverity.ERROR) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        message,
        severity,
        error: error ? (error.stack || error.toString()) : null,
        userAgent: navigator.userAgent
    };
    
    console.error(`[${timestamp}] ${severity.toUpperCase()}: ${message}`, error);
    
    // Could be extended to send logs to a logging service
    return logEntry;
}

/**
 * Handle render errors gracefully
 * @param {string} componentName - Name of the component that failed
 * @param {Error} error - Error object
 * @param {string} containerId - Container element ID
 * @returns {boolean} True if error was handled
 */
function handleRenderError(componentName, error, containerId) {
    logError(`Failed to render ${componentName}`, error, ErrorSeverity.ERROR);
    
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <span class="codicon codicon-error"></span>
                <h3>Rendering Error</h3>
                <p>Failed to render ${componentName}</p>
                <p class="error-details">${escapeHtml(error.message)}</p>
                <button class="error-retry-btn" onclick="location.reload()">
                    <span class="codicon codicon-refresh"></span>
                    Reload View
                </button>
            </div>
        `;
        return true;
    }
    return false;
}

/**
 * Show error notification to user
 * @param {string} message - Error message to display
 * @param {string} details - Optional error details
 */
function showErrorNotification(message, details = "") {
    if (typeof vscode !== "undefined") {
        vscode.postMessage({
            command: "showError",
            message: message + (details ? ` (${details})` : "")
        });
    } else {
        console.error(message, details);
    }
}

/**
 * Show warning notification to user
 * @param {string} message - Warning message to display
 */
function showWarningNotification(message) {
    if (typeof vscode !== "undefined") {
        vscode.postMessage({
            command: "showWarning",
            message
        });
    } else {
        console.warn(message);
    }
}

/**
 * Show info notification to user
 * @param {string} message - Info message to display
 */
function showInfoNotification(message) {
    if (typeof vscode !== "undefined") {
        vscode.postMessage({
            command: "showInfo",
            message
        });
    } else {
        console.info(message);
    }
}

/**
 * Validate message data structure
 * @param {Object} message - Message to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result with isValid flag and missing fields
 */
function validateMessageData(message, requiredFields = []) {
    const missing = [];
    
    if (!message || typeof message !== "object") {
        return {
            isValid: false,
            missing: ["message object"]
        };
    }
    
    for (const field of requiredFields) {
        if (!(field in message) || message[field] === null || message[field] === undefined) {
            missing.push(field);
        }
    }
    
    return {
        isValid: missing.length === 0,
        missing
    };
}

/**
 * Safely execute a function with error handling
 * @param {Function} fn - Function to execute
 * @param {string} context - Context description for error logging
 * @param {*} defaultValue - Default value to return on error
 * @returns {*} Function result or default value
 */
function safeExecute(fn, context, defaultValue = null) {
    try {
        return fn();
    } catch (error) {
        logError(`Error in ${context}`, error, ErrorSeverity.ERROR);
        return defaultValue;
    }
}

/**
 * Wrap async function with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context description
 * @returns {Function} Wrapped function
 */
function wrapAsync(asyncFn, context) {
    return async function(...args) {
        try {
            return await asyncFn.apply(this, args);
        } catch (error) {
            logError(`Async error in ${context}`, error, ErrorSeverity.ERROR);
            showErrorNotification(`Operation failed: ${context}`, error.message);
            throw error;
        }
    };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                logError(`Retry attempt ${attempt + 1} failed, waiting ${delay}ms`, error, ErrorSeverity.WARNING);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

/**
 * Create error boundary for component rendering
 * @param {Function} renderFn - Render function to wrap
 * @param {string} componentName - Component name for error messages
 * @param {string} containerId - Container element ID
 * @returns {Function} Wrapped render function
 */
function createErrorBoundary(renderFn, componentName, containerId) {
    return function(...args) {
        try {
            return renderFn.apply(this, args);
        } catch (error) {
            handleRenderError(componentName, error, containerId);
        }
    };
}

/**
 * Validate data before processing
 * @param {*} data - Data to validate
 * @param {Function} validator - Validation function that returns {isValid, errors}
 * @param {string} context - Context for error messages
 * @returns {boolean} True if data is valid
 */
function validateData(data, validator, context) {
    try {
        const result = validator(data);
        if (!result.isValid) {
            const errorMsg = `Invalid data in ${context}: ${result.errors.join(", ")}`;
            logError(errorMsg, null, ErrorSeverity.WARNING);
            showWarningNotification(errorMsg);
            return false;
        }
        return true;
    } catch (error) {
        logError(`Validation error in ${context}`, error, ErrorSeverity.ERROR);
        return false;
    }
}

/**
 * Check if error is a network error
 * @param {Error} error - Error to check
 * @returns {boolean} True if network error
 */
function isNetworkError(error) {
    if (!error) {
        return false;
    }
    return error.message.includes("network") ||
           error.message.includes("fetch") ||
           error.message.includes("timeout") ||
           error.name === "NetworkError";
}

/**
 * Check if error is a validation error
 * @param {Error} error - Error to check
 * @returns {boolean} True if validation error
 */
function isValidationError(error) {
    if (!error) {
        return false;
    }
    return error.message.includes("validation") ||
           error.message.includes("invalid") ||
           error.name === "ValidationError";
}

/**
 * Format error for display
 * @param {Error} error - Error to format
 * @returns {string} Formatted error message
 */
function formatErrorMessage(error) {
    if (!error) {
        return "Unknown error occurred";
    }
    
    if (typeof error === "string") {
        return error;
    }
    
    if (error.message) {
        return error.message;
    }
    
    return error.toString();
}

/**
 * Create user-friendly error message
 * @param {Error} error - Error object
 * @param {string} action - Action that was being performed
 * @returns {string} User-friendly message
 */
function getUserFriendlyErrorMessage(error, action) {
    if (isNetworkError(error)) {
        return `Unable to ${action} due to network issues. Please check your connection and try again.`;
    }
    
    if (isValidationError(error)) {
        return `Invalid data: ${formatErrorMessage(error)}`;
    }
    
    return `Failed to ${action}: ${formatErrorMessage(error)}`;
}

/**
 * Collect debugging information
 * @returns {Object} Debug information
 */
function collectDebugInfo() {
    return {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        windowSize: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        documentReady: document.readyState,
        vsCodeApiAvailable: typeof vscode !== "undefined",
        d3Available: typeof d3 !== "undefined"
    };
}

/**
 * Assert condition and throw error if false
 * @param {boolean} condition - Condition to check
 * @param {string} message - Error message if condition is false
 */
function assert(condition, message) {
    if (!condition) {
        const error = new Error(`Assertion failed: ${message}`);
        logError(message, error, ErrorSeverity.CRITICAL);
        throw error;
    }
}

/**
 * Check if element exists in DOM
 * @param {string} elementId - Element ID to check
 * @param {string} context - Context for error message
 * @returns {boolean} True if element exists
 */
function ensureElementExists(elementId, context) {
    const element = document.getElementById(elementId);
    if (!element) {
        logError(`Element not found: ${elementId} in ${context}`, null, ErrorSeverity.ERROR);
        return false;
    }
    return true;
}
