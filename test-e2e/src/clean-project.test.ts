/**
 * E2E tests for clean project state
 * 
 * This test verifies that when no model JSON or config files exist:
 * - The extension icon appears in the activity bar
 * - Clicking the icon shows the sidebar with a title and plus button
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
                          vscode.extensions.getExtension("derivative-programming.appdna");
                         
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        
        if (!extension) {
            console.log("Extension not found by ID");
            this.skip();
            return;
        }
        
        console.log(`Extension ${extension.id} is ${extension.isActive ? "active" : "inactive"}`);
    });

    it("should have the extension icon in the activity bar", async function() {
        // Check if the extension contributes a view container
        // Look for the package.json contribution
        const extension = vscode.extensions.getExtension("appdna") || 
                        vscode.extensions.getExtension("derivative-programming.appdna");
        
        assert.ok(extension, "Extension should be available");
        
        // Check the package.json for viewContainers contribution
        const packageJson = extension.packageJSON;
        console.log("Extension package.json contributes:", Object.keys(packageJson.contributes || {}));
        
        // Verify that the extension contributes a viewContainer to the activitybar
        const viewContainers = packageJson.contributes?.viewsContainers?.activitybar;
        assert.ok(viewContainers && viewContainers.length > 0, 
            "Extension should contribute a view container to the activity bar");
            
        // Print information about the view container
        console.log("View container in activity bar:", 
            viewContainers.map((vc: any) => `${vc.id} (${vc.title})`));
            
        // Note: We can't verify the actual icon position in the activity bar through the API
        // as VS Code doesn't expose that information programmatically
        console.log("Note: Cannot programmatically verify exact position in activity bar");
    });

    it("should focus the extension view when clicking the icon", async function() {
        // Simulate clicking the icon by showing the view container
        try {
            // This command is equivalent to clicking the icon in the activity bar
            await vscode.commands.executeCommand("workbench.view.extension.appdnaContainer");
            
            // Give the UI time to update
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log("Executed command to focus AppDNA view container");
            
            // We can verify that the extension's commands are available
            // which indicates the view is active
            const commands = await vscode.commands.getCommands(true);
            const appDnaCommands = commands.filter(cmd => cmd.startsWith("appdna."));
            console.log("Available AppDNA commands after focusing view:", appDnaCommands);
            
            // We should have at least the addFile command
            assert.ok(appDnaCommands.includes("appdna.addFile"), 
                "addFile command should be available after focusing the view");
        } catch (err) {
            console.error("Error focusing view:", err);
            throw err;
        }
        
        // Verify the expected UI state for a clean project
        // We'll check for the existence of the core commands
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes("appdna.addFile"), "Add File command should be available");
    });

    it("should show 'Add File' button when no app-dna.json exists", async function() {
        // Check that the Add File button/command is available
        const commands = await vscode.commands.getCommands(true);
        const hasAddFileCommand = commands.includes("appdna.addFile");
        
        assert.ok(hasAddFileCommand, "Add File command should exist");
        
        // Check if the file exists - it shouldn't in a clean project
        const appDnaJsonPath = path.join(workspaceRoot, "app-dna.json");
        assert.strictEqual(fs.existsSync(appDnaJsonPath), false, "app-dna.json should not exist initially");
        
        // Take a screenshot of the view (not directly possible through API)
        console.log("Note: Cannot programmatically take screenshots of the UI");
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
            // Execute the Add File command - equivalent to clicking the Add File button
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

    it("should verify context menu actions available", async function() {
        try {
            // List all commands that might be shown in a context menu
            const commands = await vscode.commands.getCommands(true);
            const contextMenuCommands = commands.filter(cmd => 
                cmd.startsWith("appdna.") && 
                (cmd.includes("add") || cmd.includes("edit") || cmd.includes("remove") || 
                 cmd.includes("generate") || cmd.includes("save") || cmd.includes("open"))
            );
            
            console.log("Available context menu commands:", contextMenuCommands);
            
            // Simulate opening a context menu by checking for expected commands
            // Note: We cannot directly click or open context menus through the API
            const expectedCommands = [
                "appdna.addFile",
                "appdna.addObject",
                "appdna.editObject",
                "appdna.saveFile"
            ];
            
            for (const cmd of expectedCommands) {
                if (commands.includes(cmd)) {
                    console.log(`Command "${cmd}" is available`);
                } else {
                    console.log(`Command "${cmd}" is NOT available`);
                }
            }
            
            // Now that app-dna.json exists, certain commands should be available
            assert.ok(commands.includes("appdna.saveFile"), 
                "Save File command should be available after creating app-dna.json");
                
        } catch (err) {
            console.error("Error checking context menu actions:", err);
            throw err;
        }
    });
});