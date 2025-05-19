"use strict";

/**
 * Formats a camelCase or PascalCase label to human-readable form
 * @param {string} label The label to format
 * @returns {string} Formatted label
 */
function formatLabel(label) {
    if (!label) {
        return '';
    }
    
    // Handle specific cases for acronyms that should stay together
    // For example: "DNAApp" → "DNA App", not "D N A App"
    const replacements = [
        { pattern: 'DNA', replacement: 'DNA' },
        { pattern: 'API', replacement: 'API' },
        { pattern: 'URL', replacement: 'URL' },
        { pattern: 'UI', replacement: 'UI' },
        { pattern: 'SQL', replacement: 'SQL' },
        { pattern: 'HTTP', replacement: 'HTTP' },
        { pattern: 'XML', replacement: 'XML' },
        { pattern: 'JSON', replacement: 'JSON' },
        { pattern: 'HTML', replacement: 'HTML' },
        { pattern: 'CSS', replacement: 'CSS' },
        { pattern: 'JS', replacement: 'JS' },
        { pattern: 'UUID', replacement: 'UUID' },
        { pattern: 'ID', replacement: 'ID' }
    ];
    
    // Temporarily replace known acronyms with placeholders
    let tempLabel = label;
    replacements.forEach((item, index) => {
        tempLabel = tempLabel.replace(new RegExp(item.pattern, 'g'), `__PLACEHOLDER_${index}__`);
    });
    
    // Add space before capital letters
    const formattedText = tempLabel
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim(); // Trim any extra spaces
    
    // Restore the acronyms
    let finalText = formattedText;
    replacements.forEach((item, index) => {
        finalText = finalText.replace(new RegExp(`__PLACEHOLDER_${index}__`, 'g'), item.replacement);
    });
    
    return finalText;
}

module.exports = {
    formatLabel
};
