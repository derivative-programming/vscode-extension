/**
 * add-object-wizard-validation.test.ts
 * Tests for object name validation logic in the Add Object Wizard
 * Created: 2025-01-14
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Simulated validateObjectName function extracted from addObjectWizardView.js
 * This simulates the validation logic to test it in isolation
 */
function validateObjectName(name: string, isLookupObject: boolean, existingObjects: {name: string}[] = []): string | null {
    if (!name) {
        return "Object name cannot be empty";
    }
    if (name.length > 100) {
        return "Object name cannot exceed 100 characters";
    }
    if (name.includes(" ")) {
        return "Object name cannot contain spaces";
    }
    if (!/^[a-zA-Z]+$/.test(name)) {
        return "Object name must contain only letters";
    }
    if (name[0] !== name[0].toUpperCase()) {
        return "Object name must be in pascal case (example... ToDoItem)";
    }
    if (existingObjects.some(obj => obj.name === name)) {
        return "An object with this name already exists";
    }
    // NEW: Validate lookup object name doesn't contain "Lookup"
    if (isLookupObject && name.toLowerCase().includes('lookup')) {
        return "It is not necessary to have Lookup in the name";
    }
    return null; // Valid
}

suite('Add Object Wizard Name Validation Tests', () => {
    console.log('Starting Add Object Wizard Name Validation Test Suite');
    
    test('Valid object names should pass validation for regular objects', () => {
        assert.strictEqual(validateObjectName('ValidName', false), null);
        assert.strictEqual(validateObjectName('MyObject', false), null);
        assert.strictEqual(validateObjectName('TestObject', false), null);
        assert.strictEqual(validateObjectName('A', false), null);
    });

    test('Valid object names should pass validation for lookup objects', () => {
        assert.strictEqual(validateObjectName('ValidName', true), null);
        assert.strictEqual(validateObjectName('MyObject', true), null);
        assert.strictEqual(validateObjectName('TestObject', true), null);
        assert.strictEqual(validateObjectName('Status', true), null);
        assert.strictEqual(validateObjectName('Priority', true), null);
    });

    test('Lookup objects with "Lookup" in name should fail validation (case insensitive)', () => {
        // Test various cases of "lookup" in the name
        assert.strictEqual(validateObjectName('TestLookup', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('LookupTable', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('StatusLookup', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('MyLookupObject', true), "It is not necessary to have Lookup in the name");
        
        // Test case insensitive matching
        assert.strictEqual(validateObjectName('Testlookup', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('TestLOOKUP', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('TestLookUp', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('TESTLOOKUP', true), "It is not necessary to have Lookup in the name");
    });

    test('Regular objects with "Lookup" in name should pass validation', () => {
        // Regular objects (not lookup objects) can have "Lookup" in their name
        assert.strictEqual(validateObjectName('TestLookup', false), null);
        assert.strictEqual(validateObjectName('LookupTable', false), null);
        assert.strictEqual(validateObjectName('StatusLookup', false), null);
        assert.strictEqual(validateObjectName('MyLookupObject', false), null);
    });

    test('Lookup objects with partial "lookup" matches should fail validation', () => {
        // Test partial matches
        assert.strictEqual(validateObjectName('SomeLookupData', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('LookupDetails', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('DataLookupInfo', true), "It is not necessary to have Lookup in the name");
    });

    test('Other validation rules should still work for lookup objects', () => {
        // Empty name
        assert.strictEqual(validateObjectName('', true), "Object name cannot be empty");
        
        // Too long name
        const longName = 'A' + 'b'.repeat(100); // 101 characters
        assert.strictEqual(validateObjectName(longName, true), "Object name cannot exceed 100 characters");
        
        // Contains spaces
        assert.strictEqual(validateObjectName('Test Object', true), "Object name cannot contain spaces");
        
        // Invalid characters
        assert.strictEqual(validateObjectName('Test123', true), "Object name must contain only letters");
        assert.strictEqual(validateObjectName('Test-Object', true), "Object name must contain only letters");
        
        // Not PascalCase
        assert.strictEqual(validateObjectName('testObject', true), "Object name must be in pascal case (example... ToDoItem)");
        
        // Duplicate name
        const existingObjects = [{name: 'ExistingObject'}];
        assert.strictEqual(validateObjectName('ExistingObject', true, existingObjects), "An object with this name already exists");
    });

    test('Other validation rules should still work for regular objects', () => {
        // Empty name
        assert.strictEqual(validateObjectName('', false), "Object name cannot be empty");
        
        // Too long name
        const longName = 'A' + 'b'.repeat(100); // 101 characters
        assert.strictEqual(validateObjectName(longName, false), "Object name cannot exceed 100 characters");
        
        // Contains spaces
        assert.strictEqual(validateObjectName('Test Object', false), "Object name cannot contain spaces");
        
        // Invalid characters
        assert.strictEqual(validateObjectName('Test123', false), "Object name must contain only letters");
        assert.strictEqual(validateObjectName('Test-Object', false), "Object name must contain only letters");
        
        // Not PascalCase
        assert.strictEqual(validateObjectName('testObject', false), "Object name must be in pascal case (example... ToDoItem)");
        
        // Duplicate name
        const existingObjects = [{name: 'ExistingObject'}];
        assert.strictEqual(validateObjectName('ExistingObject', false, existingObjects), "An object with this name already exists");
    });

    test('Validation order - lookup validation should come after other validations', () => {
        // If a lookup object has "lookup" in the name but also has other issues,
        // the other validations should be caught first
        
        // Too long name with lookup - should fail on length first
        const longLookupName = 'A' + 'b'.repeat(90) + 'Lookup'; // > 100 chars
        assert.strictEqual(validateObjectName(longLookupName, true), "Object name cannot exceed 100 characters");
        
        // Invalid format with lookup - should fail on format first
        assert.strictEqual(validateObjectName('test lookup', true), "Object name cannot contain spaces");
        assert.strictEqual(validateObjectName('testLookup', true), "Object name must be in pascal case (example... ToDoItem)");
    });
});