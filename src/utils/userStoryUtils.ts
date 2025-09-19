// userStoryUtils.ts
// Utilities for extracting data objects from user stories
// September 19, 2025

/**
 * Extracts data object names from a user story text.
 * This is a TypeScript version of the JavaScript function in userStoriesView.js
 * @param text User story text
 * @returns Array of extracted object names
 */
export function extractDataObjectsFromUserStory(text: string): string[] {
    if (!text || typeof text !== "string") { 
        return []; 
    }
    
    const lowerText = text.toLowerCase().trim();
    const dataObjects: string[] = [];
    
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
 * Helper function to add singular/plural variants of an object name
 * @param objectName The object name to add variants for
 * @param dataObjects The array to add variants to
 */
function addSingularPluralVariants(objectName: string, dataObjects: string[]): void {
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
 * @param name The spaced name to convert
 * @returns The PascalCase version
 */
function toPascalCase(name: string): string {
    if (!name || typeof name !== "string") { 
        return ""; 
    }
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Checks if an extracted object name matches a data object name with various formats and variants
 * @param extractedName The name extracted from user story
 * @param dataObjectName The actual data object name from the model
 * @returns True if they match (considering case variations and singular/plural)
 */
export function isDataObjectMatch(extractedName: string, dataObjectName: string): boolean {
    if (!extractedName || !dataObjectName) {
        return false;
    }
    
    const extractedLower = extractedName.toLowerCase();
    const dataObjectLower = dataObjectName.toLowerCase();
    
    // Direct matches
    if (extractedLower === dataObjectLower) {
        return true;
    }
    
    // PascalCase conversions
    const extractedPascal = toPascalCase(extractedName).toLowerCase();
    const dataObjectPascal = toPascalCase(dataObjectName).toLowerCase();
    
    if (extractedLower === dataObjectPascal || extractedPascal === dataObjectLower) {
        return true;
    }
    
    // Spaced format conversions
    const extractedSpaced = toSpacedFormat(extractedName).toLowerCase();
    const dataObjectSpaced = toSpacedFormat(dataObjectName).toLowerCase();
    
    if (extractedSpaced === dataObjectLower || extractedLower === dataObjectSpaced) {
        return true;
    }
    
    // Singular/plural variants
    if (extractedLower.endsWith('s') && extractedLower.length > 1) {
        const singular = extractedLower.slice(0, -1);
        if (singular === dataObjectLower || singular === dataObjectPascal || singular === dataObjectSpaced) {
            return true;
        }
    } else {
        const plural = extractedLower + 's';
        if (plural === dataObjectLower || plural === dataObjectPascal || plural === dataObjectSpaced) {
            return true;
        }
    }
    
    // Check if data object has plural and we're looking for singular
    if (dataObjectLower.endsWith('s') && dataObjectLower.length > 1) {
        const dataObjectSingular = dataObjectLower.slice(0, -1);
        if (extractedLower === dataObjectSingular || extractedPascal === dataObjectSingular || extractedSpaced === dataObjectSingular) {
            return true;
        }
    }
    
    return false;
}

/**
 * Converts a PascalCase name to spaced format.
 * @param name The PascalCase name to convert
 * @returns The spaced version
 */
function toSpacedFormat(name: string): string {
    if (!name || typeof name !== "string") { 
        return ""; 
    }
    return name.replace(/([A-Z])/g, ' $1').trim();
}