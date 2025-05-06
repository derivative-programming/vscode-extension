// src/utils/xpathUtils.ts
// Utility functions for working with XPaths and JSONPaths to navigate and modify JSON objects
// Last modified: May 6, 2025

/**
 * A utility class for working with XPath-like and JSONPath expressions to navigate and modify JSON objects
 */
export class XPathUtils {
    /**
     * Traverse a JSON object using an XPath-like string and get the value at that path
     * 
     * @param obj The object to traverse
     * @param path XPath-like string (e.g., "root/namespace[0]/object[1]/prop[2]/name")
     * @returns The value at the specified path, or undefined if not found
     */
    public static getValue(obj: any, path: string): any {
        // Check if this is a JSONPath query
        if (path.startsWith('$') || path.includes('..') || path.includes('[?(') || path.includes('==')) {
            return this.getValueByJsonPath(obj, path);
        }

        if (!obj || !path) {
            return undefined;
        }

        // Split path into segments
        const segments = this.parsePath(path);
        let current = obj;

        // Traverse the object by segments
        for (const segment of segments) {
            // If current is null or undefined, we've reached a dead end
            if (current === null || current === undefined) {
                return undefined;
            }

            const { name, index } = segment;

            // Handle array index if specified
            if (index !== null) {
                if (!Array.isArray(current[name])) {
                    return undefined;
                }
                
                if (index < 0 || index >= current[name].length) {
                    return undefined;
                }
                
                current = current[name][index];
            } else {
                // Regular property access
                current = current[name];
            }
        }

        return current;
    }

    /**
     * Set a value in a JSON object at the specified XPath-like path
     * 
     * @param obj The object to modify
     * @param path XPath-like string (e.g., "root/namespace[0]/object[1]/prop[2]/name") or 
     *             JSONPath (e.g., "$..object[?(@.name == 'Pac')].prop[?(@.name == 'Name')]")
     * @param value The value to set
     * @returns True if set successfully, false otherwise
     */
    public static setValue(obj: any, path: string, value: any): boolean {
        // Check if this is a JSONPath query
        if (path.startsWith('$') || path.includes('..') || path.includes('[?(') || path.includes('==')) {
            return this.setValueByJsonPath(obj, path, value);
        }

        if (!obj || !path) {
            return false;
        }

        // Split path into segments
        const segments = this.parsePath(path);
        
        // We need at least one segment
        if (segments.length === 0) {
            return false;
        }
        
        // Pop the last segment as it's the property we want to set
        const lastSegment = segments.pop();
        if (!lastSegment) {
            return false;
        }
        
        let current = obj;
        
        // Traverse the object by segments to reach the parent of the property to set
        for (const segment of segments) {
            const { name, index } = segment;
            
            // Create path if it doesn't exist
            if (current[name] === undefined) {
                // If next segment is an array access, we need to create an array
                const nextSegment = segments[segments.indexOf(segment) + 1];
                if (nextSegment && nextSegment.index !== null) {
                    current[name] = [];
                } else {
                    current[name] = {};
                }
            }
            
            // Handle array index if specified
            if (index !== null) {
                if (!Array.isArray(current[name])) {
                    return false;
                }
                
                // Ensure array has enough elements
                while (current[name].length <= index) {
                    current[name].push({});
                }
                
                current = current[name][index];
            } else {
                current = current[name];
            }
            
            // If current is null or undefined, we've reached a dead end
            if (current === null || current === undefined) {
                return false;
            }
        }
        
        // Now set the value on the final property
        const { name, index } = lastSegment;
        
        if (index !== null) {
            // Setting a value in an array
            if (!current[name]) {
                current[name] = [];
            }
            
            if (!Array.isArray(current[name])) {
                return false;
            }
            
            // Ensure array has enough elements
            while (current[name].length <= index) {
                current[name].push(undefined);
            }
            
            current[name][index] = value;
        } else {
            // Setting a regular property
            current[name] = value;
        }
        
        return true;
    }
    
