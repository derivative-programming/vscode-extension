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
 * Create a new user story (extracted from original bridge)
 */
export async function createUserStory(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RouteContext
): Promise<void> {
    logRequest(req, context.outputChannel);
    
    try {
        const body = await parseRequestBody(req);
        const modelService = ModelService.getInstance();
        
        // Simple validation
        if (!body.name || !body.title) {
            sendErrorResponse(res, 400, "name and title are required", context.outputChannel);
            return;
        }
        const model = modelService.getCurrentModel();
        
        if (!model || !model.namespace || model.namespace.length === 0) {
            sendErrorResponse(res, 400, "No namespaces available", context.outputChannel);
            return;
        }
        
        const namespace = model.namespace[0];
        if (!namespace.userStory) {
            namespace.userStory = [];
        }
        
        const newStory = {
            name: body.name,
            title: body.title,
            description: body.description || "",
            isIgnored: body.isIgnored || "false",
            roleName: body.roleName || ""
        };
        
        namespace.userStory.push(newStory);
        modelService.markUnsavedChanges();
        
        setTimeout(() => {
            try {
                require("vscode").commands.executeCommand("appdna.refresh");
            } catch (e) {
                // Ignore errors
            }
        }, 100);
        
        context.outputChannel.appendLine(`[Data Bridge] Created user story: ${body.name}`);
        sendJsonResponse(res, 200, {
            success: true,
            userStory: newStory,
            message: `User story "${body.name}" created successfully`
        }, context.outputChannel);
        
    } catch (error) {
        sendErrorResponse(res, 400, error instanceof Error ? error.message : "Invalid request", context.outputChannel);
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
