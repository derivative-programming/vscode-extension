// userStoriesView.js
// Shows the user story items in a table view
// May 10, 2025

"use strict";

// Import VS Code module
const vscode = require('vscode');

// Store user story items so we can modify them
// These arrays are just for reference, the actual data comes from the model
let userStoryItems = [];
let originalUserStoryItems = [];

/**
 * Extracts the role name from a user story text.
 * @param {string} text User story text
 * @returns {string|null} The extracted role name or null if not found
 */
function extractRoleFromUserStory(text) {
    if (!text || typeof text !== "string") { return null; }
    
    // Remove extra spaces
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract role from: A [Role] wants to...
    const re1 = /^A\s+\[?(\w+(?:\s+\w+)*)\]?\s+wants to/i;
    // Regex to extract role from: As a [Role], I want to...
    const re2 = /^As a\s+\[?(\w+(?:\s+\w+)*)\]?\s*,?\s*I want to/i;
    
    const match1 = re1.exec(t);
    const match2 = re2.exec(t);
    
    if (match1) {
        return match1[1].trim();
    } else if (match2) {
        return match2[1].trim();
    }
    
    return null;
}

/**
 * Extracts data object names from a user story text.
 * @param {string} text User story text
 * @returns {string[]} Array of extracted object names
 */
function extractDataObjectsFromUserStory(text) {
    if (!text || typeof text !== "string") { return []; }
    
    const lowerText = text.toLowerCase();
    const dataObjects = [];
    
    // Extract data objects from 'view all [objects] in a [container]' pattern
    // Handle both "in a [object]" and "in the application" (where "application" is not a data object)
    const viewAllInPattern = /view all\s+(?:a\s+|an\s+|the\s+|all\s+)?([a-z]+(?:\s+[a-z]+)*)\s+in (?:a\s+|the\s+)([a-z]+(?:\s+[a-z]+)*)/g;
    let match;
    while ((match = viewAllInPattern.exec(lowerText)) !== null) {
        const obj1 = match[1].trim();
        const obj2 = match[2].trim();
        
        // Always add the first object (the items being viewed)
        if (obj1 && !dataObjects.includes(obj1)) {
            dataObjects.push(obj1);
            // Also add singular/plural variants
            if (obj1.endsWith('s')) {
                const singular = obj1.slice(0, -1);
                if (!dataObjects.includes(singular)) {
                    dataObjects.push(singular);
                }
            } else {
                const plural = obj1 + 's';
                if (!dataObjects.includes(plural)) {
                    dataObjects.push(plural);
                }
            }
        }
        
        // Only add the second object if it's not "application"
        if (obj2 && obj2 !== 'application' && !dataObjects.includes(obj2)) {
            dataObjects.push(obj2);
            // Also add singular/plural variants
            if (obj2.endsWith('s')) {
                const singular = obj2.slice(0, -1);
                if (!dataObjects.includes(singular)) {
                    dataObjects.push(singular);
                }
            } else {
                const plural = obj2 + 's';
                if (!dataObjects.includes(plural)) {
                    dataObjects.push(plural);
                }
            }
        }
    }
    
    // Extract data objects (look for nouns after common patterns)
    const objectPatterns = [
        /(?:view all|view|add|create|update|edit|delete|remove)\s+(?:a\s+|an\s+|the\s+|all\s+)?([a-z]+(?:\s+[a-z]+)*)/g,
        /(?:of|for)\s+(?:a\s+|an\s+|the\s+|all\s+)?([a-z]+(?:\s+[a-z]+)*)/g
    ];
    
    for (const pattern of objectPatterns) {
        while ((match = pattern.exec(lowerText)) !== null) {
            const obj = match[1].trim();
            if (obj && !dataObjects.includes(obj)) {
                dataObjects.push(obj);
                // Also add singular/plural variants
                if (obj.endsWith('s')) {
                    const singular = obj.slice(0, -1);
                    if (!dataObjects.includes(singular)) {
                        dataObjects.push(singular);
                    }
                } else {
                    const plural = obj + 's';
                    if (!dataObjects.includes(plural)) {
                        dataObjects.push(plural);
                    }
                }
            }
        }
    }
    
    return dataObjects;
}

/**
 * Converts a spaced name to PascalCase.
 * @param {string} name The spaced name to convert
 * @returns {string} The PascalCase version
 */
