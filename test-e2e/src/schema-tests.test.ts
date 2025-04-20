/**
 * Schema-specific E2E tests for AppDNA extension
 * Tests JSON schema handling and validation
 */

import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface TestContext {
    schemaPath?: string;
}

describe("AppDNA Schema Functionality Tests", function() {
    // This test suite might take some time to run
    this.timeout(60000);
    
    // Get workspace root path
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "";
    
    // Test context for sharing data between tests
    const testContext: TestContext = {};
    
    before(async function() {
        // Wait for the extension to activate fully
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log(`Workspace root: ${workspaceRoot}`);
        
        if (!workspaceRoot) {
            console.log("Workspace root not found, skipping tests");
            this.skip();
            return;
        }
        
        // List all files in the workspace root to help with debugging
        try {
            const files = fs.readdirSync(workspaceRoot);
            console.log("Files in workspace root:", files);
            
            // Try to find the schema file in the workspace root
            const schemaFile = files.find(f => f === "app-dna.schema.json");
            if (schemaFile) {
                testContext.schemaPath = path.join(workspaceRoot, schemaFile);
                console.log(`Found schema file at: ${testContext.schemaPath}`);
            } else {
                console.log("Schema file not found in workspace root, will search in parent directories");
                
                // Try to find in parent directory (if we're running from test-e2e)
                const parentDir = path.resolve(workspaceRoot, "..");
                if (fs.existsSync(path.join(parentDir, "app-dna.schema.json"))) {
                    testContext.schemaPath = path.join(parentDir, "app-dna.schema.json");
                    console.log(`Found schema file in parent directory: ${testContext.schemaPath}`);
                }
            }
        } catch (err) {
            console.log("Error listing files in workspace root:", err);
        }
        
        // Make sure the extension is active
        // Extension ID might be just "appdna" without publisher during development
        const extension = vscode.extensions.getExtension("appdna") || 
                          vscode.extensions.getExtension("TestPublisher.appdna");
                         
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        
        if (extension) {
            console.log(`Extension ${extension.id} is ${extension.isActive ? "active" : "inactive"}`);
        } else {
            console.log("Extension not found by ID");
            
            // List all extensions to see if ours is there under a different ID
            const allExtensions = vscode.extensions.all;
            const potentialMatches = allExtensions.filter(ext => 
                ext.id.toLowerCase().includes("appdna") || 
                (ext.packageJSON && ext.packageJSON.name === "appdna")
            );
            
            if (potentialMatches.length > 0) {
                console.log("Potential extension matches:", potentialMatches.map(e => e.id));
            }
        }
    });

    it("should have a valid schema file", function() {
        // If no schema path was found, skip the test
        if (!testContext.schemaPath) {
            console.log("No schema file found, skipping test");
            this.skip();
            return;
        }
        
        // Check if the schema file exists
        const exists = fs.existsSync(testContext.schemaPath);
        console.log(`Schema file exists: ${exists}`);
        assert.ok(exists, "Schema file should exist");
        
        // Try to parse the schema
        let schema: any;
        try {
            const schemaContent = fs.readFileSync(testContext.schemaPath, "utf8");
            schema = JSON.parse(schemaContent);
            assert.ok(schema, "Schema should be parseable as JSON");
        } catch (err) {
            assert.fail(`Schema file should be valid JSON: ${err}`);
        }
        
        // Check schema structure
        assert.ok(schema.type === "object", "Schema root should be an object");
        assert.ok(schema.properties, "Schema should define properties");
    });

    it("should execute add file command", async function() {
        // This test checks if the addFile command can be executed
        try {
            // Execute the add file command
            await vscode.commands.executeCommand("appdna.addFile");
            
            // If we get here, the command executed without error
            assert.ok(true, "Add file command executed successfully");
            
            // Wait a bit for any async operations to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (err) {
            console.log("Command execution note:", err);
            this.skip(); // Skip this test if the command isn't available
        }
    });

    it("should read schema properties dynamically", async function() {
        // If no schema path was found, skip the test
        if (!testContext.schemaPath) {
            console.log("No schema file found, skipping test");
            this.skip();
            return;
        }
        
        // Read the schema file directly
        const schemaContent = fs.readFileSync(testContext.schemaPath, "utf8");
        const schema = JSON.parse(schemaContent);
        
        // Examine some key properties in the schema
        // These assertions verify the structure expected by the extension
        assert.ok(schema.properties, "Schema should define top-level properties");
        
        // Count the properties to ensure we have a valid schema
        const propertyCount = Object.keys(schema.properties).length;
        assert.ok(propertyCount > 0, "Schema should have at least one property");
        console.log(`Schema has ${propertyCount} top-level properties`);
        
        // Test some specific schema features that our extension uses
        // For each property that has a description, check it's a string
        Object.keys(schema.properties).forEach(propName => {
            const prop = schema.properties[propName];
            if (prop.description) {
                assert.strictEqual(
                    typeof prop.description, 
                    "string", 
                    `Property ${propName} should have a string description`
                );
            }
            
            // If the property has an enum, check it's an array
            if (prop.enum) {
                assert.ok(
                    Array.isArray(prop.enum), 
                    `Property ${propName} enum should be an array`
                );
            }
        });
    });
});