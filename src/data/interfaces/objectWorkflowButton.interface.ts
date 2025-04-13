/**
 * Interface for the Object Workflow Button schema structure
 */

export interface ObjectWorkflowButtonSchema {
    buttonType: string;
    isVisible: string;
    isEnabled: string;
    isButtonCallToAction: string;
    conditionalVisiblePropertyName: string;
    buttonText: string;
    buttonName: string;
    destinationContextObjectName: string;
    destinationTargetName: string;
    accessKey: string;
    isIgnored: string;
}