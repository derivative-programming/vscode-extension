"use strict";
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Generate code files for a single object by calling external model services
 * @param {Object} obj Object to generate code for
 * @param {string} outputFolder Path to output the generated code
 * @param {string} namespaceName Namespace name for the generated code
 */
async function generateObjectCode(obj, outputFolder, namespaceName) {
    if (!obj.name) {
        return;
    }
    
    // Generate a model class for this object
    const className = obj.name.charAt(0).toUpperCase() + obj.name.slice(1);
    
    try {
        // Call external API for TypeScript model generation
        const tsContent = await callExternalModelService('typescript', obj, namespaceName);
        const tsFilePath = path.join(outputFolder, `${className}.ts`);
        fs.writeFileSync(tsFilePath, tsContent);
        
        // Call external API for C# model generation
        const csharpContent = await callExternalModelService('csharp', obj, namespaceName);
        const csharpFilePath = path.join(outputFolder, `${className}.cs`);
        fs.writeFileSync(csharpFilePath, csharpContent);
        
        // Log success
        console.log(`Generated code for ${className} in ${namespaceName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to generate code for ${className}: ${errorMessage}`);
        throw error;
    }
}

/**
 * Call external model service API to generate code
 * @param {string} language Target language for the generated code
 * @param {Object} obj Object structure to generate code for
 * @param {string} namespace Namespace for the generated code
 * @returns {Promise<string>} Generated code as string
 */
async function callExternalModelService(language, obj, namespace) {
    // Get service URL from configuration
    const config = vscode.workspace.getConfiguration('appDNA');
    const serviceBaseUrl = config.get('modelServiceUrl') || 'https://modelservicesapi.derivative-programming.com';
    
    console.log(`Calling external model service for ${language} code generation at ${serviceBaseUrl}`);
    
    try {
        // For TypeScript-based extension, we can use the built-in https module
        const https = require('https');
        
        // Create the request payload according to the API specification
        const payload = {
            modelData: JSON.stringify({
                object: obj,
                namespace: namespace,
                language: language
            }),
            targetLanguage: language,
            options: {
                includeComments: true,
                generateConstructor: true,
                generateProperties: true
            }
        };
        
        // Return a promise that resolves with the generated code
        return new Promise((resolve, reject) => {
            // Determine which endpoint to use based on the language
            const endpoint = '/api/v1_0/fabrication-requests';
            
            // Prepare the request options
            const options = {
                hostname: new URL(serviceBaseUrl).hostname,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            };
            
            // Create the request
            const req = https.request(options, (res) => {
                let data = '';
                
                // Collect response data
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                // Process the complete response
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const responseObject = JSON.parse(data);
                            
                            // Extract the generated code from the response
                            // Note: The actual property might be different based on the API response structure
                            if (responseObject && responseObject.generatedCode) {
                                resolve(responseObject.generatedCode);
                            } else {
                                // If the expected property isn't found, provide a fallback
                                console.warn('Response format unexpected, using fallback code template');
                                resolve(generateFallbackCode(language, obj, namespace));
                            }
                        } catch (error) {
                            console.error('Error parsing API response:', error);
                            resolve(generateFallbackCode(language, obj, namespace));
                        }
                    } else {
                        console.error(`API request failed with status code ${res.statusCode}`);
                        resolve(generateFallbackCode(language, obj, namespace));
                    }
                });
            });
            
            // Handle request errors
            req.on('error', (error) => {
                console.error(`Error making API request: ${error.message}`);
                resolve(generateFallbackCode(language, obj, namespace));
            });
            
            // Send the request with the JSON payload
            req.write(JSON.stringify(payload));
            req.end();
        });
    } catch (error) {
        console.error('Error in callExternalModelService:', error);
        return generateFallbackCode(language, obj, namespace);
    }
}

/**
 * Generate fallback code when the API call fails
 * @param {string} language Target language for the code
 * @param {Object} obj Object to generate code for
 * @param {string} namespace Namespace for the code
 * @returns {string} Generated fallback code
 */
function generateFallbackCode(language, obj, namespace) {
    const className = obj.name.charAt(0).toUpperCase() + obj.name.slice(1);
    
    if (language === 'typescript') {
        return `/*
 * Generated by AppDNA (Fallback) - ${new Date().toISOString()}
 * Namespace: ${namespace}
 * Note: This is fallback code generated when the external API couldn't be reached
 */
export class ${className} {
    // Properties would be generated based on the object definition
    ${obj.properties ? obj.properties.map(prop => {
            // Determine TypeScript type from property type
            let tsType = 'any';
            switch (prop.type?.toLowerCase()) {
                case 'string':
                    tsType = 'string';
                    break;
                case 'number':
                case 'int':
                case 'float':
                    tsType = 'number';
                    break;
                case 'boolean':
                    tsType = 'boolean';
                    break;
                case 'date':
                case 'datetime':
                    tsType = 'Date';
                    break;
                default: tsType = 'any';
            }
            return `${prop.name}: ${tsType};`;
        }).join('\n    ') : '// No properties defined'}
    
    constructor(data?: Partial<${className}>) {
        Object.assign(this, data || {});
    }
}`;
    } else if (language === 'csharp') {
        return `/*
 * Generated by AppDNA (Fallback) - ${new Date().toISOString()}
 * Namespace: ${namespace}
 * Note: This is fallback code generated when the external API couldn't be reached
 */
using System;

namespace ${namespace}
{
    public class ${className}
    {
        // Properties would be generated based on the object definition
        ${obj.properties ? obj.properties.map(prop => {
            // Determine C# type from property type
            let csharpType = 'object';
            switch (prop.type?.toLowerCase()) {
                case 'string':
                    csharpType = 'string';
                    break;
                case 'number':
                case 'float':
                    csharpType = 'double';
                    break;
                case 'int':
                    csharpType = 'int';
                    break;
                case 'boolean':
                    csharpType = 'bool';
                    break;
                case 'date':
                case 'datetime':
                    csharpType = 'DateTime';
                    break;
                default: csharpType = 'object';
            }
            return `public ${csharpType} ${prop.name} { get; set; }`;
        }).join('\n        ') : '// No properties defined'}
    }
}`;
    } else {
        return `// Code generation for ${language} not implemented yet`;
    }
}

/**
 * Validates JSON data against a schema
 * @param {Object} jsonData The JSON data to validate
 * @param {string} schemaPath Path to the schema file
 * @returns {Promise<Object>} Validation result
 */
async function validateAgainstSchema(jsonData, schemaPath) {
    try {
        // Import Ajv dynamically
        const Ajv = require('ajv');
        
        // Load schema from file
        const schemaContent = await vscode.workspace.fs.readFile(vscode.Uri.file(schemaPath));
        const schema = JSON.parse(Buffer.from(schemaContent).toString('utf-8'));
        
        // Create validator
        const ajv = new Ajv({ allErrors: true });
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
            errors: [{ message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }]
        };
    }
}

module.exports = {
    generateObjectCode,
    callExternalModelService,
    generateFallbackCode,
    validateAgainstSchema
};