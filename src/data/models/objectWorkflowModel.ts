/**
 * Object workflow model that represents an object workflow in the App DNA schema
 */

import { DynaFlowTaskModel } from "./dynaFlowTaskModel";
import { ObjectWorkflowButtonModel } from "./objectWorkflowButtonModel";
import { ObjectWorkflowOutputVarModel } from "./objectWorkflowOutputVarModel";
import { ObjectWorkflowParamModel } from "./objectWorkflowParamModel";
import { ObjectWorkflowSchema } from "../interfaces";

export class ObjectWorkflowModel implements ObjectWorkflowSchema {
    name: string;
    titleText: string;
    initObjectWorkflowName: string;
    isInitObjWFSubscribedToParams: string;
    isExposedInBusinessObject: string;
    isObjectDelete: string;
    layoutName: string;
    introText: string;
    formTitleText: string;
    formIntroText: string;
    formFooterText: string;
    formFooterImageURL: string;
    codeDescription: string;
    isAutoSubmit: string;
    isHeaderVisible: string;
    isPage: string;
    isAuthorizationRequired: string;
    isLoginPage: string;
    isLogoutPage: string;
    isImpersonationPage: string;
    roleRequired: string;
    isCaptchaVisible: string;
    isCreditCardEntryUsed: string;
    headerImageURL: string;
    footerImageURL: string;
    isDynaFlow: string;
    isDynaFlowTask: string;
    isCustomPageViewUsed: string;
    isIgnoredInDocumentation: string;
    targetChildObject: string;
    isCustomLogicOverwritten: string;
    objectWorkflowParam: ObjectWorkflowParamModel[];
    objectWorkflowOutputVar: ObjectWorkflowOutputVarModel[];
    objectWorkflowButton: ObjectWorkflowButtonModel[];
    dynaFlowTask: DynaFlowTaskModel[];

    constructor(data?: Partial<ObjectWorkflowSchema>) {
        this.name = data?.name || "";
        this.titleText = data?.titleText || "";
        this.initObjectWorkflowName = data?.initObjectWorkflowName || "";
        this.isInitObjWFSubscribedToParams = data?.isInitObjWFSubscribedToParams || "false";
        this.isExposedInBusinessObject = data?.isExposedInBusinessObject || "false";
        this.isObjectDelete = data?.isObjectDelete || "false";
        this.layoutName = data?.layoutName || "";
        this.introText = data?.introText || "";
        this.formTitleText = data?.formTitleText || "";
        this.formIntroText = data?.formIntroText || "";
        this.formFooterText = data?.formFooterText || "";
        this.formFooterImageURL = data?.formFooterImageURL || "";
        this.codeDescription = data?.codeDescription || "";
        this.isAutoSubmit = data?.isAutoSubmit || "false";
        this.isHeaderVisible = data?.isHeaderVisible || "true";
        this.isPage = data?.isPage || "true";
        this.isAuthorizationRequired = data?.isAuthorizationRequired || "false";
        this.isLoginPage = data?.isLoginPage || "false";
        this.isLogoutPage = data?.isLogoutPage || "false";
        this.isImpersonationPage = data?.isImpersonationPage || "false";
        this.roleRequired = data?.roleRequired || "";
        this.isCaptchaVisible = data?.isCaptchaVisible || "false";
        this.isCreditCardEntryUsed = data?.isCreditCardEntryUsed || "false";
        this.headerImageURL = data?.headerImageURL || "";
        this.footerImageURL = data?.footerImageURL || "";
        this.isDynaFlow = data?.isDynaFlow || "false";
        this.isDynaFlowTask = data?.isDynaFlowTask || "false";
        this.isCustomPageViewUsed = data?.isCustomPageViewUsed || "false";
        this.isIgnoredInDocumentation = data?.isIgnoredInDocumentation || "false";
        this.targetChildObject = data?.targetChildObject || "";
        this.isCustomLogicOverwritten = data?.isCustomLogicOverwritten || "false";
        
        // Convert JSON arrays to typed model arrays
        this.objectWorkflowParam = (data?.objectWorkflowParam || []).map(param => 
            param instanceof ObjectWorkflowParamModel ? param : new ObjectWorkflowParamModel(param));
        
        this.objectWorkflowOutputVar = (data?.objectWorkflowOutputVar || []).map(outputVar => 
            outputVar instanceof ObjectWorkflowOutputVarModel ? outputVar : new ObjectWorkflowOutputVarModel(outputVar));
        
        this.objectWorkflowButton = (data?.objectWorkflowButton || []).map(button => 
            button instanceof ObjectWorkflowButtonModel ? button : new ObjectWorkflowButtonModel(button));
        
        this.dynaFlowTask = (data?.dynaFlowTask || []).map(task => 
            task instanceof DynaFlowTaskModel ? task : new DynaFlowTaskModel(task));
    }

