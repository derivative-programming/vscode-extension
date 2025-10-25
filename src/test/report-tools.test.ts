/**
 * Unit tests for the Report MCP tools
 * Tests for report tools methods
 * Created on: 2025-10-25
 */

import * as assert from 'assert';
import { ReportTools } from '../mcp/tools/reportTools';

suite('Report MCP Tools Tests', () => {
    test('ReportTools has get_report_schema method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.get_report_schema, 'ReportTools should have get_report_schema method');
        assert.strictEqual(typeof reportTools.get_report_schema, 'function', 'get_report_schema should be a function');
    });

    test('ReportTools has get_report method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.get_report, 'ReportTools should have get_report method');
        assert.strictEqual(typeof reportTools.get_report, 'function', 'get_report should be a function');
    });

    test('ReportTools has suggest_report_name_and_title method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.suggest_report_name_and_title, 'ReportTools should have suggest_report_name_and_title method');
        assert.strictEqual(typeof reportTools.suggest_report_name_and_title, 'function', 'suggest_report_name_and_title should be a function');
    });

    test('ReportTools has create_report method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.create_report, 'ReportTools should have create_report method');
        assert.strictEqual(typeof reportTools.create_report, 'function', 'create_report should be a function');
    });

    test('ReportTools has update_report method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.update_report, 'ReportTools should have update_report method');
        assert.strictEqual(typeof reportTools.update_report, 'function', 'update_report should be a function');
    });

    test('ReportTools has add_report_param method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.add_report_param, 'ReportTools should have add_report_param method');
        assert.strictEqual(typeof reportTools.add_report_param, 'function', 'add_report_param should be a function');
    });

    test('ReportTools has add_report_column method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.add_report_column, 'ReportTools should have add_report_column method');
        assert.strictEqual(typeof reportTools.add_report_column, 'function', 'add_report_column should be a function');
    });

    test('ReportTools has add_report_button method', () => {
        const reportTools = new ReportTools(null);
        assert.ok(reportTools.add_report_button, 'ReportTools should have add_report_button method');
        assert.strictEqual(typeof reportTools.add_report_button, 'function', 'add_report_button should be a function');
    });

    test('get_report_schema returns expected structure', async () => {
        const reportTools = new ReportTools(null);
        const result = await reportTools.get_report_schema();
        
        assert.ok(result, 'get_report_schema should return a result');
        assert.strictEqual(result.success, true, 'Result should be successful');
        assert.ok(result.schema, 'Result should contain schema');
        assert.strictEqual(result.schema.objectType, 'report', 'Schema should be for report objects');
        assert.ok(result.schema.properties, 'Schema should contain properties');
        assert.ok(result.schema.properties.name, 'Schema should have name property');
        assert.ok(result.schema.properties.titleText, 'Schema should have titleText property');
        assert.ok(result.schema.properties.visualizationType, 'Schema should have visualizationType property');
    });

    test('get_report validates required parameters', async () => {
        const reportTools = new ReportTools(null);
        
        // Test without report_name
        const result = await reportTools.get_report({});
        
        assert.ok(result, 'get_report should return a result');
        assert.strictEqual(result.success, false, 'Result should fail without report_name');
        assert.ok(result.validationErrors, 'Result should contain validation errors');
        assert.ok(result.validationErrors.length > 0, 'Should have at least one validation error');
    });
});
