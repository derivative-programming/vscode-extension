"use strict";
/**
 * ModelDataProvider - Responsible for loading JSON data and instantiating model objects
 */
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
exports.ModelDataProvider = void 0;
const fs = __importStar(require("fs"));
const schemaLoader_1 = require("./schemaLoader");
const rootModel_1 = require("./rootModel");
const namespaceModel_1 = require("./namespaceModel");
const objectModel_1 = require("./objectModel");
const propModel_1 = require("./propModel");
const navButtonModel_1 = require("./navButtonModel");
const reportModel_1 = require("./reportModel");
const templateSetModel_1 = require("./templateSetModel");
const apiSiteModel_1 = require("./apiSiteModel");
const childObjectModel_1 = require("./childObjectModel");
const reportColumnModel_1 = require("./reportColumnModel");
const reportParamModel_1 = require("./reportParamModel");
const reportButtonModel_1 = require("./reportButtonModel");
const objectWorkflowModel_1 = require("./objectWorkflowModel");
const objectWorkflowParamModel_1 = require("./objectWorkflowParamModel");
const objectWorkflowOutputVarModel_1 = require("./objectWorkflowOutputVarModel");
const objectWorkflowButtonModel_1 = require("./objectWorkflowButtonModel");
const queryModel_1 = require("./queryModel");
const queryParamModel_1 = require("./queryParamModel");
const modelFeatureModel_1 = require("./modelFeatureModel");
const lexiconItemModel_1 = require("./lexiconItemModel");
const userStoryModel_1 = require("./userStoryModel");
const lookupItemModel_1 = require("./lookupItemModel");
const propSubscriptionModel_1 = require("./propSubscriptionModel");
const calculatedPropModel_1 = require("./calculatedPropModel");
const fetchModel_1 = require("./fetchModel");
const intersectionObjModel_1 = require("./intersectionObjModel");
const jsonschema_1 = require("jsonschema");
class ModelDataProvider {
    static instance;
    jsonCache = null;
    rootModelCache = null;
    constructor() { }
    /**
     * Get the singleton instance of ModelDataProvider
     */
    static getInstance() {
        if (!ModelDataProvider.instance) {
            ModelDataProvider.instance = new ModelDataProvider();
        }
        return ModelDataProvider.instance;
    }
    /**
     * Load JSON data from a file
     * @param filePath Path to the JSON file
     */
    async loadJsonFile(filePath) {
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
        }
        catch (error) {
            console.error("Error loading JSON file:", error);
            throw error;
        }
    }
    /**
     * Validate JSON data against the schema
     * @param jsonData JSON data to validate
     */
    async validateJson(jsonData) {
        try {
            // Load the schema
            const schema = await schemaLoader_1.SchemaLoader.getInstance().loadSchema();
            // Validate the JSON against the schema
            const result = (0, jsonschema_1.validate)(jsonData, schema);
            // Log validation errors if any
            if (!result.valid) {
                console.error("JSON validation errors:", result.errors);
            }
            return result.valid;
        }
        catch (error) {
            console.error("Error validating JSON:", error);
            throw error;
        }
    }
    /**
     * Load the root model from a JSON file
     * @param filePath Path to the JSON file
     */
    async loadRootModel(filePath) {
        try {
            // Load JSON data
            const jsonData = await this.loadJsonFile(filePath);
            // Validate JSON data (optional - can be commented out for performance with very large files)
            const isValid = await this.validateJson(jsonData);
            if (!isValid) {
                throw new Error("JSON validation failed");
            }
            // Create root model from the root data
            const rootData = jsonData.root;
            const rootModel = rootModel_1.RootModel.fromJson(rootData);
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
        }
        catch (error) {
            console.error("Error loading root model:", error);
            throw error;
        }
    }
    /**
     * Process namespace objects from JSON and convert to NamespaceModel instances
     * @param namespaces Array of namespace JSON objects
     */
    processNamespaces(namespaces) {
        return namespaces.map(namespace => {
            // Create a NamespaceModel instance
            const namespaceModel = namespaceModel_1.NamespaceModel.fromJson(namespace);
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
    processObjects(objects) {
        return objects.map(object => {
            // Create an ObjectModel instance
            const objectModel = objectModel_1.ObjectModel.fromJson(object);
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
    processChildObjects(childObjects) {
        return childObjects.map(childObject => {
            // Create a ChildObjectModel instance and return it
            // Note: We're not trying to access properties that don't exist in the interface
            return childObjectModel_1.ChildObjectModel.fromJson(childObject);
        });
    }
    /**
     * Process property objects from JSON and convert to PropModel instances
     * @param properties Array of property JSON objects
     */
    processProperties(properties) {
        return properties.map(property => {
            // Create a PropModel instance
            return propModel_1.PropModel.fromJson(property);
        });
    }
    /**
     * Process property subscription objects from JSON and convert to PropSubscriptionModel instances
     * @param propSubscriptions Array of property subscription JSON objects
     */
    processPropSubscriptions(propSubscriptions) {
        return propSubscriptions.map(propSubscription => {
            return propSubscriptionModel_1.PropSubscriptionModel.fromJson(propSubscription);
        });
    }
    /**
     * Process calculated property objects from JSON and convert to CalculatedPropModel instances
     * @param calculatedProps Array of calculated property JSON objects
     */
    processCalculatedProps(calculatedProps) {
        return calculatedProps.map(calculatedProp => {
            return calculatedPropModel_1.CalculatedPropModel.fromJson(calculatedProp);
        });
    }
    /**
     * Process fetch objects from JSON and convert to FetchModel instances
     * @param fetches Array of fetch JSON objects
     */
    processFetches(fetches) {
        return fetches.map(fetch => {
            return fetchModel_1.FetchModel.fromJson(fetch);
        });
    }
    /**
     * Process intersection object objects from JSON and convert to IntersectionObjModel instances
     * @param intersectionObjs Array of intersection object JSON objects
     */
    processIntersectionObjs(intersectionObjs) {
        return intersectionObjs.map(intersectionObj => {
            return intersectionObjModel_1.IntersectionObjModel.fromJson(intersectionObj);
        });
    }
    /**
     * Process report objects from JSON and convert to ReportModel instances
     * @param reports Array of report JSON objects
     */
    processReports(reports) {
        return reports.map(report => {
            // Create a ReportModel instance
            const reportModel = reportModel_1.ReportModel.fromJson(report);
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
    processReportColumns(columns) {
        return columns.map(column => {
            return reportColumnModel_1.ReportColumnModel.fromJson(column);
        });
    }
    /**
     * Process report parameter objects from JSON and convert to ReportParamModel instances
     * @param params Array of report parameter JSON objects
     */
    processReportParams(params) {
        return params.map(param => {
            return reportParamModel_1.ReportParamModel.fromJson(param);
        });
    }
    /**
     * Process report button objects from JSON and convert to ReportButtonModel instances
     * @param buttons Array of report button JSON objects
     */
    processReportButtons(buttons) {
        return buttons.map(button => {
            return reportButtonModel_1.ReportButtonModel.fromJson(button);
        });
    }
    /**
     * Process object workflow objects from JSON and convert to ObjectWorkflowModel instances
     * @param workflows Array of object workflow JSON objects
     */
    processObjectWorkflows(workflows) {
        return workflows.map(workflow => {
            // Create an ObjectWorkflowModel instance
            const workflowModel = objectWorkflowModel_1.ObjectWorkflowModel.fromJson(workflow);
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
    processObjectWorkflowParams(params) {
        return params.map(param => {
            return objectWorkflowParamModel_1.ObjectWorkflowParamModel.fromJson(param);
        });
    }
    /**
     * Process object workflow output variable objects from JSON and convert to ObjectWorkflowOutputVarModel instances
     * @param outputVars Array of object workflow output variable JSON objects
     */
    processObjectWorkflowOutputVars(outputVars) {
        return outputVars.map(outputVar => {
            return objectWorkflowOutputVarModel_1.ObjectWorkflowOutputVarModel.fromJson(outputVar);
        });
    }
    /**
     * Process object workflow button objects from JSON and convert to ObjectWorkflowButtonModel instances
     * @param buttons Array of object workflow button JSON objects
     */
    processObjectWorkflowButtons(buttons) {
        return buttons.map(button => {
            return objectWorkflowButtonModel_1.ObjectWorkflowButtonModel.fromJson(button);
        });
    }
    /**
     * Process query objects from JSON and convert to QueryModel instances
     * @param queries Array of query JSON objects
     */
    processQueries(queries) {
        return queries.map(query => {
            // Create a QueryModel instance
            const queryModel = queryModel_1.QueryModel.fromJson(query);
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
    processQueryParams(params) {
        return params.map(param => {
            return queryParamModel_1.QueryParamModel.fromJson(param);
        });
    }
    /**
     * Process navigation button objects from JSON and convert to NavButtonModel instances
     * @param navButtons Array of navigation button JSON objects
     */
    processNavButtons(navButtons) {
        return navButtons.map(navButton => {
            return navButtonModel_1.NavButtonModel.fromJson(navButton);
        });
    }
    /**
     * Process template set objects from JSON and convert to TemplateSetModel instances
     * @param templateSets Array of template set JSON objects
     */
    processTemplateSets(templateSets) {
        return templateSets.map(templateSet => {
            return templateSetModel_1.TemplateSetModel.fromJson(templateSet);
        });
    }
    /**
     * Process API site objects from JSON and convert to ApiSiteModel instances
     * @param apiSites Array of API site JSON objects
     */
    processApiSites(apiSites) {
        return apiSites.map(apiSite => {
            return apiSiteModel_1.ApiSiteModel.fromJson(apiSite);
        });
    }
    /**
     * Process model feature objects from JSON and convert to ModelFeatureModel instances
     * @param modelFeatures Array of model feature JSON objects
     */
    processModelFeatures(modelFeatures) {
        return modelFeatures.map(modelFeature => {
            return modelFeatureModel_1.ModelFeatureModel.fromJson(modelFeature);
        });
    }
    /**
     * Process lexicon item objects from JSON and convert to LexiconItemModel instances
     * @param lexiconItems Array of lexicon item JSON objects
     */
    processLexiconItems(lexiconItems) {
        return lexiconItems.map(lexiconItem => {
            return lexiconItemModel_1.LexiconItemModel.fromJson(lexiconItem);
        });
    }
    /**
     * Process user story objects from JSON and convert to UserStoryModel instances
     * @param userStories Array of user story JSON objects
     */
    processUserStories(userStories) {
        return userStories.map(userStory => {
            return userStoryModel_1.UserStoryModel.fromJson(userStory);
        });
    }
    /**
     * Process lookup item objects from JSON and convert to LookupItemModel instances
     * @param lookupItems Array of lookup item JSON objects
     */
    processLookupItems(lookupItems) {
        return lookupItems.map(lookupItem => {
            return lookupItemModel_1.LookupItemModel.fromJson(lookupItem);
        });
    }
    /**
     * Get the loaded root model
     */
    getRootModel() {
        return this.rootModelCache;
    }
    /**
     * Save the root model to a JSON file
     * @param filePath Path to save the JSON file
     * @param rootModel Root model to save
     */
    async saveRootModel(filePath, rootModel) {
        try {
            // Convert root model to JSON
            const jsonData = { root: rootModel.toJson() };
            // Write JSON to file
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
        }
        catch (error) {
            console.error("Error saving root model:", error);
            throw error;
        }
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.jsonCache = null;
        this.rootModelCache = null;
    }
}
exports.ModelDataProvider = ModelDataProvider;
//# sourceMappingURL=ModelDataProvider.js.map