    /**
     * Delete a value in a JSON object at the specified XPath-like path
     * 
     * @param obj The object to modify
     * @param path XPath-like string (e.g., "root/namespace[0]/object[1]/prop[2]/name")
     * @returns True if deleted successfully, false otherwise
     */
    public static deleteValue(obj: any, path: string): boolean {
        // Check if this is a JSONPath query
        if (path.startsWith('$') || path.includes('..') || path.includes('[?(') || path.includes('==')) {
            return this.deleteValueByJsonPath(obj, path);
        }

        if (!obj || !path) {
            return false;
        }

        // Split path into segments
        const segments = this.parsePath(path);
        
        // We need at least one segment
        if (segments.length === 0) {
            return false;
        }
        
        // Pop the last segment as it's the property we want to delete
        const lastSegment = segments.pop();
        if (!lastSegment) {
            return false;
        }
        
        let current = obj;
        
        // Traverse the object by segments to reach the parent of the property to delete
        for (const segment of segments) {
            const { name, index } = segment;
            
            // If any segment doesn't exist, we can't delete
            if (current[name] === undefined) {
                return false;
            }
            
            // Handle array index if specified
            if (index !== null) {
                if (!Array.isArray(current[name]) || index >= current[name].length) {
                    return false;
                }
                
                current = current[name][index];
            } else {
                current = current[name];
            }
            
            // If current is null or undefined, we've reached a dead end
            if (current === null || current === undefined) {
                return false;
            }
        }
        
        // Now delete the value on the final property
        const { name, index } = lastSegment;
        
        if (index !== null) {
            // Deleting a value in an array
            if (!Array.isArray(current[name]) || index >= current[name].length) {
                return false;
            }
            
            // For arrays, we use splice to remove the element
            current[name].splice(index, 1);
        } else {
            // Deleting a regular property
            if (current[name] === undefined) {
                return false;
            }
            
            delete current[name];
        }
        
        return true;
    }
    
    /**
     * Parse an XPath-like string into segments with name and index (if applicable)
     * 
     * @param path XPath-like string (e.g., "root/namespace[0]/object[1]/prop[2]/name")
     * @returns Array of segments with name and index
     */
    private static parsePath(path: string): Array<{ name: string; index: number | null }> {
        if (!path) {
            return [];
        }
        
        // Split path by '/'
        const parts = path.split('/');
        const segments: Array<{ name: string; index: number | null }> = [];
        
        for (const part of parts) {
            // Skip empty segments
            if (!part.trim()) {
                continue;
            }
            
            // Check for array accessor [index]
            const match = part.match(/^(.+)\[(\d+)\]$/);
            
            if (match) {
                segments.push({
                    name: match[1],
                    index: parseInt(match[2], 10)
                });
            } else {
                segments.push({
                    name: part,
                    index: null
                });
            }
        }
        
        return segments;
    }

    /**
     * Handles JSONPath expressions to get values from a JSON object
     * Supports the following JSONPath features:
     * - $ as root
     * - .. for recursive descent
     * - [?(@.property == 'value')] for filtering
     * 
     * @param obj The object to traverse
     * @param path JSONPath expression
     * @returns The value(s) found at that path, or undefined if not found
     */
    private static getValueByJsonPath(obj: any, path: string): any {
        // Parse JSONPath into segments
        const segments = this.parseJsonPath(path);
        
        // Find matching nodes
        const results = this.findNodesByJsonPath(obj, segments);
        
        // Return the matched values (might be multiple)
        if (results.length === 0) {
            return undefined;
        } else if (results.length === 1) {
            return results[0];
        } else {
            return results;
        }
    }

