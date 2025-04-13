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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgainstSchema = validateAgainstSchema;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const ajv_1 = __importDefault(require("ajv"));
/**
 * Validates JSON data against the app-dna schema
 * @param jsonData The JSON data to validate
 * @param context The extension context for accessing extension resources
 * @returns Object with validation result and any errors
 */
async function validateAgainstSchema(jsonData, context) {
    try {
        // Load schema from extension directory instead of workspace
        const schemaPath = path.join(context.extensionPath, 'app-dna.schema.json');
        const schemaContent = await vscode.workspace.fs.readFile(vscode.Uri.file(schemaPath));
        const schema = JSON.parse(Buffer.from(schemaContent).toString('utf-8'));
        // Create validator with options to support draft-04
        const ajv = new ajv_1.default({
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
    }
    catch (error) {
        console.error('Schema validation error:', error);
        return {
            valid: false,
            errors: [{ message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }]
        };
    }
}
//# sourceMappingURL=schemaValidator.js.map