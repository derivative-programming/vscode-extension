"use strict";
const fs = require("fs");
const vscode = require("vscode");

/**
 * Gets object data from the app-dna.json file
 * @param {string} objectName Name of the object to retrieve
 * @param {string} appDNAFilePath Path to the app-dna.json file
 * @returns {Object} The object data
 */
function getObjectData(objectName, appDNAFilePath) {
    try {
        if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
            return { name: objectName, error: "AppDNA file not found" };
        }
        
        const fileContent = fs.readFileSync(appDNAFilePath, "utf-8");
        const jsonData = JSON.parse(fileContent);
        
        let objectData = null;
        
        // Ensure the object name is trimmed and case-insensitive for matching
        const normalizedObjectName = objectName.trim().toLowerCase();

        // Find the object in any namespace
        if (jsonData.root && jsonData.root.namespace) {
            for (const ns of jsonData.root.namespace) {
                if (Array.isArray(ns.object)) {
                    const obj = ns.object.find(o => o.name.trim().toLowerCase() === normalizedObjectName);
                    if (obj) {
                        objectData = obj;
                        objectData.namespaceName = ns.name;
                        break;
                    }
                }
            }
        }
        
        return objectData || { name: objectName, error: "Object not found" };
    } catch (error) {
        console.error("Error reading object data:", error);
        return { name: objectName, error: error.message };
    }
}

/**
 * Saves object data back to the app-dna.json file
 * @param {Object} data The data to save
 * @param {string} appDNAFilePath Path to the app-dna.json file
 */
function saveObjectData(data, appDNAFilePath) {
    try {
        if (!appDNAFilePath || !fs.existsSync(appDNAFilePath)) {
            vscode.window.showErrorMessage("AppDNA file not found. Cannot save changes.");
            return;
        }
        
        const fileContent = fs.readFileSync(appDNAFilePath, "utf-8");
        const jsonData = JSON.parse(fileContent);
        
        // Find and update the object
        let updated = false;
        
        if (jsonData.root && jsonData.root.namespace) {
            for (const ns of jsonData.root.namespace) {
                if (Array.isArray(ns.object)) {
                    const objIndex = ns.object.findIndex(o => o.name === data.name);
                    if (objIndex >= 0) {
                        // Update the object properties
                        if (data.settings) {
                            // Update basic properties
                            for (const [key, value] of Object.entries(data.settings)) {
                                if (key !== "prop" && key !== "report" && key !== "objectWorkflow") {
                                    ns.object[objIndex][key] = value;
                                }
                            }
                        }
                        
                        // Update props if provided
                        if (data.props) {
                            ns.object[objIndex].prop = data.props;
                        }
                        
                        updated = true;
                        break;
                    }
                }
            }
        }
        
        if (updated) {
            fs.writeFileSync(appDNAFilePath, JSON.stringify(jsonData, null, 2), "utf-8");
            vscode.window.showInformationMessage("Object updated successfully");
            
            // Try to refresh the tree view if possible
            try {
                vscode.commands.executeCommand("appdna.refresh");
            } catch (error) {
                console.error("Could not refresh tree view:", error);
            }
        } else {
            vscode.window.showErrorMessage("Failed to update object: Object not found");
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to save changes: ${error.message}`);
    }
}

/**
 * Formats a property key into a readable label
 * @param {string} key The property key to format
 * @returns {string} The formatted label
 */
function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase());
}

module.exports = {
    getObjectData,
    saveObjectData,
    formatLabel
};