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
    
    const lowerText = text.toLowerCase().trim();
    const dataObjects = [];
    
    // Handle "view all [objects] in a/the [container]" pattern
    const viewAllIndex = lowerText.indexOf('view all ');
    if (viewAllIndex !== -1) {
        const afterViewAll = lowerText.substring(viewAllIndex + 9); // 9 = length of 'view all '
        const inIndex = afterViewAll.indexOf(' in ');
        
        if (inIndex !== -1) {
            // Extract the objects part (between "view all" and "in")
            let objectsPart = afterViewAll.substring(0, inIndex).trim();
            
            // Remove articles like "a", "an", "the", "all" at the beginning
            const articles = ['all ', 'a ', 'an ', 'the '];
            for (const article of articles) {
                if (objectsPart.startsWith(article)) {
                    objectsPart = objectsPart.substring(article.length);
                    break;
                }
            }
            
            // Extract the container part (after "in a/the")
            let containerPart = afterViewAll.substring(inIndex + 4).trim(); // 4 = length of ' in '
            
            // Remove articles at the beginning of container
            for (const article of articles) {
                if (containerPart.startsWith(article)) {
                    containerPart = containerPart.substring(article.length);
                    break;
                }
            }
            
            // Stop at common sentence endings
            const endings = [' for ', ' to ', ' when ', ' where ', ' with ', ' by ', ' from '];
            for (const ending of endings) {
                const endIndex = containerPart.indexOf(ending);
                if (endIndex !== -1) {
                    containerPart = containerPart.substring(0, endIndex);
                    break;
                }
            }
            
            // Add the objects being viewed
            if (objectsPart) {
                addSingularPluralVariants(objectsPart, dataObjects);
            }
            
            // Add the container object (but not "application")
            if (containerPart && containerPart !== 'application') {
                addSingularPluralVariants(containerPart, dataObjects);
            }
            
            // Return early - we handled the "view all" case, don't process other patterns
            return dataObjects;
        }
    }
    
    // Handle simple patterns like "view/add/edit/delete a [object]" only if NOT a "view all" case
    const actionWords = ['view ', 'add ', 'create ', 'update ', 'edit ', 'delete ', 'remove '];
    for (const action of actionWords) {
        const actionIndex = lowerText.indexOf(action);
        if (actionIndex !== -1) {
            let afterAction = lowerText.substring(actionIndex + action.length).trim();
            
            // Remove articles
            const articles = ['all ', 'a ', 'an ', 'the '];
            for (const article of articles) {
                if (afterAction.startsWith(article)) {
                    afterAction = afterAction.substring(article.length);
                    break;
                }
            }
            
            // Extract the object name (stop at common word boundaries)
            const boundaries = [' in ', ' for ', ' to ', ' when ', ' where ', ' with ', ' by ', ' from ', ' of ', ' and ', ' or '];
            let objectName = afterAction;
            for (const boundary of boundaries) {
                const boundaryIndex = objectName.indexOf(boundary);
                if (boundaryIndex !== -1) {
                    objectName = objectName.substring(0, boundaryIndex);
                    break;
                }
            }
            
            // Clean up and add if valid
            objectName = objectName.trim();
            if (objectName) {
                addSingularPluralVariants(objectName, dataObjects);
            }
        }
    }
    
    return dataObjects;
}

/**
 * Extracts the action from a user story text using sophisticated pattern matching.
 * Based on the proven extraction logic from the page mapping view.
 * @param {string} text User story text
 * @returns {string} The extracted action or 'unknown' if not found
 */
function extractActionFromUserStory(text) {
    if (!text || typeof text !== "string") { return "unknown"; }
    
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract action from: ...wants to [action]... (case insensitive)
    // Updated to handle "view all" properly without requiring additional "a|an|all" after it
    const re1 = /wants to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
    const match1 = t.match(re1);
    if (match1) { 
        const action = match1[1].toLowerCase();
        // Normalize action variants
        if (action === 'create') { return "add"; }
        if (action === 'edit') { return "update"; }
        if (action === 'remove') { return "delete"; }
        return action;
    }
    
    // Regex to extract action from: ...I want to [action]... (case insensitive)
    const re2 = /I want to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
    const match2 = t.match(re2);
    if (match2) { 
        const action = match2[1].toLowerCase();
        // Normalize action variants
        if (action === 'create') { return "add"; }
        if (action === 'edit') { return "update"; }
        if (action === 'remove') { return "delete"; }
        return action;
    }
    
    // Fallback: Simple word matching for edge cases
    const lowerText = text.toLowerCase();
    if (lowerText.includes('view all')) {
        return "view all";
    }
    
    const actions = ['view', 'add', 'update', 'delete'];
    for (const action of actions) {
        const actionRegex = new RegExp(`\\b${action}\\b`, 'i');
        if (actionRegex.test(lowerText)) {
            return action;
        }
    }
    
    return "unknown";
}

/**
 * Helper function to add singular/plural variants of an object name
 * @param {string} objectName The object name to add variants for
 * @param {string[]} dataObjects The array to add variants to
 */
