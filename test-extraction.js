// Test the improved extraction functions

function extractActionFromStory(text) {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract action from: ...wants to [action] [a|an|all]... (case insensitive)
    // Updated to better capture "view all" as a single action
    const re1 = /wants to\s+\[?(view all|view|add|update|delete)\]?(?:\s+(?:a|an|all))/i;
    const match1 = t.match(re1);
    if (match1) { return match1[1].toLowerCase(); }
    
    // Regex to extract action from: ...I want to [action] [a|an|all]... (case insensitive)
    const re2 = /I want to\s+\[?(view all|view|add|update|delete)\]?(?:\s+(?:a|an|all))/i;
    const match2 = t.match(re2);
    if (match2) { return match2[1].toLowerCase(); }
    
    return "";
}

function extractObjectFromStory(text) {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract object from: ...[action] [a|an|all] [object] (case insensitive)
    // Updated to handle phrases like "Org Customers in a Organization" - extract just "Org Customers"
    const re = /(?:view all|view|add|update|delete)\]?\s+(?:a|an|all)\s+\[?([^.!?]+?)(?:\s+in\s+(?:a|an|the)\s+\w+|\s*[\.\!\?]|$)/i;
    const match = t.match(re);
    if (match) { 
        // Clean up the captured object text
        let objectText = match[1].trim();
        // Remove any trailing brackets or quotes
        objectText = objectText.replace(/[\]\)"']*$/, '');
        return objectText; 
    }
    
    return "";
}

// Test cases
const testCases = [
    "As a Admin, I want to view all Org Customers in a Organization",
    "As a Admin, I want to view all Organizations in the application", 
    "As a Admin, I want to view a Customer",
    "As a Admin, I want to view all Customer Email Requests in a Customer",
    "As a User, I want to add a Org Invite",
    "As a Admin, I want to Update a Customer"
];

console.log("Testing extraction functions:");
console.log("============================");

testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: "${testCase}"`);
    console.log(`  Action: "${extractActionFromStory(testCase)}"`);
    console.log(`  Object: "${extractObjectFromStory(testCase)}"`);
});
