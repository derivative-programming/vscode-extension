"use strict";

/**
 * Formats a camelCase or PascalCase label to human-readable form
 * @param {string} label The label to format
 * @returns {string} Formatted label
 */
function formatLabel(label) {
    if (!label) {
        return "";
    }

    // Use regex for a more robust approach to handle various cases including acronyms
    let result = label
        // Insert space before a capital letter followed by a lowercase letter (e.g., AppDna -> App Dna)
        .replace(/([A-Z])([a-z])/g, " $1$2")
        // Insert space before a capital letter that is preceded by a lowercase letter or digit (e.g., appDNA -> app DNA, test1DNA -> test1 DNA)
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        // Insert space before a sequence of capital letters followed by a lowercase letter (handles acronym followed by word, e.g. DNAApp -> DNA App)
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        // Add space between letter and digit: TestA1 -> Test A 1
        .replace(/([A-Za-z])(\d)/g, "$1 $2");

    // Capitalize the first letter and trim whitespace
    result = result.charAt(0).toUpperCase() + result.slice(1).trim();

    return result;
}

module.exports = {
    formatLabel
};
