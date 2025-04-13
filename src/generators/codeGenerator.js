"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateObjectCode = generateObjectCode;
exports.callExternalModelService = callExternalModelService;
exports.generateFallbackCode = generateFallbackCode;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Generates code files for a single object by calling external model services
 * @param obj The object to generate code for
 * @param outputFolder The folder where generated code should be saved
 * @param namespaceName The namespace name for the generated code
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
    }
    catch (error) {
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
async function callExternalModelService(language, obj, namespace) {
    // Get service URL from configuration
    const config = vscode.workspace.getConfiguration('appDNA');
    const serviceBaseUrl = config.get('modelServiceUrl') || 'https://modelservicesapi.derivative-programming.com';
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
            const data = await vscode.workspace.fs.readFile(vscode.Uri.parse(`${url}?${new URLSearchParams({
                data: JSON.stringify(payload)
            })}`));
            // Parse the response
            const responseText = Buffer.from(data).toString('utf-8');
            try {
                const response = JSON.parse(responseText);
                // Extract the generated code from the response
                if (response && response.generatedCode) {
                    return response.generatedCode;
                }
                else {
                    throw new Error('Missing generatedCode in API response');
                }
            }
            catch (parseError) {
                console.error('Error parsing API response:', parseError);
                throw new Error('Invalid response from model service');
            }
        }
        catch (requestError) {
            console.error('API request failed:', requestError);
            throw requestError;
        }
    }
    catch (error) {
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
    }
    else if (language === 'csharp') {
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
    }
    else {
        return `// Code generation for ${language} not implemented yet`;
    }
}
//# sourceMappingURL=codeGenerator.js.map