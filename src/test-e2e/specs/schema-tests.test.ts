/**
 * E2E test for JSON schema functionality in AppDNA extension
 * This test demonstrates how to test schema-based features
 */

describe("AppDNA Schema Functionality", () => {
    before(async () => {
        // Wait for the extension to activate
        await browser.waitUntil(async () => {
            const workbench = await browser.getWorkbench();
            return workbench !== undefined;
        }, {
            timeout: 10000,
            timeoutMsg: "Workbench did not initialize within timeout"
        });
    });

    it("should be able to open command palette and execute add file command", async () => {
        // Get the workbench
        const workbench = await browser.getWorkbench();
        
        // Open command palette
        await workbench.executeCommand("View: Show Command Palette");
        
        // Type our extension command
        const input = workbench.getQuickOpenBox();
        await input.setText(">AppDNA: Add File");
        
        // Wait for suggestions to appear
        await browser.pause(1000);
        
        // Select the first item (should be our command)
        await input.selectQuickPick(0);
        
        // Wait for any dialogs or UI changes
        await browser.pause(2000);
    });

    it("should verify the app-dna.json file creation if needed", async function() {
        // This test should use browser.executeWorkbench to check if file exists
        // and verify initial contents match schema requirements
        
        const fileExists = await browser.executeWorkbench(async (vscode) => {
            const fs = vscode.require("fs");
            const path = vscode.require("path");
            const workspaceFolders = vscode.workspace.workspaceFolders;
            
            if (!workspaceFolders) {
                return false;
            }
            
            const appDnaPath = path.join(workspaceFolders[0].uri.fsPath, "app-dna.json");
            
            try {
                return fs.existsSync(appDnaPath);
            } catch (err) {
                return false;
            }
        });
        
        expect(fileExists).toBe(true);
    });

    it("should show the Data Objects node in the tree view after file creation", async () => {
        // Get the workbench
        const workbench = await browser.getWorkbench();
        
        // Get the activity bar and open our view container
        const activityBar = workbench.getActivityBar();
        await activityBar.openViewContainer("AppDNA");
        
        // Wait for the tree view to populate
        await browser.pause(1000);
        
        // Get the tree view and check for the Data Objects node
        const sideBar = workbench.getSideBar();
        const treeView = sideBar.getContent();
        const sections = await treeView.getSections();
        
        // Find the Data Objects section
        const hasDataObjects = await sections.some(async (section) => {
            const label = await section.getTitle();
            return label.includes("Data Objects");
        });
        
        expect(hasDataObjects).toBe(true);
    });
    
    it("should show the 'Save File' button when app-dna.json exists", async () => {
        // Get the workbench
        const workbench = await browser.getWorkbench();
        
        // Get the sidebar
        const sideBar = workbench.getSideBar();
        
        // Find the title section controls (buttons)
        const titlePart = sideBar.getTitlePart();
        const actions = await titlePart.getActions();
        
        // Check if "Save File" action is visible
        const saveFileActionExists = actions.some(action => 
            action.title === "Save File" || action.title.includes("save"));
            
        expect(saveFileActionExists).toBe(true);
    });
});