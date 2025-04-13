/**
 * Interface for the Navigation Button schema structure
 */

export interface NavButtonSchema {
    buttonType: string;
    isVisible: string;
    isEnabled: string;
    isButtonCallToAction: string;
    conditionalVisiblePropertyName: string;
    buttonText: string;
    buttonName: string;
    destinationContextObjectName: string;
    destinationTargetName: string;
    roleRequired: string;
}