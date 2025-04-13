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
exports.registerCommands = registerCommands;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const jsonEditor_1 = require("../webviews/jsonEditor");
const objectCommands_1 = require("./objectCommands");
const projectCommands_1 = require("./projectCommands");
const objectDetailsView = __importStar(require("../webviews/objectDetailsView"));
const modelExplorerView_1 = require("../webviews/modelExplorerView");
/**
 * Registers all commands for the AppDNA extension
 * @param context Extension context
 * @param jsonTreeDataProvider The tree data provider
 * @param appDNAFilePath Path to the app-dna.json file
 * @param modelService The model service instance
 */
function registerCommands(context, jsonTreeDataProvider, appDNAFilePath, modelService) {
    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand('appdna.refresh', () => {
        jsonTreeDataProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);
    // Register edit command
    const editCommand = vscode.commands.registerCommand('appdna.editObject', (node) => {
        (0, jsonEditor_1.openJsonEditor)(context, node.label);
    });
    context.subscriptions.push(editCommand);
    // Register add file command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.addFile', async () => {
        await (0, objectCommands_1.addFileCommand)(context, appDNAFilePath, jsonTreeDataProvider, modelService);
    }));
    // Register add object command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.addObject', async () => {
        await (0, objectCommands_1.addObjectCommand)(appDNAFilePath, jsonTreeDataProvider, modelService);
    }));
    // Register remove object command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.removeObject', async (node) => {
        await (0, objectCommands_1.removeObjectCommand)(node, appDNAFilePath, jsonTreeDataProvider, modelService);
    }));
    // Register new project command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.newProject', async () => {
        await (0, projectCommands_1.newProjectCommand)(jsonTreeDataProvider);
    }));
    // Register open project command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.openProject', async () => {
        await (0, projectCommands_1.openProjectCommand)(jsonTreeDataProvider);
    }));
    // Register save project command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.saveProject', async () => {
        await (0, projectCommands_1.saveProjectCommand)(jsonTreeDataProvider);
    }));
    // Register generate code command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.generateCode', async () => {
        await (0, objectCommands_1.generateCodeCommand)(appDNAFilePath, modelService);
    }));
    // Register show details command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.showDetails', (node) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const appDNAPath = workspaceFolder ? path.join(workspaceFolder, 'app-dna.json') : '';
        // Ensure the objectDetailsView module is loaded correctly
        if (!objectDetailsView || typeof objectDetailsView.showObjectDetails !== 'function') {
            vscode.window.showErrorMessage('Failed to load objectDetailsView module. Please check the extension setup.');
            return;
        }
        // Use the objectDetailsView implementation
        objectDetailsView.showObjectDetails(node, appDNAPath);
    }));
    // Register list all objects command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.listAllObjects', async () => {
        if (!modelService.isFileLoaded()) {
            vscode.window.showWarningMessage('No App DNA file is currently loaded.');
            return;
        }
        // Open the model explorer webview for objects
        (0, modelExplorerView_1.openModelExplorer)(context, modelService, 'objects');
    }));
    // Register list all reports command
    context.subscriptions.push(vscode.commands.registerCommand('appdna.listAllReports', async () => {
        if (!modelService.isFileLoaded()) {
            vscode.window.showWarningMessage('No App DNA file is currently loaded.');
            return;
        }
        // Open the model explorer webview for reports
        (0, modelExplorerView_1.openModelExplorer)(context, modelService, 'reports');
    }));
}
//# sourceMappingURL=registerCommands.js.map