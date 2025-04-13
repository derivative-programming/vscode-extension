/**
 * Interface for the Object Workflow schema structure
 */

import { ObjectWorkflowParamSchema } from './objectWorkflowParam.interface';
import { ObjectWorkflowOutputVarSchema } from './objectWorkflowOutputVar.interface';
import { ObjectWorkflowButtonSchema } from './objectWorkflowButton.interface';
import { DynaFlowTaskSchema } from './dynaFlowTask.interface';

export interface ObjectWorkflowSchema {
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
    objectWorkflowParam: ObjectWorkflowParamSchema[];
    objectWorkflowOutputVar: ObjectWorkflowOutputVarSchema[];
    objectWorkflowButton: ObjectWorkflowButtonSchema[];
    dynaFlowTask: DynaFlowTaskSchema[];
}