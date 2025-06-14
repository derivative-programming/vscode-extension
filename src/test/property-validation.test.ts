/**
 * property-validation.test.ts
 * Tests for property name validation logic in the Add Property modal
 * Created: 2025-01-14
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Simulated validatePropertyName function extracted from propertyModalFunctionality.js
 * This simulates the validation logic to test it in isolation
 */
function validatePropertyName(name: string, existingProps: {name: string}[] = []): string | null {
    if (!name) {
        return "Property name cannot be empty";
    }
    if (name.length > 100) {
        return "Property name cannot exceed 100 characters";
    }
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
        return "Property name must start with a letter and contain only letters and numbers";
    }
    if (existingProps.some(p => p.name === name)) {
        return "Property with this name already exists";
    }
    return null; // Valid
}

suite('Property Name Validation Tests', () => {
    console.log('Starting Property Name Validation Test Suite');
    
    test('Valid property names should pass validation', () => {
        assert.strictEqual(validatePropertyName('ValidName'), null);
        assert.strictEqual(validatePropertyName('propertyName'), null);
        assert.strictEqual(validatePropertyName('Property123'), null);
        assert.strictEqual(validatePropertyName('A'), null);
        assert.strictEqual(validatePropertyName('a'), null);
    });

    test('Empty property name should fail validation', () => {
        const result = validatePropertyName('');
        assert.strictEqual(result, "Property name cannot be empty");
    });

    test('Property name exceeding 100 characters should fail validation', () => {
        console.log('Testing 100 character limit validation');
        // Create a string longer than 100 characters
        const longName = 'A' + 'b'.repeat(100); // 101 characters total
        const result = validatePropertyName(longName);
        assert.strictEqual(result, "Property name cannot exceed 100 characters");
        console.log('100 character limit validation test passed');
    });

    test('Property name exactly 100 characters should pass validation', () => {
        console.log('Testing exactly 100 character validation');
        // Create a string exactly 100 characters
        const maxLengthName = 'A' + 'b'.repeat(99); // Exactly 100 characters
        const result = validatePropertyName(maxLengthName);
        assert.strictEqual(result, null);
        console.log('Exactly 100 character validation test passed');
    });

    test('Property name with invalid characters should fail validation', () => {
        assert.strictEqual(validatePropertyName('123Invalid'), "Property name must start with a letter and contain only letters and numbers");
        assert.strictEqual(validatePropertyName('Invalid-Name'), "Property name must start with a letter and contain only letters and numbers");
        assert.strictEqual(validatePropertyName('Invalid Name'), "Property name must start with a letter and contain only letters and numbers");
        assert.strictEqual(validatePropertyName('Invalid@Name'), "Property name must start with a letter and contain only letters and numbers");
    });

    test('Duplicate property name should fail validation', () => {
        const existingProps = [{name: 'ExistingProperty'}];
        const result = validatePropertyName('ExistingProperty', existingProps);
        assert.strictEqual(result, "Property with this name already exists");
    });

    test('Validation order - length check should come before format check', () => {
        // Create invalid format but too long - should fail on length first
        const longInvalidName = '123' + 'b'.repeat(98); // 101 chars, starts with number
        const result = validatePropertyName(longInvalidName);
        assert.strictEqual(result, "Property name cannot exceed 100 characters");
    });
});