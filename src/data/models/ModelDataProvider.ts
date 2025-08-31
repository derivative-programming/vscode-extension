/**
 * ModelDataProvider - Responsible for loading JSON data and instantiating model objects
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { SchemaLoader } from "./schemaLoader";
import { RootModel } from "./rootModel";
import { NamespaceModel } from "./namespaceModel";
import { ObjectModel } from "./objectModel";
import { PropModel } from "./propModel";
import { NavButtonModel } from "./navButtonModel";
import { ReportModel } from "./reportModel";
import { TemplateSetModel } from "./templateSetModel";
import { ApiSiteModel } from "./apiSiteModel";
import { ChildObjectModel } from "./childObjectModel";
import { ReportColumnModel } from "./reportColumnModel";
import { ReportParamModel } from "./reportParamModel";
import { ReportButtonModel } from "./reportButtonModel";
import { ObjectWorkflowModel } from "./objectWorkflowModel";
import { ObjectWorkflowParamModel } from "./objectWorkflowParamModel";
import { ObjectWorkflowOutputVarModel } from "./objectWorkflowOutputVarModel";
import { ObjectWorkflowButtonModel } from "./objectWorkflowButtonModel";
import { QueryModel } from "./queryModel";
import { QueryParamModel } from "./queryParamModel";
import { ModelFeatureModel } from "./modelFeatureModel";
import { LexiconItemModel } from "./lexiconItemModel";
import { UserStoryModel } from "./userStoryModel";
import { LookupItemModel } from "./lookupItemModel";
import { PropSubscriptionModel } from "./propSubscriptionModel";
import { CalculatedPropModel } from "./calculatedPropModel";
import { FetchModel } from "./fetchModel";
import { IntersectionObjModel } from "./intersectionObjModel";
import { AppDnaSchema } from "../interfaces";
import { validate } from "jsonschema";

export class ModelDataProvider {
    private static instance: ModelDataProvider;
    private jsonCache: any = null;
    private rootModelCache: RootModel | null = null;
    
    private constructor() {}
    
    /**
     * Get the singleton instance of ModelDataProvider
     */
    public static getInstance(): ModelDataProvider {
        if (!ModelDataProvider.instance) {
            ModelDataProvider.instance = new ModelDataProvider();
        }
        return ModelDataProvider.instance;
    }
    
    /**
     * Load JSON data from a file
     * @param filePath Path to the JSON file
     */
    public async loadJsonFile(filePath: string): Promise<any> {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            
            // For very large files, we could consider using streaming
            // but for most app-dna.json files, this direct read should be efficient
            const fileContent = fs.readFileSync(filePath, "utf8");
            const jsonData = JSON.parse(fileContent);
            this.jsonCache = jsonData;
            
            return jsonData;
        } catch (error) {
            console.error("Error loading JSON file:", error);
            throw error;
        }
    }
    
    /**
     * Validate JSON data against the schema
     * @param jsonData JSON data to validate
     * @returns Object with validation result and detailed error information
     */
    public async validateJson(jsonData: any): Promise<{valid: boolean; errors: any[] | null; detailedMessage?: string}> {
        try {
            // Load the schema
            const schema = await SchemaLoader.getInstance().loadSchema();
            
            // Validate the JSON against the schema
            const result = validate(jsonData, schema as any);
            
            // Create detailed error message if validation fails
            let detailedMessage = "";
            if (!result.valid && result.errors && result.errors.length > 0) {
                console.error("JSON validation errors:", result.errors);
                
                // Create a user-friendly summary of validation errors
                const errorSummary = result.errors.slice(0, 5).map((error, index) => {
                    const path = error.property || error.instance || "root";
                    const message = error.message || "Unknown validation error";
                    return `${index + 1}. Path: "${path}" - ${message}`;
                }).join('\n');
                
                const totalErrors = result.errors.length;
                const hasMoreErrors = totalErrors > 5;
                
                detailedMessage = `JSON validation failed with ${totalErrors} error${totalErrors === 1 ? '' : 's'}:\n\n${errorSummary}${hasMoreErrors ? '\n\n... and ' + (totalErrors - 5) + ' more errors.' : ''}`;
            }
            
            return {
                valid: result.valid,
                errors: result.errors || null,
                detailedMessage
            };
        } catch (error) {
            console.error("Error validating JSON:", error);
            const errorMessage = `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return {
                valid: false,
                errors: [{message: errorMessage}],
                detailedMessage: errorMessage
            };
        }
    }
    
    /**
     * Load the root model from a JSON file
     * @param filePath Path to the JSON file
     */
    public async loadRootModel(filePath: string): Promise<RootModel> {
        try {
            // Load JSON data
            const jsonData = await this.loadJsonFile(filePath);
            
            // Validate JSON data (optional - can be commented out for performance with very large files)
            const validationResult = await this.validateJson(jsonData);
            if (!validationResult.valid) {
                const errorMessage = validationResult.detailedMessage || "JSON validation failed";
                throw new Error(errorMessage);
            }
            
            // Create root model from the root data
            const rootData = jsonData.root;
            const rootModel = RootModel.fromJson(rootData);
            
            // Process namespaces if they exist
            if (rootData.namespace && Array.isArray(rootData.namespace)) {
                rootModel.namespace = this.processNamespaces(rootData.namespace);
            }
            
            // Process navButtons if they exist
            if (rootData.navButton && Array.isArray(rootData.navButton)) {
                rootModel.navButton = this.processNavButtons(rootData.navButton);
            }
            
            // Process templateSets if they exist
            if (rootData.templateSet && Array.isArray(rootData.templateSet)) {
                rootModel.templateSet = this.processTemplateSets(rootData.templateSet);
            }
            
            this.rootModelCache = rootModel;
            return rootModel;
        } catch (error) {
            console.error("Error loading root model:", error);
            throw error;
        }
    }
    
    /**
     * Process namespace objects from JSON and convert to NamespaceModel instances
     * @param namespaces Array of namespace JSON objects
     */
    private processNamespaces(namespaces: any[]): NamespaceModel[] {
        return namespaces.map(namespace => {
            // Create a NamespaceModel instance
            const namespaceModel = NamespaceModel.fromJson(namespace);
            
            // Process objects if they exist
            if (namespace.object && Array.isArray(namespace.object)) {
                namespaceModel.object = this.processObjects(namespace.object);
            }
            
            // Process apiSites if they exist
            if (namespace.apiSite && Array.isArray(namespace.apiSite)) {
                namespaceModel.apiSite = this.processApiSites(namespace.apiSite);
            }
            
            // Process modelFeatures if they exist
            if (namespace.modelFeature && Array.isArray(namespace.modelFeature)) {
                namespaceModel.modelFeature = this.processModelFeatures(namespace.modelFeature);
            }
            
            // Process lexicon items if they exist
            if (namespace.lexicon && Array.isArray(namespace.lexicon)) {
                namespaceModel.lexicon = this.processLexiconItems(namespace.lexicon);
            }
            
            // Process user stories if they exist
            if (namespace.userStory && Array.isArray(namespace.userStory)) {
                namespaceModel.userStory = this.processUserStories(namespace.userStory);
            }
            
            return namespaceModel;
        });
    }
    
    /**
     * Process object objects from JSON and convert to ObjectModel instances
     * @param objects Array of object JSON objects
     */
    private processObjects(objects: any[]): ObjectModel[] {
        return objects.map(object => {
            // Create an ObjectModel instance
            const objectModel = ObjectModel.fromJson(object);
            
            // Process properties if they exist
            if (object.prop && Array.isArray(object.prop)) {
                objectModel.prop = this.processProperties(object.prop);
            }
            
            // Process property subscriptions if they exist
            if (object.propSubscription && Array.isArray(object.propSubscription)) {
                objectModel.propSubscription = this.processPropSubscriptions(object.propSubscription);
            }
            
            // Process calculated properties if they exist
            if (object.calculatedProp && Array.isArray(object.calculatedProp)) {
                objectModel.calculatedProp = this.processCalculatedProps(object.calculatedProp);
            }
            
            // Process reports if they exist
            if (object.report && Array.isArray(object.report)) {
                objectModel.report = this.processReports(object.report);
            }
            
            // Process child objects if they exist
            if (object.childObject && Array.isArray(object.childObject)) {
                objectModel.childObject = this.processChildObjects(object.childObject);
            }
            
            // Process object workflows if they exist
            if (object.objectWorkflow && Array.isArray(object.objectWorkflow)) {
                objectModel.objectWorkflow = this.processObjectWorkflows(object.objectWorkflow);
            }
            
            // Process fetches if they exist
            if (object.fetch && Array.isArray(object.fetch)) {
                objectModel.fetch = this.processFetches(object.fetch);
            }
            
            // Process queries if they exist
            if (object.query && Array.isArray(object.query)) {
                objectModel.query = this.processQueries(object.query);
            }
            
            // Process intersection objects if they exist
            if (object.intersectionObj && Array.isArray(object.intersectionObj)) {
                objectModel.intersectionObj = this.processIntersectionObjs(object.intersectionObj);
            }
            
            // Process lookup items if they exist
            if (object.lookupItem && Array.isArray(object.lookupItem)) {
                objectModel.lookupItem = this.processLookupItems(object.lookupItem);
            }
            
            return objectModel;
        });
    }
    
    /**
     * Process child object objects from JSON and convert to ChildObjectModel instances
     * @param childObjects Array of child object JSON objects
     */
    private processChildObjects(childObjects: any[]): ChildObjectModel[] {
        return childObjects.map(childObject => {
            // Create a ChildObjectModel instance and return it
            // Note: We're not trying to access properties that don't exist in the interface
            return ChildObjectModel.fromJson(childObject);
        });
    }
    
    /**
     * Process property objects from JSON and convert to PropModel instances
     * @param properties Array of property JSON objects
     */
    private processProperties(properties: any[]): PropModel[] {
        return properties.map(property => {
            // Create a PropModel instance
            return PropModel.fromJson(property);
        });
    }
    
    /**
     * Process property subscription objects from JSON and convert to PropSubscriptionModel instances
     * @param propSubscriptions Array of property subscription JSON objects
     */
    private processPropSubscriptions(propSubscriptions: any[]): PropSubscriptionModel[] {
        return propSubscriptions.map(propSubscription => {
            return PropSubscriptionModel.fromJson(propSubscription);
        });
    }
    
    /**
     * Process calculated property objects from JSON and convert to CalculatedPropModel instances
     * @param calculatedProps Array of calculated property JSON objects
     */
    private processCalculatedProps(calculatedProps: any[]): CalculatedPropModel[] {
        return calculatedProps.map(calculatedProp => {
            return CalculatedPropModel.fromJson(calculatedProp);
        });
    }
    
    /**
     * Process fetch objects from JSON and convert to FetchModel instances
     * @param fetches Array of fetch JSON objects
     */
    private processFetches(fetches: any[]): FetchModel[] {
        return fetches.map(fetch => {
            return FetchModel.fromJson(fetch);
        });
    }
    
    /**
     * Process intersection object objects from JSON and convert to IntersectionObjModel instances
     * @param intersectionObjs Array of intersection object JSON objects
     */
    private processIntersectionObjs(intersectionObjs: any[]): IntersectionObjModel[] {
        return intersectionObjs.map(intersectionObj => {
            return IntersectionObjModel.fromJson(intersectionObj);
        });
    }
    
    /**
     * Process report objects from JSON and convert to ReportModel instances
     * @param reports Array of report JSON objects
     */
    private processReports(reports: any[]): ReportModel[] {
        return reports.map(report => {
            // Create a ReportModel instance
            const reportModel = ReportModel.fromJson(report);
            
            // Process report columns if they exist
            if (report.reportColumn && Array.isArray(report.reportColumn)) {
                reportModel.reportColumn = this.processReportColumns(report.reportColumn);
            }
            
            // Process report parameters if they exist
            if (report.reportParam && Array.isArray(report.reportParam)) {
                reportModel.reportParam = this.processReportParams(report.reportParam);
            }
            
            // Process report buttons if they exist
            if (report.reportButton && Array.isArray(report.reportButton)) {
                reportModel.reportButton = this.processReportButtons(report.reportButton);
            }
            
            return reportModel;
        });
    }
    
    /**
     * Process report column objects from JSON and convert to ReportColumnModel instances
     * @param columns Array of report column JSON objects
     */
    private processReportColumns(columns: any[]): ReportColumnModel[] {
        return columns.map(column => {
            return ReportColumnModel.fromJson(column);
        });
    }
    
    /**
     * Process report parameter objects from JSON and convert to ReportParamModel instances
     * @param params Array of report parameter JSON objects
     */
    private processReportParams(params: any[]): ReportParamModel[] {
        return params.map(param => {
            return ReportParamModel.fromJson(param);
        });
    }
    
    /**
     * Process report button objects from JSON and convert to ReportButtonModel instances
     * @param buttons Array of report button JSON objects
     */
    private processReportButtons(buttons: any[]): ReportButtonModel[] {
        return buttons.map(button => {
            return ReportButtonModel.fromJson(button);
        });
    }
    
    /**
     * Process object workflow objects from JSON and convert to ObjectWorkflowModel instances
     * @param workflows Array of object workflow JSON objects
     */
    private processObjectWorkflows(workflows: any[]): ObjectWorkflowModel[] {
        return workflows.map(workflow => {
            // Create an ObjectWorkflowModel instance
            const workflowModel = ObjectWorkflowModel.fromJson(workflow);
            
            // Process workflow parameters if they exist
            if (workflow.objectWorkflowParam && Array.isArray(workflow.objectWorkflowParam)) {
                workflowModel.objectWorkflowParam = this.processObjectWorkflowParams(workflow.objectWorkflowParam);
            }
            
            // Process workflow output variables if they exist
            if (workflow.objectWorkflowOutputVar && Array.isArray(workflow.objectWorkflowOutputVar)) {
                workflowModel.objectWorkflowOutputVar = this.processObjectWorkflowOutputVars(workflow.objectWorkflowOutputVar);
            }
            
            // Process workflow buttons if they exist
            if (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) {
                workflowModel.objectWorkflowButton = this.processObjectWorkflowButtons(workflow.objectWorkflowButton);
            }
            
            return workflowModel;
        });
    }
    
    /**
     * Process object workflow parameter objects from JSON and convert to ObjectWorkflowParamModel instances
     * @param params Array of object workflow parameter JSON objects
     */
    private processObjectWorkflowParams(params: any[]): ObjectWorkflowParamModel[] {
        return params.map(param => {
            return ObjectWorkflowParamModel.fromJson(param);
        });
    }
    
    /**
     * Process object workflow output variable objects from JSON and convert to ObjectWorkflowOutputVarModel instances
     * @param outputVars Array of object workflow output variable JSON objects
     */
    private processObjectWorkflowOutputVars(outputVars: any[]): ObjectWorkflowOutputVarModel[] {
        return outputVars.map(outputVar => {
            return ObjectWorkflowOutputVarModel.fromJson(outputVar);
        });
    }
    
    /**
     * Process object workflow button objects from JSON and convert to ObjectWorkflowButtonModel instances
     * @param buttons Array of object workflow button JSON objects
     */
    private processObjectWorkflowButtons(buttons: any[]): ObjectWorkflowButtonModel[] {
        return buttons.map(button => {
            return ObjectWorkflowButtonModel.fromJson(button);
        });
    }
    
    /**
     * Process query objects from JSON and convert to QueryModel instances
     * @param queries Array of query JSON objects
     */
    private processQueries(queries: any[]): QueryModel[] {
        return queries.map(query => {
            // Create a QueryModel instance
            const queryModel = QueryModel.fromJson(query);
            
            // Process query parameters if they exist
            if (query.queryParam && Array.isArray(query.queryParam)) {
                queryModel.queryParam = this.processQueryParams(query.queryParam);
            }
            
            return queryModel;
        });
    }
    
    /**
     * Process query parameter objects from JSON and convert to QueryParamModel instances
     * @param params Array of query parameter JSON objects
     */
    private processQueryParams(params: any[]): QueryParamModel[] {
        return params.map(param => {
            return QueryParamModel.fromJson(param);
        });
    }
    
    /**
     * Process navigation button objects from JSON and convert to NavButtonModel instances
     * @param navButtons Array of navigation button JSON objects
     */
    private processNavButtons(navButtons: any[]): NavButtonModel[] {
        return navButtons.map(navButton => {
            return NavButtonModel.fromJson(navButton);
        });
    }
    
    /**
     * Process template set objects from JSON and convert to TemplateSetModel instances
     * @param templateSets Array of template set JSON objects
     */
    private processTemplateSets(templateSets: any[]): TemplateSetModel[] {
        return templateSets.map(templateSet => {
            return TemplateSetModel.fromJson(templateSet);
        });
    }
    
    /**
     * Process API site objects from JSON and convert to ApiSiteModel instances
     * @param apiSites Array of API site JSON objects
     */
    private processApiSites(apiSites: any[]): ApiSiteModel[] {
        return apiSites.map(apiSite => {
            return ApiSiteModel.fromJson(apiSite);
        });
    }
    
    /**
     * Process model feature objects from JSON and convert to ModelFeatureModel instances
     * @param modelFeatures Array of model feature JSON objects
     */
    private processModelFeatures(modelFeatures: any[]): ModelFeatureModel[] {
        return modelFeatures.map(modelFeature => {
            return ModelFeatureModel.fromJson(modelFeature);
        });
    }
    
    /**
     * Process lexicon item objects from JSON and convert to LexiconItemModel instances
     * @param lexiconItems Array of lexicon item JSON objects
     */
    private processLexiconItems(lexiconItems: any[]): LexiconItemModel[] {
        return lexiconItems.map(lexiconItem => {
            return LexiconItemModel.fromJson(lexiconItem);
        });
    }
    
    /**
     * Process user story objects from JSON and convert to UserStoryModel instances
     * @param userStories Array of user story JSON objects
     */
    private processUserStories(userStories: any[]): UserStoryModel[] {
        return userStories.map(userStory => {
            return UserStoryModel.fromJson(userStory);
        });
    }
    
    /**
     * Process lookup item objects from JSON and convert to LookupItemModel instances
     * @param lookupItems Array of lookup item JSON objects
     */
    private processLookupItems(lookupItems: any[]): LookupItemModel[] {
        return lookupItems.map(lookupItem => {
            return LookupItemModel.fromJson(lookupItem);
        });
    }
    
    /**
     * Get the loaded root model
     */
    public getRootModel(): RootModel | null {
        return this.rootModelCache;
    }
    
    /**
     * Save the root model to a JSON file
     * @param filePath Path to save the JSON file
     * @param rootModel Root model to save
     */
    public async saveRootModel(filePath: string, rootModel: RootModel): Promise<void> {
        try {
            // Convert root model to JSON
            const jsonData = { root: rootModel.toJson() };
            
            // Write JSON to file
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
        } catch (error) {
            console.error("Error saving root model:", error);
            throw error;
        }
    }
    
    /**
     * Clear the cache
     */
    public clearCache(): void {
        this.jsonCache = null;
        this.rootModelCache = null;
    }
}