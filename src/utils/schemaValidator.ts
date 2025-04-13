import * as vscode from 'vscode';
import * as path from 'path';
import Ajv from 'ajv';

/**
 * Validates JSON data against the app-dna schema
 * @param jsonData The JSON data to validate
 * @param context The extension context for accessing extension resources
 * @returns Object with validation result and any errors
 */
export async function validateAgainstSchema(
    jsonData: any, 
    context: vscode.ExtensionContext
): Promise<{valid: boolean; errors: any[] | null}> {
    try {
        // Load schema from extension directory instead of workspace
        const schemaPath = path.join(context.extensionPath, 'app-dna.schema.json');
        const schemaContent = await vscode.workspace.fs.readFile(vscode.Uri.file(schemaPath));
        const schema = JSON.parse(Buffer.from(schemaContent).toString('utf-8'));
        
        // Create validator with options to support draft-04
        const ajv = new Ajv({
            allErrors: true,
            schemaId: 'id', // Important for draft-04 compatibility
            meta: false // Disable default metaschemas
        });
        
        // Add draft-04 metaschema for validation
        ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
        
        const validate = ajv.compile(schema);
        const valid = validate(jsonData);
        
        return {
            valid: !!valid,
            errors: validate.errors || null
        };
    } catch (error) {
        console.error('Schema validation error:', error);
        return {
            valid: false, 
            errors: [{message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`}]
        };
    }
}