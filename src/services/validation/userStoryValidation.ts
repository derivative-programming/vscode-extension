// userStoryValidation.ts
// User story extraction and validation logic
// Created on: October 16, 2025
// This file contains validation logic for user story text parsing and validation

import { ModelService } from '../modelService';

/**
 * User story validation result
 */
export interface UserStoryValidationResult {
    valid: boolean;
    error?: string;
    role?: string;
    dataObjects?: string[];
}

/**
 * Extract role from user story text
 * Supports patterns: "A [Role] wants to..." and "As a [Role], I want to..."
 */
export function extractRoleFromUserStory(text: string): string | null {
    if (!text || typeof text !== "string") { 
        return null; 
    }
    
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
 * Extract data objects from user story text
 * Handles patterns: "view all X in Y", "add a X", "update an X", etc.
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
        const afterViewAll = lowerText.substring(viewAllIndex + 9);
        const inIndex = afterViewAll.indexOf(' in ');
        
        if (inIndex !== -1) {
            let objectsPart = afterViewAll.substring(0, inIndex).trim();
            const articles = ['all ', 'a ', 'an ', 'the '];
            for (const article of articles) {
                if (objectsPart.startsWith(article)) {
                    objectsPart = objectsPart.substring(article.length);
                    break;
                }
            }
            
            let containerPart = afterViewAll.substring(inIndex + 4).trim();
            for (const article of articles) {
                if (containerPart.startsWith(article)) {
                    containerPart = containerPart.substring(article.length);
                    break;
                }
            }
            
            const endings = [' for ', ' to ', ' when ', ' where ', ' with ', ' by ', ' from '];
            for (const ending of endings) {
                const endIndex = containerPart.indexOf(ending);
                if (endIndex !== -1) {
                    containerPart = containerPart.substring(0, endIndex);
                    break;
                }
            }
            
            if (objectsPart) {
                addSingularPluralVariants(objectsPart, dataObjects);
            }
            
            if (containerPart && containerPart !== 'application') {
                addSingularPluralVariants(containerPart, dataObjects);
            }
            
            return dataObjects;
        }
    }
    
    // Handle simple patterns like "view/add/edit/delete a [object]"
    const actionWords = ['view ', 'add ', 'create ', 'update ', 'edit ', 'delete ', 'remove '];
    for (const action of actionWords) {
        const actionIndex = lowerText.indexOf(action);
        if (actionIndex !== -1) {
            let afterAction = lowerText.substring(actionIndex + action.length).trim();
            
            const articles = ['all ', 'a ', 'an ', 'the '];
            for (const article of articles) {
                if (afterAction.startsWith(article)) {
                    afterAction = afterAction.substring(article.length);
                    break;
                }
            }
            
            const boundaries = [' in ', ' for ', ' to ', ' when ', ' where ', ' with ', ' by ', ' from ', ' of ', ' and ', ' or '];
            let objectName = afterAction;
            for (const boundary of boundaries) {
                const boundaryIndex = objectName.indexOf(boundary);
                if (boundaryIndex !== -1) {
                    objectName = objectName.substring(0, boundaryIndex);
                    break;
                }
            }
            
            objectName = objectName.trim();
            if (objectName) {
                addSingularPluralVariants(objectName, dataObjects);
            }
        }
    }
    
    return dataObjects;
}

/**
 * Add singular/plural variants of an object name
 */
function addSingularPluralVariants(objectName: string, dataObjects: string[]): void {
    if (!dataObjects.includes(objectName)) {
        dataObjects.push(objectName);
    }
    
    const pascalCase = toPascalCase(objectName);
    if (pascalCase && pascalCase !== objectName && !dataObjects.includes(pascalCase)) {
        dataObjects.push(pascalCase);
    }
    
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
 * Convert to PascalCase
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
 * Validate if role exists in model
 */
export function isValidRole(roleName: string, modelService: ModelService): boolean {
    if (!roleName) { 
        return false; 
    }
    
    try {
        const allObjects = modelService.getAllObjects();
        if (!allObjects || !Array.isArray(allObjects)) {
            return false;
        }
        
        const roleObjects = allObjects.filter((obj: any) => 
            obj.name === 'Role' || (obj.name && obj.name.toLowerCase().includes('role'))
        );
        
        if (roleObjects.length === 0) {
            return true; // If no Role objects exist, allow any role name
        }
        
        for (const roleObj of roleObjects) {
            if (roleObj.lookupItem && Array.isArray(roleObj.lookupItem)) {
                const roleExists = roleObj.lookupItem.some((item: any) => {
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
        
        return false;
    } catch (error) {
        console.error('Error validating role:', error);
        return true; // Allow in case of error
    }
}

/**
 * Validate user story text comprehensively
 * Returns validation result with role, objects, and error details
 */
export function validateUserStory(storyText: string, modelService: ModelService): UserStoryValidationResult {
    // Extract role
    const role = extractRoleFromUserStory(storyText);
    if (!role) {
        return {
            valid: false,
            error: 'Unable to extract role from user story text'
        };
    }

    // Validate role exists
    if (!isValidRole(role, modelService)) {
        return {
            valid: false,
            error: `Role "${role}" does not exist in model`,
            role
        };
    }

    // Extract and validate data objects
    const dataObjects = extractDataObjectsFromUserStory(storyText);
    if (dataObjects.length > 0) {
        const objectValidation = validateDataObjects(dataObjects, modelService);
        if (!objectValidation.allValid) {
            const missingObjectsText = objectValidation.missingObjects.join(', ');
            return {
                valid: false,
                error: `Data object(s) "${missingObjectsText}" do not exist in model`,
                role,
                dataObjects
            };
        }
    }

    return {
        valid: true,
        role,
        dataObjects
    };
}

/**
 * Validate if data objects exist in model
 */
export function validateDataObjects(objectNames: string[], modelService: ModelService): { 
    allValid: boolean; 
    missingObjects: string[]; 
    validObjects: string[] 
} {
    const result = {
        allValid: true,
        missingObjects: [] as string[],
        validObjects: [] as string[]
    };
    
    if (!objectNames || !Array.isArray(objectNames) || objectNames.length === 0) {
        return result;
    }
    
    try {
        const allObjects = modelService.getAllObjects();
        if (!allObjects || !Array.isArray(allObjects)) {
            result.allValid = false;
            result.missingObjects = [...objectNames];
            return result;
        }
        
        const modelObjectNames = allObjects.map((obj: any) => {
            const name = obj.name || "";
            return {
                original: name,
                lower: name.toLowerCase()
            };
        });
        
        for (const objectName of objectNames) {
            const searchName = objectName.toLowerCase();
            const searchPascal = toPascalCase(objectName).toLowerCase();
            
            const found = modelObjectNames.some(modelObj => {
                if (modelObj.lower === searchName || modelObj.lower === searchPascal) {
                    return true;
                }
                
                // Check singular/plural variants
                if (searchName.endsWith('s') && searchName.length > 1) {
                    const singular = searchName.slice(0, -1);
                    return modelObj.lower === singular;
                } else {
                    const plural = searchName + 's';
                    return modelObj.lower === plural;
                }
            });
            
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
        result.allValid = true;
        result.validObjects = [...objectNames];
        return result;
    }
}
