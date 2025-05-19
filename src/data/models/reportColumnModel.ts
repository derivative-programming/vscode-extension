/**
 * Report column model that represents a report column in the App DNA schema
 * Last modified: May 19, 2025
 */

import { ReportColumnSchema } from "../interfaces";

export class ReportColumnModel implements ReportColumnSchema {
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
    isIgnored?: string;    constructor(data?: Partial<ReportColumnSchema>) {
        // Optional properties are only assigned if they exist in data
        // Core Properties
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.minWidth !== undefined) { this.minWidth = data.minWidth; }
        if (data?.maxWidth !== undefined) { this.maxWidth = data.maxWidth; }
        
        // Data Source Properties
        if (data?.sourceLookupObjImplementationObjName !== undefined) { this.sourceLookupObjImplementationObjName = data.sourceLookupObjImplementationObjName; }
        if (data?.sourceObjectName !== undefined) { this.sourceObjectName = data.sourceObjectName; }
        if (data?.sourcePropertyName !== undefined) { this.sourcePropertyName = data.sourcePropertyName; }
        
        // Data Type Properties
        if (data?.sqlServerDBDataType !== undefined) { this.sqlServerDBDataType = data.sqlServerDBDataType; }
        if (data?.sqlServerDBDataTypeSize !== undefined) { this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize; }
        
        // Formatting Properties
        if (data?.dateTimeDisplayFormat !== undefined) { this.dateTimeDisplayFormat = data.dateTimeDisplayFormat; }
        if (data?.infoToolTipText !== undefined) { this.infoToolTipText = data.infoToolTipText; }
        if (data?.isHtml !== undefined) { this.isHtml = data.isHtml; }
        if (data?.isUnixEpochDateTime !== undefined) { this.isUnixEpochDateTime = data.isUnixEpochDateTime; }
        
        // Button Properties
        if (data?.isButton !== undefined) { this.isButton = data.isButton; }
        if (data?.isButtonCallToAction !== undefined) { this.isButtonCallToAction = data.isButtonCallToAction; }
        if (data?.buttonText !== undefined) { this.buttonText = data.buttonText; }
        if (data?.buttonAccessKey !== undefined) { this.buttonAccessKey = data.buttonAccessKey; }
        if (data?.isButtonAccessKeyAvailable !== undefined) { this.isButtonAccessKeyAvailable = data.isButtonAccessKeyAvailable; }
        if (data?.isButtonClickedOnRowClick !== undefined) { this.isButtonClickedOnRowClick = data.isButtonClickedOnRowClick; }
        if (data?.isButtonAsyncObjWF !== undefined) { this.isButtonAsyncObjWF = data.isButtonAsyncObjWF; }
        
        // Navigation Properties
        if (data?.destinationContextObjectName !== undefined) { this.destinationContextObjectName = data.destinationContextObjectName; }
        if (data?.destinationTargetName !== undefined) { this.destinationTargetName = data.destinationTargetName; }
        if (data?.isNavURL !== undefined) { this.isNavURL = data.isNavURL; }
        if (data?.NavURLLinkText !== undefined) { this.NavURLLinkText = data.NavURLLinkText; }
        
        // Display Control Properties
        if (data?.isVisible !== undefined) { this.isVisible = data.isVisible; }
        if (data?.headerText !== undefined) { this.headerText = data.headerText; }
        if (data?.isConditionallyDisplayed !== undefined) { this.isConditionallyDisplayed = data.isConditionallyDisplayed; }
        if (data?.conditionalVisiblePropertyName !== undefined) { this.conditionalVisiblePropertyName = data.conditionalVisiblePropertyName; }
        if (data?.isJoinedToLeftColumn !== undefined) { this.isJoinedToLeftColumn = data.isJoinedToLeftColumn; }
        if (data?.isJoinedToRightColumn !== undefined) { this.isJoinedToRightColumn = data.isJoinedToRightColumn; }
        if (data?.isImageURL !== undefined) { this.isImageURL = data.isImageURL; }
        if (data?.isFormFooter !== undefined) { this.isFormFooter = data.isFormFooter; }
        
        // Analytics & Summary Properties
        if (data?.isColumnSumMetricAvailable !== undefined) { this.isColumnSumMetricAvailable = data.isColumnSumMetricAvailable; }
        if (data?.isSummaryDisplayed !== undefined) { this.isSummaryDisplayed = data.isSummaryDisplayed; }
        
        // Filtering Properties
        if (data?.isFilterAvailable !== undefined) { this.isFilterAvailable = data.isFilterAvailable; }
        if (data?.conditionalSqlLogic !== undefined) { this.conditionalSqlLogic = data.conditionalSqlLogic; }
        
        // Export & Selection Properties
        if (data?.isForcedIntoExport !== undefined) { this.isForcedIntoExport = data.isForcedIntoExport; }
        if (data?.isMultiSelectColumn !== undefined) { this.isMultiSelectColumn = data.isMultiSelectColumn; }
        
        // Data Processing Properties
        if (data?.isAsyncObjWFResultFileStreamedOut !== undefined) { this.isAsyncObjWFResultFileStreamedOut = data.isAsyncObjWFResultFileStreamedOut; }
        if (data?.asyncObjWFResultFilePathParamName !== undefined) { this.asyncObjWFResultFilePathParamName = data.asyncObjWFResultFilePathParamName; }
        if (data?.buttonBadgeCountPropertyName !== undefined) { this.buttonBadgeCountPropertyName = data.buttonBadgeCountPropertyName; }
        
