// workflowTools.ts
// Tools for managing workflows (isDynaFlow=true objectWorkflow) via MCP
// Created on: November 9, 2025
// This file implements workflow tools for the MCP server

/**
 * Implements workflow tools for the MCP server
 * Workflows are identified by isDynaFlow="true" in objectWorkflow array
 */
export class WorkflowTools {
    constructor(modelService: any) {
        // ModelService passed but not used - MCP server uses HTTP bridge
    }

    /**
     * Gets the schema definition for workflows (isDynaFlow objectWorkflow)
     * Tool name: get_workflow_schema (following MCP snake_case convention)
     * @returns Schema definition with properties, validation rules, and examples for workflows
     */
    public async get_workflow_schema(): Promise<any> {
        return {
            success: true,
            schema: {
                type: "object",
                description: "Workflow (objectWorkflow with isDynaFlow=true) structure in AppDNA model - represents multi-step business processes orchestrated through tasks.",
                objectType: "objectWorkflow",
                category: "workflow",
                properties: {
                    name: {
                        type: "string",
                        required: true,
                        format: "PascalCase",
                        pattern: "^[A-Z][A-Za-z0-9]*$",
                        description: "Workflow ID, unique for each workflow. Must be in PascalCase format. Should not end with 'InitObjWF' or 'InitReport' (those are page init flows).",
                        examples: ["CustomerRegistration", "OrderProcessing", "DataValidation", "ReportGeneration", "BulkImport"]
                    },
                    codeDescription: {
                        type: "string",
                        required: false,
                        description: "Code-level description of the workflow's purpose and behavior.",
                        examples: ["Handles customer registration and initial setup", "Processes orders and updates inventory"]
                    },
                    isCustomLogicOverwritten: {
                        type: "string",
                        required: false,
                        enum: ["true", "false"],
                        description: "Has the auto-generated logic been overwritten with custom code? String \"true\" or \"false\".",
                        examples: ["true", "false"]
                    }
                },
                dynaFlowTask: {
                    type: "array",
                    description: "Tasks that make up the workflow. Tasks are executed in sequence or based on task dependencies.",
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                required: true,
                                format: "PascalCase",
                                pattern: "^[A-Z][A-Za-z0-9]*$",
                                description: "Task name. Must be in PascalCase format and unique within the workflow.",
                                examples: ["ValidateInput", "ProcessData", "SendNotification", "UpdateDatabase"]
                            }
                        }
                    }
                },
                usage: {
                    ownerObject: "Workflows are defined in the objectWorkflow array of a data object",
                    identification: "Workflows are identified by isDynaFlow='true' property",
                    taskArray: "Each workflow can have multiple tasks in the dynaFlowTask array",
                    examples: [
                        {
                            name: "CustomerRegistration",
                            isDynaFlow: "true",
                            codeDescription: "Handles customer registration and initial setup",
                            dynaFlowTask: [
                                {
                                    name: "ValidateCustomerData"
                                },
                                {
                                    name: "CreateCustomerRecord"
                                },
                                {
                                    name: "SendWelcomeEmail"
                                }
                            ]
                        },
                        {
                            name: "OrderProcessing",
                            isDynaFlow: "true",
                            codeDescription: "Processes orders and updates inventory",
                            dynaFlowTask: [
                                {
                                    name: "ValidateOrder"
                                },
                                {
                                    name: "ProcessPayment"
                                },
                                {
                                    name: "UpdateInventory"
                                }
                            ]
                        }
                    ]
                },
                notes: [
                    "Workflows are stored in the objectWorkflow array with isDynaFlow='true'",
                    "Each workflow belongs to a data object (owner object)",
                    "Workflows orchestrate multi-step business processes through tasks",
                    "Tasks are defined in the dynaFlowTask array",
                    "Tasks execute in sequence or based on dependencies",
                    "Workflows are different from page init flows (which end in InitObjWF/InitReport)",
                    "Workflows are different from general flows (which have neither isDynaFlow nor isDynaFlowTask)",
                    "All boolean properties use string values: \"true\" or \"false\"",
                    "Property names must use PascalCase format"
                ]
            }
        };
    }

    /**
     * Lists all workflows in the model with summary data
     * Tool name: list_workflows
     * @param workflow_name - Optional workflow name filter (case-insensitive, partial match)
     * @param owner_object_name - Optional owner object name filter (case-insensitive, exact match)
     * @returns Array of workflows with summary information
     */
    public async list_workflows(workflow_name?: string, owner_object_name?: string): Promise<any> {
        try {
            // Use HTTP bridge to get all objects
            const response = await fetch('http://localhost:3001/api/objects');
            if (!response.ok) {
                return {
                    success: false,
                    error: 'Could not retrieve objects from model',
                    note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
                };
            }

            const objects = await response.json();
            const workflows: any[] = [];

            // Iterate through all objects and their objectWorkflow arrays
            for (const obj of objects) {
                // Apply owner object name filter (case-insensitive, exact match)
                if (owner_object_name && obj.name.toLowerCase() !== owner_object_name.toLowerCase()) {
                    continue;
                }

                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    for (const workflow of obj.objectWorkflow) {
                        // Identify workflows by isDynaFlow="true"
                        if (workflow.isDynaFlow === "true") {
                            // Apply workflow name filter (case-insensitive, partial match)
                            if (workflow_name && !workflow.name.toLowerCase().includes(workflow_name.toLowerCase())) {
                                continue;
                            }

                            workflows.push({
                                name: workflow.name,
                                owner_object_name: obj.name,
                                taskCount: workflow.dynaFlowTask ? workflow.dynaFlowTask.length : 0
                            });
                        }
                    }
                }
            }

            return {
                success: true,
                workflows: workflows,
                count: workflows.length,
                filters: {
                    workflow_name: workflow_name || null,
                    owner_object_name: owner_object_name || null
                },
                note: `Found ${workflows.length} workflow(s) in the model. Workflows are identified by isDynaFlow='true'.`
            };
        } catch (error) {
            return {
                success: false,
                error: `Could not list workflows: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Gets complete details of a specific workflow including all tasks
     * Tool name: get_workflow
     * @param workflow_name - Name of the workflow (case-insensitive)
     * @returns Complete workflow with dynaFlowTask array
     */
    public async get_workflow(workflow_name: string): Promise<any> {
        const validationErrors: string[] = [];

        if (!workflow_name) {
            validationErrors.push('workflow_name is required');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'workflow_name is required (case-insensitive).'
            };
        }

        try {
            // Use HTTP bridge to get all objects
            const response = await fetch('http://localhost:3001/api/objects');
            if (!response.ok) {
                return {
                    success: false,
                    error: 'Could not retrieve objects from model',
                    note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
                };
            }

            const objects = await response.json();
            let foundWorkflow: any = null;
            let foundOwnerObjectName: string = '';

            // Search for the workflow
            for (const obj of objects) {
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    for (const workflow of obj.objectWorkflow) {
                        if (workflow.isDynaFlow === "true" && 
                            workflow.name.toLowerCase() === workflow_name.toLowerCase()) {
                            foundWorkflow = workflow;
                            foundOwnerObjectName = obj.name;
                            break;
                        }
                    }
                }

                if (foundWorkflow) {
                    break;
                }
            }

            if (!foundWorkflow) {
                return {
                    success: false,
                    error: `Workflow "${workflow_name}" not found in any object`,
                    note: 'Workflow name matching is case-insensitive. Make sure the workflow exists and has isDynaFlow="true".',
                    validationErrors: [`Workflow "${workflow_name}" does not exist in the model or is not marked as isDynaFlow="true"`]
                };
            }

            // Filter hidden properties
            const filteredWorkflow = this.filterHiddenWorkflowProperties(foundWorkflow);

            return {
                success: true,
                workflow: filteredWorkflow,
                owner_object_name: foundOwnerObjectName,
                element_counts: {
                    taskCount: filteredWorkflow.dynaFlowTask ? filteredWorkflow.dynaFlowTask.length : 0
                },
                note: `Workflow retrieved successfully. Owner object: ${foundOwnerObjectName}. ${filteredWorkflow.dynaFlowTask ? filteredWorkflow.dynaFlowTask.length : 0} task(s) found.`
            };
        } catch (error) {
            return {
                success: false,
                error: `Could not retrieve workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required. Make sure the AppDNA extension is running and a model file is loaded.'
            };
        }
    }

    /**
     * Updates workflow properties
     * Tool name: update_workflow
     * @param workflow_name - Name of the workflow (case-sensitive)
     * @param codeDescription - Optional code description
     * @param isCustomLogicOverwritten - Optional custom logic flag
     * @returns Updated workflow
     */
    public async update_workflow(
        workflow_name: string,
        codeDescription?: string,
        isCustomLogicOverwritten?: 'true' | 'false'
    ): Promise<any> {
        const validationErrors: string[] = [];

        if (!workflow_name) {
            validationErrors.push('workflow_name is required');
        }

        // At least one property must be provided
        if (!codeDescription && !isCustomLogicOverwritten) {
            validationErrors.push('At least one property must be specified to update');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'workflow_name is required (case-sensitive). At least one property must be specified for update.'
            };
        }

        try {
            // First, find the workflow
            const getResponse = await fetch('http://localhost:3001/api/objects');
            if (!getResponse.ok) {
                return {
                    success: false,
                    error: 'Could not retrieve objects from model',
                    note: 'Bridge connection required.'
                };
            }

            const objects = await getResponse.json();
            let foundWorkflow: any = null;
            let foundOwnerObjectName: string = '';

            for (const obj of objects) {
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    for (const workflow of obj.objectWorkflow) {
                        if (workflow.isDynaFlow === "true" && workflow.name === workflow_name) {
                            foundWorkflow = workflow;
                            foundOwnerObjectName = obj.name;
                            break;
                        }
                    }
                }
                if (foundWorkflow) {
                    break;
                }
            }

            if (!foundWorkflow) {
                return {
                    success: false,
                    error: `Workflow "${workflow_name}" not found`,
                    note: 'Workflow name matching is case-sensitive. Make sure the workflow exists and has isDynaFlow="true".',
                    validationErrors: [`Workflow "${workflow_name}" does not exist in the model`]
                };
            }

            // Update properties
            if (codeDescription !== undefined) {
                foundWorkflow.codeDescription = codeDescription;
            }
            if (isCustomLogicOverwritten !== undefined) {
                foundWorkflow.isCustomLogicOverwritten = isCustomLogicOverwritten;
            }

            // Changes are applied in memory - the model service will track unsaved changes
            const filteredWorkflow = this.filterHiddenWorkflowProperties(foundWorkflow);

            return {
                success: true,
                workflow: filteredWorkflow,
                owner_object_name: foundOwnerObjectName,
                message: 'Workflow updated successfully',
                note: 'The model has unsaved changes. Use the save command to persist to disk.'
            };
        } catch (error) {
            return {
                success: false,
                error: `Could not update workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required.'
            };
        }
    }

    /**
     * Creates a new workflow in the specified data object
     * Tool name: create_workflow
     * @param owner_object_name - Name of the owner data object
     * @param name - Name of the new workflow (PascalCase)
     * @param codeDescription - Optional code description
     * @returns Created workflow
     */
    public async create_workflow(
        owner_object_name: string,
        name: string,
        codeDescription?: string
    ): Promise<any> {
        const validationErrors: string[] = [];

        if (!owner_object_name) {
            validationErrors.push('owner_object_name is required');
        }

        if (!name) {
            validationErrors.push('name is required');
        }

        // Validate PascalCase naming
        if (name && !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
            validationErrors.push('name must be in PascalCase format (start with uppercase letter, contain only letters and numbers)');
        }

        // Should not end with page init flow suffixes
        if (name && (name.endsWith('InitObjWF') || name.endsWith('InitReport'))) {
            validationErrors.push('Workflow name should not end with "InitObjWF" or "InitReport" (those are for page init flows)');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'owner_object_name and name are required. name must be PascalCase and not end with InitObjWF/InitReport.'
            };
        }

        try {
            // Get all objects
            const response = await fetch('http://localhost:3001/api/objects');
            if (!response.ok) {
                return {
                    success: false,
                    error: 'Could not retrieve objects from model',
                    note: 'Bridge connection required.'
                };
            }

            const objects = await response.json();
            const ownerObject = objects.find((obj: any) => obj.name === owner_object_name);

            if (!ownerObject) {
                return {
                    success: false,
                    error: `Owner object "${owner_object_name}" not found`,
                    validationErrors: [`Owner object "${owner_object_name}" does not exist in the model`]
                };
            }

            // Check for duplicate workflow name in this object
            if (ownerObject.objectWorkflow && Array.isArray(ownerObject.objectWorkflow)) {
                const duplicate = ownerObject.objectWorkflow.find((wf: any) => wf.name === name);
                if (duplicate) {
                    return {
                        success: false,
                        error: `Workflow with name "${name}" already exists in object "${owner_object_name}"`,
                        validationErrors: [`Duplicate workflow name "${name}" in object "${owner_object_name}"`]
                    };
                }
            }

            // Create new workflow
            const newWorkflow: any = {
                name: name,
                isDynaFlow: "true",
                dynaFlowTask: []
            };

            if (codeDescription !== undefined) {
                newWorkflow.codeDescription = codeDescription;
            }

            // Add workflow to object
            if (!ownerObject.objectWorkflow) {
                ownerObject.objectWorkflow = [];
            }
            ownerObject.objectWorkflow.push(newWorkflow);

            // Changes are applied in memory - the model service will track unsaved changes
            const filteredWorkflow = this.filterHiddenWorkflowProperties(newWorkflow);

            return {
                success: true,
                workflow: filteredWorkflow,
                owner_object_name: owner_object_name,
                message: `Workflow "${name}" created successfully in object "${owner_object_name}"`,
                note: 'The model has unsaved changes. Use the save command to persist to disk.'
            };
        } catch (error) {
            return {
                success: false,
                error: `Could not create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required.'
            };
        }
    }

    /**
     * Adds a new task to a workflow
     * Tool name: add_workflow_task
     * @param workflow_name - Name of the workflow
     * @param name - Name of the new task (PascalCase)
     * @returns Created task
     */
    public async add_workflow_task(
        workflow_name: string,
        name: string
    ): Promise<any> {
        const validationErrors: string[] = [];

        if (!workflow_name) {
            validationErrors.push('workflow_name is required');
        }

        if (!name) {
            validationErrors.push('name is required');
        }

        // Validate PascalCase naming
        if (name && !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
            validationErrors.push('name must be in PascalCase format (start with uppercase letter, contain only letters and numbers)');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'workflow_name and name are required. name must be PascalCase.'
            };
        }

        try {
            // Find the workflow
            const response = await fetch('http://localhost:3001/api/objects');
            if (!response.ok) {
                return {
                    success: false,
                    error: 'Could not retrieve objects from model',
                    note: 'Bridge connection required.'
                };
            }

            const objects = await response.json();
            let foundWorkflow: any = null;
            let foundOwnerObjectName: string = '';

            for (const obj of objects) {
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    for (const workflow of obj.objectWorkflow) {
                        if (workflow.isDynaFlow === "true" && workflow.name === workflow_name) {
                            foundWorkflow = workflow;
                            foundOwnerObjectName = obj.name;
                            break;
                        }
                    }
                }
                if (foundWorkflow) {
                    break;
                }
            }

            if (!foundWorkflow) {
                return {
                    success: false,
                    error: `Workflow "${workflow_name}" not found`,
                    validationErrors: [`Workflow "${workflow_name}" does not exist in the model`]
                };
            }

            // Check for duplicate task name
            if (!foundWorkflow.dynaFlowTask) {
                foundWorkflow.dynaFlowTask = [];
            }

            const duplicate = foundWorkflow.dynaFlowTask.find((task: any) => task.name === name);
            if (duplicate) {
                return {
                    success: false,
                    error: `Task with name "${name}" already exists in workflow "${workflow_name}"`,
                    validationErrors: [`Duplicate task name "${name}" in workflow "${workflow_name}"`]
                };
            }

            // Create new task
            const newTask: any = {
                name: name
            };

            // Add task to workflow
            foundWorkflow.dynaFlowTask.push(newTask);

            // Changes are applied in memory - the model service will track unsaved changes
            return {
                success: true,
                task: newTask,
                workflow_name: workflow_name,
                owner_object_name: foundOwnerObjectName,
                message: `Task "${name}" added successfully to workflow "${workflow_name}"`,
                note: 'The model has unsaved changes. Use the save command to persist to disk.'
            };
        } catch (error) {
            return {
                success: false,
                error: `Could not add task: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required.'
            };
        }
    }

    /**
     * Moves a task to a new position in the workflow's task array
     * Tool name: move_workflow_task
     * @param workflow_name - Name of the workflow
     * @param task_name - Name of the task to move
     * @param new_position - New position (0-based index)
     * @returns Move operation result
     */
    public async move_workflow_task(
        workflow_name: string,
        task_name: string,
        new_position: number
    ): Promise<any> {
        const validationErrors: string[] = [];

        if (!workflow_name) {
            validationErrors.push('workflow_name is required');
        }

        if (!task_name) {
            validationErrors.push('task_name is required');
        }

        if (new_position === undefined || new_position === null) {
            validationErrors.push('new_position is required');
        }

        if (new_position < 0) {
            validationErrors.push('new_position must be >= 0');
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validationErrors,
                note: 'workflow_name, task_name, and new_position are required. new_position must be >= 0.'
            };
        }

        try {
            // Find the workflow
            const response = await fetch('http://localhost:3001/api/objects');
            if (!response.ok) {
                return {
                    success: false,
                    error: 'Could not retrieve objects from model',
                    note: 'Bridge connection required.'
                };
            }

            const objects = await response.json();
            let foundWorkflow: any = null;
            let foundOwnerObjectName: string = '';

            for (const obj of objects) {
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    for (const workflow of obj.objectWorkflow) {
                        if (workflow.isDynaFlow === "true" && workflow.name === workflow_name) {
                            foundWorkflow = workflow;
                            foundOwnerObjectName = obj.name;
                            break;
                        }
                    }
                }
                if (foundWorkflow) {
                    break;
                }
            }

            if (!foundWorkflow) {
                return {
                    success: false,
                    error: `Workflow "${workflow_name}" not found`,
                    validationErrors: [`Workflow "${workflow_name}" does not exist in the model`]
                };
            }

            if (!foundWorkflow.dynaFlowTask || foundWorkflow.dynaFlowTask.length === 0) {
                return {
                    success: false,
                    error: `Workflow "${workflow_name}" has no tasks`,
                    validationErrors: [`Workflow "${workflow_name}" has no tasks to move`]
                };
            }

            // Find the task
            const oldPosition = foundWorkflow.dynaFlowTask.findIndex((task: any) => task.name === task_name);
            if (oldPosition === -1) {
                return {
                    success: false,
                    error: `Task "${task_name}" not found in workflow "${workflow_name}"`,
                    validationErrors: [`Task "${task_name}" does not exist in workflow "${workflow_name}"`]
                };
            }

            // Validate new position
            if (new_position >= foundWorkflow.dynaFlowTask.length) {
                return {
                    success: false,
                    error: `new_position ${new_position} is out of bounds (max: ${foundWorkflow.dynaFlowTask.length - 1})`,
                    validationErrors: [`new_position must be between 0 and ${foundWorkflow.dynaFlowTask.length - 1}`]
                };
            }

            // Move the task
            const [task] = foundWorkflow.dynaFlowTask.splice(oldPosition, 1);
            foundWorkflow.dynaFlowTask.splice(new_position, 0, task);

            // Changes are applied in memory - the model service will track unsaved changes
            return {
                success: true,
                workflow_name: workflow_name,
                owner_object_name: foundOwnerObjectName,
                task_name: task_name,
                old_position: oldPosition,
                new_position: new_position,
                task_count: foundWorkflow.dynaFlowTask.length,
                message: `Task "${task_name}" moved from position ${oldPosition} to ${new_position}`,
                note: `Total tasks: ${foundWorkflow.dynaFlowTask.length}. The model has unsaved changes.`
            };
        } catch (error) {
            return {
                success: false,
                error: `Could not move task: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Bridge connection required.'
            };
        }
    }

    /**
     * Filters out properties that are not shown in the workflow details view UI
     * @param workflow - Workflow object to filter
     * @returns Filtered workflow object
     */
    private filterHiddenWorkflowProperties(workflow: any): any {
        // For the simplified workflow schema, only return properties defined in the schema
        const allowedProperties = [
            'name',
            'codeDescription',
            'isCustomLogicOverwritten',
            'dynaFlowTask'
        ];

        const filtered: any = {};
        allowedProperties.forEach(prop => {
            if (workflow[prop] !== undefined) {
                if (prop === 'dynaFlowTask' && Array.isArray(workflow[prop])) {
                    // Filter tasks to only include 'name' property
                    filtered[prop] = workflow[prop].map((task: any) => ({
                        name: task.name
                    }));
                } else {
                    filtered[prop] = workflow[prop];
                }
            }
        });

        return filtered;
    }
}
