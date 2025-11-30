// userStoryRoutes.ts
// Route handlers for user story operations
// Created on: November 30, 2025

import * as http from "http";
import { ModelService } from "../../modelService";
import { validateUserStory } from "../../validation/userStoryValidation";
import {
    parseRequestBody,
    sendJsonResponse,
    sendErrorResponse,
    logRequest
} from "../utils/routeUtils";
import { RouteContext } from "../types/routeTypes";

/**
 * GET /api/user-stories
 * Get all user stories from all namespaces
 */
export async function getUserStories(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    const modelService = ModelService.getInstance();
    const model = modelService.getCurrentModel();
    const stories = model?.namespace?.flatMap(ns => ns.userStory || []) || [];
    
    context.outputChannel.appendLine(`[Data Bridge] Returning ${stories.length} user stories`);
    sendJsonResponse(res, 200, stories, context.outputChannel);
}

/**
 * POST /api/user-stories
 * Create a new user story with validation
 */
export async function createUserStory(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { storyText, storyNumber } = await parseRequestBody(req);
        const modelService = ModelService.getInstance();
        
        // Validate storyText is provided
        if (!storyText) {
            sendErrorResponse(res, 400, "storyText is required", context.outputChannel);
            return;
        }
        
        // Get namespace
        const model = modelService.getCurrentModel();
        if (!model || !model.namespace || !Array.isArray(model.namespace) || model.namespace.length === 0) {
            sendErrorResponse(res, 400, "Model structure is invalid or namespace not found", context.outputChannel);
            return;
        }
        
        const namespace = model.namespace[0];
        if (!namespace.userStory || !Array.isArray(namespace.userStory)) {
            namespace.userStory = [];
        }
        
        // Validate user story using validation module
        const validation = validateUserStory(storyText, modelService);
        if (!validation.valid) {
            sendErrorResponse(res, 400, validation.error || "Invalid user story", context.outputChannel);
            return;
        }
        
        // Check for duplicate
        const existingStory = namespace.userStory.find((story: any) => story.storyText === storyText);
        if (existingStory) {
            sendErrorResponse(res, 409, "Duplicate story text already exists", context.outputChannel);
            return;
        }
        
        // Generate GUID for name
        const generateGuid = (): string => {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        
        // Create new story
        const newStory: any = {
            name: generateGuid(),
            storyText: storyText
        };
        
        // Add optional storyNumber if provided
        if (storyNumber) {
            newStory.storyNumber = storyNumber;
        }
        
        // Add to model
        namespace.userStory.push(newStory);
        
        // Mark unsaved changes
        modelService.markUnsavedChanges();
        
        context.outputChannel.appendLine(`[Data Bridge] User story created: ${newStory.name}`);
        sendJsonResponse(res, 201, {
            success: true,
            story: newStory,
            message: "User story added successfully (unsaved changes)"
        }, context.outputChannel);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        context.outputChannel.appendLine(`[Data Bridge] Error creating story: ${errorMessage}`);
        sendErrorResponse(res, 500, errorMessage, context.outputChannel);
    }
}

/**
 * POST /api/user-stories/update
 * Update an existing user story
 */
export async function updateUserStory(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const { name, isIgnored } = await parseRequestBody(req);
        
        if (!name) {
            throw new Error('Parameter "name" is required');
        }
        
        const modelService = ModelService.getInstance();
        const model = modelService.getCurrentModel();
        
        if (!model || !model.namespace) {
            throw new Error("No model loaded");
        }
        
        let foundStory: any = null;
        for (const ns of model.namespace) {
            if (ns.userStory && Array.isArray(ns.userStory)) {
                foundStory = ns.userStory.find((s: any) => s.name === name);
                if (foundStory) {
                    break;
                }
            }
        }
        
        if (!foundStory) {
            throw new Error(`User story "${name}" not found`);
        }
        
        if (isIgnored !== undefined) {
            foundStory.isIgnored = isIgnored;
        }
        
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore errors
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Updated user story: ${name}`);
        sendJsonResponse(res, 200, {
            success: true,
            userStory: foundStory,
            message: `User story "${name}" updated successfully`
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 400, error instanceof Error ? error.message : "Invalid request", context.outputChannel);
    }
}
