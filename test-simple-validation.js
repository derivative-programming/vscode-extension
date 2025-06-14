// Simple test for button name validation
console.log("Testing button validation regex:");

const regex = /^[a-zA-Z][a-zA-Z]*$/;

const testNames = [
    "ValidButton",    // Should pass
    "Button123",      // Should fail (has numbers)
    "Test1",          // Should fail (has number)
    "OnlyLetters",    // Should pass
    "123Start",       // Should fail (starts with number)
    "Hyp-hen",        // Should fail (has hyphen)
    "Under_score",    // Should fail (has underscore)
    "Space Name"      // Should fail (has space)
];

testNames.forEach(name => {
    const isValid = regex.test(name);
    console.log(`"${name}": ${isValid ? 'VALID' : 'INVALID'}`);
});