        // Security & Metadata Properties
        if (data?.isEncrypted !== undefined) { this.isEncrypted = data.isEncrypted; }
        if (data?.codeDescription !== undefined) { this.codeDescription = data.codeDescription; }
        if (data?.isIgnored !== undefined) { this.isIgnored = data.isIgnored; }
    }

    /**
     * Create a new empty report column model
     */
    public static createEmpty(): ReportColumnModel {
        return new ReportColumnModel();
    }

    /**
     * Create a report column model from JSON data
     */
    public static fromJson(json: any): ReportColumnModel {
        return new ReportColumnModel(json);
    }    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        // Core Properties
        if (this.name !== undefined) { json.name = this.name; }
        if (this.minWidth !== undefined) { json.minWidth = this.minWidth; }
        if (this.maxWidth !== undefined) { json.maxWidth = this.maxWidth; }
        
        // Data Source Properties
        if (this.sourceLookupObjImplementationObjName !== undefined) { json.sourceLookupObjImplementationObjName = this.sourceLookupObjImplementationObjName; }
        if (this.sourceObjectName !== undefined) { json.sourceObjectName = this.sourceObjectName; }
        if (this.sourcePropertyName !== undefined) { json.sourcePropertyName = this.sourcePropertyName; }
        
        // Data Type Properties
        if (this.sqlServerDBDataType !== undefined) { json.sqlServerDBDataType = this.sqlServerDBDataType; }
        if (this.sqlServerDBDataTypeSize !== undefined) { json.sqlServerDBDataTypeSize = this.sqlServerDBDataTypeSize; }
        
        // Formatting Properties
        if (this.dateTimeDisplayFormat !== undefined) { json.dateTimeDisplayFormat = this.dateTimeDisplayFormat; }
        if (this.infoToolTipText !== undefined) { json.infoToolTipText = this.infoToolTipText; }
        if (this.isHtml !== undefined) { json.isHtml = this.isHtml; }
        if (this.isUnixEpochDateTime !== undefined) { json.isUnixEpochDateTime = this.isUnixEpochDateTime; }
        
        // Button Properties
        if (this.isButton !== undefined) { json.isButton = this.isButton; }
        if (this.isButtonCallToAction !== undefined) { json.isButtonCallToAction = this.isButtonCallToAction; }
        if (this.buttonText !== undefined) { json.buttonText = this.buttonText; }
        if (this.buttonAccessKey !== undefined) { json.buttonAccessKey = this.buttonAccessKey; }
        if (this.isButtonAccessKeyAvailable !== undefined) { json.isButtonAccessKeyAvailable = this.isButtonAccessKeyAvailable; }
        if (this.isButtonClickedOnRowClick !== undefined) { json.isButtonClickedOnRowClick = this.isButtonClickedOnRowClick; }
        if (this.isButtonAsyncObjWF !== undefined) { json.isButtonAsyncObjWF = this.isButtonAsyncObjWF; }
        
        // Navigation Properties
        if (this.destinationContextObjectName !== undefined) { json.destinationContextObjectName = this.destinationContextObjectName; }
        if (this.destinationTargetName !== undefined) { json.destinationTargetName = this.destinationTargetName; }
        if (this.isNavURL !== undefined) { json.isNavURL = this.isNavURL; }
        if (this.NavURLLinkText !== undefined) { json.NavURLLinkText = this.NavURLLinkText; }
        
        // Display Control Properties
        if (this.isVisible !== undefined) { json.isVisible = this.isVisible; }
        if (this.headerText !== undefined) { json.headerText = this.headerText; }
        if (this.isConditionallyDisplayed !== undefined) { json.isConditionallyDisplayed = this.isConditionallyDisplayed; }
        if (this.conditionalVisiblePropertyName !== undefined) { json.conditionalVisiblePropertyName = this.conditionalVisiblePropertyName; }
        if (this.isJoinedToLeftColumn !== undefined) { json.isJoinedToLeftColumn = this.isJoinedToLeftColumn; }
        if (this.isJoinedToRightColumn !== undefined) { json.isJoinedToRightColumn = this.isJoinedToRightColumn; }
        if (this.isImageURL !== undefined) { json.isImageURL = this.isImageURL; }
        if (this.isFormFooter !== undefined) { json.isFormFooter = this.isFormFooter; }
        
        // Analytics & Summary Properties
        if (this.isColumnSumMetricAvailable !== undefined) { json.isColumnSumMetricAvailable = this.isColumnSumMetricAvailable; }
        if (this.isSummaryDisplayed !== undefined) { json.isSummaryDisplayed = this.isSummaryDisplayed; }
        
        // Filtering Properties
        if (this.isFilterAvailable !== undefined) { json.isFilterAvailable = this.isFilterAvailable; }
        if (this.conditionalSqlLogic !== undefined) { json.conditionalSqlLogic = this.conditionalSqlLogic; }
        
        // Export & Selection Properties
        if (this.isForcedIntoExport !== undefined) { json.isForcedIntoExport = this.isForcedIntoExport; }
        if (this.isMultiSelectColumn !== undefined) { json.isMultiSelectColumn = this.isMultiSelectColumn; }
        
        // Data Processing Properties
        if (this.isAsyncObjWFResultFileStreamedOut !== undefined) { json.isAsyncObjWFResultFileStreamedOut = this.isAsyncObjWFResultFileStreamedOut; }
        if (this.asyncObjWFResultFilePathParamName !== undefined) { json.asyncObjWFResultFilePathParamName = this.asyncObjWFResultFilePathParamName; }
        if (this.buttonBadgeCountPropertyName !== undefined) { json.buttonBadgeCountPropertyName = this.buttonBadgeCountPropertyName; }
        
        // Security & Metadata Properties
        if (this.isEncrypted !== undefined) { json.isEncrypted = this.isEncrypted; }
        if (this.codeDescription !== undefined) { json.codeDescription = this.codeDescription; }
        if (this.isIgnored !== undefined) { json.isIgnored = this.isIgnored; }
        
        return json;
    }
}