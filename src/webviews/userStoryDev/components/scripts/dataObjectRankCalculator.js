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
 * Gets the primary (lowest rank) data object referenced in a user story
 * @param {string} storyText - The user story text
 * @param {Array} allDataObjects - Array of all data objects from the model
 * @returns {Object} Object with { dataObjectName, rank }
 */
function getPrimaryDataObjectForStory(storyText, allDataObjects) {
    // Extract data objects from story text
    const extractedObjects = extractDataObjectsFromStory(storyText);
    
    if (extractedObjects.length === 0) {
        return { dataObjectName: null, rank: 999 };
    }
    
    // Calculate rank for each extracted object
    const objectRanks = extractedObjects.map(objName => {
        const rank = calculateDataObjectRank(objName, allDataObjects);
        return { dataObjectName: objName, rank: rank };
    });
    
    // Sort by rank (ascending) and return the one with lowest rank (highest priority)
    objectRanks.sort((a, b) => a.rank - b.rank);
    
    console.log(`Story references: ${objectRanks.map(o => `${o.dataObjectName}(rank ${o.rank})`).join(', ')}`);
    
    return objectRanks[0];
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
        
        // Calculate primary data object and rank for each story
        const storiesWithRank = incompleteItems.map(item => {
            const primaryObject = getPrimaryDataObjectForStory(item.storyText, dataObjects);
            
            return {
                ...item,
                primaryDataObject: primaryObject.dataObjectName,
                dataObjectRank: primaryObject.rank
            };
        });
        
        // Sort by rank (ascending), then by story number (ascending) as tiebreaker
        storiesWithRank.sort((a, b) => {
            if (a.dataObjectRank !== b.dataObjectRank) {
                return a.dataObjectRank - b.dataObjectRank;
            }
            return a.storyNumber - b.storyNumber;
        });
        
        // Assign new queue positions (10, 20, 30, etc.)
        const updates = storiesWithRank.map((story, index) => {
            const newPosition = (index + 1) * 10;
            
            console.log(`Story ${story.storyNumber}: "${story.storyText?.substring(0, 50)}..." -> Data Object: ${story.primaryDataObject || 'none'}, Rank: ${story.dataObjectRank}, New Position: ${newPosition}`);
            
            return {
                storyId: story.storyId,
                developmentQueuePosition: newPosition,
                primaryDataObject: story.primaryDataObject,
                dataObjectRank: story.dataObjectRank
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
