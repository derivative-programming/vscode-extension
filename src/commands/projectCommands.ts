import * as vscode from 'vscode';

/**
 * Command handler for creating a new project
 * @param jsonTreeDataProvider The tree data provider
 */
export async function newProjectCommand(jsonTreeDataProvider: any): Promise<void> {
    const projectName = await vscode.window.showInputBox({
        placeHolder: 'Project name',
        prompt: 'Enter a name for the new project'
    });
    
    if (projectName) {
        jsonTreeDataProvider.reset();
        vscode.window.showInformationMessage(`Created new project: ${projectName}`);
    }
}

/**
 * Command handler for opening an existing project
 * @param jsonTreeDataProvider The tree data provider
 */
export async function openProjectCommand(jsonTreeDataProvider: any): Promise<void> {
    const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
            'JSON Files': ['json']
        },
        title: 'Open AppDNA Project'
    });

    if (fileUri && fileUri.length > 0) {
        try {
            // Read file and parse JSON
            const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
            const projectData = JSON.parse(Buffer.from(fileContent).toString('utf-8'));
            
            // Load project data
            jsonTreeDataProvider.loadProject(projectData);
            vscode.window.showInformationMessage(`Opened project: ${fileUri[0].fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open project: ${error}`);
        }
    }
}

/**
 * Command handler for saving a project
 * @param jsonTreeDataProvider The tree data provider
 */
export async function saveProjectCommand(jsonTreeDataProvider: any): Promise<void> {
    const fileUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('app_project.json'),
        filters: {
            'JSON Files': ['json']
        },
        title: 'Save AppDNA Project'
    });

    if (fileUri) {
        try {
            // Get project data and save to file
            const projectData = jsonTreeDataProvider.getProject();
            const jsonString = JSON.stringify(projectData, null, 2);
            
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(jsonString, 'utf-8'));
            vscode.window.showInformationMessage(`Project saved to: ${fileUri.fsPath}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save project: ${errorMessage}`);
        }
    }
}