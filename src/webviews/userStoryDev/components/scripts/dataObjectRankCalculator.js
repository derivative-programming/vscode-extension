// Description: Data Object Rank Calculator - calculates queue positions based on data object hierarchy rank
// Created: October 12, 2025
// Last Modified: October 12, 2025

/**
 * Extracts data object names from a user story text.
 * This follows the same logic as extractDataObjectsFromUserStory in userStoryUtils.ts
 * @param {string} text - User story text
 * @returns {Array<string>} Array of extracted object names
 */
function extractDataObjectsFromStory(text) {
    if (!text || typeof text !== "string") { 
        return []; 
    }
    
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
            
            // Add variants
            if (objectName && objectName !== 'application') {
                addSingularPluralVariants(objectName, dataObjects);
            }
        }
    }
    
    return dataObjects;
}

/**
 * Helper to add both singular and plural variants of a word to the array
 * @param {string} word - The word to process
 * @param {Array<string>} targetArray - Array to add variants to
 */
function addSingularPluralVariants(word, targetArray) {
    if (!word) {
        return;
    }
    
    const cleaned = word.trim().toLowerCase();
    if (!cleaned) {
        return;
    }
    
    // Add the original word
    if (!targetArray.includes(cleaned)) {
        targetArray.push(cleaned);
    }
    
    // Try to generate singular/plural variants
    if (cleaned.endsWith('s')) {
        // Might be plural, try singular
        const singular = cleaned.substring(0, cleaned.length - 1);
        if (!targetArray.includes(singular)) {
            targetArray.push(singular);
        }
    } else {
        // Might be singular, try plural
        const plural = cleaned + 's';
        if (!targetArray.includes(plural)) {
            targetArray.push(plural);
        }
    }
}

/**
 * Converts a space-separated name to PascalCase
 * e.g., "customer email request" -> "CustomerEmailRequest"
 * @param {string} name - Space-separated name
 * @returns {string} PascalCase version of the name
 */
