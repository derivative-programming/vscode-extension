"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.newProjectCommand = newProjectCommand;
exports.openProjectCommand = openProjectCommand;
exports.saveProjectCommand = saveProjectCommand;
const vscode = __importStar(require("vscode"));
/**
 * Command handler for creating a new project
 * @param jsonTreeDataProvider The tree data provider
 */
async function newProjectCommand(jsonTreeDataProvider) {
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
async function openProjectCommand(jsonTreeDataProvider) {
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open project: ${error}`);
        }
    }
}
/**
 * Command handler for saving a project
 * @param jsonTreeDataProvider The tree data provider
 */
async function saveProjectCommand(jsonTreeDataProvider) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save project: ${errorMessage}`);
        }
    }
}
//# sourceMappingURL=projectCommands.js.map