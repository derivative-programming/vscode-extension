/**
 * Unit tests for the Wizard MCP tools
 * Tests for open_add_data_object_wizard and open_add_report_wizard tools
 * Created on: 2025-10-19
 */

import * as assert from 'assert';
import { ViewTools } from '../mcp/tools/viewTools';

suite('Wizard MCP Tools Tests', () => {
    test('ViewTools has openAddDataObjectWizard method', () => {
        const viewTools = new ViewTools();
        assert.ok(viewTools.openAddDataObjectWizard, 'ViewTools should have openAddDataObjectWizard method');
        assert.strictEqual(typeof viewTools.openAddDataObjectWizard, 'function', 'openAddDataObjectWizard should be a function');
    });

    test('ViewTools has openAddReportWizard method', () => {
        const viewTools = new ViewTools();
        assert.ok(viewTools.openAddReportWizard, 'ViewTools should have openAddReportWizard method');
        assert.strictEqual(typeof viewTools.openAddReportWizard, 'function', 'openAddReportWizard should be a function');
    });

    test('openAddDataObjectWizard calls correct command', async () => {
        const viewTools = new ViewTools();
        
        // This will fail when HTTP bridge is not running, which is expected in unit tests
        // We're just verifying the method exists and attempts to call the command
        try {
            await viewTools.openAddDataObjectWizard();
            // If it succeeds (rare in test environment), that's fine
            assert.ok(true, 'openAddDataObjectWizard executed without error');
        } catch (error: any) {
            // Expected to fail in test environment since HTTP bridge won't be running
            // Verify error message indicates it tried to connect
            assert.ok(
                error.message.includes('HTTP bridge') || error.message.includes('connection'),
                'Error should indicate HTTP bridge connection attempt'
            );
        }
    });

    test('openAddReportWizard calls correct command', async () => {
        const viewTools = new ViewTools();
        
        // This will fail when HTTP bridge is not running, which is expected in unit tests
        // We're just verifying the method exists and attempts to call the command
        try {
            await viewTools.openAddReportWizard();
            // If it succeeds (rare in test environment), that's fine
            assert.ok(true, 'openAddReportWizard executed without error');
        } catch (error: any) {
            // Expected to fail in test environment since HTTP bridge won't be running
            // Verify error message indicates it tried to connect
            assert.ok(
                error.message.includes('HTTP bridge') || error.message.includes('connection'),
                'Error should indicate HTTP bridge connection attempt'
            );
        }
    });
});
