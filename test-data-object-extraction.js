// Test script for data object extraction from user stories
// Run with: node test-data-object-extraction.js

/**
 * Extracts data object names from a user story text.
 * @param {string} text User story text
 * @returns {string[]} Array of extracted object names
 */
function extractDataObjectsFromUserStory(text) {
    if (!text || typeof text !== "string") { return []; }
    
    const lowerText = text.toLowerCase();
    const dataObjects = [];
    
    // Extract data objects (look for nouns after common patterns)
    const objectPatterns = [
        /(?:view all|view|add|create|update|edit|delete|remove)\s+(?:a\s+|an\s+|the\s+|all\s+)?([a-z]+(?:\s+[a-z]+)*)/g,
        /(?:of|for)\s+(?:a\s+|an\s+|the\s+|all\s+)?([a-z]+(?:\s+[a-z]+)*)/g
    ];
    
    for (const pattern of objectPatterns) {
        let match;
        while ((match = pattern.exec(lowerText)) !== null) {
            const obj = match[1].trim();
            if (obj && !dataObjects.includes(obj)) {
                dataObjects.push(obj);
                // Also add singular/plural variants
                if (obj.endsWith('s')) {
                    const singular = obj.slice(0, -1);
                    if (!dataObjects.includes(singular)) {
                        dataObjects.push(singular);
                    }
                } else {
                    const plural = obj + 's';
                    if (!dataObjects.includes(plural)) {
                        dataObjects.push(plural);
                    }
                }
            }
        }
    }
    
    return dataObjects;
}

/**
 * Converts a spaced name to PascalCase.
 * @param {string} name The spaced name to convert
 * @returns {string} The PascalCase version
 */
function toPascalCase(name) {
    if (!name || typeof name !== "string") { return ""; }
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Converts a PascalCase name to spaced format.
 * @param {string} name The PascalCase name to convert
 * @returns {string} The spaced version
 */
function toSpacedFormat(name) {
    if (!name || typeof name !== "string") { return ""; }
    return name.replace(/([A-Z])/g, ' $1').trim();
}

// Test cases
const testStories = [
    "A Manager wants to view all customers",
    "As a Sales Rep, I want to add a new product",
    "A Admin wants to update the user settings",
    "As a Customer, I want to delete my order",
    "A Developer wants to view all bug reports",
    "As a User, I want to create an invoice item",
    "A Supervisor wants to add all project tasks"
];

console.log("Testing Data Object Extraction from User Stories");
console.log("=" .repeat(60));

testStories.forEach((story, index) => {
    console.log(`\nTest ${index + 1}: "${story}"`);
    const objects = extractDataObjectsFromUserStory(story);
    console.log(`Extracted objects: [${objects.join(', ')}]`);
    
    // Show case conversions for first object if any
    if (objects.length > 0) {
        const firstObj = objects[0];
        console.log(`  - Original: "${firstObj}"`);
        console.log(`  - PascalCase: "${toPascalCase(firstObj)}"`);
        console.log(`  - Spaced Format: "${toSpacedFormat(toPascalCase(firstObj))}"`);
    }
});

console.log("\n" + "=" .repeat(60));
console.log("Data object extraction testing completed!");