    /**
     * Create a new empty object workflow model
     */
    public static createEmpty(): ObjectWorkflowModel {
        return new ObjectWorkflowModel();
    }

    /**
     * Create an object workflow model from JSON data
     */
    public static fromJson(json: any): ObjectWorkflowModel {
        return new ObjectWorkflowModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            titleText: this.titleText,
            initObjectWorkflowName: this.initObjectWorkflowName,
            isInitObjWFSubscribedToParams: this.isInitObjWFSubscribedToParams,
            isExposedInBusinessObject: this.isExposedInBusinessObject,
            isObjectDelete: this.isObjectDelete,
            layoutName: this.layoutName,
            introText: this.introText,
            formTitleText: this.formTitleText,
            formIntroText: this.formIntroText,
            formFooterText: this.formFooterText,
            formFooterImageURL: this.formFooterImageURL,
            codeDescription: this.codeDescription,
            isAutoSubmit: this.isAutoSubmit,
            isHeaderVisible: this.isHeaderVisible,
            isPage: this.isPage,
            isAuthorizationRequired: this.isAuthorizationRequired,
            isLoginPage: this.isLoginPage,
            isLogoutPage: this.isLogoutPage,
            isImpersonationPage: this.isImpersonationPage,
            roleRequired: this.roleRequired,
            isCaptchaVisible: this.isCaptchaVisible,
            isCreditCardEntryUsed: this.isCreditCardEntryUsed,
            headerImageURL: this.headerImageURL,
            footerImageURL: this.footerImageURL,
            isDynaFlow: this.isDynaFlow,
            isDynaFlowTask: this.isDynaFlowTask,
            isCustomPageViewUsed: this.isCustomPageViewUsed,
            isIgnoredInDocumentation: this.isIgnoredInDocumentation,
            targetChildObject: this.targetChildObject,
            isCustomLogicOverwritten: this.isCustomLogicOverwritten,
            objectWorkflowParam: this.objectWorkflowParam.map(param => param.toJson()),
            objectWorkflowOutputVar: this.objectWorkflowOutputVar.map(outputVar => outputVar.toJson()),
            objectWorkflowButton: this.objectWorkflowButton.map(button => button.toJson()),
            dynaFlowTask: this.dynaFlowTask.map(task => task.toJson())
        };
    }

    /**
     * Add a new parameter to the workflow
     */
    public addParam(param: ObjectWorkflowParamModel): void {
        this.objectWorkflowParam.push(param);
    }

    /**
     * Add a new output variable to the workflow
     */
    public addOutputVar(outputVar: ObjectWorkflowOutputVarModel): void {
        this.objectWorkflowOutputVar.push(outputVar);
    }

    /**
     * Add a new button to the workflow
     */
    public addButton(button: ObjectWorkflowButtonModel): void {
        this.objectWorkflowButton.push(button);
    }

    /**
     * Add a new DynaFlow task to the workflow
     */
    public addDynaFlowTask(task: DynaFlowTaskModel): void {
        this.dynaFlowTask.push(task);
    }
}