function toPascalCase(name) {
    if (!name || typeof name !== "string") { return ""; }
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Converts a PascalCase name to spaced format.
 * @param {string} name The PascalCase name to convert
 * @returns {string} The spaced version
 */
function toSpacedFormat(name) {
    if (!name || typeof name !== "string") { return ""; }
    return name.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Validates if data objects exist in the model's data objects.
 * @param {string[]} objectNames Array of object names to validate
 * @param {Object} modelService The model service instance
 * @returns {Object} Object with validation results and missing objects
 */
function validateDataObjects(objectNames, modelService) {
    const result = {
        allValid: true,
        missingObjects: [],
        validObjects: []
    };
    
    if (!objectNames || !Array.isArray(objectNames) || objectNames.length === 0) {
        return result;
    }
    
    if (!modelService || !modelService.isFileLoaded()) {
        result.allValid = false;
        result.missingObjects = [...objectNames];
        return result;
    }
    
    try {
        const allObjects = modelService.getAllObjects();
        if (!allObjects || !Array.isArray(allObjects)) {
            result.allValid = false;
            result.missingObjects = [...objectNames];
            return result;
        }
        
        // Get all object names in various formats for comparison
        const modelObjectNames = allObjects.map(obj => {
            const name = obj.name || "";
            return {
                original: name,
                lower: name.toLowerCase(),
                pascalCase: toPascalCase(name),
                spacedFormat: toSpacedFormat(name).toLowerCase()
            };
        });
        
        for (const objectName of objectNames) {
            const searchName = objectName.toLowerCase();
            const searchPascal = toPascalCase(objectName);
            const searchSpaced = toSpacedFormat(objectName).toLowerCase();
            
            const found = modelObjectNames.some(modelObj => 
                modelObj.lower === searchName ||
                modelObj.lower === searchPascal.toLowerCase() ||
                modelObj.lower === searchSpaced ||
                modelObj.spacedFormat === searchName ||
                modelObj.spacedFormat === searchSpaced
            );
            
            if (found) {
                result.validObjects.push(objectName);
            } else {
                result.missingObjects.push(objectName);
                result.allValid = false;
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error validating data objects:', error);
        // In case of error, return true to avoid blocking user stories
        result.allValid = true;
        result.validObjects = [...objectNames];
        return result;
    }
}

/**
 * Validates if a role exists in the model's role data objects.
 * @param {string} roleName The role name to validate
 * @param {Object} modelService The model service instance
 * @returns {boolean} True if the role exists, false otherwise
 */
function isValidRole(roleName, modelService) {
    if (!roleName || !modelService || !modelService.isFileLoaded()) {
        return false;
    }
    
    try {
        const allObjects = modelService.getAllObjects();
        if (!allObjects || !Array.isArray(allObjects)) {
            return false;
        }
        
        // Find Role objects (objects with name 'Role' or containing 'role')
        const roleObjects = allObjects.filter(obj => 
            obj.name === 'Role' || (obj.name && obj.name.toLowerCase().includes('role'))
        );
        
        if (roleObjects.length === 0) {
            // If no Role objects exist in the model, allow any role name
            return true;
        }
        
        // Check if the role name exists in any Role object's lookup items
        for (const roleObj of roleObjects) {
            if (roleObj.lookupItem && Array.isArray(roleObj.lookupItem)) {
                const roleExists = roleObj.lookupItem.some(item => {
                    // Check both name and displayName for matches (case insensitive)
                    const itemName = (item.name || "").toLowerCase();
                    const itemDisplayName = (item.displayName || "").toLowerCase();
                    const searchRole = roleName.toLowerCase();
                    
                    return itemName === searchRole || itemDisplayName === searchRole;
                });
                
                if (roleExists) {
                    return true;
                }
            }
        }
        
        // Role not found in any lookup items
        return false;
    } catch (error) {
        console.error('Error validating role:', error);
        // In case of error, return true to avoid blocking user stories
        return true;
    }
}

/**
 * Validates user story text against allowed formats.
 * Accepts:
 *   - A [Role Name] wants to [view, add, update, delete] [a,an,all] [Object Name(s)]
 *   - A [Role Name] wants to view all [Object Name(s)] in a [Container Object Name]
 *   - As a [Role Name], I want to [view, add, update, delete] [a,an,all] [Object Name(s)]
 *   - As a [Role Name], I want to view all [Object Name(s)] in a [Container Object Name]
 * Brackets are optional, case is ignored, and 'a', 'an', or 'all' are allowed before the object.
 * @param {string} text
 * @returns {boolean}
 */
function isValidUserStoryFormat(text) {
    if (!text || typeof text !== "string") { return false; }
    // Remove extra spaces
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex for: A [Role] wants to view all [objects] in a [container] OR in the [container]
    const re1ViewAll = /^A\s+[\w\s]+\s+wants to\s+view all\s+[\w\s]+\s+in (?:a |the )[\w\s]+$/i;
    // Regex for: As a [Role], I want to view all [objects] in a [container] OR in the [container]  
    const re2ViewAll = /^As a\s+[\w\s]+\s*,\s*I want to\s+view all\s+[\w\s]+\s+in (?:a |the )[\w\s]+$/i;
    
    // Regex for: A [Role] wants to [action] [a|an] [object] (single object actions)
    const re1Single = /^A\s+[\w\s]+\s+wants to\s+(?:view|add|create|update|edit|delete|remove)\s+(?:a |an )[\w\s]+$/i;
    // Regex for: As a [Role], I want to [action] [a|an] [object] (single object actions)
    const re2Single = /^As a\s+[\w\s]+\s*,\s*I want to\s+(?:view|add|create|update|edit|delete|remove)\s+(?:a |an )[\w\s]+$/i;
    
    const result = re1ViewAll.test(t) || re2ViewAll.test(t) || re1Single.test(t) || re2Single.test(t);
    
    // Debug logging to help identify failing patterns
    if (!result) {
        console.log(`[DEBUG] Story format validation failed for: "${t}"`);
        console.log(`  re1ViewAll test: ${re1ViewAll.test(t)}`);
        console.log(`  re2ViewAll test: ${re2ViewAll.test(t)}`);
        console.log(`  re1Single test: ${re1Single.test(t)}`);
        console.log(`  re2Single test: ${re2Single.test(t)}`);
    }
    
    return result;
}

// Track active panels to avoid duplicates
const activePanels = new Map();

// Track panel references for the single user stories view
const userStoryPanel = {
    panel: null,
    context: null,
    modelService: null
};

/**
 * Gets the reference to the user stories view panel if it's open
 * @returns {Object|null} The user stories view panel info or null if not open
 */
function getUserStoriesPanel() {
    if (activePanels.has('userStoriesView')) {
        return {
            type: 'userStoriesView',
            context: userStoryPanel.context,
            modelService: userStoryPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the user stories panel if it's open
 */
function closeUserStoriesPanel() {
    console.log(`Closing user stories panel if open`);
    const panel = activePanels.get('userStoriesView');
    if (panel && !panel._disposed) {
        panel.dispose();
        activePanels.delete('userStoriesView');
    }
    // Clean up userStoryPanel reference
    userStoryPanel.panel = null;
}

/**
 * Shows a user stories view in a webview
 * @param {Object} context The extension context
 * @param {Object} modelService The model service instance
 */
function showUserStoriesView(context, modelService) {
    if (!modelService || !modelService.isFileLoaded()) {
        // Use VS Code API from the imported context, not from a global vscode variable
        vscode.window.showErrorMessage("No project is currently loaded.");
        return;
    }    // Create a consistent panel ID
    const panelId = 'userStoriesView';
    console.log(`showUserStoriesView called (panelId: ${panelId})`);
    
    // Store reference to context and modelService
    userStoryPanel.context = context;
    userStoryPanel.modelService = modelService;
    
    // Check if panel already exists
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for user stories view, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        activePanels.get(panelId).reveal(vscode.ViewColumn.One);
        return;
    }
    
    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
        'userStoriesView',
        'User Stories',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Track this panel
    console.log(`Adding new panel to activePanels with id: ${panelId}`);
    activePanels.set(panelId, panel);
    userStoryPanel.panel = panel;
    
    // Remove from tracking when disposed
    panel.onDidDispose(() => {
        console.log(`Panel disposed, removing from tracking: ${panelId}`);
        activePanels.delete(panelId);
        userStoryPanel.panel = null;
    });

    // Get the model data
    const rootModel = modelService.getCurrentModel();
    if (!rootModel) {
        vscode.window.showErrorMessage("Failed to get model data. Check if the model file is loaded correctly.");
        return;
    }

    // Ensure rootModel.namespace exists and is an array
    if (!rootModel.namespace || !Array.isArray(rootModel.namespace) || rootModel.namespace.length === 0) {
        panel.webview.html = createHtmlContent([], "No namespaces found in the model.");
        return;
    }

    // Get user story items from the first namespace
    const firstNamespace = rootModel.namespace[0];
    const userStoryItems = (firstNamespace.userStory || []).map(item => ({
        name: item.name || "",
        storyNumber: item.storyNumber || "",
        storyText: item.storyText || "",
        isIgnored: item.isIgnored || "false",
        isStoryProcessed: item.isStoryProcessed || "false"
    }));

    // Set the webview HTML content
    panel.webview.html = createHtmlContent(userStoryItems);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'addUserStory':
                try {
                    // Get the current model data
                    const currentModel = modelService.getCurrentModel();
                    if (!currentModel || !currentModel.namespace || !Array.isArray(currentModel.namespace) || currentModel.namespace.length === 0) {
                        throw new Error("Model structure is invalid or namespace not found");
                    }

                    // Get the first namespace
                    const namespace = currentModel.namespace[0];
                    if (!namespace.userStory || !Array.isArray(namespace.userStory)) {
                        namespace.userStory = [];
                    }

                    // Validate the story text format
                    const storyText = message.data.storyText;
                    
                    // Check if multiple stories were pasted together
                    const storyCount = (storyText.match(/As a\s+\w+\s*,\s*I want to/gi) || []).length + 
                                      (storyText.match(/A\s+\w+\s+wants to/gi) || []).length;
                    
                    if (storyCount > 1) {
                        panel.webview.postMessage({
                            command: 'addUserStoryError',
                            data: {
                                error: `Multiple user stories detected (${storyCount} stories found). Please enter one user story at a time, or use CSV upload for bulk import.`
                            }
                        });
                        return;
                    }
                    
                    if (!isValidUserStoryFormat(storyText)) {
                        panel.webview.postMessage({
                            command: 'addUserStoryError',
                            data: {
                                error: `Story text format is invalid: "${storyText}". Expected format: "A [Role name] wants to [view, add, update, delete] a [object name]" or "A [Role name] wants to view all [objects] in a [container object name]" (brackets optional, alternate "As a..." format also accepted)`
                            }
                        });
                        return;
                    }

                    // Extract and validate the role from the user story
                    const roleName = extractRoleFromUserStory(storyText);
                    if (!roleName) {
                        panel.webview.postMessage({
                            command: 'addUserStoryError',
                            data: {
                                error: 'Unable to extract role name from the user story. Please ensure the story follows the correct format.'
                            }
                        });
                        return;
                    }

                    // Validate that the role exists in the model
                    if (!isValidRole(roleName, modelService)) {
                        panel.webview.postMessage({
                            command: 'addUserStoryError',
                            data: {
                                error: `Role "${roleName}" does not exist in the model. Please ensure the role is defined in a Role data object with lookup items before creating user stories that reference it.`
                            }
                        });
                        return;
                    }

                    // Extract and validate data objects from the user story
                    const dataObjects = extractDataObjectsFromUserStory(storyText);
                    if (dataObjects.length > 0) {
                        const objectValidation = validateDataObjects(dataObjects, modelService);
                        if (!objectValidation.allValid) {
                            const missingObjectsText = objectValidation.missingObjects.join(', ');
                            panel.webview.postMessage({
                                command: 'addUserStoryError',
                                data: {
                                    error: `Data object(s) "${missingObjectsText}" do not exist in the model. Please ensure the data object(s) are defined in the model before creating user stories that reference them.`
                                }
                            });
                            return;
                        }
                    }

                    // Check for duplicate story text
                    const existingStory = namespace.userStory.find(story => story.storyText === storyText);
                    if (existingStory) {
                        panel.webview.postMessage({
                            command: 'addUserStoryError',
                            data: {
                                error: 'A user story with this text already exists'
                            }
                        });
                        return;
                    }

                    // Create a new user story
                    const newStory = {
                        name: generateGuid(),
                        storyText: storyText
                    };                    // Add the new story to the model
                    namespace.userStory.push(newStory);
                    
                    // Mark that there are unsaved changes
                    if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                        modelService.markUnsavedChanges();
                        console.log(`[UserStoriesView] Marked unsaved changes after adding new story`);
                    } else {
                        console.warn(`[UserStoriesView] modelService.markUnsavedChanges is not available`);
                    }

                    // Send updated items back to the webview
                    panel.webview.postMessage({
                        command: 'userStoryAdded',
                        data: {
                            story: newStory,
                            index: namespace.userStory.length - 1
                        }
                    });

                    console.log(`Added new user story: ${storyText} (in memory only, not saved to file)`);
                } catch (error) {
                    console.error('Error adding user story:', error);
                    vscode.window.showErrorMessage(`Failed to add user story: ${error.message}`);
                }
                break;

            case 'toggleIgnored':
                try {
                    // Get the current model data
                    const currentModel = modelService.getCurrentModel();
                    if (!currentModel || !currentModel.namespace || !Array.isArray(currentModel.namespace) || currentModel.namespace.length === 0) {
                        throw new Error("Model structure is invalid or namespace not found");
                    }

                    // Get the first namespace
                    const namespace = currentModel.namespace[0];
                    if (!namespace.userStory || !Array.isArray(namespace.userStory)) {
                        throw new Error("User story array not found in namespace");
                    }

                    const { index, isIgnored } = message.data;
                    const storyItem = namespace.userStory[index];
                    
                    if (storyItem) {                        // Update the isIgnored value in the model
                        storyItem.isIgnored = isIgnored ? "true" : "false";
                        
                        // Mark that there are unsaved changes
                        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                            modelService.markUnsavedChanges();
                            console.log(`[UserStoriesView] Marked unsaved changes after updating story ignored status`);
                        } else {
                            console.warn(`[UserStoriesView] modelService.markUnsavedChanges is not available`);
                        }
                        
                        console.log(`Updated user story isIgnored status: ${storyItem.storyText} -> ${storyItem.isIgnored} (in memory only, not saved to file)`);
                    } else {
                        throw new Error(`Story item not found at index ${index}`);
                    }
                } catch (error) {
                    console.error('Error updating user story isIgnored status:', error);
                    vscode.window.showErrorMessage(`Failed to update user story: ${error.message}`);
                }
                break;

            case 'downloadCsv':
                try {
                    // Get the current model data
                    const currentModel = modelService.getCurrentModel();
                    if (!currentModel || !currentModel.namespace || !Array.isArray(currentModel.namespace) || currentModel.namespace.length === 0) {
                        throw new Error("Model structure is invalid or namespace not found");
                    }

                    // Get the first namespace
                    const namespace = currentModel.namespace[0];
                    const stories = namespace.userStory || [];

                    // Create CSV content
                    let csvContent = "storyNumber,storyText\n";
                    stories.forEach(story => {
                        // Proper CSV escaping
                        const storyNumber = story.storyNumber || "";
                        const storyText = `"${(story.storyText || "").replace(/"/g, '""')}"`;
                        csvContent += `${storyNumber},${storyText}\n`;
                    });

                    // Generate timestamped filename
                    const now = new Date();
                    const pad = n => n.toString().padStart(2, '0');
                    const y = now.getFullYear();
                    const m = pad(now.getMonth() + 1);
                    const d = pad(now.getDate());
                    const h = pad(now.getHours());
                    const min = pad(now.getMinutes());
                    const s = pad(now.getSeconds());
                    const timestamp = `${y}${m}${d}${h}${min}${s}`;
                    const filename = `user_story_report_${timestamp}.csv`;

                    // Send CSV content back to webview for download
                    panel.webview.postMessage({
                        command: 'csvData',
                        data: {
                            content: csvContent,
                            filename: filename
                        }
                    });
                } catch (error) {
                    console.error('Error generating CSV:', error);
                    vscode.window.showErrorMessage(`Failed to generate CSV: ${error.message}`);
                }
                break;

            case 'uploadCsv':
                try {
                    // Get the current model data
                    const currentModel = modelService.getCurrentModel();
                    if (!currentModel || !currentModel.namespace || !Array.isArray(currentModel.namespace) || currentModel.namespace.length === 0) {
                        throw new Error("Model structure is invalid or namespace not found");
                    }

                    // Get the first namespace
                    const namespace = currentModel.namespace[0];
                    if (!namespace.userStory || !Array.isArray(namespace.userStory)) {
                        namespace.userStory = [];
                    }

                    // Parse CSV content
                    const csvData = message.data.content;
                    const rows = parseCSV(csvData);
                    
                    const results = {
                        added: 0,
                        skipped: 0,
                        errors: []
                    };
                    
                    // Process each row
                    for (const row of rows) {
                        // Skip header row if present
                        if (row.length > 0 && (row[0] === 'storyNumber' || row[0] === 'storyText')) {
                            continue;
                        }
                        
                        // Handle different CSV formats (with or without storyNumber)
                        let storyNumber = null;
                        let storyText = null;
                        
                        if (row.length >= 2) {
                            // Format: storyNumber, storyText
                            storyNumber = row[0].trim();
                            storyText = row[1].trim();
                        } else if (row.length === 1) {
                            // Format: storyText only
                            storyText = row[0].trim();
                        } else {
                            // Empty row
                            continue;
                        }
                        
                        // Skip empty story text
                        if (!storyText) {
                            continue;
                        }
                        
                        // Validate story format
                        if (!isValidUserStoryFormat(storyText)) {
                            results.skipped++;
                            results.errors.push(`Invalid format: "${storyText}"`);
                            continue;
                        }
                        
                        // Extract and validate the role from the user story
                        const roleName = extractRoleFromUserStory(storyText);
                        if (!roleName) {
                            results.skipped++;
                            results.errors.push(`Unable to extract role from: "${storyText}"`);
                            continue;
                        }
                        
                        // Validate that the role exists in the model
                        if (!isValidRole(roleName, modelService)) {
                            results.skipped++;
                            results.errors.push(`Role "${roleName}" does not exist in model: "${storyText}"`);
                            continue;
                        }
                        
                        // Extract and validate data objects from the user story
                        const dataObjects = extractDataObjectsFromUserStory(storyText);
                        if (dataObjects.length > 0) {
                            const objectValidation = validateDataObjects(dataObjects, modelService);
                            if (!objectValidation.allValid) {
                                const missingObjectsText = objectValidation.missingObjects.join(', ');
                                results.skipped++;
                                results.errors.push(`Data object(s) "${missingObjectsText}" do not exist in model: "${storyText}"`);
                                continue;
                            }
                        }
                        
                        // Check for duplicates
                        if (namespace.userStory.some(s => s.storyText === storyText)) {
                            results.skipped++;
                            results.errors.push(`Duplicate: "${storyText}"`);
                            continue;
                        }
                        
                        // Add story to the model
                        const newStory = {
                            name: generateGuid(),
                            storyNumber: storyNumber || "",
                            storyText: storyText
                        };
                        
                        namespace.userStory.push(newStory);
                        results.added++;
                    }
                      // Mark that there are unsaved changes if any stories were added
                    if (results.added > 0) {
                        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                            modelService.markUnsavedChanges();
                            console.log(`[UserStoriesView] Marked unsaved changes after importing ${results.added} stories from CSV`);
                        } else {
                            console.warn(`[UserStoriesView] modelService.markUnsavedChanges is not available`);
                        }
                    }
                    
                    // Send results back to webview
                    panel.webview.postMessage({
                        command: 'csvUploadResults',
                        data: {
                            results: results,
                            stories: namespace.userStory.map(item => ({
                                name: item.name || "",
                                storyNumber: item.storyNumber || "",
                                storyText: item.storyText || "",
                                isIgnored: item.isIgnored || "false",
                                isStoryProcessed: item.isStoryProcessed || "false"
                            }))
                        }
                    });
                } catch (error) {
                    console.error('Error processing CSV upload:', error);
                    vscode.window.showErrorMessage(`Failed to process CSV upload: ${error.message}`);
                }
                break;

            case 'saveCsvToWorkspace':
                try {
                    const fs = require('fs');
                    const path = require('path');
                    // Use the actual workspace root, not extensionPath
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders || workspaceFolders.length === 0) {
                        throw new Error('No workspace folder is open');
                    }
                    const workspaceRoot = workspaceFolders[0].uri.fsPath;
                    const reportDir = path.join(workspaceRoot, 'user_story_reports');
                    if (!fs.existsSync(reportDir)) {
                        fs.mkdirSync(reportDir, { recursive: true });
                    }
                    const filePath = path.join(reportDir, message.data.filename);
                    fs.writeFileSync(filePath, message.data.content, 'utf8');
                    vscode.window.showInformationMessage('CSV file saved to workspace: ' + filePath);
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
                } catch (error) {
                    console.error('Error saving CSV to workspace:', error);
                    vscode.window.showErrorMessage('Failed to save CSV to workspace: ' + error.message);
                }
                break;
        }
    });
}

