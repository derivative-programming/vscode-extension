/**
 * Interface for the Report Column schema structure
 * Last modified: May 19, 2025
 */

export interface ReportColumnSchema {
    // Core Properties
    name?: string;
    minWidth?: string;
    maxWidth?: string;
    
    // Data Source Properties
    sourceLookupObjImplementationObjName?: string;
    sourceObjectName?: string;
    sourcePropertyName?: string;
    
    // Data Type Properties
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    
    // Formatting Properties
    dateTimeDisplayFormat?: string;
    infoToolTipText?: string;
    isHtml?: string;
    isUnixEpochDateTime?: string;
    
    // Button Properties
    isButton?: string;
    isButtonCallToAction?: string;
    buttonText?: string;
    buttonAccessKey?: string;
    isButtonAccessKeyAvailable?: string;
    isButtonClickedOnRowClick?: string;
    isButtonAsyncObjWF?: string;
    
    // Navigation Properties
    destinationContextObjectName?: string;
    destinationTargetName?: string;
    isNavURL?: string;
    NavURLLinkText?: string;
    
    // Display Control Properties
    isVisible?: string;
    headerText?: string;
    isConditionallyDisplayed?: string;
    conditionalVisiblePropertyName?: string;
    isJoinedToLeftColumn?: string;
    isJoinedToRightColumn?: string;
    isImageURL?: string;
    isFormFooter?: string;
    
    // Analytics & Summary Properties
    isColumnSumMetricAvailable?: string;
    isSummaryDisplayed?: string;
    
    // Filtering Properties
    isFilterAvailable?: string;
    conditionalSqlLogic?: string;
    
    // Export & Selection Properties
    isForcedIntoExport?: string;
    isMultiSelectColumn?: string;
    
    // Data Processing Properties
    isAsyncObjWFResultFileStreamedOut?: string;
    asyncObjWFResultFilePathParamName?: string;
    buttonBadgeCountPropertyName?: string;
    
    // Security & Metadata Properties
    isEncrypted?: string;
    codeDescription?: string;
    isIgnored?: string;
}