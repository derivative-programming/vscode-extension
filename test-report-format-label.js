// Test file to verify the formatLabel function fixes the reported issues
// Created: 2025-06-08

const { formatLabel } = require('./src/webviews/reports/helpers/reportDataHelper.js');

console.log('Testing formatLabel function with problematic examples:');
console.log('');

// Test cases based on the user's examples
const testCases = [
    'isFKList',        // Should be "Is FK List", not "Is F K List" 
    'sqlServerDBDataType',  // Should be "Sql Server DB Data Type", not "Sql Server D B Data Type"
    'isAPIReady',      // Should be "Is API Ready"
    'appDNATest',      // Should be "App DNA Test"
    'userIDField',     // Should be "User ID Field"
    'httpURLPath',     // Should be "Http URL Path"
    'jsonDataObject',  // Should be "Json Data Object"
];

testCases.forEach(testCase => {
    const result = formatLabel(testCase);
    console.log(`"${testCase}" → "${result}"`);
});

console.log('');
console.log('Expected results:');
console.log('"isFKList" → "Is FK List"');
console.log('"sqlServerDBDataType" → "Sql Server DB Data Type"');
