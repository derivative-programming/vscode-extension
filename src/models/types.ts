// Define interfaces for type safety
import * as vscode from 'vscode';

/**
 * Represents an object within a namespace
 */
export interface NamespaceObject {
    name: string;
    parentObjectName?: string;
    properties?: Property[];
    [key: string]: any; // Allow for additional properties
}

/**
 * Represents a namespace containing objects
 */
export interface Namespace {
    name: string;
    object: NamespaceObject[];
}

/**
 * Represents a property of an object
 */
export interface Property {
    name: string;
    type: string;
    value?: any;
}

/**
 * Root structure of the AppDNA file
 */
export interface AppDNARoot {
    namespace: Namespace[];
    object?: any[]; // Legacy support
    lookupItem?: any[]; // Legacy support
}

/**
 * Main data structure of the AppDNA file
 */
export interface AppDNAData {
    root: AppDNARoot;
}

/**
 * Type for representing changes in the tree data
 */
export type TreeDataChange = JsonTreeItem | undefined | void;

/**
 * Tree item class for representing JSON data in the tree view
 */
export class JsonTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;        // If this is the DATA OBJECTS item, apply special styling
        if (contextValue === 'dataObjects' && label === 'DATA OBJECTS') {
            // Use iconPath to give it a distinctive appearance
            this.iconPath = new vscode.ThemeIcon('database');
        }

        // If this is the FORMS item, apply special styling
        if (contextValue === 'forms' && label === 'FORMS') {
            // Use iconPath to give it a distinctive appearance
            this.iconPath = new vscode.ThemeIcon('edit');
        }

    // If the item represents a data object, attach a command to show details.
        if (contextValue === 'dataObjectItem') {
            this.command = {
                title: 'Show Details',
                command: 'appdna.showDetails',
                arguments: [this]
            };
        }
        
        // If the item represents a report, attach a command to show report details.
        if (contextValue === 'reportItem') {
            this.command = {
                title: 'Show Report Details',
                command: 'appdna.showReportDetails',
                arguments: [this]
            };
        }
        
        // If the item represents a form, attach a command to show form details.
        if (contextValue === 'formItem') {
            this.command = {
                title: 'Show Form Details',
                command: 'appdna.showFormDetails',
                arguments: [this]
            };
        }
        
        // If the item represents an API site, attach a command to show API details.
        if (contextValue === 'apiSiteItem') {
            this.command = {
                title: 'Show API Details',
                command: 'appdna.showApiDetails',
                arguments: [this]
            };
        }
        
        // If the item represents a page init workflow, attach a command to show workflow details.
        if (contextValue === 'pageInitWorkflowItem') {
            this.command = {
                title: 'Show Workflow Details',
                command: 'appdna.showWorkflowDetails',
                arguments: [this]
            };
        }
        
        // If the item represents a general workflow, attach a command to show general flow details.
        if (contextValue === 'generalWorkflowItem') {
            this.command = {
                title: 'Show General Flow Details',
                command: 'appdna.showGeneralFlowDetails',
                arguments: [this]
            };
        }
        
        // If the item represents a DynaFlow workflow (WORKFLOWS), attach a command to show workflow details.
        if (contextValue === 'dynaFlowWorkflowItem') {
            this.command = {
                title: 'Show Workflow Details',
                command: 'appdna.showWorkflowDetails',
                arguments: [this]
            };
        }
        
        // If the item represents a DynaFlow Task workflow (WORKFLOW_TASKS), attach a command to show workflow task details.
        if (contextValue === 'dynaFlowTaskWorkflowItem') {
            this.command = {
                title: 'Show Workflow Task Details',
                command: 'appdna.showWorkflowDetails',
                arguments: [this]
            };
        }
        
        // Set the id property directly instead of using a getter
        // to avoid conflict with the parent class property
        this.id = `${this.contextValue || 'item'}-${this.label}`;
    }
}