import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NamespaceObject } from '../models/types';

/**
 * Generates code files for a single object by calling external model services
 * @param obj The object to generate code for
 * @param outputFolder The folder where generated code should be saved
 * @param namespaceName The namespace name for the generated code
 */
export async function generateObjectCode(obj: NamespaceObject, outputFolder: string, namespaceName: string): Promise<void> {
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
 * @param language Target language for the generated code
 * @param obj Object structure to generate code for
 * @param namespace Namespace for the generated code
 * @returns Generated code as string
 */
export async function callExternalModelService(language: string, obj: NamespaceObject, namespace: string): Promise<string> {
    // Get service URL from configuration
    const config = vscode.workspace.getConfiguration('appDNA');
    const serviceBaseUrl = config.get<string>('modelServiceUrl') || 'https://modelservicesapi.derivative-programming.com';
    
    console.log(`Calling external model service for ${language} code generation at ${serviceBaseUrl}`);
    
    try {
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
        
        // Use node-fetch or browser fetch API with a polyfill in web extensions
        // This approach works in both desktop and web extensions
        const endpoint = '/api/v1_0/fabrication-requests';
        const url = `${serviceBaseUrl}${endpoint}`;
        
        // Show status in the UI while API call is in progress
        vscode.window.setStatusBarMessage(`Generating ${language} code...`, 2000);
        
        try {
            // Make the API request
            const data = await vscode.workspace.fs.readFile(
                vscode.Uri.parse(`${url}?${new URLSearchParams({
                    data: JSON.stringify(payload)
                })}`)
            );
            
            // Parse the response
            const responseText = Buffer.from(data).toString('utf-8');
            try {
                const response = JSON.parse(responseText);
                // Extract the generated code from the response
                if (response && response.generatedCode) {
                    return response.generatedCode;
                } else {
                    throw new Error('Missing generatedCode in API response');
                }
            } catch (parseError) {
                console.error('Error parsing API response:', parseError);
                throw new Error('Invalid response from model service');
            }
        } catch (requestError) {
            console.error('API request failed:', requestError);
            throw requestError;
        }
    } catch (error) {
        console.error('Error in callExternalModelService:', error);
        vscode.window.showWarningMessage(`Failed to generate ${language} code from service: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback code.`);
        return generateFallbackCode(language, obj, namespace);
    }
}

/**
 * Generate fallback code when the API call fails
 * @param language Target language for the generated code
 * @param obj Object structure to generate code for
 * @param namespace Namespace for the generated code
 * @returns Generated fallback code as string
 */
export function generateFallbackCode(language: string, obj: NamespaceObject, namespace: string): string {
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
            case 'string': tsType = 'string'; break;
            case 'number': case 'int': case 'float': tsType = 'number'; break;
            case 'boolean': tsType = 'boolean'; break;
            case 'date': case 'datetime': tsType = 'Date'; break;
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
                case 'string': csharpType = 'string'; break;
                case 'number': case 'float': csharpType = 'double'; break;
                case 'int': csharpType = 'int'; break;
                case 'boolean': csharpType = 'bool'; break;
                case 'date': case 'datetime': csharpType = 'DateTime'; break;
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