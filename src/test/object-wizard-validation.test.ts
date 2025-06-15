/**
 * object-wizard-validation.test.ts
 * Tests for object name validation logic in the Add Object Wizard
 * Created: 2025-01-14
 */

import * as assert from 'assert';

/**
 * Simulated validation function extracted from addObjectWizardView.js
 * This simulates the validation logic to test it in isolation
 */
function validateObjectName(objectName: string, isLookupObject: boolean, existingObjects: {name: string}[] = []): string | null {
    // Validate name is not empty
    if (!objectName) {
        return "Object name cannot be empty";
    }
    
    // Validate name length does not exceed 100 characters
    if (objectName.length > 100) {
        return "Object name cannot exceed 100 characters";
    }
    
    // Validate name has no spaces
    if (objectName.includes(" ")) {
        return "Object name cannot contain spaces";
    }
    
    // Validate name is alpha only
    if (!/^[a-zA-Z]+$/.test(objectName)) {
        return "Object name must contain only letters";
    }
    
    // Validate name follows PascalCase
    if (objectName[0] !== objectName[0].toUpperCase()) {
        return "Object name must be in pascal case (example... ToDoItem)";
    }
    
    // Validate lookup object naming convention
    if (isLookupObject && objectName.toLowerCase().includes('lookup')) {
        return "It is not necessary to have Lookup in the name";
    }
    
    // Validate name is unique
    if (existingObjects.some(obj => obj.name === objectName)) {
        return "An object with this name already exists";
    }
    
    return null; // Valid
}

suite('Object Wizard Name Validation Tests', () => {
    console.log('Starting Object Wizard Name Validation Test Suite');
    
    test('Valid non-lookup object names should pass validation', () => {
        assert.strictEqual(validateObjectName('ValidName', false), null);
        assert.strictEqual(validateObjectName('Customer', false), null);
        assert.strictEqual(validateObjectName('OrderItem', false), null);
    });

    test('Valid lookup object names should pass validation', () => {
        assert.strictEqual(validateObjectName('Status', true), null);
        assert.strictEqual(validateObjectName('Priority', true), null);
        assert.strictEqual(validateObjectName('Category', true), null);
    });

    test('Lookup objects with "Lookup" in name should fail validation', () => {
        assert.strictEqual(validateObjectName('StatusLookup', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('LookupStatus', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('PriorityLookup', true), "It is not necessary to have Lookup in the name");
    });

    test('Lookup validation should be case-insensitive', () => {
        assert.strictEqual(validateObjectName('StatusLOOKUP', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('LOOKUPStatus', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('StatuslookUp', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('lookupStatus', true), "It is not necessary to have Lookup in the name");
    });

    test('Non-lookup objects with "Lookup" in name should pass validation', () => {
        // This is important - only lookup objects should be restricted
        assert.strictEqual(validateObjectName('StatusLookup', false), null);
        assert.strictEqual(validateObjectName('LookupHelper', false), null);
        assert.strictEqual(validateObjectName('LookupService', false), null);
    });

    test('Lookup validation should work with "Lookup" in middle of name', () => {
        assert.strictEqual(validateObjectName('StatusLookupHelper', true), "It is not necessary to have Lookup in the name");
        assert.strictEqual(validateObjectName('MyLookupObject', true), "It is not necessary to have Lookup in the name");
    });

    test('Other validations should still work for lookup objects', () => {
        // Empty name
        assert.strictEqual(validateObjectName('', true), "Object name cannot be empty");
        
        // Too long
        const longName = 'a'.repeat(101);
        assert.strictEqual(validateObjectName(longName, true), "Object name cannot exceed 100 characters");
        
        // Contains spaces
        assert.strictEqual(validateObjectName('Status Item', true), "Object name cannot contain spaces");
        
        // Not alpha only
        assert.strictEqual(validateObjectName('Status123', true), "Object name must contain only letters");
        
        // Not PascalCase
        assert.strictEqual(validateObjectName('statusItem', true), "Object name must be in pascal case (example... ToDoItem)");
        
        // Duplicate name
        const existingObjects = [{name: 'ExistingStatus'}];
        assert.strictEqual(validateObjectName('ExistingStatus', true, existingObjects), "An object with this name already exists");
    });

    test('Validation order - lookup check should come after format checks', () => {
        // If both PascalCase and lookup violations exist, PascalCase should be caught first
        assert.strictEqual(validateObjectName('statusLookup', true), "Object name must be in pascal case (example... ToDoItem)");
        
        // If both spaces and lookup violations exist, spaces should be caught first
        assert.strictEqual(validateObjectName('Status Lookup', true), "Object name cannot contain spaces");
    });
});