    /**
     * Sets values in a JSON object using JSONPath expressions
     * 
     * @param obj The object to modify
     * @param path JSONPath expression
     * @param value The value to set
     * @returns True if at least one value was modified, false otherwise
     */
    private static setValueByJsonPath(obj: any, path: string, value: any): boolean {
        // Parse JSONPath into segments
        const segments = this.parseJsonPath(path);
        
        // We need to find the parent nodes and property/index to modify
        if (segments.length === 0) {
            return false;
        }
        
        // Get the last segment, which describes the property to set
        const lastSegment = segments[segments.length - 1];
        
        // Find parent nodes (all nodes that match the path up to the last segment)
        const parentSegments = segments.slice(0, segments.length - 1);
        const parents = this.findNodesByJsonPath(obj, parentSegments);
        
        if (parents.length === 0) {
            return false;
        }
        
        // Determine what property or index to set on the parent(s)
        let modified = false;
        
        for (const parent of parents) {
            if (lastSegment.type === 'property') {
                parent[lastSegment.value] = value;
                modified = true;
            } else if (lastSegment.type === 'index') {
                const index = parseInt(lastSegment.value, 10);
                if (Array.isArray(parent) && !isNaN(index)) {
                    // Ensure the array is large enough
                    while (parent.length <= index) {
                        parent.push(undefined);
                    }
                    parent[index] = value;
                    modified = true;
                }
            } else if (lastSegment.type === 'filter') {
                // Apply filter to determine which elements to modify
                const matches = this.applyFilter(parent, lastSegment.filter);
                for (const match of matches) {
                    if (typeof match.index === 'number') {
                        parent[match.index] = value;
                    } else if (typeof match.property === 'string') {
                        parent[match.property] = value;
                    }
                    modified = true;
                }
            }
        }
        
        return modified;
    }

    /**
     * Deletes values in a JSON object using JSONPath expressions
     * 
     * @param obj The object to modify
     * @param path JSONPath expression
     * @returns True if at least one value was deleted, false otherwise
     */
    private static deleteValueByJsonPath(obj: any, path: string): boolean {
        // Parse JSONPath into segments
        const segments = this.parseJsonPath(path);
        
        // We need to find the parent nodes and property/index to delete
        if (segments.length === 0) {
            return false;
        }
        
        // Get the last segment, which describes the property to delete
        const lastSegment = segments[segments.length - 1];
        
        // Find parent nodes (all nodes that match the path up to the last segment)
        const parentSegments = segments.slice(0, segments.length - 1);
        const parents = this.findNodesByJsonPath(obj, parentSegments);
        
        if (parents.length === 0) {
            return false;
        }
        
        // Determine what property or index to delete on the parent(s)
        let deleted = false;
        
        for (const parent of parents) {
            if (lastSegment.type === 'property') {
                if (parent[lastSegment.value] !== undefined) {
                    delete parent[lastSegment.value];
                    deleted = true;
                }
            } else if (lastSegment.type === 'index') {
                const index = parseInt(lastSegment.value, 10);
                if (Array.isArray(parent) && !isNaN(index) && index >= 0 && index < parent.length) {
                    parent.splice(index, 1);
                    deleted = true;
                }
            } else if (lastSegment.type === 'filter') {
                // Apply filter to determine which elements to delete
                const matches = this.applyFilter(parent, lastSegment.filter);
                
                // Sort matches in descending order by index (to avoid affecting indices during removal)
                matches.sort((a, b) => {
                    const aIdx = typeof a.index === 'number' ? a.index : -1;
                    const bIdx = typeof b.index === 'number' ? b.index : -1;
                    return bIdx - aIdx;
                });
                
                for (const match of matches) {
                    if (typeof match.index === 'number' && Array.isArray(parent)) {
                        parent.splice(match.index, 1);
                        deleted = true;
                    } else if (typeof match.property === 'string') {
                        delete parent[match.property];
                        deleted = true;
                    }
                }
            }
        }
        
        return deleted;
    }

