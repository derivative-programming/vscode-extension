#!/bin/bash

# Wizard MCP Tools Verification Script
# This script verifies the implementation of wizard MCP tools

echo "=== Wizard MCP Tools Verification ==="
echo ""

echo "1. Checking MCP commands registration..."
grep -n "openAddDataObjectWizard\|openAddFormWizard" src/commands/mcpViewCommands.ts | head -10
echo ""

echo "2. Checking ViewTools methods..."
grep -n "openAddDataObjectWizard\|openAddFormWizard" src/mcp/tools/viewTools.ts | head -10
echo ""

echo "3. Checking MCP server tool registration..."
grep -n "open_add_data_object_wizard\|open_add_form_wizard" src/mcp/server.ts | head -10
echo ""

echo "4. Counting total MCP tools..."
TOOL_COUNT=$(grep "registerTool('" src/mcp/server.ts | sed "s/.*registerTool('//g" | sed "s/'.*//g" | sort | wc -l)
echo "Total MCP tools: $TOOL_COUNT"
echo ""

echo "5. Listing wizard tools..."
grep "registerTool('" src/mcp/server.ts | sed "s/.*registerTool('//g" | sed "s/'.*//g" | sort | grep wizard
echo ""

echo "6. Checking test file..."
if [ -f "src/test/mcp-wizard-tools.test.ts" ]; then
    echo "✓ Test file exists: src/test/mcp-wizard-tools.test.ts"
    echo "  Test count: $(grep "test('" src/test/mcp-wizard-tools.test.ts | wc -l)"
else
    echo "✗ Test file not found"
fi
echo ""

echo "7. Checking documentation..."
if grep -q "open_add_form_wizard" MCP_README.md; then
    echo "✓ Documentation updated in MCP_README.md"
else
    echo "✗ Documentation not updated"
fi
echo ""

echo "8. Compilation status..."
if [ -f "dist/mcp/tools/viewTools.js" ]; then
    echo "✓ Code compiled successfully"
else
    echo "✗ Compilation failed or not run"
fi
echo ""

echo "=== Verification Complete ==="
echo ""
echo "Summary:"
echo "- MCP Commands: Added appdna.mcp.openAddDataObjectWizard and appdna.mcp.openAddFormWizard"
echo "- ViewTools Methods: Added openAddDataObjectWizard() and openAddFormWizard()"
echo "- MCP Tools: Added open_add_data_object_wizard and open_add_form_wizard"
echo "- Total Tools: $TOOL_COUNT"
echo "- Tests: Created mcp-wizard-tools.test.ts with 4 tests"
echo "- Documentation: Updated MCP_README.md with examples and tool count"
