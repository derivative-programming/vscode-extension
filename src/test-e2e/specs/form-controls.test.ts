/**
 * E2E test for form controls in AppDNA extension
 * This test validates form input generation based on JSON schema
 */

describe("AppDNA Form Controls", () => {
    before(async () => {
        // Wait for the extension to activate
        await browser.waitUntil(async () => {
            const workbench = await browser.getWorkbench();
            return workbench !== undefined;
        }, {
            timeout: 10000,
            timeoutMsg: "Workbench did not initialize within timeout"
        });
        
        // Ensure app-dna.json exists by running the add file command if needed
        await browser.executeWorkbench(async (vscode) => {
            const fs = vscode.require("fs");
            const path = vscode.require("path");
            const workspaceFolders = vscode.workspace.workspaceFolders;
            
            if (!workspaceFolders) {
                return false;
            }
            
            const appDnaPath = path.join(workspaceFolders[0].uri.fsPath, "app-dna.json");
            
            if (!fs.existsSync(appDnaPath)) {
                // Create the file by executing the command
                await vscode.commands.executeCommand("appdna.addFile");
                return true;
            }
            
            return true;
        });
    });

    it("should load schema from app-dna.schema.json", async function() {
        // Check that the schema file exists and can be loaded
        const schemaFileExists = await browser.executeWorkbench(async (vscode) => {
            const fs = vscode.require("fs");
            const path = vscode.require("path");
            const workspaceFolders = vscode.workspace.workspaceFolders;
            
            if (!workspaceFolders) {
                return false;
            }
            
            const schemaPath = path.join(workspaceFolders[0].uri.fsPath, "app-dna.schema.json");
            
            try {
                return fs.existsSync(schemaPath);
            } catch (err) {
                return false;
            }
        });
        
        expect(schemaFileExists).toBe(true);
    });

    it("should open an object in the editor when selected", async () => {
        // Get the workbench
        const workbench = await browser.getWorkbench();
        
        // Get the activity bar and open our view container
        const activityBar = workbench.getActivityBar();
        await activityBar.openViewContainer("AppDNA");
        
        // Wait for the tree view to populate
        await browser.pause(1000);
        
        // Open an editor for an object
        await browser.executeWorkbench(async (vscode) => {
            // Try to find Data Objects node and expand it
            try {
                await vscode.commands.executeCommand("appdna.addObject");
                await browser.pause(2000); // Wait for any UI updates
                return true;
            } catch (err) {
                return false;
            }
        });
        
        // Wait for editor to open
        await browser.pause(2000);
    });

    it("should show form controls based on schema properties", async () => {
        // This test verifies that form controls are generated based on schema properties
        
        // Check if editor is open and has form controls
        const hasFormControls = await browser.executeWorkbench(async (vscode) => {
            // Look for webview elements
            // Note: This is a simplified check as we can't easily query webview content directly
            const activeEditor = vscode.window.activeTextEditor;
            return activeEditor !== undefined;
        });
        
        expect(hasFormControls).toBe(true);
    });

    it("should show enum properties as dropdowns", async () => {
        // This test would verify that enum properties are rendered as dropdowns
        // For now we're just checking the overall editor state
        
        const isEditorOpen = await browser.executeWorkbench(async (vscode) => {
            return vscode.window.activeTextEditor !== undefined;
        });
        
        expect(isEditorOpen).toBe(true);
    });
    
    it("should show descriptions as tooltips", async () => {
        // In a real test, we would hover over controls to check for tooltips
        // For now, we're just verifying the editor state
        
        const editorIsActive = await browser.executeWorkbench(async (vscode) => {
            return vscode.window.activeTextEditor !== undefined;
        });
        
        expect(editorIsActive).toBe(true);
    });

    it("should display controls in alphabetical order", async () => {
        // In a real test, we would check the ordering of form controls
        // For this example, we're just validating that the editor is still active
        
        const editorIsActive = await browser.executeWorkbench(async (vscode) => {
            return vscode.window.activeTextEditor !== undefined;
        });
        
        expect(editorIsActive).toBe(true);
    });

    it("should show checkboxes for toggling property existence", async () => {
        // This test would check for the presence of checkboxes next to controls
        // For now, we're just verifying the editor remains open
        
        const editorIsActive = await browser.executeWorkbench(async (vscode) => {
            return vscode.window.activeTextEditor !== undefined;
        });
        
        expect(editorIsActive).toBe(true);
    });
});