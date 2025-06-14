// Test file for button name validation functionality
// Created: 2025-06-14

// Mock the validateButtonName function from clientScriptTemplate.js
// Since this is a template function, we'll extract the logic and test it directly

function validateButtonName(name, currentButtons = []) {
    if (!name) {
        return "Button name cannot be empty";
    }
    if (name.length > 100) {
        return "Button name cannot exceed 100 characters";
    }
    if (!/^[a-zA-Z][a-zA-Z]*$/.test(name)) {
        return "Button name must start with a letter and contain only letters (no numbers)";
    }
    // Check if button with this name already exists
    if (currentButtons.some(button => button.buttonName === name)) {
        return "Button with this name already exists";
    }
    return null; // Valid
}

console.log('Testing button name validation:');
console.log('');

// Test cases
const testCases = [
    { name: '', expected: 'Button name cannot be empty' },
    { name: 'ValidButton', expected: null },
    { name: 'Another123', expected: 'Button name must start with a letter and contain only letters (no numbers)' },
    { name: 'AnotherButton', expected: null },
    { name: 'a'.repeat(100), expected: null }, // exactly 100 characters
    { name: 'a'.repeat(101), expected: 'Button name cannot exceed 100 characters' }, // 101 characters
    { name: 'Very'.repeat(25) + 'Name', expected: 'Button name cannot exceed 100 characters' }, // 104 characters
    { name: '123Invalid', expected: 'Button name must start with a letter and contain only letters (no numbers)' },
    { name: 'Invalid Name', expected: 'Button name must start with a letter and contain only letters (no numbers)' },
    { name: 'Invalid-Name', expected: 'Button name must start with a letter and contain only letters (no numbers)' },
    { name: 'ButtonWith1Number', expected: 'Button name must start with a letter and contain only letters (no numbers)' },
    { name: 'Button2', expected: 'Button name must start with a letter and contain only letters (no numbers)' },
];

// Test unique names
const existingButtons = [{ buttonName: 'ExistingButton' }];
testCases.push(
    { name: 'ExistingButton', buttons: existingButtons, expected: 'Button with this name already exists' },
    { name: 'NewButton', buttons: existingButtons, expected: null }
);

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = validateButtonName(testCase.name, testCase.buttons);
    const success = result === testCase.expected;
    
    console.log(`Test ${index + 1}: "${testCase.name}" (${testCase.name.length} chars)`);
    console.log(`  Expected: ${testCase.expected || 'null'}`);
    console.log(`  Got: ${result || 'null'}`);
    console.log(`  Result: ${success ? 'PASS' : 'FAIL'}`);
    console.log('');
    
    if (success) {
        passed++;
    } else {
        failed++;
    }
});

console.log(`Results: ${passed} passed, ${failed} failed`);

// Specific test for the 100-character limit requirement
console.log('');
console.log('Specific test for 100-character limit:');
const exactly100 = 'a'.repeat(100);
const exactly101 = 'a'.repeat(101);

console.log(`100 chars: "${exactly100.substring(0, 20)}..." -> ${validateButtonName(exactly100) || 'Valid'}`);
console.log(`101 chars: "${exactly101.substring(0, 20)}..." -> ${validateButtonName(exactly101) || 'Valid'}`);