    /**
     * Parse a JSONPath expression into segments
     * 
     * @param path JSONPath expression (e.g., "$..object[?(@.name == 'Pac')].prop[?(@.name == 'Name')]")
     * @returns Array of segments with type and value
     */
    private static parseJsonPath(path: string): Array<{ 
        type: 'root' | 'property' | 'index' | 'recursive' | 'filter';
        value: string;
        filter?: { property: string; operator: string; value: any }
    }> {
        if (!path) {
            return [];
        }
        
        const segments: Array<{
            type: 'root' | 'property' | 'index' | 'recursive' | 'filter';
            value: string;
            filter?: { property: string; operator: string; value: any }
        }> = [];

        // Remove whitespace
        path = path.trim();
        
        // Handle root symbol
        if (path.startsWith('$')) {
            segments.push({ type: 'root', value: '$' });
            path = path.substring(1);
        }
        
        // Split by dots but consider '..' as special case for recursive descent
        let parts = [];
        let currentPart = '';
        let i = 0;
        
        while (i < path.length) {
            // Handle recursive descent
            if (path.substring(i, i + 2) === '..') {
                if (currentPart) {
                    parts.push(currentPart);
                    currentPart = '';
                }
                parts.push('..');
                i += 2;
                continue;
            }
            
            // Handle dots as segment separators
            if (path[i] === '.') {
                if (currentPart) {
                    parts.push(currentPart);
                    currentPart = '';
                }
                i++;
                continue;
            }
            
            // Handle bracketed expressions (filters and indices)
            if (path[i] === '[') {
                let bracketCount = 1;
                let j = i + 1;
                
                // Find the matching closing bracket
                while (j < path.length && bracketCount > 0) {
                    if (path[j] === '[') bracketCount++;
                    if (path[j] === ']') bracketCount--;
                    j++;
                }
                
                if (currentPart) {
                    parts.push(currentPart);
                    currentPart = '';
                }
                
                parts.push(path.substring(i, j));
                i = j;
                continue;
            }
            
            // Add character to current part
            currentPart += path[i];
            i++;
        }
        
        // Add final part if there's one
        if (currentPart) {
            parts.push(currentPart);
        }
        
        // Process each part
        for (const part of parts) {
            if (part === '..') {
                segments.push({ type: 'recursive', value: '..' });
            } else if (part.startsWith('[') && part.endsWith(']')) {
                const inner = part.substring(1, part.length - 1);
                
                if (inner.startsWith('?(') && inner.endsWith(')')) {
                    // Filter expression like [?(@.name == 'value')]
                    const filterExpr = inner.substring(2, inner.length - 1);
                    const match = filterExpr.match(/@\.([a-zA-Z0-9_]+)\s*(==|!=|>=|<=|>|<|===|!==)\s*(['"])(.*?)\3/);
                    
                    if (match) {
                        const property = match[1];
                        const operator = match[2];
                        const value = match[4];
                        
                        segments.push({
                            type: 'filter',
                            value: part,
                            filter: { property, operator, value }
                        });
                    } else {
                        console.warn(`Unsupported filter expression: ${filterExpr}`);
                    }
                } else if (!isNaN(Number(inner))) {
                    // Numeric index like [0]
                    segments.push({ type: 'index', value: inner });
                } else if (inner.startsWith("'") && inner.endsWith("'") || 
                           inner.startsWith('"') && inner.endsWith('"')) {
                    // Named property in brackets like ['name']
                    const propName = inner.substring(1, inner.length - 1);
                    segments.push({ type: 'property', value: propName });
                }
            } else {
                // Regular property name
                segments.push({ type: 'property', value: part });
            }
        }
        
        return segments;
    }

    /**
     * Find nodes in a JSON object that match a JSONPath expression
     * 
     * @param obj The object to search
     * @param segments Array of JSONPath segments to match
     * @returns Array of matching nodes
     */
    private static findNodesByJsonPath(obj: any, segments: Array<{ 
        type: 'root' | 'property' | 'index' | 'recursive' | 'filter';
        value: string;
        filter?: { property: string; operator: string; value: any }
    }>): any[] {
        if (segments.length === 0) {
            return [obj];
        }
        
        const currentSegment = segments[0];
        const remainingSegments = segments.slice(1);
        
        let currentNodes: any[] = [];
        
        // Process the current segment
        switch (currentSegment.type) {
            case 'root':
                currentNodes = [obj];
                break;
                
            case 'property':
                if (obj !== null && obj !== undefined && obj[currentSegment.value] !== undefined) {
                    currentNodes = [obj[currentSegment.value]];
                }
                break;
                
            case 'index':
                const index = parseInt(currentSegment.value, 10);
                if (Array.isArray(obj) && !isNaN(index) && index >= 0 && index < obj.length) {
                    currentNodes = [obj[index]];
                }
                break;
                
            case 'recursive':
                // Recursive descent - collect all properties at any depth
                currentNodes = this.collectAllProperties(obj);
                break;
                
            case 'filter':
                if (currentSegment.filter && Array.isArray(obj)) {
                    // Apply filter to array elements
                    const matches = this.applyFilter(obj, currentSegment.filter);
                    currentNodes = matches.map(match => {
                        if (typeof match.index === 'number') {
                            return obj[match.index];
                        }
                        return undefined;
                    }).filter(Boolean);
                } else if (currentSegment.filter && obj !== null && typeof obj === 'object') {
                    // Apply filter to object properties
                    const matches = this.applyFilter(obj, currentSegment.filter);
                    currentNodes = matches.map(match => {
                        if (typeof match.property === 'string') {
                            return obj[match.property];
                        }
                        return undefined;
                    }).filter(Boolean);
                }
                break;
        }
        
        // If there are no more segments, return the current nodes
        if (remainingSegments.length === 0) {
            return currentNodes;
        }
        
        // Otherwise, continue processing with remaining segments
        let results: any[] = [];
        for (const node of currentNodes) {
            const childResults = this.findNodesByJsonPath(node, remainingSegments);
            results = results.concat(childResults);
        }
        
        return results;
    }

    /**
     * Apply a filter to an object or array to find matching elements
     * 
     * @param obj The object or array to filter
     * @param filter The filter to apply
     * @returns Array of matches with index/property information
     */
    private static applyFilter(obj: any, filter: { property: string; operator: string; value: any }): Array<{ index?: number; property?: string }> {
        const matches: Array<{ index?: number; property?: string }> = [];
        
        if (Array.isArray(obj)) {
            // Filter array elements
            for (let i = 0; i < obj.length; i++) {
                if (this.evaluateFilter(obj[i], filter)) {
                    matches.push({ index: i });
                }
            }
        } else if (obj !== null && typeof obj === 'object') {
            // Filter object properties
            for (const key of Object.keys(obj)) {
                if (this.evaluateFilter(obj[key], filter)) {
                    matches.push({ property: key });
                }
            }
        }
        
        return matches;
    }

    /**
     * Evaluate a filter condition against a value
     * 
     * @param value The value to test
     * @param filter The filter condition
     * @returns True if the value passes the filter, false otherwise
     */
    private static evaluateFilter(value: any, filter: { property: string; operator: string; value: any }): boolean {
        if (value === null || value === undefined) {
            return false;
        }
        
        const propValue = value[filter.property];
        
        switch (filter.operator) {
            case '==':
            case '===':
                return propValue == filter.value;
            case '!=':
            case '!==':
                return propValue != filter.value;
            case '>':
                return propValue > filter.value;
            case '>=':
                return propValue >= filter.value;
            case '<':
                return propValue < filter.value;
            case '<=':
                return propValue <= filter.value;
            default:
                return false;
        }
    }

    /**
     * Collect all properties of an object at any depth
     * Used for recursive descent ('..') operator
     * 
     * @param obj The object to collect properties from
     * @returns Array containing all properties at any depth
     */
    private static collectAllProperties(obj: any): any[] {
        const results: any[] = [];
        
        const traverse = (value: any) => {
            if (value === null || value === undefined) {
                return;
            }
            
            // Add this value to the results
            results.push(value);
            
            // If it's an array, traverse its elements
            if (Array.isArray(value)) {
                for (const item of value) {
                    traverse(item);
                }
            }
            // If it's an object, traverse its properties
            else if (typeof value === 'object') {
                for (const key of Object.keys(value)) {
                    traverse(value[key]);
                }
            }
        };
        
        traverse(obj);
        results.shift(); // Remove the root object itself
        
        return results;
    }
}