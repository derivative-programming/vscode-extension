/**
 * Unit tests for MCP wizard tools
 * Created on: January 19, 2025
 */

import * as assert from 'assert';
import { ViewTools } from '../mcp/tools/viewTools';

suite('MCP Wizard Tools Tests', () => {
    test('ViewTools has openAddDataObjectWizard method', () => {
        const viewTools = new ViewTools();
        
        assert.ok(viewTools.openAddDataObjectWizard, 'ViewTools should have openAddDataObjectWizard method');
        assert.strictEqual(typeof viewTools.openAddDataObjectWizard, 'function', 'openAddDataObjectWizard should be a function');
    });

    test('ViewTools has openAddFormWizard method', () => {
        const viewTools = new ViewTools();
        
        assert.ok(viewTools.openAddFormWizard, 'ViewTools should have openAddFormWizard method');
        assert.strictEqual(typeof viewTools.openAddFormWizard, 'function', 'openAddFormWizard should be a function');
    });

    test('openAddDataObjectWizard returns proper error when bridge unavailable', async () => {
        const viewTools = new ViewTools();
        
        try {
            await viewTools.openAddDataObjectWizard();
            assert.fail('Should throw error when bridge is not available');
        } catch (error) {
            assert.ok(error instanceof Error, 'Should throw an Error');
            assert.ok(error.message.includes('HTTP bridge connection failed') || 
                     error.message.includes('extension running'), 
                     'Error should mention bridge or extension');
        }
    });

    test('openAddFormWizard returns proper error when bridge unavailable', async () => {
        const viewTools = new ViewTools();
        
        try {
            await viewTools.openAddFormWizard();
            assert.fail('Should throw error when bridge is not available');
        } catch (error) {
            assert.ok(error instanceof Error, 'Should throw an Error');
            assert.ok(error.message.includes('HTTP bridge connection failed') || 
                     error.message.includes('extension running'), 
                     'Error should mention bridge or extension');
        }
    });
});
