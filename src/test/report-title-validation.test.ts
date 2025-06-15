/**
 * report-title-validation.test.ts
 * Tests for report title validation logic in the Add Report Wizard
 * Created: 2025-01-08
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Simulated validateReportTitle function extracted from addReportWizardView.js
 * This simulates the validation logic to test it in isolation
 */
function validateReportTitle(title: string): {isValid: boolean, message: string} {
    // Validate title is not empty
    if (!title) {
        return {
            isValid: false,
            message: "Report title cannot be empty"
        };
    }
    
    // Validate title length does not exceed 100 characters
    if (title.length > 100) {
        return {
            isValid: false,
            message: "Report title cannot exceed 100 characters"
        };
    }
    
    // Title is valid
    return {
        isValid: true,
        message: "Report title is valid"
    };
}

suite('Report Title Validation Tests', () => {
    
    test('Empty report title should fail validation', () => {
        console.log('Testing empty title validation');
        const result = validateReportTitle('');
        assert.strictEqual(result.isValid, false);
        assert.strictEqual(result.message, "Report title cannot be empty");
        console.log('Empty title validation test passed');
    });

    test('Valid report title should pass validation', () => {
        console.log('Testing valid title validation');
        const result = validateReportTitle('Valid Report Title');
        assert.strictEqual(result.isValid, true);
        assert.strictEqual(result.message, "Report title is valid");
        console.log('Valid title validation test passed');
    });

    test('Report title exceeding 100 characters should fail validation', () => {
        console.log('Testing 100 character limit validation');
        // Create a string longer than 100 characters
        const longTitle = 'A'.repeat(101);
        const result = validateReportTitle(longTitle);
        assert.strictEqual(result.isValid, false);
        assert.strictEqual(result.message, "Report title cannot exceed 100 characters");
        console.log('100 character limit validation test passed');
    });

    test('Report title exactly 100 characters should pass validation', () => {
        console.log('Testing exactly 100 character validation');
        // Create a string exactly 100 characters
        const maxLengthTitle = 'A'.repeat(100);
        const result = validateReportTitle(maxLengthTitle);
        assert.strictEqual(result.isValid, true);
        assert.strictEqual(result.message, "Report title is valid");
        console.log('Exactly 100 character validation test passed');
    });

    test('Report title with spaces and special characters should pass validation', () => {
        console.log('Testing title with spaces and special characters');
        // Unlike report names, titles can have spaces and special characters
        const titleWithSpecialChars = 'Report Title with Spaces & Special! Characters';
        const result = validateReportTitle(titleWithSpecialChars);
        assert.strictEqual(result.isValid, true);
        assert.strictEqual(result.message, "Report title is valid");
        console.log('Special characters validation test passed');
    });

    test('Report title with unicode characters should pass validation', () => {
        console.log('Testing title with unicode characters');
        const unicodeTitle = 'Report Título with éñ characters';
        const result = validateReportTitle(unicodeTitle);
        assert.strictEqual(result.isValid, true);
        assert.strictEqual(result.message, "Report title is valid");
        console.log('Unicode characters validation test passed');
    });
});