/**
 * Generates a GUID
 * @returns {string} A new GUID
 */
function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Parses CSV content into rows
 * @param {string} csvText The CSV text to parse
 * @returns {Array} An array of rows, where each row is an array of values
 */
function parseCSV(csvText) {
    const rows = [];
    let inQuote = false;
    let currentValue = "";
    let currentRow = [];
    
    // Handle line endings
    csvText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = i + 1 < csvText.length ? csvText[i + 1] : null;
        
        if (char === '"') {
            if (inQuote && nextChar === '"') {
                // Double quote inside a quoted value
                currentValue += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            // End of value
            currentRow.push(currentValue);
            currentValue = "";
        } else if (char === '\n' && !inQuote) {
            // End of row
            currentRow.push(currentValue);
            rows.push(currentRow);
            currentValue = "";
            currentRow = [];
        } else {
            // Add character to current value
            currentValue += char;
        }
    }
    
    // Handle last value and row if any
    if (currentValue !== "" || currentRow.length > 0) {
        currentRow.push(currentValue);
        rows.push(currentRow);
    }
    
    return rows;
}

/**
 * Creates the HTML content for the webview
 * @param {Array} userStoryItems The user story items to display
 * @param {string} errorMessage Optional error message to display
 * @returns {string} The HTML content
 */