function addSingularPluralVariants(objectName, dataObjects) {
    // Add the original object name
    if (!dataObjects.includes(objectName)) {
        dataObjects.push(objectName);
    }
    
    // Add PascalCase version for multi-word names
    const pascalCase = toPascalCase(objectName);
    if (pascalCase && pascalCase !== objectName && !dataObjects.includes(pascalCase)) {
        dataObjects.push(pascalCase);
    }
    
    // Add singular/plural variants for both original and PascalCase
    const variants = [objectName];
    if (pascalCase && pascalCase !== objectName) {
        variants.push(pascalCase);
    }
    
    for (const variant of variants) {
        if (variant.endsWith('s') && variant.length > 1) {
            const singular = variant.slice(0, -1);
            if (!dataObjects.includes(singular)) {
                dataObjects.push(singular);
            }
        } else {
            const plural = variant + 's';
            if (!dataObjects.includes(plural)) {
                dataObjects.push(plural);
            }
        }
    }
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
        
        // Group variants by base concept (e.g., "customer", "Customer", "customers" are all variations of the same concept)
        const conceptGroups = groupVariantsByConcept(objectNames);
        
        for (const conceptGroup of conceptGroups) {
            let conceptValid = false;
            const groupValidObjects = [];
            const groupMissingObjects = [];
            
            for (const objectName of conceptGroup) {
                const searchName = objectName.toLowerCase();
                const searchPascal = toPascalCase(objectName);
                const searchSpaced = toSpacedFormat(objectName).toLowerCase();
                
                const found = modelObjectNames.some(modelObj => {
                    // Direct matches
                    const directMatches = modelObj.lower === searchName ||
                        modelObj.lower === searchPascal.toLowerCase() ||
                        modelObj.lower === searchSpaced ||
                        modelObj.spacedFormat === searchName ||
                        modelObj.spacedFormat === searchSpaced;
                    
                    // Singular/plural variant matches
                    let variantMatches = false;
                    if (!directMatches) {
                        // Check if we're searching for plural and model has singular
                        if (searchName.endsWith('s') && searchName.length > 1) {
                            const singular = searchName.slice(0, -1);
                            variantMatches = modelObj.lower === singular;
                        }
                        // Check if we're searching for singular and model has plural  
                        else {
                            const plural = searchName + 's';
                            variantMatches = modelObj.lower === plural;
                        }
                    }
                    
                    return directMatches || variantMatches;
                });
                
                if (found) {
                    groupValidObjects.push(objectName);
                    conceptValid = true;
                } else {
                    groupMissingObjects.push(objectName);
                }
            }
            
            // If at least one variant in this concept group is valid, consider the concept valid
            if (conceptValid) {
                result.validObjects.push(...groupValidObjects);
            } else {
                // Only report missing if NO variants of this concept exist
                result.missingObjects.push(...groupMissingObjects);
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
 * Groups variant object names by their base concept
 * @param {string[]} objectNames Array of object names
 * @returns {string[][]} Array of arrays, each containing variants of the same concept
 */
function groupVariantsByConcept(objectNames) {
    const groups = [];
    const processed = new Set();
    
    for (const objectName of objectNames) {
        if (processed.has(objectName)) {
            continue;
        }
        
        const group = [objectName];
        processed.add(objectName);
        
        // Find all variants of this concept
        const baseName = objectName.toLowerCase().replace(/s$/, '').replace(/\s+/g, '');
        
        for (const otherName of objectNames) {
            if (processed.has(otherName)) {
                continue;
            }
            
            const otherBaseName = otherName.toLowerCase().replace(/s$/, '').replace(/\s+/g, '');
            
            if (baseName === otherBaseName) {
                group.push(otherName);
                processed.add(otherName);
            }
        }
        
        groups.push(group);
    }
    
    return groups;
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
function showUserStoriesView(context, modelService, initialTab) {
    if (!modelService || !modelService.isFileLoaded()) {
        // Use VS Code API from the imported context, not from a global vscode variable
        vscode.window.showErrorMessage("No project is currently loaded.");
        return;
    }    // Create a consistent panel ID
    const panelId = 'userStoriesView';
    console.log(`showUserStoriesView called (panelId: ${panelId}, initialTab: ${initialTab})`);
    
    // Store reference to context and modelService
    userStoryPanel.context = context;
    userStoryPanel.modelService = modelService;
    
    // Check if panel already exists
    if (activePanels.has(panelId)) {
        console.log(`Panel already exists for user stories view, revealing existing panel`);
        // Panel exists, reveal it instead of creating a new one
        const existingPanel = activePanels.get(panelId);
        existingPanel.reveal(vscode.ViewColumn.One);
        
        // If initialTab is specified, send message to switch to that tab
        if (initialTab) {
            existingPanel.webview.postMessage({
                command: 'switchToTab',
                data: { tabName: initialTab }
            });
        }
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

    // Set the webview HTML content with optional initial tab
    panel.webview.html = createHtmlContent(userStoryItems, null, initialTab);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'addUserStory': {
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

                    // Validate the story text format - now supporting multiple stories one per line
                    const inputText = message.data.storyText;
                    const storyLines = inputText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                    
                    if (storyLines.length === 0) {
                        panel.webview.postMessage({
                            command: 'addUserStoryError',
                            data: {
                                error: 'No valid story lines found. Please enter at least one user story.'
                            }
                        });
                        return;
                    }
                    
                    const results = {
                        added: 0,
                        skipped: 0,
                        errors: [],
                        addedStories: []
                    };
                    
                    // Process each story line
                    for (let i = 0; i < storyLines.length; i++) {
                        const storyText = storyLines[i];
                        const lineNumber = i + 1;
                        
                        try {
                            // Validate format
                            if (!isValidUserStoryFormat(storyText)) {
                                results.skipped++;
                                results.errors.push(`Line ${lineNumber}: Invalid format - "${storyText}"`);
                                continue;
                            }

                            // Extract and validate the role from the user story
                            const roleName = extractRoleFromUserStory(storyText);
                            if (!roleName) {
                                results.skipped++;
                                results.errors.push(`Line ${lineNumber}: Unable to extract role - "${storyText}"`);
                                continue;
                            }

                            // Validate that the role exists in the model
                            if (!isValidRole(roleName, modelService)) {
                                results.skipped++;
                                results.errors.push(`Line ${lineNumber}: Role "${roleName}" does not exist in model - "${storyText}"`);
                                continue;
                            }

                            // Extract and validate data objects from the user story
                            const dataObjects = extractDataObjectsFromUserStory(storyText);
                            console.log('[DEBUG] Extracted data objects from story:', storyText);
                            console.log('[DEBUG] Data objects found:', dataObjects);
                            if (dataObjects.length > 0) {
                                const objectValidation = validateDataObjects(dataObjects, modelService);
                                console.log('[DEBUG] Validation result:', objectValidation);
                                console.log('[DEBUG] Missing objects:', objectValidation.missingObjects);
                                console.log('[DEBUG] Valid objects:', objectValidation.validObjects);
                                if (!objectValidation.allValid) {
                                    const missingObjectsText = objectValidation.missingObjects.join(', ');
                                    results.skipped++;
                                    results.errors.push(`Line ${lineNumber}: Data object(s) "${missingObjectsText}" do not exist in model - "${storyText}"`);
                                    continue;
                                }
                            }

                            // Check for duplicate story text
                            const existingStory = namespace.userStory.find(story => story.storyText === storyText);
                            if (existingStory) {
                                results.skipped++;
                                results.errors.push(`Line ${lineNumber}: Duplicate story - "${storyText}"`);
                                continue;
                            }

                            // Create a new user story
                            const newStory = {
                                name: generateGuid(),
                                storyText: storyText
                            };

                            // Add the new story to the model
                            namespace.userStory.push(newStory);
                            results.added++;
                            results.addedStories.push({
                                story: newStory,
                                index: namespace.userStory.length - 1
                            });
                            
                        } catch (error) {
                            results.skipped++;
                            results.errors.push(`Line ${lineNumber}: Error processing story - ${error.message}`);
                        }
                    }
                    
                    // Mark that there are unsaved changes if any stories were added
                    if (results.added > 0) {
                        if (modelService && typeof modelService.markUnsavedChanges === 'function') {
                            modelService.markUnsavedChanges();
                            console.log(`[UserStoriesView] Marked unsaved changes after adding ${results.added} stories`);
                        } else {
                            console.warn(`[UserStoriesView] modelService.markUnsavedChanges is not available`);
                        }
                    }

                    // Send results back to webview
                    if (results.added === 0 && results.errors.length > 0) {
                        // All stories failed, show error
                        panel.webview.postMessage({
                            command: 'addUserStoryError',
                            data: {
                                error: results.errors.join('\n')
                            }
                        });
                    } else {
                        // Some or all stories succeeded
                        panel.webview.postMessage({
                            command: 'userStoriesAdded',
                            data: {
                                results: results,
                                stories: results.addedStories
                            }
                        });
                    }

                    console.log(`Added ${results.added} user stories, skipped ${results.skipped} (in memory only, not saved to file)`);
                } catch (error) {
                    console.error('Error adding user stories:', error);
                    vscode.window.showErrorMessage(`Failed to add user stories: ${error.message}`);
                }
                break;
            } // End addUserStory case block

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

            case 'uploadCsv': {
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
            } // End uploadCsv case block

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
                
            case 'saveRoleDistributionPng':
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
                    
                    // Convert base64 to buffer and save
                    const base64Data = message.data.pngData.replace(/^data:image\/png;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    fs.writeFileSync(filePath, buffer);
                    
                    vscode.window.showInformationMessage('PNG file saved to workspace: ' + filePath);
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
                } catch (error) {
                    console.error('Error saving PNG to workspace:', error);
                    vscode.window.showErrorMessage('Failed to save PNG to workspace: ' + error.message);
                }
                break;
                
            case 'showError':
                vscode.window.showErrorMessage(message.data.message);
                break;
                
            case 'refresh':
                // Reload the user stories from the model
                try {
                    const rootModel = modelService.getCurrentModel();
                    if (!rootModel || !rootModel.namespace || !Array.isArray(rootModel.namespace) || rootModel.namespace.length === 0) {
                        panel.webview.postMessage({
                            command: 'refreshError',
                            data: { error: 'No namespaces found in the model.' }
                        });
                        return;
                    }

                    const firstNamespace = rootModel.namespace[0];
                    const userStoryItems = (firstNamespace.userStory || []).map(item => ({
                        name: item.name || "",
                        storyNumber: item.storyNumber || "",
                        storyText: item.storyText || "",
                        isIgnored: item.isIgnored || "false",
                        isStoryProcessed: item.isStoryProcessed || "false"
                    }));

                    // Send refreshed data back to webview
                    panel.webview.postMessage({
                        command: 'refreshComplete',
                        data: { userStoryItems: userStoryItems }
                    });
                } catch (error) {
                    console.error('[UserStoriesView] Error refreshing stories:', error);
                    panel.webview.postMessage({
                        command: 'refreshError',
                        data: { error: 'Error refreshing stories: ' + error.message }
                    });
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
function createHtmlContent(userStoryItems, errorMessage = null, initialTab = null) {
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
            z-index: 1000;
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
        
        /* Tab styling following metrics analysis pattern */
        .validation-header {
            margin-bottom: 20px;
        }
        
        .validation-header h2 {
            margin: 0 0 10px 0;
            color: var(--vscode-foreground);
            font-size: 24px;
        }
        
        .validation-header p {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 20px;
        }
        
        .tab {
            padding: 8px 16px;
            cursor: pointer;
            background-color: var(--vscode-tab-inactiveBackground);
            border: none;
            outline: none;
            color: var(--vscode-tab-inactiveForeground);
            margin-right: 4px;
            border-top-left-radius: 3px;
            border-top-right-radius: 3px;
            user-select: none;
        }
        
        .tab:hover {
            background-color: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
        }
        
        .tab.active {
            background-color: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-bottom: 2px solid var(--vscode-focusBorder);
        }
        
        .tab.active:hover {
            background-color: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
        }
        
        .tab-content {
            display: none;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-top: none;
            border-radius: 0 0 3px 3px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        /* Empty state styling for analytics tab */
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state h3 {
            color: var(--vscode-foreground);
            margin-bottom: 10px;
        }
        
        .empty-state ul {
            color: var(--vscode-foreground);
        }
        
        /* Role Distribution Histogram Styles */
        .histogram-container {
            padding: 20px;
            background: var(--vscode-editor-background);
        }

        .histogram-header {
            margin-bottom: 20px;
        }

        .histogram-header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
        }

        .histogram-title {
            flex: 1;
        }

        .histogram-title h3 {
            margin: 0 0 5px 0;
            color: var(--vscode-foreground);
            font-size: 18px;
            font-weight: 500;
        }

        .histogram-title p {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
        }

        .histogram-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .histogram-refresh-button {
            background: none !important;
        }

        .histogram-viz {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 20px;
            padding: 10px;
            background: var(--vscode-editor-background);
        }

        .histogram-viz.hidden {
            display: none;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        .loading.hidden {
            display: none;
        }

        /* Role Distribution Summary Stats */
        .role-distribution-summary {
            margin-top: 20px;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }

        .summary-stats {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            font-weight: 500;
        }

        .stat-value {
            font-size: 20px;
            color: var(--vscode-foreground);
            font-weight: 600;
        }

        /* Histogram tooltip */
        .role-distribution-tooltip {
            position: absolute;
            background: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            border-radius: 4px;
            padding: 10px;
            font-size: 12px;
            color: var(--vscode-editorHoverWidget-foreground);
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            line-height: 1.5;
        }
        
        /* Spinner overlay */
        .spinner-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .spinner {
            border: 4px solid var(--vscode-progressBar-background);
            border-top: 4px solid var(--vscode-progressBar-foreground);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
    </style>
</head>
<body>
    <div class="validation-header">
        <h2>User Stories</h2>
        <p>Create and manage user stories that describe features and requirements with multiple views</p>
    </div>
    
    <div class="tabs">
        <button class="tab active" data-tab="stories">Stories</button>
        <button class="tab" data-tab="details">Details</button>
        <button class="tab" data-tab="analytics">Role Distribution</button>
    </div>
    
    <div id="stories-tab" class="tab-content active">
        ${errorMessage ? '<div class="error-message">' + errorMessage + '</div>' : ''}
        <div id="messageContainer"></div>
        
        <div class="container">
            <div class="btn-container">
                <div class="search-container">
                    <span class="search-label">Search:</span>
                    <input type="text" id="searchInput" placeholder="Filter user stories...">
                </div>
                <div>
                    <button id="refreshStoriesButton" class="icon-button" title="Refresh Stories"><i class="codicon codicon-refresh"></i></button>
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
    </div>
    
    <div id="details-tab" class="tab-content">
        <div class="container">
            <div class="btn-container">
                <div class="search-container">
                    <span class="search-label">Search:</span>
                    <input type="text" id="detailsSearchInput" placeholder="Filter user story details...">
                </div>
                <div>
                    <button id="refreshDetailsButton" class="icon-button" title="Refresh Details"><i class="codicon codicon-refresh"></i></button>
                </div>
            </div>
            
            <div class="table-container">
                <table id="userStoriesDetailsTable">
                    <thead>
                        <tr>
                            <th data-sort="storyNumber">Story Number</th>
                            <th data-sort="storyText">Story Text</th>
                            <th data-sort="role">Role</th>
                            <th data-sort="action">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userStoryItems.map((item, index) => {
                            const role = extractRoleFromUserStory(item.storyText) || 'Unknown';
                            const action = extractActionFromUserStory(item.storyText);
                            return '<tr data-index="' + index + '">' +
                                '<td>' + (item.storyNumber || '') + '</td>' +
                                '<td>' + (item.storyText || '') + '</td>' +
                                '<td>' + role + '</td>' +
                                '<td>' + action + '</td>' +
                                '</tr>';
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <div id="analytics-tab" class="tab-content" data-role-distribution='${JSON.stringify((() => {
        // Calculate role distribution during HTML generation (server-side)
        const roleCount = new Map();
        userStoryItems.forEach(item => {
            // Skip ignored stories
            if (item.isIgnored === "true") {
                return;
            }
            const role = extractRoleFromUserStory(item.storyText);
            if (role && role !== 'Unknown') {
                const currentCount = roleCount.get(role) || 0;
                roleCount.set(role, currentCount + 1);
            }
        });
        // Convert to array and sort by count (descending)
        return Array.from(roleCount.entries())
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count);
    })())}'>
        <div class="histogram-container">
            <div class="histogram-header">
                <div class="histogram-header-content">
                    <div class="histogram-title">
                        <h3>Role Distribution</h3>
                        <p>Distribution of user stories across roles</p>
                    </div>
                    <div class="histogram-actions">
                        <button id="refreshRoleDistributionButton" class="icon-button histogram-refresh-button" title="Refresh Histogram">
                            <i class="codicon codicon-refresh"></i>
                        </button>
                        <button id="generateRoleDistributionPngBtn" class="icon-button" title="Export as PNG">
                            <i class="codicon codicon-device-camera"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div id="role-distribution-loading" class="loading">Loading role distribution...</div>
            <div id="role-distribution-visualization" class="histogram-viz hidden"></div>
            <div class="role-distribution-summary">
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Roles:</span>
                        <span class="stat-value" id="totalRolesCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Stories:</span>
                        <span class="stat-value" id="totalStoriesCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Avg Stories/Role:</span>
                        <span class="stat-value" id="avgStoriesPerRole">0.0</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Add User Story Modal -->
    <div id="addStoryModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add User Stories</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <label for="storyText">Story Text:</label>
                <textarea id="storyText" placeholder="Enter user story text (one story per line)..."></textarea>
                <p><strong>Enter one or more user stories, one per line.</strong> For CSV import with additional fields, use CSV upload.<br>
Format: "A [Role name] wants to [view, add, update, delete] a [object name]"<br>
View All format: "A [Role name] wants to view all [objects] in a [container object name]"<br>
Special case: "...in the application" is allowed (application is not validated as a data object)<br>
Alternate format: "As a [Role name], I want to [view, add, update, delete] a [object name]"<br>
Alternate View All: "As a [Role name], I want to view all [objects] in a [container object name]"<br>
<strong>Note:</strong> The role and data object(s) must exist in the model.</p>
                <div id="addStoryError" class="error-message" style="display: none;"></div>
            </div>            <div class="modal-footer">
                <button id="btnConfirmAddStory">Add Stories</button>
                <button id="btnCancelAddStory" >Cancel</button>
            </div>
        </div>
    </div>
    
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            
            // Track user story items for updates
            let userStoryItems = [];
            
            // Helper functions for spinner overlay
            function showSpinner() {
                const spinnerOverlay = document.getElementById("spinner-overlay");
                if (spinnerOverlay) {
                    spinnerOverlay.style.display = "flex";
                }
            }
            
            function hideSpinner() {
                const spinnerOverlay = document.getElementById("spinner-overlay");
                if (spinnerOverlay) {
                    spinnerOverlay.style.display = "none";
                }
            }
            
            // Helper function to extract role from user story
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
            
            // Helper function to extract action from user story
            function extractActionFromUserStory(text) {
                if (!text || typeof text !== "string") { return "unknown"; }
                
                const t = text.trim().replace(/\s+/g, " ");
                
                // Regex to extract action from: ...wants to [action]... (case insensitive)
                const re1 = /wants to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
                const match1 = t.match(re1);
                if (match1) { 
                    const action = match1[1].toLowerCase();
                    // Normalize action variants
                    if (action === 'create') { return "add"; }
                    if (action === 'edit') { return "update"; }
                    if (action === 'remove') { return "delete"; }
                    return action;
                }
                
                // Regex to extract action from: ...I want to [action]... (case insensitive)
                const re2 = /I want to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
                const match2 = t.match(re2);
                if (match2) { 
                    const action = match2[1].toLowerCase();
                    // Normalize action variants
                    if (action === 'create') { return "add"; }
                    if (action === 'edit') { return "update"; }
                    if (action === 'remove') { return "delete"; }
                    return action;
                }
                
                return "unknown";
            }
            
            // Initialize tabs
            initializeTabs();
            
            // Handle initial tab selection if provided
            const initialTab = ${initialTab ? `'${initialTab}'` : 'null'};
            if (initialTab) {
                console.log('[UserStoriesView] Switching to initial tab:', initialTab);
                switchTab(initialTab);
            }
            
            // Cache DOM elements with null checks
            const table = document.getElementById('userStoriesTable');
            const detailsTable = document.getElementById('userStoriesDetailsTable');
            const searchInput = document.getElementById('searchInput');
            const detailsSearchInput = document.getElementById('detailsSearchInput');
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
            
            // Initialize tab functionality
            function initializeTabs() {
                const tabs = document.querySelectorAll('.tab');
                
                tabs.forEach(tab => {
                    tab.addEventListener('click', function() {
                        const tabName = this.getAttribute('data-tab');
                        switchTab(tabName);
                    });
                });
            }
            
            // Switch between tabs
            function switchTab(tabName) {
                // Remove active class from all tabs and content
                document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to selected tab and content
                document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
                document.getElementById(tabName + '-tab').classList.add('active');
                
                // Render role distribution histogram when Analytics tab is selected
                if (tabName === 'analytics') {
                    renderRoleDistributionHistogram();
                }
            }
            
            // Calculate role distribution from user story items
            function calculateRoleDistribution(userStoryItems) {
                const roleCount = new Map();
                
                // Count stories per role
                userStoryItems.forEach(item => {
                    // Skip ignored stories
                    if (item.isIgnored === "true") {
                        return;
                    }
                    const role = extractRoleFromUserStory(item.storyText);
                    if (role && role !== 'Unknown') {
                        const currentCount = roleCount.get(role) || 0;
                        roleCount.set(role, currentCount + 1);
                    }
                });
                
                // Convert to array and sort by count (descending)
                const distribution = Array.from(roleCount.entries())
                    .map(([role, count]) => ({ role, count }))
                    .sort((a, b) => b.count - a.count);
                
                return distribution;
            }
            
            // Get bar color based on percentage of max count
            function getBarColor(count, maxCount) {
                const percentage = (count / maxCount) * 100;
                if (percentage >= 50) return '#d73a49';  // Red - Very High
                if (percentage >= 30) return '#f66a0a';  // Orange - High
                if (percentage >= 15) return '#28a745';  // Green - Medium
                return '#6c757d';  // Gray - Low
            }
            
            // Update summary statistics
            function updateSummaryStats(distribution) {
                const totalRolesCount = document.getElementById('totalRolesCount');
                const totalStoriesCount = document.getElementById('totalStoriesCount');
                const avgStoriesPerRole = document.getElementById('avgStoriesPerRole');
                
                if (totalRolesCount && totalStoriesCount && avgStoriesPerRole) {
                    const totalRoles = distribution.length;
                    const totalStories = distribution.reduce((sum, d) => sum + d.count, 0);
                    const avgStories = totalRoles > 0 ? (totalStories / totalRoles).toFixed(1) : '0.0';
                    
                    totalRolesCount.textContent = totalRoles;
                    totalStoriesCount.textContent = totalStories;
                    avgStoriesPerRole.textContent = avgStories;
                }
            }
            
            // Render role distribution histogram using D3.js
            function renderRoleDistributionHistogram() {
                console.log('[UserStoriesView] Rendering role distribution histogram');
                
                const visualization = document.getElementById('role-distribution-visualization');
                const loading = document.getElementById('role-distribution-loading');
                const analyticsTab = document.getElementById('analytics-tab');
                
                if (!visualization || !loading || !analyticsTab) {
                    console.error('[UserStoriesView] Histogram elements not found');
                    return;
                }
                
                // Get pre-calculated distribution from data attribute (server-side generated)
                let distribution = [];
                try {
                    const distributionData = analyticsTab.getAttribute('data-role-distribution');
                    if (distributionData) {
                        distribution = JSON.parse(distributionData);
                    }
                } catch (error) {
                    console.error('[UserStoriesView] Error parsing role distribution data:', error);
                    loading.innerHTML = 'Error loading role distribution data';
                    return;
                }
                
                if (distribution.length === 0) {
                    loading.innerHTML = 'No user story data available';
                    return;
                }
                
                // Hide loading, show visualization
                loading.classList.add('hidden');
                visualization.classList.remove('hidden');
                
                // Clear previous content
                visualization.innerHTML = '';
                
                // Update summary stats
                updateSummaryStats(distribution);
                
                // Setup dimensions
                const margin = {top: 20, right: 20, bottom: 80, left: 60};
                const width = 700 - margin.left - margin.right;
                const height = 400 - margin.top - margin.bottom;
                
                // Create SVG
                const svg = d3.select(visualization)
                    .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                    .style('background', 'var(--vscode-editor-background)');
                
                const g = svg.append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
                
                // Extract data
                const roles = distribution.map(d => d.role);
                const counts = distribution.map(d => d.count);
                const maxCount = Math.max(...counts);
                const totalStories = counts.reduce((sum, count) => sum + count, 0);
                
                // Setup scales
                const xScale = d3.scaleBand()
                    .domain(roles)
                    .range([0, width])
                    .padding(0.2);
                
                const yScale = d3.scaleLinear()
                    .domain([0, Math.max(...counts)])
                    .range([height, 0])
                    .nice();
                
                // Create tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'role-distribution-tooltip')
                    .style('opacity', 0);
                
                // Add bars
                g.selectAll('.role-bar')
                    .data(distribution)
                    .enter()
                    .append('rect')
                    .attr('class', 'role-bar')
                    .attr('x', d => xScale(d.role))
                    .attr('y', d => yScale(d.count))
                    .attr('width', xScale.bandwidth())
                    .attr('height', d => height - yScale(d.count))
                    .attr('fill', d => getBarColor(d.count, maxCount))
                    .attr('stroke', 'var(--vscode-panel-border)')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        const percentage = ((d.count / totalStories) * 100).toFixed(1);
                        
                        d3.select(this)
                            .attr('opacity', 0.8);
                        
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', 0.95);
                        tooltip.html(
                            '<strong>' + d.role + '</strong><br/>' +
                            'Stories: <strong>' + d.count + '</strong><br/>' +
                            'Percentage: <strong>' + percentage + '%</strong>'
                        )
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function(d) {
                        d3.select(this)
                            .attr('opacity', 1);
                        
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    });
                
                // Add value labels on top of bars
                g.selectAll('.bar-label')
                    .data(distribution)
                    .enter()
                    .append('text')
                    .attr('class', 'bar-label')
                    .attr('x', d => xScale(d.role) + xScale.bandwidth() / 2)
                    .attr('y', d => yScale(d.count) - 5)
                    .attr('text-anchor', 'middle')
                    .text(d => d.count)
                    .attr('fill', 'var(--vscode-editor-foreground)')
                    .attr('font-size', '12px')
                    .attr('font-weight', 'bold');
                
                // Add X axis
                g.append('g')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(xScale))
                    .selectAll('text')
                    .style('text-anchor', 'end')
                    .attr('dx', '-.8em')
                    .attr('dy', '.15em')
                    .attr('transform', 'rotate(-45)')
                    .attr('fill', 'var(--vscode-editor-foreground)')
                    .style('font-size', '11px');
                
                // Add Y axis
                g.append('g')
                    .call(d3.axisLeft(yScale).ticks(5))
                    .selectAll('text')
                    .attr('fill', 'var(--vscode-editor-foreground)');
                
                // Add Y axis label
                g.append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('y', 0 - margin.left)
                    .attr('x', 0 - (height / 2))
                    .attr('dy', '1em')
                    .style('text-anchor', 'middle')
                    .style('fill', 'var(--vscode-editor-foreground)')
                    .style('font-size', '12px')
                    .text('Number of User Stories');
                
                // Style axis lines
                g.selectAll('.domain, .tick line')
                    .attr('stroke', 'var(--vscode-panel-border)');
                
                console.log('[UserStoriesView] Role distribution histogram rendered with ' + distribution.length + ' roles');
            }
            
            // Generate PNG export of role distribution histogram
            function generateRoleDistributionPNG() {
                const svgElement = document.querySelector('#role-distribution-visualization svg');
                if (!svgElement) {
                    console.error('No SVG found for PNG export');
                    vscode.postMessage({
                        command: 'showError',
                        data: { message: 'No histogram visualization found to export' }
                    });
                    return;
                }
                
                // Convert SVG to canvas and then to PNG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const data = (new XMLSerializer()).serializeToString(svgElement);
                const DOMURL = window.URL || window.webkitURL || window;
                
                const img = new Image();
                const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
                const url = DOMURL.createObjectURL(svgBlob);
                
                img.onload = function () {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    DOMURL.revokeObjectURL(url);
                    
                    const pngData = canvas.toDataURL('image/png');
                    
                    // Send PNG data to extension for saving
                    vscode.postMessage({
                        command: 'saveRoleDistributionPng',
                        data: { 
                            pngData: pngData,
                            filename: 'user-stories-role-distribution.png'
                        }
                    });
                };
                
                img.src = url;
            }
            
            // Ensure required elements exist before proceeding
            if (!btnAddStory || !addStoryModal || !storyTextInput) {
                console.error('[ERROR] Required DOM elements not found!');
                return;
            }
            
            // Initialize sort direction
            let sortDirection = {
                storyNumber: 'asc',
                storyText: 'asc',
                isIgnored: 'asc'
            };
            
            // Initially store the table data for filtering (with safety check)
            let tableData = [];
            if (table && table.querySelector('tbody')) {
                tableData = Array.from(table.querySelectorAll('tbody tr')).map(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        return {
                            row: row,
                            storyNumber: cells[0].textContent,
                            storyText: cells[1].textContent,
                            isIgnored: cells[2].querySelector('input') ? 
                                cells[2].querySelector('input').checked ? "true" : "false" : "false"
                        };
                    }
                    return null;
                }).filter(item => item !== null);
                
                // Also populate userStoryItems for role distribution
                userStoryItems = tableData.map(item => ({
                    storyNumber: item.storyNumber,
                    storyText: item.storyText,
                    isIgnored: item.isIgnored
                }));
            }
            
            // Table sorting functionality
            if (table) {
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
                    
                    // Update sort indicators in table headers
                    table.querySelectorAll('th').forEach(header => {
                        const headerSortBy = header.dataset.sort;
                        if (headerSortBy) {
                            // Remove existing indicators
                            const headerText = header.textContent.replace(/ ▼| ▲/g, '');
                            
                            if (headerSortBy === sortBy) {
                                // Add indicator for the active sort column
                                header.textContent = headerText + (sortDirection[sortBy] === 'asc' ? ' ▲' : ' ▼');
                            } else {
                                // Just show the column name without indicator
                                header.textContent = headerText;
                            }
                        }
                    });
                    
                    // Re-append rows in sorted order
                    rows.forEach(row => tbody.appendChild(row));
                });
            });
            } // End table safety check
            
            // Handle search/filter functionality
            if (searchInput && table) {
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
            } // End search input safety check
            
            // Details table sorting functionality
            if (detailsTable) {
                // Initialize sort direction for details table
                let detailsSortDirection = {
                    storyNumber: 'asc',
                    storyText: 'asc',
                    role: 'asc',
                    action: 'asc'
                };
                
                detailsTable.querySelectorAll('th').forEach(th => {
                    th.addEventListener('click', () => {
                        const sortBy = th.dataset.sort;
                        const direction = detailsSortDirection[sortBy];
                        
                        // Get all rows
                        const tbody = detailsTable.querySelector('tbody');
                        const rows = Array.from(tbody.querySelectorAll('tr'));
                        
                        // Sort rows
                        rows.sort((a, b) => {
                            let valueA, valueB;
                            
                            if (sortBy === 'storyNumber') {
                                // For story number column, compare numerically
                                const textA = a.querySelectorAll('td')[0].textContent.trim();
                                const textB = b.querySelectorAll('td')[0].textContent.trim();
                                
                                valueA = isNaN(parseInt(textA)) ? 0 : parseInt(textA);
                                valueB = isNaN(parseInt(textB)) ? 0 : parseInt(textB);
                                
                                return direction === 'asc' ? valueA - valueB : valueB - valueA;
                            } else {
                                // For text columns, compare text content
                                const cellIndexMap = { storyNumber: 0, storyText: 1, role: 2, action: 3 };
                                valueA = a.querySelectorAll('td')[cellIndexMap[sortBy]].textContent.trim().toLowerCase();
                                valueB = b.querySelectorAll('td')[cellIndexMap[sortBy]].textContent.trim().toLowerCase();
                                
                                if (direction === 'asc') {
                                    return valueA > valueB ? 1 : -1;
                                } else {
                                    return valueA < valueB ? 1 : -1;
                                }
                            }
                        });
                        
                        // Update sort direction for next click
                        detailsSortDirection[sortBy] = direction === 'asc' ? 'desc' : 'asc';
                        
                        // Update sort indicators in table headers
                        detailsTable.querySelectorAll('th').forEach(header => {
                            const headerSortBy = header.dataset.sort;
                            if (headerSortBy) {
                                // Remove existing indicators
                                const headerText = header.textContent.replace(/ ▼| ▲/g, '');
                                
                                if (headerSortBy === sortBy) {
                                    // Add indicator for the active sort column
                                    header.textContent = headerText + (detailsSortDirection[sortBy] === 'asc' ? ' ▲' : ' ▼');
                                } else {
                                    // Just show the column name without indicator
                                    header.textContent = headerText;
                                }
                            }
                        });
                        
                        // Re-append rows in sorted order
                        rows.forEach(row => tbody.appendChild(row));
                    });
                });
            }
            
            // Details table search functionality
            if (detailsSearchInput && detailsTable) {
                detailsSearchInput.addEventListener('input', () => {
                    const searchTerm = detailsSearchInput.value.toLowerCase();
                    
                    // Filter the rows
                    const rows = detailsTable.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const storyNumber = row.querySelectorAll('td')[0].textContent.toLowerCase();
                        const storyText = row.querySelectorAll('td')[1].textContent.toLowerCase();
                        const role = row.querySelectorAll('td')[2].textContent.toLowerCase();
                        const action = row.querySelectorAll('td')[3].textContent.toLowerCase();
                        
                        if (storyNumber.includes(searchTerm) || 
                            storyText.includes(searchTerm) || 
                            role.includes(searchTerm) || 
                            action.includes(searchTerm)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                });
            }
            
            // Handle Add User Story button
            if (btnAddStory) {
                btnAddStory.addEventListener('click', () => {
                    // Reset form
                    storyTextInput.value = '';
                    addStoryError.style.display = 'none';
                    
                    // Show modal
                    addStoryModal.style.display = 'block';
                    
                    // Focus on the story text input for better user experience
                    setTimeout(() => {
                        storyTextInput.focus();
                    }, 100);
                });
            } else {
                console.error('[ERROR] Add Story button not found!');
            }
            
            // Handle modal close button
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => {
                    addStoryModal.style.display = 'none';
                });
            }
            
            // Handle cancel button in modal
            if (btnCancelAddStory) {
                btnCancelAddStory.addEventListener('click', () => {
                    addStoryModal.style.display = 'none';
                });
            }
            
            // Handle click outside modal to close
            window.addEventListener('click', (event) => {
                if (event.target === addStoryModal) {
                    addStoryModal.style.display = 'none';
                }
            });
            
            // Handle confirm button in modal
            btnConfirmAddStory.addEventListener('click', () => {
                const storyText = storyTextInput.value.trim();
                
                if (!storyText) {
                    addStoryError.textContent = 'Story text cannot be empty';
                    addStoryError.style.display = 'block';
                    return;
                }
                
                // Send message to extension to add the story (can be multiple stories, one per line)
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
            
            // Handle refresh stories button
            const refreshStoriesButton = document.getElementById('refreshStoriesButton');
            if (refreshStoriesButton) {
                refreshStoriesButton.addEventListener('click', () => {
                    console.log('[UserStoriesView] Refreshing stories tab');
                    showSpinner();
                    vscode.postMessage({
                        command: 'refresh'
                    });
                });
            }
            
            // Handle refresh details button
            const refreshDetailsButton = document.getElementById('refreshDetailsButton');
            if (refreshDetailsButton) {
                refreshDetailsButton.addEventListener('click', () => {
                    console.log('[UserStoriesView] Refreshing details tab');
                    showSpinner();
                    vscode.postMessage({
                        command: 'refresh'
                    });
                });
            }
            
            // Handle refresh role distribution button
            const refreshRoleDistributionButton = document.getElementById('refreshRoleDistributionButton');
            if (refreshRoleDistributionButton) {
                refreshRoleDistributionButton.addEventListener('click', () => {
                    console.log('[UserStoriesView] Refreshing role distribution histogram');
                    
                    // Show spinner overlay
                    showSpinner();
                    
                    // Use setTimeout to allow spinner to display before heavy calculation
                    setTimeout(() => {
                        try {
                            // Recalculate distribution from current table state
                            const currentUserStoryItems = [];
                            if (table && table.querySelector('tbody')) {
                                const rows = table.querySelectorAll('tbody tr');
                                rows.forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length >= 2) {
                                        currentUserStoryItems.push({
                                            storyNumber: cells[0].textContent.trim(),
                                            storyText: cells[1].textContent.trim(),
                                            isIgnored: cells[2] && cells[2].querySelector('input') ? 
                                                cells[2].querySelector('input').checked ? "true" : "false" : "false"
                                        });
                                    }
                                });
                            }
                            
                            // Calculate new distribution
                            const newDistribution = calculateRoleDistribution(currentUserStoryItems);
                            
                            // Update data attribute
                            const analyticsTab = document.getElementById('analytics-tab');
                            if (analyticsTab) {
                                analyticsTab.setAttribute('data-role-distribution', JSON.stringify(newDistribution));
                            }
                            
                            // Re-render histogram
                            renderRoleDistributionHistogram();
                        } finally {
                            // Hide spinner after processing
                            hideSpinner();
                        }
                    }, 50); // Small delay to ensure spinner shows
                });
            }
            
            // Handle PNG export button for role distribution
            const generateRoleDistributionPngBtn = document.getElementById('generateRoleDistributionPngBtn');
            if (generateRoleDistributionPngBtn) {
                generateRoleDistributionPngBtn.addEventListener('click', () => {
                    console.log('[UserStoriesView] Generating role distribution PNG');
                    generateRoleDistributionPNG();
                });
            }
            
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
                    case 'switchToTab':
                        // Switch to the specified tab
                        if (message.data && message.data.tabName) {
                            console.log('[UserStoriesView] Received switchToTab command:', message.data.tabName);
                            switchTab(message.data.tabName);
                        }
                        break;
                        
                    case 'addUserStoryError':
                        addStoryError.textContent = message.data.error;
                        addStoryError.style.display = 'block';
                        break;
                        
                    case 'userStoryAdded':
                        // Close the modal
                        addStoryModal.style.display = 'none';
                        
                        // Add the story to the main table
                        const tbody = table.querySelector('tbody');
                        const newRow = document.createElement('tr');
                        newRow.dataset.index = message.data.index;
                        newRow.innerHTML = 
                            '<td>' + (message.data.story.storyNumber || '') + '</td>' +
                            '<td>' + (message.data.story.storyText || '') + '</td>' +
                            '<td><input type="checkbox" class="isIgnoredCheckbox" data-index="' + message.data.index + '"' + 
                            (message.data.story.isIgnored === "true" ? ' checked' : '') + '></td>';
                        tbody.appendChild(newRow);
                        
                        // Add the story to the details table
                        if (detailsTable) {
                            const detailsTbody = detailsTable.querySelector('tbody');
                            const newDetailsRow = document.createElement('tr');
                            newDetailsRow.dataset.index = message.data.index;
                            
                            const role = message.data.story.storyText ? (extractRoleFromUserStory(message.data.story.storyText) || 'Unknown') : 'Unknown';
                            const action = message.data.story.storyText ? extractActionFromUserStory(message.data.story.storyText) : 'unknown';
                            
                            newDetailsRow.innerHTML = 
                                '<td>' + (message.data.story.storyNumber || '') + '</td>' +
                                '<td>' + (message.data.story.storyText || '') + '</td>' +
                                '<td>' + role + '</td>' +
                                '<td>' + action + '</td>';
                            detailsTbody.appendChild(newDetailsRow);
                        }
                        
                        // Show success message
                        messageContainer.innerHTML = '<div class="success-message">User story added successfully. Remember to save the model to persist changes.</div>';
                        setTimeout(() => {
                            messageContainer.innerHTML = '';
                        }, 5000);
                        break;
                        
                    case 'userStoriesAdded': {
                        // Close the modal
                        addStoryModal.style.display = 'none';
                        
                        // Add all new stories to the table
                        const tableBody = table.querySelector('tbody');
                        const results = message.data.results;
                        
                        message.data.stories.forEach(storyData => {
                            // Add to main table
                            const newRow = document.createElement('tr');
                            newRow.dataset.index = storyData.index;
                            newRow.innerHTML = 
                                '<td>' + (storyData.story.storyNumber || '') + '</td>' +
                                '<td>' + (storyData.story.storyText || '') + '</td>' +
                                '<td><input type="checkbox" class="isIgnoredCheckbox" data-index="' + storyData.index + '"' + 
                                (storyData.story.isIgnored === "true" ? ' checked' : '') + '></td>';
                            tableBody.appendChild(newRow);
                            
                            // Add to details table
                            if (detailsTable) {
                                const detailsTbody = detailsTable.querySelector('tbody');
                                const newDetailsRow = document.createElement('tr');
                                newDetailsRow.dataset.index = storyData.index;
                                
                                const role = storyData.story.storyText ? (extractRoleFromUserStory(storyData.story.storyText) || 'Unknown') : 'Unknown';
                                const action = storyData.story.storyText ? extractActionFromUserStory(storyData.story.storyText) : 'unknown';
                                
                                newDetailsRow.innerHTML = 
                                    '<td>' + (storyData.story.storyNumber || '') + '</td>' +
                                    '<td>' + (storyData.story.storyText || '') + '</td>' +
                                    '<td>' + role + '</td>' +
                                    '<td>' + action + '</td>';
                                detailsTbody.appendChild(newDetailsRow);
                            }
                        });
                        
                        // Show results message
                        let resultMessage = '<div class="success-message">';
                        if (results.added === 1) {
                            resultMessage += 'User story added successfully';
                        } else {
                            resultMessage += results.added + ' user stories added successfully';
                        }
                        
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
                        }, 8000);
                        break;
                    } // End userStoriesAdded case block
                        
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
                        
                    case 'refreshComplete': {
                        // Hide spinner
                        hideSpinner();
                        
                        // Update the table with refreshed data
                        const allStories = message.data.userStoryItems;
                        
                        // Update local array
                        userStoryItems = allStories;
                        
                        // Rebuild main table
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
                        
                        // Rebuild details table
                        if (detailsTable) {
                            const detailsTableBody = detailsTable.querySelector('tbody');
                            detailsTableBody.innerHTML = '';
                            
                            allStories.forEach((item, index) => {
                                const detailsRow = document.createElement('tr');
                                detailsRow.dataset.index = index;
                                
                                const role = item.storyText ? (extractRoleFromUserStory(item.storyText) || 'Unknown') : 'Unknown';
                                const action = item.storyText ? extractActionFromUserStory(item.storyText) : 'unknown';
                                
                                detailsRow.innerHTML = 
                                    '<td>' + (item.storyNumber || '') + '</td>' +
                                    '<td>' + (item.storyText || '') + '</td>' +
                                    '<td>' + role + '</td>' +
                                    '<td>' + action + '</td>';
                                detailsTableBody.appendChild(detailsRow);
                            });
                        }
                        
                        // Update role distribution data attribute
                        const analyticsTab = document.getElementById('analytics-tab');
                        if (analyticsTab) {
                            const roleCount = new Map();
                            allStories.forEach(item => {
                                if (item.isIgnored === "true") return;
                                const role = extractRoleFromUserStory(item.storyText);
                                if (role && role !== 'Unknown') {
                                    roleCount.set(role, (roleCount.get(role) || 0) + 1);
                                }
                            });
                            const newDistribution = Array.from(roleCount.entries())
                                .map(([role, count]) => ({ role, count }))
                                .sort((a, b) => b.count - a.count);
                            analyticsTab.setAttribute('data-role-distribution', JSON.stringify(newDistribution));
                        }
                        
                        // Show success message
                        messageContainer.innerHTML = '<div class="success-message">User stories refreshed successfully.</div>';
                        setTimeout(() => {
                            messageContainer.innerHTML = '';
                        }, 3000);
                        break;
                    }
                    
                    case 'refreshError': {
                        // Hide spinner
                        hideSpinner();
                        
                        // Show error message
                        messageContainer.innerHTML = '<div class="error-message">Failed to refresh: ' + message.data.error + '</div>';
                        setTimeout(() => {
                            messageContainer.innerHTML = '';
                        }, 5000);
                        break;
                    }
                        
                    case 'csvUploadResults': {
                        // Update the table with new data
                        const results = message.data.results;
                        const allStories = message.data.stories;
                        
                        // Update local array
                        userStoryItems = allStories;
                        
                        // Rebuild main table
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
                        
                        // Rebuild details table
                        if (detailsTable) {
                            const detailsTableBody = detailsTable.querySelector('tbody');
                            detailsTableBody.innerHTML = '';
                            
                            allStories.forEach((item, index) => {
                                const detailsRow = document.createElement('tr');
                                detailsRow.dataset.index = index;
                                
                                const role = item.storyText ? (extractRoleFromUserStory(item.storyText) || 'Unknown') : 'Unknown';
                                const action = item.storyText ? extractActionFromUserStory(item.storyText) : 'unknown';
                                
                                detailsRow.innerHTML = 
                                    '<td>' + (item.storyNumber || '') + '</td>' +
                                    '<td>' + (item.storyText || '') + '</td>' +
                                    '<td>' + role + '</td>' +
                                    '<td>' + action + '</td>';
                                detailsTableBody.appendChild(detailsRow);
                            });
                        }
                        
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
                    } // End csvUploadResults case block
                }
            });
        })();
    </script>
    
    <!-- Spinner overlay -->
    <div id="spinner-overlay" class="spinner-overlay">
        <div class="spinner"></div>
    </div>
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
