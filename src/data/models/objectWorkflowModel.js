"use strict";
/**
 * Object workflow model that represents an object workflow in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectWorkflowModel = void 0;
const dynaFlowTaskModel_1 = require("./dynaFlowTaskModel");
const objectWorkflowButtonModel_1 = require("./objectWorkflowButtonModel");
const objectWorkflowOutputVarModel_1 = require("./objectWorkflowOutputVarModel");
const objectWorkflowParamModel_1 = require("./objectWorkflowParamModel");
class ObjectWorkflowModel {
    name;
    titleText;
    initObjectWorkflowName;
    isInitObjWFSubscribedToParams;
    isExposedInBusinessObject;
    isObjectDelete;
    layoutName;
    introText;
    formTitleText;
    formIntroText;
    formFooterText;
    formFooterImageURL;
    codeDescription;
    isAutoSubmit;
    isHeaderVisible;
    isPage;
    isAuthorizationRequired;
    isLoginPage;
    isLogoutPage;
    isImpersonationPage;
    roleRequired;
    isCaptchaVisible;
    isCreditCardEntryUsed;
    headerImageURL;
    footerImageURL;
    isDynaFlow;
    isDynaFlowTask;
    isCustomPageViewUsed;
    isIgnoredInDocumentation;
    targetChildObject;
    isCustomLogicOverwritten;
    objectWorkflowParam;
    objectWorkflowOutputVar;
    objectWorkflowButton;
    dynaFlowTask;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.titleText !== undefined) {
            this.titleText = data.titleText;
        }
        if (data?.initObjectWorkflowName !== undefined) {
            this.initObjectWorkflowName = data.initObjectWorkflowName;
        }
        if (data?.isInitObjWFSubscribedToParams !== undefined) {
            this.isInitObjWFSubscribedToParams = data.isInitObjWFSubscribedToParams;
        }
        if (data?.isExposedInBusinessObject !== undefined) {
            this.isExposedInBusinessObject = data.isExposedInBusinessObject;
        }
        if (data?.isObjectDelete !== undefined) {
            this.isObjectDelete = data.isObjectDelete;
        }
        if (data?.layoutName !== undefined) {
            this.layoutName = data.layoutName;
        }
        if (data?.introText !== undefined) {
            this.introText = data.introText;
        }
        if (data?.formTitleText !== undefined) {
            this.formTitleText = data.formTitleText;
        }
        if (data?.formIntroText !== undefined) {
            this.formIntroText = data.formIntroText;
        }
        if (data?.formFooterText !== undefined) {
            this.formFooterText = data.formFooterText;
        }
        if (data?.formFooterImageURL !== undefined) {
            this.formFooterImageURL = data.formFooterImageURL;
        }
        if (data?.codeDescription !== undefined) {
            this.codeDescription = data.codeDescription;
        }
        if (data?.isAutoSubmit !== undefined) {
            this.isAutoSubmit = data.isAutoSubmit;
        }
        if (data?.isHeaderVisible !== undefined) {
            this.isHeaderVisible = data.isHeaderVisible;
        }
        if (data?.isPage !== undefined) {
            this.isPage = data.isPage;
        }
        if (data?.isAuthorizationRequired !== undefined) {
            this.isAuthorizationRequired = data.isAuthorizationRequired;
        }
        if (data?.isLoginPage !== undefined) {
            this.isLoginPage = data.isLoginPage;
        }
        if (data?.isLogoutPage !== undefined) {
            this.isLogoutPage = data.isLogoutPage;
        }
        if (data?.isImpersonationPage !== undefined) {
            this.isImpersonationPage = data.isImpersonationPage;
        }
        if (data?.roleRequired !== undefined) {
            this.roleRequired = data.roleRequired;
        }
        if (data?.isCaptchaVisible !== undefined) {
            this.isCaptchaVisible = data.isCaptchaVisible;
        }
        if (data?.isCreditCardEntryUsed !== undefined) {
            this.isCreditCardEntryUsed = data.isCreditCardEntryUsed;
        }
        if (data?.headerImageURL !== undefined) {
            this.headerImageURL = data.headerImageURL;
        }
        if (data?.footerImageURL !== undefined) {
            this.footerImageURL = data.footerImageURL;
        }
        if (data?.isDynaFlow !== undefined) {
            this.isDynaFlow = data.isDynaFlow;
        }
        if (data?.isDynaFlowTask !== undefined) {
            this.isDynaFlowTask = data.isDynaFlowTask;
        }
        if (data?.isCustomPageViewUsed !== undefined) {
            this.isCustomPageViewUsed = data.isCustomPageViewUsed;
        }
        if (data?.isIgnoredInDocumentation !== undefined) {
            this.isIgnoredInDocumentation = data.isIgnoredInDocumentation;
        }
        if (data?.targetChildObject !== undefined) {
            this.targetChildObject = data.targetChildObject;
        }
        if (data?.isCustomLogicOverwritten !== undefined) {
            this.isCustomLogicOverwritten = data.isCustomLogicOverwritten;
        }
        // Handle array properties
        if (data?.objectWorkflowParam !== undefined) {
            this.objectWorkflowParam = data.objectWorkflowParam.map(param => param instanceof objectWorkflowParamModel_1.ObjectWorkflowParamModel ? param : new objectWorkflowParamModel_1.ObjectWorkflowParamModel(param));
        }
        if (data?.objectWorkflowOutputVar !== undefined) {
            this.objectWorkflowOutputVar = data.objectWorkflowOutputVar.map(outputVar => outputVar instanceof objectWorkflowOutputVarModel_1.ObjectWorkflowOutputVarModel ? outputVar : new objectWorkflowOutputVarModel_1.ObjectWorkflowOutputVarModel(outputVar));
        }
        if (data?.objectWorkflowButton !== undefined) {
            this.objectWorkflowButton = data.objectWorkflowButton.map(button => button instanceof objectWorkflowButtonModel_1.ObjectWorkflowButtonModel ? button : new objectWorkflowButtonModel_1.ObjectWorkflowButtonModel(button));
        }
        if (data?.dynaFlowTask !== undefined) {
            this.dynaFlowTask = data.dynaFlowTask.map(task => task instanceof dynaFlowTaskModel_1.DynaFlowTaskModel ? task : new dynaFlowTaskModel_1.DynaFlowTaskModel(task));
        }
    }
    /**
     * Create a new empty object workflow model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new ObjectWorkflowModel();
    }
    /**
     * Create an object workflow model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<ObjectWorkflowSchema>
        return new ObjectWorkflowModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.name !== undefined) {
            json.name = this.name;
        }
        if (this.titleText !== undefined) {
            json.titleText = this.titleText;
        }
        if (this.initObjectWorkflowName !== undefined) {
            json.initObjectWorkflowName = this.initObjectWorkflowName;
        }
        if (this.isInitObjWFSubscribedToParams !== undefined) {
            json.isInitObjWFSubscribedToParams = this.isInitObjWFSubscribedToParams;
        }
        if (this.isExposedInBusinessObject !== undefined) {
            json.isExposedInBusinessObject = this.isExposedInBusinessObject;
        }
        if (this.isObjectDelete !== undefined) {
            json.isObjectDelete = this.isObjectDelete;
        }
        if (this.layoutName !== undefined) {
            json.layoutName = this.layoutName;
        }
        if (this.introText !== undefined) {
            json.introText = this.introText;
        }
        if (this.formTitleText !== undefined) {
            json.formTitleText = this.formTitleText;
        }
        if (this.formIntroText !== undefined) {
            json.formIntroText = this.formIntroText;
        }
        if (this.formFooterText !== undefined) {
            json.formFooterText = this.formFooterText;
        }
        if (this.formFooterImageURL !== undefined) {
            json.formFooterImageURL = this.formFooterImageURL;
        }
        if (this.codeDescription !== undefined) {
            json.codeDescription = this.codeDescription;
        }
        if (this.isAutoSubmit !== undefined) {
            json.isAutoSubmit = this.isAutoSubmit;
        }
        if (this.isHeaderVisible !== undefined) {
            json.isHeaderVisible = this.isHeaderVisible;
        }
        if (this.isPage !== undefined) {
            json.isPage = this.isPage;
        }
        if (this.isAuthorizationRequired !== undefined) {
            json.isAuthorizationRequired = this.isAuthorizationRequired;
        }
        if (this.isLoginPage !== undefined) {
            json.isLoginPage = this.isLoginPage;
        }
        if (this.isLogoutPage !== undefined) {
            json.isLogoutPage = this.isLogoutPage;
        }
        if (this.isImpersonationPage !== undefined) {
            json.isImpersonationPage = this.isImpersonationPage;
        }
        if (this.roleRequired !== undefined) {
            json.roleRequired = this.roleRequired;
        }
        if (this.isCaptchaVisible !== undefined) {
            json.isCaptchaVisible = this.isCaptchaVisible;
        }
        if (this.isCreditCardEntryUsed !== undefined) {
            json.isCreditCardEntryUsed = this.isCreditCardEntryUsed;
        }
        if (this.headerImageURL !== undefined) {
            json.headerImageURL = this.headerImageURL;
        }
        if (this.footerImageURL !== undefined) {
            json.footerImageURL = this.footerImageURL;
        }
        if (this.isDynaFlow !== undefined) {
            json.isDynaFlow = this.isDynaFlow;
        }
        if (this.isDynaFlowTask !== undefined) {
            json.isDynaFlowTask = this.isDynaFlowTask;
        }
        if (this.isCustomPageViewUsed !== undefined) {
            json.isCustomPageViewUsed = this.isCustomPageViewUsed;
        }
        if (this.isIgnoredInDocumentation !== undefined) {
            json.isIgnoredInDocumentation = this.isIgnoredInDocumentation;
        }
        if (this.targetChildObject !== undefined) {
            json.targetChildObject = this.targetChildObject;
        }
        if (this.isCustomLogicOverwritten !== undefined) {
            json.isCustomLogicOverwritten = this.isCustomLogicOverwritten;
        }
        // Add array properties only if they are defined
        if (this.objectWorkflowParam !== undefined && this.objectWorkflowParam.length > 0) {
            json.objectWorkflowParam = this.objectWorkflowParam.map(param => param.toJson());
        }
        if (this.objectWorkflowOutputVar !== undefined && this.objectWorkflowOutputVar.length > 0) {
            json.objectWorkflowOutputVar = this.objectWorkflowOutputVar.map(outputVar => outputVar.toJson());
        }
        if (this.objectWorkflowButton !== undefined && this.objectWorkflowButton.length > 0) {
            json.objectWorkflowButton = this.objectWorkflowButton.map(button => button.toJson());
        }
        if (this.dynaFlowTask !== undefined && this.dynaFlowTask.length > 0) {
            json.dynaFlowTask = this.dynaFlowTask.map(task => task.toJson());
        }
        return json;
    }
    /**
     * Add a new parameter to the workflow
     */
    addParam(param) {
        if (!this.objectWorkflowParam) {
            this.objectWorkflowParam = [];
        }
        this.objectWorkflowParam.push(param);
    }
    /**
     * Add a new output variable to the workflow
     */
    addOutputVar(outputVar) {
        if (!this.objectWorkflowOutputVar) {
            this.objectWorkflowOutputVar = [];
        }
        this.objectWorkflowOutputVar.push(outputVar);
    }
    /**
     * Add a new button to the workflow
     */
    addButton(button) {
        if (!this.objectWorkflowButton) {
            this.objectWorkflowButton = [];
        }
        this.objectWorkflowButton.push(button);
    }
    /**
     * Add a new DynaFlow task to the workflow
     */
    addDynaFlowTask(task) {
        if (!this.dynaFlowTask) {
            this.dynaFlowTask = [];
        }
        this.dynaFlowTask.push(task);
    }
}
exports.ObjectWorkflowModel = ObjectWorkflowModel;
//# sourceMappingURL=objectWorkflowModel.js.map