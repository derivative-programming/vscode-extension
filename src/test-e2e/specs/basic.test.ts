/**
 * Basic E2E test for AppDNA extension
 * This test validates that:
 * 1. The extension loads correctly
 * 2. The AppDNA view container is visible
 * 3. Commands can be executed
 */

describe("AppDNA Extension", () => {
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

    it("should have AppDNA view container in activity bar", async () => {
        // Get the workbench object
        const workbench = await browser.getWorkbench();
        
        // Get the activity bar
        const activityBar = workbench.getActivityBar();
        
        // Check if our extension's view container exists
        const viewContainers = await activityBar.getViewContainerTitles();
        
        // Verify that our view container exists
        expect(viewContainers).toContain("AppDNA");
    });

    it("should show AppDNA view when clicking on activity bar icon", async () => {
        // Get the workbench
        const workbench = await browser.getWorkbench();
        
        // Get the activity bar
        const activityBar = workbench.getActivityBar();
        
        // Click on our view container to show it
        await activityBar.openViewContainer("AppDNA");
        
        // Verify the view is visible
        const sideBar = workbench.getSideBar();
        const sections = await sideBar.getTitleSections();
        
        // Check if the AppDNA section is visible
        expect(sections).toContain("AppDNA");
    });

    it("should show 'Add File' button when app-dna.json doesn't exist", async () => {
        // Get the workbench
        const workbench = await browser.getWorkbench();
        
        // Get the sidebar
        const sideBar = workbench.getSideBar();
        
        // Find the title section controls (buttons)
        const titlePart = sideBar.getTitlePart();
        const actions = await titlePart.getActions();
        
        // Check if "Add File" action is visible
        const addFileActionExists = actions.some(action => 
            action.title === "Add File" || action.title.includes("add"));
            
        expect(addFileActionExists).toBe(true);
    });

    it("should be able to execute a command from command palette", async () => {
        // Get the workbench
        const workbench = await browser.getWorkbench();
        
        // Open command palette
        await workbench.executeCommand("View: Show Command Palette");
        
        // Type our extension command
        const input = workbench.getQuickOpenBox();
        await input.setText(">AppDNA: Add File");
        
        // Wait for suggestions to appear
        await browser.pause(1000);
        
        // Verify our command appears in the list
        const suggestions = await input.getQuickPicks();
        const hasAddFileCommand = suggestions.some(suggestion => 
            suggestion.label === "AppDNA: Add File" || 
            suggestion.label.includes("Add File"));
            
        expect(hasAddFileCommand).toBe(true);
        
        // Close the command palette
        await input.cancel();
    });
});