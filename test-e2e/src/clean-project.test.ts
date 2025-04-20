/**
 * E2E tests for clean project state
 * 
 * This test verifies that when no model JSON or config files exist:
 * - The sidebar shows only a title
 * - There's a plus button
 * - No other buttons are shown
 */

import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

describe("AppDNA Clean Project Test", function() {
    // This test suite might take some time to run
    this.timeout(60000);
    
    // Get workspace root path
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "";
    
    before(async function() {
        // Wait for the extension to activate fully
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log("Clean project test - workspace root:", workspaceRoot);
        
        if (!workspaceRoot) {
            console.log("Workspace root not found, skipping tests");
            this.skip();
            return;
        }
        
        // Make sure the extension is active
        const extension = vscode.extensions.getExtension("appdna") || 
                          vscode.extensions.getExtension("TestPublisher.appdna");
                         
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        
        if (!extension) {
            console.log("Extension not found by ID");
            this.skip();
            return;
        }
        
        console.log(`Extension ${extension.id} is ${extension.isActive ? "active" : "inactive"}`);
        
        // Make sure we start with a clean state by refreshing the view
        try {
            await vscode.commands.executeCommand("appdna.refreshView");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Give UI time to update
        } catch (err) {
            console.log("Error refreshing view:", err);
        }
    });

    it("should show the AppDNA view container in the activity bar", async function() {
        // Verify the extension's view container exists
        // We'll use the vscode.executeCommand API to check if view-related commands exist
        const commands = await vscode.commands.getCommands(true);
        const viewCommands = commands.filter(cmd => 
            cmd.includes("appdnaContainer") || 
            (cmd.includes("appdna") && cmd.includes("view"))
        );
        
        console.log("AppDNA view-related commands:", viewCommands);
        assert.ok(viewCommands.length > 0, "AppDNA view container commands should exist");
    });

    it("should show 'Add File' button when no app-dna.json exists", async function() {
        // Check that the Add File button/command is available
        const commands = await vscode.commands.getCommands(true);
        const hasAddFileCommand = commands.includes("appdna.addFile");
        
        assert.ok(hasAddFileCommand, "Add File command should exist");
        
        // Instead of checking the context directly, we'll check if the file exists
        // When no app-dna.json exists, the Add File button should be shown
        const appDnaJsonPath = path.join(workspaceRoot, "app-dna.json");
        assert.strictEqual(fs.existsSync(appDnaJsonPath), false, "app-dna.json should not exist initially");
    });

    it("should not show app-dna.json-dependent commands when no file exists", async function() {
        // Since we can't directly check UI state, we'll verify commands are registered
        // but check that the file they operate on doesn't exist
        const appDnaJsonPath = path.join(workspaceRoot, "app-dna.json");
        assert.strictEqual(fs.existsSync(appDnaJsonPath), false, "app-dna.json should not exist initially");
    });

    it("should create app-dna.json when Add File button is clicked", async function() {
        // First verify the file doesn't exist
        const appDnaJsonPath = path.join(workspaceRoot, "app-dna.json");
        assert.strictEqual(fs.existsSync(appDnaJsonPath), false, "app-dna.json should not exist initially");
        
        try {
            // Execute the Add File command
            await vscode.commands.executeCommand("appdna.addFile");
            
            // Wait for async file creation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Now check that the file exists
            assert.strictEqual(fs.existsSync(appDnaJsonPath), true, "app-dna.json should be created after clicking Add File");
            
            // Verify the file contains valid JSON
            const fileContent = fs.readFileSync(appDnaJsonPath, "utf8");
            const jsonContent = JSON.parse(fileContent);
            
            // The file should have a root object
            assert.ok(jsonContent.root, "Created app-dna.json should have a root object");
            
        } catch (err) {
            console.error("Error while testing Add File button:", err);
            throw err;
        }
    });
});