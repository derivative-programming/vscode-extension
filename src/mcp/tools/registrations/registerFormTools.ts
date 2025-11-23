// registerFormTools.ts
// MCP tool registrations for form operations
// Extracted from server.ts on: November 23, 2025

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FormTools } from '../formTools.js';

export function registerFormTools(server: McpServer, tools: FormTools): void {
    // Register get_form_schema tool
        server.registerTool('get_form_schema', {
        title: 'Get Form Schema',
        description: 'Get the schema definition for complete form structure (objectWorkflow). Includes all form properties (name, isPage, titleText, ownerObject, etc.), input parameter structure (objectWorkflowParam), button structure (objectWorkflowButton), output variable structure (objectWorkflowOutputVar), validation rules, SQL data types, and examples of complete forms with all components.',
        inputSchema: {},
        outputSchema: {
            success: z.boolean(),
            schema: z.any(),
            note: z.string().optional()
        }
    }, async () => {
        try {
            const result = await tools.get_form_schema();
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register get_form tool
    server.registerTool('get_form', {
        title: 'Get Form',
        description: 'Get complete details of a specific form by name. If owner_object_name is provided, searches only that object; otherwise searches all objects. Returns the full form structure including all input parameters (objectWorkflowParam), buttons (objectWorkflowButton), output variables (objectWorkflowOutputVar), and element counts. Form name matching is case-insensitive.',
        inputSchema: {
            form_name: z.string().describe('The name of the form to retrieve (case-insensitive matching)'),
            owner_object_name: z.string().optional().describe('Optional: The name of the owner data object that contains the form (case-insensitive matching). If not provided, all objects will be searched.')
        },
        outputSchema: {
            success: z.boolean(),
            form: z.any().optional().describe('Complete form object with all properties and arrays'),
            owner_object_name: z.string().optional(),
            element_counts: z.object({
                paramCount: z.number(),
                buttonCount: z.number(),
                outputVarCount: z.number(),
                totalElements: z.number()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ owner_object_name, form_name }) => {
        try {
            const result = await tools.get_form({ owner_object_name, form_name });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });













    // Register suggest_form_name_and_title tool
        server.registerTool('suggest_form_name_and_title', {
        title: 'Suggest Form Name and Title',
        description: 'Generate suggested form name (PascalCase) and title (human-readable) based on context: owner object, role, action, and target child object. Useful before creating a form to get naming recommendations that follow conventions.',
        inputSchema: {
            owner_object_name: z.string().describe('The name of the owner data object (required, case-sensitive exact match)'),
            role_required: z.string().optional().describe('Optional: Role required to access the form (case-sensitive)'),
            action: z.string().optional().describe('Optional: Action verb for the form (e.g., "Save", "Delete", "Approve"). If action is "Add", you should also provide target_child_object.'),
            target_child_object: z.string().optional().describe('Optional: Target child object when form creates new instances (case-sensitive). Should be provided when action is "Add" to specify which child object is being added.')
        },
        outputSchema: {
            success: z.boolean(),
            suggestions: z.object({
                form_name: z.string(),
                title_text: z.string()
            }).optional(),
            context: z.object({
                owner_object_name: z.string(),
                role_required: z.string().nullable(),
                action: z.string().nullable(),
                target_child_object: z.string().nullable()
            }).optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ owner_object_name, role_required, action, target_child_object }) => {
        try {
            const result = await tools.suggest_form_name_and_title({ owner_object_name, role_required, action, target_child_object });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register create_form tool
        server.registerTool('create_form', {
        title: 'Create Form',
        description: 'Create a new form (objectWorkflow) in a data object with automatic page init flow creation. Form name must be unique (case-insensitive) across all objects and in PascalCase format. Automatically creates OK and Cancel buttons. Owner object name must match exactly (case-sensitive). TIP: Use suggest_form_name_and_title tool first to get recommended form name and title based on your context (owner object, role, action, target child object).',
        inputSchema: {
            owner_object_name: z.string().describe('The name of the owner data object (required, case-sensitive exact match)'),
            form_name: z.string().describe('The name of the form (required, PascalCase, must be unique case-insensitive across all objects)'),
            title_text: z.string().describe('The title displayed on the form (required, max 100 characters)'),
            role_required: z.string().optional().describe('Optional: Role required to access the form (case-sensitive). Auto-sets isAuthorizationRequired="true" and layoutName="{role}Layout"'),
            target_child_object: z.string().optional().describe('Optional: Target child object when form creates new instances (case-sensitive exact match)')
        },
        outputSchema: {
            success: z.boolean(),
            form: z.any().optional(),
            page_init_flow: z.any().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional(),
            validationErrors: z.array(z.string()).optional()
        }
    }, async ({ owner_object_name, form_name, title_text, role_required, target_child_object }) => {
        try {
            const result = await tools.create_form({ owner_object_name, form_name, title_text, role_required, target_child_object });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register update_form tool
        server.registerTool('update_form', {
        title: 'Update Form',
        description: 'Update properties of an existing form (objectWorkflow) in the AppDNA model. Form name must match exactly (case-sensitive). At least one property to update is required. Updates only the specified properties, leaving others unchanged. Searches all data objects to find the form.',
        inputSchema: {
            form_name: z.string().describe('The name of the form to update (required, case-sensitive exact match)'),
            titleText: z.string().optional().describe('The title displayed on the form (max 100 characters)'),
            isInitObjWFSubscribedToParams: z.enum(['true', 'false']).optional().describe('Whether the page init flow subscribes to parameters'),
            isObjectDelete: z.enum(['true', 'false']).optional().describe('Whether the form is for object deletion'),
            layoutName: z.string().optional().describe('The layout template for the form (e.g., "ManagerLayout", "AdminLayout")'),
            introText: z.string().optional().describe('Introduction text displayed on the form'),
            formTitleText: z.string().optional().describe('Form title text (alternative to titleText)'),
            formIntroText: z.string().optional().describe('Form introduction text (alternative to introText)'),
            formFooterText: z.string().optional().describe('Footer text displayed at the bottom of the form'),
            codeDescription: z.string().optional().describe('Description of the form for code documentation'),
            isAutoSubmit: z.enum(['true', 'false']).optional().describe('Whether the form auto-submits on load'),
            isHeaderVisible: z.enum(['true', 'false']).optional().describe('Whether the form header is visible'),
            isAuthorizationRequired: z.enum(['true', 'false']).optional().describe('Whether authorization is required to access the form'),
            isLoginPage: z.enum(['true', 'false']).optional().describe('Whether this is the login page'),
            isLogoutPage: z.enum(['true', 'false']).optional().describe('Whether this is the logout page'),
            isCaptchaVisible: z.enum(['true', 'false']).optional().describe('Whether CAPTCHA is visible on the form'),
            isCustomLogicOverwritten: z.enum(['true', 'false']).optional().describe('Whether custom logic overwrites default behavior')
        },
        outputSchema: {
            success: z.boolean(),
            form: z.any().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ form_name, titleText, isInitObjWFSubscribedToParams, isObjectDelete, layoutName, introText, formTitleText, formIntroText, formFooterText, codeDescription, isAutoSubmit, isHeaderVisible, isAuthorizationRequired, isLoginPage, isLogoutPage, isCaptchaVisible, isCustomLogicOverwritten }) => {
        try {
        // Build updates object with only provided properties
            const updates: any = {};
            if (titleText !== undefined) { updates.titleText = titleText; }
            if (isInitObjWFSubscribedToParams !== undefined) { updates.isInitObjWFSubscribedToParams = isInitObjWFSubscribedToParams; }
            if (isObjectDelete !== undefined) { updates.isObjectDelete = isObjectDelete; }
            if (layoutName !== undefined) { updates.layoutName = layoutName; }
            if (introText !== undefined) { updates.introText = introText; }
            if (formTitleText !== undefined) { updates.formTitleText = formTitleText; }
            if (formIntroText !== undefined) { updates.formIntroText = formIntroText; }
            if (formFooterText !== undefined) { updates.formFooterText = formFooterText; }
            if (codeDescription !== undefined) { updates.codeDescription = codeDescription; }
            if (isAutoSubmit !== undefined) { updates.isAutoSubmit = isAutoSubmit; }
            if (isHeaderVisible !== undefined) { updates.isHeaderVisible = isHeaderVisible; }
            if (isAuthorizationRequired !== undefined) { updates.isAuthorizationRequired = isAuthorizationRequired; }
            if (isLoginPage !== undefined) { updates.isLoginPage = isLoginPage; }
            if (isLogoutPage !== undefined) { updates.isLogoutPage = isLogoutPage; }
            if (isCaptchaVisible !== undefined) { updates.isCaptchaVisible = isCaptchaVisible; }
            if (isCustomLogicOverwritten !== undefined) { updates.isCustomLogicOverwritten = isCustomLogicOverwritten; }

            const result = await tools.update_form(form_name, updates);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register add_form_param tool
        server.registerTool('add_form_param', {
        title: 'Add Form Parameter',
        description: 'Add a new input parameter (form field/control) to an existing form. Parameter name must be unique within the form and in PascalCase format. Form name must match exactly (case-sensitive). Searches all data objects to find the form.',
        inputSchema: {
            form_name: z.string().describe('The name of the form to add the parameter to (required, case-sensitive exact match)'),
            name: z.string().describe('Parameter name in PascalCase format (required, must be unique within the form)'),
            sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this parameter'),
            sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal). Default is 100 for nvarchar.'),
            labelText: z.string().optional().describe('Human-readable label text displayed for this field'),
            infoToolTipText: z.string().optional().describe('Tooltip text displayed when hovering over the info icon'),
            codeDescription: z.string().optional().describe('Code description for documentation'),
            defaultValue: z.string().optional().describe('Default value for this parameter'),
            isVisible: z.enum(['true', 'false']).optional().describe('Is this parameter visible on the form?'),
            isRequired: z.enum(['true', 'false']).optional().describe('Is this parameter required?'),
            requiredErrorText: z.string().optional().describe('Error message displayed when required field is not filled'),
            isSecured: z.enum(['true', 'false']).optional().describe('Should this parameter be secured (password field)?'),
            isFK: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key?'),
            fKObjectName: z.string().optional().describe('Name of the foreign key object target (data object name, case-sensitive)'),
            fKObjectQueryName: z.string().optional().describe('Name of the foreign key object query'),
            isFKLookup: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key to a lookup object?'),
            isFKList: z.enum(['true', 'false']).optional().describe('Should a dropdown list be shown for this FK?'),
            isFKListInactiveIncluded: z.enum(['true', 'false']).optional().describe('Should inactive items be included in the FK dropdown list?'),
            isFKListUnknownOptionRemoved: z.enum(['true', 'false']).optional().describe('Should the "Unknown" option be removed from FK dropdown?'),
            fKListOrderBy: z.enum(['NameDesc', 'NameAsc', 'DisplayOrderDesc', 'DisplayOrderAsc']).optional().describe('Sort order for FK dropdown list'),
            isFKListOptionRecommended: z.enum(['true', 'false']).optional().describe('Should a recommended option be highlighted in FK dropdown?'),
            isFKListSearchable: z.enum(['true', 'false']).optional().describe('Should the FK dropdown list be searchable?'),
            FKListRecommendedOption: z.string().optional().describe('The recommended option value for FK dropdown'),
            isRadioButtonList: z.enum(['true', 'false']).optional().describe('Should this parameter be displayed as radio buttons?'),
            isFileUpload: z.enum(['true', 'false']).optional().describe('Is this parameter a file upload field?'),
            isCreditCardEntry: z.enum(['true', 'false']).optional().describe('Is this parameter a credit card entry field?'),
            isTimeZoneDetermined: z.enum(['true', 'false']).optional().describe('Should timezone be determined for this parameter?'),
            isAutoCompleteAddressSource: z.enum(['true', 'false']).optional().describe('Implements typical Google address autocomplete'),
            autoCompleteAddressSourceName: z.string().optional().describe('Name of the source parameter for address autocomplete'),
            autoCompleteAddressTargetType: z.enum(['AddressLine1', 'AddressLine2', 'City', 'StateAbbrev', 'Zip', 'Country', 'Latitude', 'Longitude']).optional().describe('Type of address field this parameter represents'),
            detailsText: z.string().optional().describe('Additional details text for this parameter'),
            validationRuleRegExMatchRequired: z.string().optional().describe('Regular expression pattern that this parameter must match'),
            validationRuleRegExMatchRequiredErrorText: z.string().optional().describe('Error message displayed when regex validation fails'),
            isIgnored: z.enum(['true', 'false']).optional().describe('Should this parameter be ignored by the code generator?'),
            sourceObjectName: z.string().optional().describe('Name of the source data object for this parameter'),
            sourcePropertyName: z.string().optional().describe('Name of the source property from the source object')
        },
        outputSchema: {
            success: z.boolean(),
            param: z.any().optional(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async (args) => {
        try {
            const { form_name, name, ...otherParams } = args;
            const param = { name, ...otherParams };
            const result = await tools.add_form_param(form_name, param as any);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register update_form_param tool
        server.registerTool('update_form_param', {
        title: 'Update Form Parameter',
        description: 'Update properties of an existing parameter (form field/control) in a form. Form name and parameter name must match exactly (case-sensitive). At least one property to update is required. Updates only the specified properties, leaving others unchanged.',
        inputSchema: {
            form_name: z.string().describe('The name of the form containing the parameter (required, case-sensitive exact match)'),
            param_name: z.string().describe('The name of the parameter to update (required, case-sensitive exact match)'),
            sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this parameter'),
            sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal)'),
            labelText: z.string().optional().describe('Human-readable label text displayed for this field'),
            infoToolTipText: z.string().optional().describe('Tooltip text displayed when hovering over the info icon'),
            codeDescription: z.string().optional().describe('Code description for documentation'),
            defaultValue: z.string().optional().describe('Default value for this parameter'),
            isVisible: z.enum(['true', 'false']).optional().describe('Is this parameter visible on the form?'),
            isRequired: z.enum(['true', 'false']).optional().describe('Is this parameter required?'),
            requiredErrorText: z.string().optional().describe('Error message displayed when required field is not filled'),
            isSecured: z.enum(['true', 'false']).optional().describe('Should this parameter be secured (password field)?'),
            isFK: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key?'),
            fKObjectName: z.string().optional().describe('Name of the foreign key object target (data object name, case-sensitive)'),
            fKObjectQueryName: z.string().optional().describe('Name of the foreign key object query'),
            isFKLookup: z.enum(['true', 'false']).optional().describe('Is this parameter a foreign key to a lookup object?'),
            isFKList: z.enum(['true', 'false']).optional().describe('Should a dropdown list be shown for this FK?'),
            isFKListInactiveIncluded: z.enum(['true', 'false']).optional().describe('Should inactive items be included in the FK dropdown list?'),
            isFKListUnknownOptionRemoved: z.enum(['true', 'false']).optional().describe('Should the "Unknown" option be removed from FK dropdown?'),
            fKListOrderBy: z.enum(['NameDesc', 'NameAsc', 'DisplayOrderDesc', 'DisplayOrderAsc']).optional().describe('Sort order for FK dropdown list'),
            isFKListOptionRecommended: z.enum(['true', 'false']).optional().describe('Should a recommended option be highlighted in FK dropdown?'),
            isFKListSearchable: z.enum(['true', 'false']).optional().describe('Should the FK dropdown list be searchable?'),
            FKListRecommendedOption: z.string().optional().describe('The recommended option value for FK dropdown'),
            isRadioButtonList: z.enum(['true', 'false']).optional().describe('Should this parameter be displayed as radio buttons?'),
            isFileUpload: z.enum(['true', 'false']).optional().describe('Is this parameter a file upload field?'),
            isCreditCardEntry: z.enum(['true', 'false']).optional().describe('Is this parameter a credit card entry field?'),
            isTimeZoneDetermined: z.enum(['true', 'false']).optional().describe('Should timezone be determined for this parameter?'),
            isAutoCompleteAddressSource: z.enum(['true', 'false']).optional().describe('Implements typical Google address autocomplete'),
            autoCompleteAddressSourceName: z.string().optional().describe('Name of the source parameter for address autocomplete'),
            autoCompleteAddressTargetType: z.enum(['AddressLine1', 'AddressLine2', 'City', 'StateAbbrev', 'Zip', 'Country', 'Latitude', 'Longitude']).optional().describe('Type of address field this parameter represents'),
            detailsText: z.string().optional().describe('Additional details text for this parameter'),
            validationRuleRegExMatchRequired: z.string().optional().describe('Regular expression pattern that this parameter must match'),
            validationRuleRegExMatchRequiredErrorText: z.string().optional().describe('Error message displayed when regex validation fails'),
            isIgnored: z.enum(['true', 'false']).optional().describe('Should this parameter be ignored by the code generator?'),
            sourceObjectName: z.string().optional().describe('Name of the source data object for this parameter'),
            sourcePropertyName: z.string().optional().describe('Name of the source property from the source object')
        },
        outputSchema: {
            success: z.boolean(),
            param: z.any().optional(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ form_name, param_name, ...updates }) => {
        try {
            const result = await tools.update_form_param(form_name, param_name, updates);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register add_form_button tool
        server.registerTool('add_form_button', {
        title: 'Add Form Button',
        description: 'Add a new button to an existing form in the AppDNA model. The form must already exist. Form name is case-sensitive exact match. buttonText is required.',
        inputSchema: {
            form_name: z.string().describe('Name of the form to add button to (required, case-sensitive exact match)'),
            buttonText: z.string().describe('Text displayed on the button (required, e.g., "Submit", "Cancel", "Back")'),
            buttonType: z.enum(['submit', 'cancel', 'other']).optional().describe('Type of button (optional): "submit", "cancel", or "other". Default is "submit"'),
            isVisible: z.enum(['true', 'false']).optional().describe('Whether button is visible (optional): "true" or "false". Default is "true"'),
            conditionalVisiblePropertyName: z.string().optional().describe('Property name that controls button visibility (optional)'),
            destinationContextObjectName: z.string().optional().describe('Owner object of the destination (optional, typically the data object that owns the target form)'),
            destinationTargetName: z.string().optional().describe('Target form, report, or workflow name for button navigation (optional)'),
            introText: z.string().optional().describe('Introduction text shown before button (optional)'),
            isButtonCallToAction: z.enum(['true', 'false']).optional().describe('Whether button is call-to-action for highlighting (optional): "true" or "false". Default is "false"'),
            accessKey: z.string().optional().describe('Keyboard shortcut key for button (optional, single character)'),
            isAccessKeyAvailable: z.enum(['true', 'false']).optional().describe('Whether access key is available (optional): "true" or "false". Default is "false"')
        },
        outputSchema: {
            success: z.boolean(),
            button: z.any().optional(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { form_name, buttonText, ...optionalProps } = args;
            
        // Build button object with only provided properties
            const button: any = { buttonText };
            
        // Add optional properties if provided
            if (optionalProps.buttonType !== undefined) { button.buttonType = optionalProps.buttonType; }
            if (optionalProps.isVisible !== undefined) { button.isVisible = optionalProps.isVisible; }
            if (optionalProps.conditionalVisiblePropertyName !== undefined) { button.conditionalVisiblePropertyName = optionalProps.conditionalVisiblePropertyName; }
            if (optionalProps.destinationContextObjectName !== undefined) { button.destinationContextObjectName = optionalProps.destinationContextObjectName; }
            if (optionalProps.destinationTargetName !== undefined) { button.destinationTargetName = optionalProps.destinationTargetName; }
            if (optionalProps.introText !== undefined) { button.introText = optionalProps.introText; }
            if (optionalProps.isButtonCallToAction !== undefined) { button.isButtonCallToAction = optionalProps.isButtonCallToAction; }
            if (optionalProps.accessKey !== undefined) { button.accessKey = optionalProps.accessKey; }
            if (optionalProps.isAccessKeyAvailable !== undefined) { button.isAccessKeyAvailable = optionalProps.isAccessKeyAvailable; }
            
            const result = await tools.add_form_button(form_name as string, button);
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register update_form_button tool
        server.registerTool('update_form_button', {
        title: 'Update Form Button',
        description: 'Update properties of an existing button in a form. Form name and button text are case-sensitive exact matches. At least one property to update is required.',
        inputSchema: {
            form_name: z.string().describe('Name of the form containing the button (required, case-sensitive exact match)'),
            button_text: z.string().describe('Text of the button to update (required, case-sensitive exact match, used to identify the button)'),
            buttonText: z.string().optional().describe('New button text (optional)'),
            buttonType: z.enum(['submit', 'cancel', 'other']).optional().describe('New button type (optional): "submit", "cancel", or "other"'),
            isVisible: z.enum(['true', 'false']).optional().describe('New visibility setting (optional): "true" or "false"'),
            conditionalVisiblePropertyName: z.string().optional().describe('New property controlling visibility (optional)'),
            destinationContextObjectName: z.string().optional().describe('New owner object of destination (optional)'),
            destinationTargetName: z.string().optional().describe('New target form/report/workflow (optional)'),
            introText: z.string().optional().describe('New introduction text (optional)'),
            isButtonCallToAction: z.enum(['true', 'false']).optional().describe('New call-to-action setting (optional): "true" or "false"'),
            accessKey: z.string().optional().describe('New keyboard shortcut key (optional)'),
            isAccessKeyAvailable: z.enum(['true', 'false']).optional().describe('New access key availability (optional): "true" or "false"')
        },
        outputSchema: {
            success: z.boolean(),
            button: z.any().optional(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { form_name, button_text, ...updates } = args;
            
            const result = await tools.update_form_button(form_name as string, button_text as string, updates);
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register add_form_output_var tool
        server.registerTool('add_form_output_var', {
        title: 'Add Form Output Variable',
        description: 'Add a new output variable to an existing form in the AppDNA model. Output variables display results or data after form submission. Form name is case-sensitive exact match. name is required.',
        inputSchema: {
            form_name: z.string().describe('Name of the form to add output variable to (required, case-sensitive exact match)'),
            name: z.string().describe('Name of the output variable (required, PascalCase)'),
            sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('SQL Server data type for this output variable'),
            sqlServerDBDataTypeSize: z.string().optional().describe('Size of data type (for nvarchar, varchar, decimal). Default is 100 for nvarchar.'),
            isFK: z.enum(['true', 'false']).optional().describe('Is this a foreign key? (optional): "true" or "false"'),
            fKObjectName: z.string().optional().describe('Foreign key object name (required if isFK="true")'),
            isFKLookup: z.enum(['true', 'false']).optional().describe('Is FK to a lookup object? (optional): "true" or "false"'),
            isIgnored: z.enum(['true', 'false']).optional().describe('Should be ignored by code generator? (optional): "true" or "false"'),
            sourceObjectName: z.string().optional().describe('Source data object name'),
            sourcePropertyName: z.string().optional().describe('Source property name from source object')
        },
        outputSchema: {
            success: z.boolean(),
            output_var: z.any().optional(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { form_name, name, ...optionalProps } = args;
            
        // Build output variable object with only provided properties
            const output_var: any = { name };
            
        // Add optional properties if provided (only the allowed properties)
            if (optionalProps.sqlServerDBDataType !== undefined) { output_var.sqlServerDBDataType = optionalProps.sqlServerDBDataType; }
            if (optionalProps.sqlServerDBDataTypeSize !== undefined) { output_var.sqlServerDBDataTypeSize = optionalProps.sqlServerDBDataTypeSize; }
            if (optionalProps.isFK !== undefined) { output_var.isFK = optionalProps.isFK; }
            if (optionalProps.fKObjectName !== undefined) { output_var.fKObjectName = optionalProps.fKObjectName; }
            if (optionalProps.isFKLookup !== undefined) { output_var.isFKLookup = optionalProps.isFKLookup; }
            if (optionalProps.isIgnored !== undefined) { output_var.isIgnored = optionalProps.isIgnored; }
            if (optionalProps.sourceObjectName !== undefined) { output_var.sourceObjectName = optionalProps.sourceObjectName; }
            if (optionalProps.sourcePropertyName !== undefined) { output_var.sourcePropertyName = optionalProps.sourcePropertyName; }
            
            const result = await tools.add_form_output_var(form_name as string, output_var);
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register update_form_output_var tool
        server.registerTool('update_form_output_var', {
        title: 'Update Form Output Variable',
        description: 'Update properties of an existing output variable in a form. Form name and output variable name are case-sensitive exact matches. At least one property to update is required. Note: Output variable names cannot be changed after creation.',
        inputSchema: {
            form_name: z.string().describe('Name of the form containing the output variable (required, case-sensitive exact match)'),
            output_var_name: z.string().describe('Name of the output variable to update (required, case-sensitive exact match, used to identify the output variable)'),
            sqlServerDBDataType: z.enum(['nvarchar', 'bit', 'datetime', 'int', 'uniqueidentifier', 'money', 'bigint', 'float', 'decimal', 'date', 'varchar', 'text']).optional().describe('New SQL Server data type'),
            sqlServerDBDataTypeSize: z.string().optional().describe('New data type size'),
            isFK: z.enum(['true', 'false']).optional().describe('New FK setting: "true" or "false"'),
            fKObjectName: z.string().optional().describe('New foreign key object name'),
            isFKLookup: z.enum(['true', 'false']).optional().describe('New FK lookup setting: "true" or "false"'),
            isIgnored: z.enum(['true', 'false']).optional().describe('New ignored setting: "true" or "false"'),
            sourceObjectName: z.string().optional().describe('New source object name'),
            sourcePropertyName: z.string().optional().describe('New source property name')
        },
        outputSchema: {
            success: z.boolean(),
            output_var: z.any().optional(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional()
        }
    }, async (args: Record<string, unknown>) => {
        try {
            const { form_name, output_var_name, ...updates } = args;
            
            const result = await tools.update_form_output_var(form_name as string, output_var_name as string, updates);
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register move_form_param tool
        server.registerTool('move_form_param', {
        title: 'Move Form Parameter',
        description: 'Move a form parameter to a new position in the parameter list. Changes the display order of input controls on the form. Form name and parameter name must match exactly (case-sensitive). Position is 0-based index (0 = first position).',
        inputSchema: {
            form_name: z.string().describe('The name of the form containing the parameter (required, case-sensitive exact match)'),
            param_name: z.string().describe('The name of the parameter to move (required, case-sensitive exact match)'),
            new_position: z.number().min(0).describe('The new 0-based index position for the parameter (0 = first position). Must be less than the total parameter count.')
        },
        outputSchema: {
            success: z.boolean(),
            report_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            param_name: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            param_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ form_name, param_name, new_position }) => {
        try {
            const result = await tools.move_form_param(form_name, param_name, new_position);
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register move_form_button tool
        server.registerTool('move_form_button', {
        title: 'Move Form Button',
        description: 'Move a form button to a new position in the button list. Changes the display order of buttons on the form. Form name and button text must match exactly (case-sensitive). Position is 0-based index (0 = first position).',
        inputSchema: {
            form_name: z.string().describe('The name of the form containing the button (required, case-sensitive exact match)'),
            button_text: z.string().describe('The text of the button to move (required, case-sensitive exact match)'),
            new_position: z.number().min(0).describe('The new 0-based index position for the button (0 = first position). Must be less than the total button count.')
        },
        outputSchema: {
            success: z.boolean(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            button_text: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            button_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ form_name, button_text, new_position }) => {
        try {
            const result = await tools.move_form_button(form_name, button_text, new_position);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // Register move_form_output_var tool
        server.registerTool('move_form_output_var', {
        title: 'Move Form Output Variable',
        description: 'Move a form output variable to a new position in the output variable list. Changes the display order of output variables on the form. Form name and output variable name must match exactly (case-sensitive). Position is 0-based index (0 = first position).',
        inputSchema: {
            form_name: z.string().describe('The name of the form containing the output variable (required, case-sensitive exact match)'),
            output_var_name: z.string().describe('The name of the output variable to move (required, case-sensitive exact match)'),
            new_position: z.number().min(0).describe('The new 0-based index position for the output variable (0 = first position). Must be less than the total output variable count.')
        },
        outputSchema: {
            success: z.boolean(),
            form_name: z.string().optional(),
            owner_object_name: z.string().optional(),
            output_var_name: z.string().optional(),
            old_position: z.number().optional(),
            new_position: z.number().optional(),
            output_var_count: z.number().optional(),
            message: z.string().optional(),
            note: z.string().optional(),
            error: z.string().optional()
        }
    }, async ({ form_name, output_var_name, new_position }) => {
        try {
            const result = await tools.move_form_output_var(form_name, output_var_name, new_position);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                structuredContent: result
            };
        } catch (error: any) {
            const errorResult = { success: false, error: error.message };
            return {
                content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
                structuredContent: errorResult,
                isError: true
            };
        }
    });

    // ========================================
    // Report Tools
    // ========================================

}