function createHtmlContent(userStoryItems, errorMessage = null) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Stories</title>
    <link rel="stylesheet" href="https://unpkg.com/@vscode/codicons@latest/dist/codicon.css" />
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            padding: 20px;
            background-color: var(--vscode-editor-background);
        }
        
        h1 {
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--vscode-editor-foreground);
        }
        
        .header-container {
            margin-bottom: 20px;
        }
        
        .subtitle {
            margin: 0 0 10px 0;
            color: var(--vscode-descriptionForeground);
        }
        
        hr {
            border: 0;
            height: 1px;
            background-color: var(--vscode-panel-border);
            margin: 0 0 20px 0;
        }
        
        .container {
            margin-bottom: 20px;
        }
        
        .search-container {
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        input[type="text"] {
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            width: 300px;
        }
        
        .search-label {
            margin-right: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th {
            padding: 10px;
            text-align: left;
            background-color: var(--vscode-editor-lineHighlightBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            color: var(--vscode-editor-foreground);
            cursor: pointer;
        }
        
        th:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        td {
            padding: 8px 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        input[type="text"].story-text {
            width: 100%;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 4px 6px;
            border-radius: 2px;
            read-only: true;
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 2px;
            cursor: pointer;
            margin-right: 10px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        /* Icon button styling for toolbar actions */
        .icon-button {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 5px;
            margin-left: 5px;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .icon-button:hover {
            background: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-foreground);
        }
        
        .icon-button:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }
        
        /* Secondary button styling for cancel button */
        #btnCancelAddStory {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        #btnCancelAddStory:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .error-message {
            color: var(--vscode-errorForeground);
            padding: 10px;
            margin: 10px 0;
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 2px;
        }
        
        .success-message {
            color: var(--vscode-terminal-ansiGreen);
            padding: 10px;
            margin: 10px 0;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-terminal-ansiGreen);
            border-radius: 2px;
        }
        
        .btn-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .btn-container > div {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .table-container {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
        }

        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
            background-color: var(--vscode-editor-background);
            margin: 15% auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            width: 60%;
            border-radius: 4px;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .close {
            color: var(--vscode-foreground);
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .modal-body {
            margin-bottom: 15px;
        }
        
        .modal-footer {
            display: flex;
            justify-content: flex-end;
        }
        
        textarea {
            width: 100%;
            min-height: 100px;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            margin-bottom: 10px;
        }
        
        .csv-input {
            display: none;
        }
        
        #messageContainer {
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header-container">
        <h1>User Stories</h1>
        <p class="subtitle">Create and manage user stories that describe features and requirements. After you add a user story, request Model AI Processing to update the model automatically.</p>
        <hr>
    </div>
    
    ${errorMessage ? '<div class="error-message">' + errorMessage + '</div>' : ''}
    <div id="messageContainer"></div>
    
    <div class="container">
        <div class="btn-container">
            <div class="search-container">
                <span class="search-label">Search:</span>
                <input type="text" id="searchInput" placeholder="Filter user stories...">
            </div>
            <div>
                <button id="btnAddStory" class="icon-button" title="Add User Story"><i class="codicon codicon-add"></i></button>
                <input type="file" id="csvFileInput" class="csv-input" accept=".csv">
                <button id="btnUploadCsv" class="icon-button" title="Upload CSV"><i class="codicon codicon-cloud-upload"></i></button>
                <button id="btnDownloadCsv" class="icon-button" title="Download CSV"><i class="codicon codicon-cloud-download"></i></button>
            </div>
        </div>
        
        <div class="table-container">
            <table id="userStoriesTable">
                <thead>
                    <tr>
                        <th data-sort="storyNumber">Story Number</th>
                        <th data-sort="storyText">Story Text</th>
                        <th data-sort="isIgnored">Ignored</th>
                    </tr>
                </thead>
                <tbody>
                    ${userStoryItems.map((item, index) => 
                        '<tr data-index="' + index + '">' +
                        '<td>' + (item.storyNumber || '') + '</td>' +
                        '<td>' + (item.storyText || '') + '</td>' +
                        '<td><input type="checkbox" class="isIgnoredCheckbox" data-index="' + index + '"' + 
                        (item.isIgnored === "true" ? ' checked' : '') + '></td>' +
                        '</tr>'
                    ).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Add User Story Modal -->
    <div id="addStoryModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add User Story</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <label for="storyText">Story Text:</label>
                <textarea id="storyText" placeholder="Enter ONE user story text..."></textarea>
                <p><strong>Enter one user story at a time.</strong> For multiple stories, use CSV upload.<br>
Format: "A [Role name] wants to [view, add, update, delete] a [object name]"<br>
View All format: "A [Role name] wants to view all [objects] in a [container object name]"<br>
Special case: "...in the application" is allowed (application is not validated as a data object)<br>
Alternate format: "As a [Role name], I want to [view, add, update, delete] a [object name]"<br>
Alternate View All: "As a [Role name], I want to view all [objects] in a [container object name]"<br>
<strong>Note:</strong> The role and data object(s) must exist in the model.</p>
                <div id="addStoryError" class="error-message" style="display: none;"></div>
            </div>            <div class="modal-footer">
                <button id="btnConfirmAddStory">Add</button>
                <button id="btnCancelAddStory" >Cancel</button>
            </div>
        </div>
    </div>
    
    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            
            // Cache DOM elements
            const table = document.getElementById('userStoriesTable');
            const searchInput = document.getElementById('searchInput');
            const btnAddStory = document.getElementById('btnAddStory');
            const btnDownloadCsv = document.getElementById('btnDownloadCsv');
            const btnUploadCsv = document.getElementById('btnUploadCsv');
            const csvFileInput = document.getElementById('csvFileInput');
            const addStoryModal = document.getElementById('addStoryModal');
            const btnCancelAddStory = document.getElementById('btnCancelAddStory');
            const btnConfirmAddStory = document.getElementById('btnConfirmAddStory');
            const storyTextInput = document.getElementById('storyText');
            const addStoryError = document.getElementById('addStoryError');
            const messageContainer = document.getElementById('messageContainer');
            const closeModalBtn = document.querySelector('.close');
            
            // Initialize sort direction
            let sortDirection = {
                storyNumber: 'asc',
                storyText: 'asc',
                isIgnored: 'asc'
            };
            
            // Initially store the table data for filtering
            const tableData = Array.from(table.querySelectorAll('tbody tr')).map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    row: row,
                    storyNumber: cells[0].textContent,
                    storyText: cells[1].textContent,
                    isIgnored: cells[2].querySelector('input').checked ? "true" : "false"
                };
            });
            
            // Table sorting functionality
            table.querySelectorAll('th').forEach(th => {
                th.addEventListener('click', () => {
                    const sortBy = th.dataset.sort;
                    const direction = sortDirection[sortBy];
                    
                    // Get all rows
                    const tbody = table.querySelector('tbody');
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    
                    // Sort rows
                    rows.sort((a, b) => {
                        let valueA, valueB;
                        
                        if (sortBy === 'isIgnored') {
                            // For checkbox column, compare checked state
                            valueA = a.querySelector('input.isIgnoredCheckbox').checked;
                            valueB = b.querySelector('input.isIgnoredCheckbox').checked;
                        } else if (sortBy === 'storyNumber') {
                            // For story number column, compare numerically
                            const cellIndexMap = { storyNumber: 0, storyText: 1 };
                            const textA = a.querySelectorAll('td')[cellIndexMap[sortBy]].textContent.trim();
                            const textB = b.querySelectorAll('td')[cellIndexMap[sortBy]].textContent.trim();
                            
                            // Convert to numbers for comparison, defaulting to 0 if not a valid number
                            valueA = isNaN(parseInt(textA)) ? 0 : parseInt(textA);
                            valueB = isNaN(parseInt(textB)) ? 0 : parseInt(textB);
                        } else {
                            // For text columns, compare text content
                            const cellIndexMap = { storyNumber: 0, storyText: 1 };
                            valueA = a.querySelectorAll('td')[cellIndexMap[sortBy]].textContent.trim().toLowerCase();
                            valueB = b.querySelectorAll('td')[cellIndexMap[sortBy]].textContent.trim().toLowerCase();
                        }
                        
                        // Compare values based on direction
                        if (sortBy === 'storyNumber') {
                            // Numeric comparison for story number
                            return direction === 'asc' ? valueA - valueB : valueB - valueA;
                        } else if (direction === 'asc') {
                            return valueA > valueB ? 1 : -1;
                        } else {
                            return valueA < valueB ? 1 : -1;
                        }
                    });
                    
                    // Update sort direction for next click
                    sortDirection[sortBy] = direction === 'asc' ? 'desc' : 'asc';
                    
                    // Re-append rows in sorted order
                    rows.forEach(row => tbody.appendChild(row));
                });
            });
            
            // Handle search/filter functionality
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                
                // Filter the rows
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const storyNumber = row.querySelectorAll('td')[0].textContent.toLowerCase();
                    const storyText = row.querySelectorAll('td')[1].textContent.toLowerCase();
                    
                    if (storyNumber.includes(searchTerm) || storyText.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
            
            // Handle Add User Story button
            btnAddStory.addEventListener('click', () => {
                // Reset form
                storyTextInput.value = '';
                addStoryError.style.display = 'none';
                
                // Show modal
                addStoryModal.style.display = 'block';
                
                // Focus on the story text input for better user experience
                storyTextInput.focus();
            });
            
            // Handle modal close button
            closeModalBtn.addEventListener('click', () => {
                addStoryModal.style.display = 'none';
            });
            
            // Handle cancel button in modal
            btnCancelAddStory.addEventListener('click', () => {
                addStoryModal.style.display = 'none';
            });
            
            // Handle confirm button in modal
            btnConfirmAddStory.addEventListener('click', () => {
                const storyText = storyTextInput.value.trim();
                
                if (!storyText) {
                    addStoryError.textContent = 'Story text cannot be empty';
                    addStoryError.style.display = 'block';
                    return;
                }
                
                // Send message to extension to add the story
                vscode.postMessage({
                    command: 'addUserStory',
                    data: { storyText }
                });
            });
            
            // Handle download CSV button
            btnDownloadCsv.addEventListener('click', () => {
                console.log('[UserStoriesView] Download CSV button clicked');
                vscode.postMessage({
                    command: 'downloadCsv'
                });
            });
            
            // Handle upload CSV button
            btnUploadCsv.addEventListener('click', () => {
                csvFileInput.click();
            });
            
            // Handle CSV file selection
            csvFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    vscode.postMessage({
                        command: 'uploadCsv',
                        data: { content }
                    });
                };
                reader.readAsText(file);
                
                // Reset file input
                csvFileInput.value = '';
            });
            
            // Handle isIgnored checkbox changes
            table.addEventListener('change', (event) => {
                if (event.target.classList.contains('isIgnoredCheckbox')) {
                    const index = event.target.dataset.index;
                    const isIgnored = event.target.checked;
                    
                    vscode.postMessage({
                        command: 'toggleIgnored',
                        data: { index, isIgnored }
                    });
                }
            });
            
            // Handle messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'addUserStoryError':
                        addStoryError.textContent = message.data.error;
                        addStoryError.style.display = 'block';
                        break;
                        
                    case 'userStoryAdded':
                        // Close the modal
                        addStoryModal.style.display = 'none';
                        
                        // Add the story to the table
                        const tbody = table.querySelector('tbody');
                        const newRow = document.createElement('tr');
                        newRow.dataset.index = message.data.index;
                        newRow.innerHTML = 
                            '<td>' + (message.data.story.storyNumber || '') + '</td>' +
                            '<td>' + (message.data.story.storyText || '') + '</td>' +
                            '<td><input type="checkbox" class="isIgnoredCheckbox" data-index="' + message.data.index + '"' + 
                            (message.data.story.isIgnored === "true" ? ' checked' : '') + '></td>';
                        tbody.appendChild(newRow);
                        
                        // Show success message
                        messageContainer.innerHTML = '<div class="success-message">User story added successfully. Remember to save the model to persist changes.</div>';
                        setTimeout(() => {
                            messageContainer.innerHTML = '';
                        }, 5000);
                        break;
                        
                    case 'csvData':
                        // Download CSV file
                        try {
                            console.log('[UserStoriesView] Received csvData message from extension', message.data);
                            // Send a message to the extension host to save the file in the workspace
                            vscode.postMessage({
                                command: 'saveCsvToWorkspace',
                                data: {
                                    content: message.data.content,
                                    filename: message.data.filename
                                }
                            });
                        } catch (e) {
                            console.error('[UserStoriesView] Failed to trigger CSV workspace save:', e);
                            messageContainer.innerHTML = '<div class="error-message">Failed to save CSV: ' + e.message + '</div>';
                        }
                        break;
                        
                    case 'csvUploadResults':
                        // Update the table with new data
                        const results = message.data.results;
                        const allStories = message.data.stories;
                        
                        // Update local array
                        userStoryItems = allStories;
                        
                        // Rebuild table
                        const tableBody = table.querySelector('tbody');
                        tableBody.innerHTML = '';
                        
                        allStories.forEach((item, index) => {
                            const row = document.createElement('tr');
                            row.dataset.index = index;
                            row.innerHTML = 
                                '<td>' + (item.storyNumber || '') + '</td>' +
                                '<td>' + (item.storyText || '') + '</td>' +
                                '<td><input type="checkbox" class="isIgnoredCheckbox" data-index="' + index + '"' + 
                                (item.isIgnored === "true" ? ' checked' : '') + '></td>';
                            tableBody.appendChild(row);
                        });
                        
                        // Show results message
                        let resultMessage = '<div class="success-message">CSV upload complete: ' + results.added + ' stories added';
                        
                        if (results.skipped > 0) {
                            resultMessage += ', ' + results.skipped + ' skipped';
                        }
                        
                        resultMessage += '. Remember to save the model to persist changes.</div>';
                        
                        if (results.errors.length > 0) {
                            resultMessage += '<div class="error-message">Issues found:<br>';
                            // Show up to 3 errors to avoid overwhelming the user
                            for (let i = 0; i < Math.min(results.errors.length, 3); i++) {
                                resultMessage += '- ' + results.errors[i] + '<br>';
                            }
                            
                            if (results.errors.length > 3) {
                                resultMessage += '...and ' + (results.errors.length - 3) + ' more issues';
                            }
                            
                            resultMessage += '</div>';
                        }
                        
                        messageContainer.innerHTML = resultMessage;
                        
                        // Clear message after some time
                        setTimeout(() => {
                            messageContainer.innerHTML = '';
                        }, 10000);
                        break;
                }
            });
        })();
    </script>
</body>
</html>`;
}

module.exports = {
    showUserStoriesView,
    getUserStoriesPanel,
    closeUserStoriesPanel,
    getUserStoriesPanel,
    closeUserStoriesPanel
};
