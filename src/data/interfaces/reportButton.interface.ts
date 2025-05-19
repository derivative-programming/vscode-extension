/**
 * Interface for the Report Button schema structure
 * Last modified: May 19, 2025
 */

export interface ReportButtonSchema {
    buttonType?: string;
    isVisible?: string;
    isEnabled?: string;
    isButtonCallToAction?: string;
    isIgnored?: string;
    conditionalVisiblePropertyName?: string;
    isButtonBadgeVisible?: string;
    buttonBadgePropertyName?: string;
    buttonTypeDisplayOrder?: string;
    buttonText?: string;
    buttonName?: string;
    destinationContextObjectName?: string;
    destinationTargetName?: string;
    accessKey?: string;
    isAccessKeyAvailable?: string;
}