function toPascalCase(name) {
    if (!name) {
        return '';
    }
    
    return name
        .toLowerCase()
        .split(/[\s_-]+/) // Split on spaces, underscores, or hyphens
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

/**
 * Checks if two data object names match (case-insensitive, handles plurals and PascalCase)
 * @param {string} name1 - First name to compare (from model, likely PascalCase)
 * @param {string} name2 - Second name to compare (from user story, likely space-separated)
 * @returns {boolean} True if names match
 */
function isDataObjectMatch(name1, name2) {
    if (!name1 || !name2) {
        return false;
    }
    
    const lower1 = name1.toLowerCase().trim();
    const lower2 = name2.toLowerCase().trim();
    
    // Exact match (case-insensitive)
    if (lower1 === lower2) {
        return true;
    }
    
    // Check singular/plural variants
    if (lower1 === lower2 + 's' || lower1 + 's' === lower2) {
        return true;
    }
    
    // Convert name2 (from user story) to PascalCase and compare
    const name2Pascal = toPascalCase(name2).toLowerCase();
    if (lower1 === name2Pascal) {
        return true;
    }
    
    // Check PascalCase version with plural
    if (lower1 === name2Pascal + 's' || lower1 + 's' === name2Pascal) {
        return true;
    }
    
    return false;
}

/**
 * Calculates the hierarchy rank for a data object based on its parent relationships
 * Rank 1 = no parent (root object)
 * Rank 2 = children of rank 1 objects
 * Rank 3 = children of rank 2 objects, etc.
 * 
 * @param {string} dataObjectName - Name of the data object
 * @param {Array} allDataObjects - Array of all data objects from the model
 * @returns {number} The rank of the data object (1 = highest priority, higher numbers = lower priority)
 */
function calculateDataObjectRank(dataObjectName, allDataObjects) {
    if (!dataObjectName || !allDataObjects || allDataObjects.length === 0) {
        return 999; // Unknown rank - lowest priority
    }
    
    // Find the data object in the list (case-insensitive with plural handling)
    const dataObject = allDataObjects.find(obj => 
        obj.name && isDataObjectMatch(obj.name, dataObjectName)
    );
    
    if (!dataObject) {
        console.log(`Data object '${dataObjectName}' not found in model`);
        return 999; // Not found - lowest priority
    }
    
    // Check if object has a parent
    const parentName = dataObject.parentObjectName && dataObject.parentObjectName.trim() 
        ? dataObject.parentObjectName.trim() 
        : null;
    
    if (!parentName) {
        // No parent = rank 1 (highest priority - root object)
        return 1;
    }
    
    // Find parent and recursively calculate rank
    const parent = allDataObjects.find(obj => 
        obj.name && isDataObjectMatch(obj.name, parentName)
    );
    
    if (!parent) {
        // Parent not found, treat as root
        console.log(`Parent '${parentName}' not found for object '${dataObjectName}', treating as root`);
        return 1;
    }
    
    // Recursively calculate parent's rank and add 1
    return calculateDataObjectRank(parent.name, allDataObjects) + 1;
}

/**
 * Extracts the action from a user story text
 * Based on the logic from userStoriesView.js
 * @param {string} text - User story text
 * @returns {string} The extracted action or 'unknown' if not found
 */
function extractActionFromUserStory(text) {
    if (!text || typeof text !== "string") {
        return "unknown";
    }
    
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract action from: ...wants to [action]... (case insensitive)
    const re1 = /wants to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
    const match1 = t.match(re1);
    if (match1) { 
        const action = match1[1].toLowerCase();
        // Normalize action variants
        if (action === 'create') {
            return "add";
        }
        if (action === 'edit') {
            return "update";
        }
        if (action === 'remove') {
            return "delete";
        }
        return action;
    }
    
    // Regex to extract action from: ...I want to [action]... (case insensitive)
    const re2 = /I want to\s+(view all|view|add|create|update|edit|delete|remove)(?:\s+(?:a|an|all))?\s+/i;
    const match2 = t.match(re2);
    if (match2) { 
        const action = match2[1].toLowerCase();
        // Normalize action variants
        if (action === 'create') {
            return "add";
        }
        if (action === 'edit') {
            return "update";
        }
        if (action === 'remove') {
            return "delete";
        }
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
 * Gets the action order for sorting
 * Add = 0, View All = 1, View = 2, Update = 3, Delete = 4, Other = 5
 * @param {string} action - The action string
 * @returns {number} The sort order for the action
 */
function getActionOrder(action) {
    const actionLower = (action || 'unknown').toLowerCase();
    
    switch (actionLower) {
        case 'add':
        case 'create':
            return 0;
        case 'view all':
            return 1;
        case 'view':
            return 2;
        case 'update':
        case 'edit':
            return 3;
        case 'delete':
        case 'remove':
            return 4;
        default:
            return 5; // unknown or other actions
    }
}

/**
 * Resolves an extracted object name to the actual object name in the model
 * Handles plural/singular variants and PascalCase conversion
 * @param {string} extractedName - The name extracted from user story text
 * @param {Array} allDataObjects - Array of all data objects from the model
 * @returns {string|null} The actual object name from the model, or null if not found
 */
function resolveDataObjectName(extractedName, allDataObjects) {
    if (!extractedName || !allDataObjects || allDataObjects.length === 0) {
        return null;
    }
    
    // Find matching object in model
    const matchedObject = allDataObjects.find(obj => 
        obj.name && isDataObjectMatch(obj.name, extractedName)
    );
    
    return matchedObject ? matchedObject.name : null;
}

/**
 * Gets the primary (lowest rank) data object referenced in a user story
 * @param {string} storyText - The user story text
 * @param {Array} allDataObjects - Array of all data objects from the model
 * @returns {Object} Object with { dataObjectName, rank, action, actionOrder }
 */
function getPrimaryDataObjectForStory(storyText, allDataObjects) {
    // Extract data objects from story text
    const extractedObjects = extractDataObjectsFromStory(storyText);
    
    // Extract action from story text
    const action = extractActionFromUserStory(storyText);
    const actionOrder = getActionOrder(action);
    
    if (extractedObjects.length === 0) {
        return { 
            dataObjectName: null, 
            rank: 999, 
            action: action, 
            actionOrder: actionOrder 
        };
    }
    
    // Resolve extracted names to actual model object names and calculate ranks
    const objectRanks = [];
    for (const extractedName of extractedObjects) {
        const actualName = resolveDataObjectName(extractedName, allDataObjects);
        if (actualName) {
            const rank = calculateDataObjectRank(actualName, allDataObjects);
            objectRanks.push({ 
                extractedName: extractedName,
                dataObjectName: actualName, 
                rank: rank 
            });
        } else {
            console.log(`Could not resolve extracted name '${extractedName}' to a model object`);
        }
    }
    
    if (objectRanks.length === 0) {
        console.log(`No valid data objects found in story`);
        return { 
            dataObjectName: null, 
            rank: 999, 
            action: action, 
            actionOrder: actionOrder 
        };
    }
    
    // Special handling for "view all" - prioritize the first object (the one being viewed)
    // Example: "view all Organizations in a Customer" -> Organizations is the target
    let primaryObject;
    if (action === 'view all' && objectRanks.length >= 2) {
        // For "view all X in Y", the first extracted object (X) is the target
        primaryObject = objectRanks[0];
        console.log(`Story references: ${objectRanks.map(o => `${o.dataObjectName}(rank ${o.rank})`).join(', ')}, action: ${action}(order ${actionOrder}), using first object for view all: ${primaryObject.dataObjectName}`);
    } else {
        // For other actions, use the lowest rank (highest priority) object
        objectRanks.sort((a, b) => a.rank - b.rank);
        primaryObject = objectRanks[0];
        console.log(`Story references: ${objectRanks.map(o => `${o.dataObjectName}(rank ${o.rank})`).join(', ')}, action: ${action}(order ${actionOrder}), using lowest rank: ${primaryObject.dataObjectName}`);
    }
    
    return {
        dataObjectName: primaryObject.dataObjectName,
        rank: primaryObject.rank,
        action: action,
        actionOrder: actionOrder
    };
}

/**
 * Calculate queue positions for all incomplete stories based on data object hierarchy rank
 * This is the main function called by the "Calculate Queue Position" button
 */
async function calculateQueueByDataObjectRank() {
    console.log('Calculating queue positions based on data object hierarchy rank...');
    
    // Show spinner
    showSpinner();
    
    try {
        // Request data object list from extension
        vscode.postMessage({
            command: 'getDataObjectsForRanking'
        });
        
        // The extension will respond with 'setDataObjectsForRanking' message
        // and then we'll continue in handleDataObjectRankingResponse
        
    } catch (error) {
        console.error('Error calculating queue positions:', error);
        hideSpinner();
        alert('Error calculating queue positions: ' + error.message);
    }
}

/**
 * Handle the response from extension with data objects and complete the ranking
 * @param {Array} dataObjects - Array of all data objects from the model
 */
function handleDataObjectRankingResponse(dataObjects) {
    try {
        console.log(`Received ${dataObjects.length} data objects for ranking`);
        
        // Filter to incomplete stories only
        const incompleteItems = allItems.filter(item => {
            return item.devStatus !== 'completed' && !item.isIgnored;
        });
        
        console.log(`Processing ${incompleteItems.length} incomplete stories`);
        
        // Calculate primary data object, rank, and action for each story
        const storiesWithRank = incompleteItems.map(item => {
            const primaryObject = getPrimaryDataObjectForStory(item.storyText, dataObjects);
            
            return {
                ...item,
                primaryDataObject: primaryObject.dataObjectName,
                dataObjectRank: primaryObject.rank,
                action: primaryObject.action,
                actionOrder: primaryObject.actionOrder
            };
        });
        
        // Sort by:
        // 1. Data object rank (ascending - lower rank = higher priority)
        // 2. Data object name (alphabetic)
        // 3. Action order (ascending - Add=0, View All=1, View=2, Update=3, Delete=4, Other=5)
        storiesWithRank.sort((a, b) => {
            // First sort by data object rank
            if (a.dataObjectRank !== b.dataObjectRank) {
                return a.dataObjectRank - b.dataObjectRank;
            }
            
            // If same rank, sort by data object name (alphabetically)
            const nameA = a.primaryDataObject || "";
            const nameB = b.primaryDataObject || "";
            if (nameA !== nameB) {
                return nameA.localeCompare(nameB);
            }
            
            // If same data object, sort by action order
            return a.actionOrder - b.actionOrder;
        });
        
        // Assign new queue positions (10, 20, 30, etc.)
        const updates = storiesWithRank.map((story, index) => {
            const newPosition = (index + 1) * 10;
            
            console.log(`Story ${story.storyNumber}: "${story.storyText?.substring(0, 50)}..." -> Data Object: ${story.primaryDataObject || 'none'}, Rank: ${story.dataObjectRank}, Action: ${story.action}(${story.actionOrder}), New Position: ${newPosition}`);
            
            return {
                storyId: story.storyId,
                developmentQueuePosition: newPosition,
                primaryDataObject: story.primaryDataObject,
                dataObjectRank: story.dataObjectRank,
                action: story.action,
                actionOrder: story.actionOrder
            };
        });
        
        // Send updates to extension
        vscode.postMessage({
            command: 'bulkUpdateQueuePositions',
            updates: updates
        });
        
        console.log(`Queue positions calculated successfully for ${updates.length} stories`);
        
        // Show success message
        setTimeout(() => {
            hideSpinner();
            alert(`Queue positions calculated successfully!\n\n${updates.length} stories reordered by data object hierarchy rank.`);
        }, 500);
        
    } catch (error) {
        console.error('Error in handleDataObjectRankingResponse:', error);
        hideSpinner();
        alert('Error calculating queue positions: ' + error.message);
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractDataObjectsFromStory,
        calculateDataObjectRank,
        getPrimaryDataObjectForStory,
        calculateQueueByDataObjectRank,
        handleDataObjectRankingResponse
    };
}
