/**
 * Report model that represents a report in the App DNA schema
 */

import { 
    ReportSchema, 
    ReportButtonSchema, 
    ReportParamSchema, 
    ReportColumnSchema 
} from "../interfaces";

export class ReportModel implements ReportSchema {
    name?: string;
    titleText?: string;
    introText?: string;
    isCachingAllowed?: string;
    isButtonDropDownAllowed?: string;
    isCustomSqlUsed?: string;
    ratingLevelColumnName?: string;
    targetChildObject?: string;
    isRatingLevelChangingRowBackgroundColor?: string;
    cacheExpirationInMinutes?: string;
    isPagingAvailable?: string;
    isFilterSectionHidden?: string;
    isFilterSectionCollapsable?: string;
    isBreadcrumbSectionHidden?: string;
    isRefreshButtonHidden?: string;
    isExportButtonsHidden?: string;
    isSchedulingAllowed?: string;
    isFavoriteCreationAllowed?: string;
    isAutoRefresh?: string;
    isAutoRefreshVisible?: string;
    isAutoRefreshFrequencyVisible?: string;
    isAutoRefreshDegraded?: string;
    autoRefreshFrequencyInMinutes?: string;
    initObjectWorkflowName?: string;
    layoutName?: string;
    badgeCountPropertyName?: string;
    codeDescription?: string;
    defaultOrderByColumnName?: string;
    defaultOrderByDescending?: string;
    isHeaderLabelsVisible?: string;
    isHeaderVisible?: string;
    isReportDetailLabelColumnVisible?: string;
    noRowsReturnedText?: string;
    isAuthorizationRequired?: string;
    roleRequired?: string;
    isPage?: string;
    formIntroText?: string;
    isIgnoredInDocumentation?: string;
    defaultPageSize?: string;
    isPageUserSettingsDistinctForApp?: string;
    isFilterPersistant?: string;
    isAzureBlobStorageUsed?: string;
    isAzureTableUsed?: string;
    azureTableNameOverride?: string;
    azureTablePrimaryKeyColumn?: string;
    isAzureTablePrimaryKeyColumnDateTime?: string;
    visualizationType?: string;
    visualizationGridGroupByColumnName?: string;
    visualizationGridGroupByInfoTextColumnName?: string;
    visualizationPieChartSliceValueColumnName?: string;
    visualizationPieChartSliceDescriptionColumnName?: string;
    visualizationLineChartUTCDateTimeColumnName?: string;
    visualizationLineChartValueColumnName?: string;
    visualizationLineChartDescriptionColumnName?: string;
    isVisualizationLineChartGridHorizLineHidden?: string;
    isVisualizationLineChartGridVerticalLineHidden?: string;
    isVisualizationLineChartLegendHidden?: string;
    isVisualizationLineChartStairLines?: string;
    visualizationLineChartGridVerticalMaxValue?: string;
    visualizationLineChartGridVerticalMinValue?: string;
    visualizationLineChartGridVerticalStepValue?: string;
    isVisualizationLineChartVerticalLabelsHidden?: string;
    visualizationLineChartGridVerticalTitle?: string;
    visualizationLineChartGridHorizTitle?: string;
    visualizationLineChartGridVerticalMaxValLabel?: string;
    visualizationLineChartGridVerticalMinValLabel?: string;
    isVisualizationLineChartGridVerticalMaxDynamic?: string;
    visualizationFlowChartSourceNodeCodeColumnName?: string;
    visualizationFlowChartSourceNodeDescriptionColumnName?: string;
    visualizationFlowChartSourceNodeColorColumnName?: string;
    visualizationFlowChartFlowDescriptionColumnName?: string;
    visualizationFlowChartDestinationNodeCodeColumnName?: string;
    visualizationCardViewTitleColumn?: string;
    visualizationCardViewDescriptionColumn?: string;
    visualizationCardViewIsImageAvailable?: string;
    visualizationCardViewImageColumn?: string;
    visualizationCardViewGroupByColumnName?: string;
    visualizationCardViewGroupByInfoTextColumnName?: string;
    visualizationFolderIDColumnName?: string;
    visualizationFolderNameColumnName?: string;
    visualizationFolderParentIDColumnName?: string;
    visualizationFolderIsFolderColumnName?: string;
    visualizationFolderIsDragDropAllowed?: string;
    visualizationFolderDragDropEventContextObjectName?: string;
    visualizationFolderDragDropEventTargetName?: string;
    isBasicHeaderAutomaticallyAdded?: string;
    filteringSqlLogic?: string;
    reportButton?: ReportButtonSchema[];
    reportParam?: ReportParamSchema[];
    reportColumn?: ReportColumnSchema[];

    constructor(data?: Partial<ReportSchema>) {
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.titleText !== undefined) { this.titleText = data.titleText; }
        if (data?.introText !== undefined) { this.introText = data.introText; }
        if (data?.isCachingAllowed !== undefined) { this.isCachingAllowed = data.isCachingAllowed; }
        if (data?.isButtonDropDownAllowed !== undefined) { this.isButtonDropDownAllowed = data.isButtonDropDownAllowed; }
        if (data?.isCustomSqlUsed !== undefined) { this.isCustomSqlUsed = data.isCustomSqlUsed; }
        if (data?.ratingLevelColumnName !== undefined) { this.ratingLevelColumnName = data.ratingLevelColumnName; }
        if (data?.targetChildObject !== undefined) { this.targetChildObject = data.targetChildObject; }
        if (data?.isRatingLevelChangingRowBackgroundColor !== undefined) { this.isRatingLevelChangingRowBackgroundColor = data.isRatingLevelChangingRowBackgroundColor; }
        if (data?.cacheExpirationInMinutes !== undefined) { this.cacheExpirationInMinutes = data.cacheExpirationInMinutes; }
        if (data?.isPagingAvailable !== undefined) { this.isPagingAvailable = data.isPagingAvailable; }
        if (data?.isFilterSectionHidden !== undefined) { this.isFilterSectionHidden = data.isFilterSectionHidden; }
        if (data?.isFilterSectionCollapsable !== undefined) { this.isFilterSectionCollapsable = data.isFilterSectionCollapsable; }
        if (data?.isBreadcrumbSectionHidden !== undefined) { this.isBreadcrumbSectionHidden = data.isBreadcrumbSectionHidden; }
        if (data?.isRefreshButtonHidden !== undefined) { this.isRefreshButtonHidden = data.isRefreshButtonHidden; }
        if (data?.isExportButtonsHidden !== undefined) { this.isExportButtonsHidden = data.isExportButtonsHidden; }
        if (data?.isSchedulingAllowed !== undefined) { this.isSchedulingAllowed = data.isSchedulingAllowed; }
        if (data?.isFavoriteCreationAllowed !== undefined) { this.isFavoriteCreationAllowed = data.isFavoriteCreationAllowed; }
        if (data?.isAutoRefresh !== undefined) { this.isAutoRefresh = data.isAutoRefresh; }
        if (data?.isAutoRefreshVisible !== undefined) { this.isAutoRefreshVisible = data.isAutoRefreshVisible; }
        if (data?.isAutoRefreshFrequencyVisible !== undefined) { this.isAutoRefreshFrequencyVisible = data.isAutoRefreshFrequencyVisible; }
        if (data?.isAutoRefreshDegraded !== undefined) { this.isAutoRefreshDegraded = data.isAutoRefreshDegraded; }
        if (data?.autoRefreshFrequencyInMinutes !== undefined) { this.autoRefreshFrequencyInMinutes = data.autoRefreshFrequencyInMinutes; }
        if (data?.initObjectWorkflowName !== undefined) { this.initObjectWorkflowName = data.initObjectWorkflowName; }
        if (data?.layoutName !== undefined) { this.layoutName = data.layoutName; }
        if (data?.badgeCountPropertyName !== undefined) { this.badgeCountPropertyName = data.badgeCountPropertyName; }
        if (data?.codeDescription !== undefined) { this.codeDescription = data.codeDescription; }
        if (data?.defaultOrderByColumnName !== undefined) { this.defaultOrderByColumnName = data.defaultOrderByColumnName; }
        if (data?.defaultOrderByDescending !== undefined) { this.defaultOrderByDescending = data.defaultOrderByDescending; }
        if (data?.isHeaderLabelsVisible !== undefined) { this.isHeaderLabelsVisible = data.isHeaderLabelsVisible; }
        if (data?.isHeaderVisible !== undefined) { this.isHeaderVisible = data.isHeaderVisible; }
        if (data?.isReportDetailLabelColumnVisible !== undefined) { this.isReportDetailLabelColumnVisible = data.isReportDetailLabelColumnVisible; }
        if (data?.noRowsReturnedText !== undefined) { this.noRowsReturnedText = data.noRowsReturnedText; }
        if (data?.isAuthorizationRequired !== undefined) { this.isAuthorizationRequired = data.isAuthorizationRequired; }
        if (data?.roleRequired !== undefined) { this.roleRequired = data.roleRequired; }
        if (data?.isPage !== undefined) { this.isPage = data.isPage; }
        if (data?.formIntroText !== undefined) { this.formIntroText = data.formIntroText; }
        if (data?.isIgnoredInDocumentation !== undefined) { this.isIgnoredInDocumentation = data.isIgnoredInDocumentation; }
        if (data?.defaultPageSize !== undefined) { this.defaultPageSize = data.defaultPageSize; }
        if (data?.isPageUserSettingsDistinctForApp !== undefined) { this.isPageUserSettingsDistinctForApp = data.isPageUserSettingsDistinctForApp; }
        if (data?.isFilterPersistant !== undefined) { this.isFilterPersistant = data.isFilterPersistant; }
        if (data?.isAzureBlobStorageUsed !== undefined) { this.isAzureBlobStorageUsed = data.isAzureBlobStorageUsed; }
        if (data?.isAzureTableUsed !== undefined) { this.isAzureTableUsed = data.isAzureTableUsed; }
        if (data?.azureTableNameOverride !== undefined) { this.azureTableNameOverride = data.azureTableNameOverride; }
        if (data?.azureTablePrimaryKeyColumn !== undefined) { this.azureTablePrimaryKeyColumn = data.azureTablePrimaryKeyColumn; }
        if (data?.isAzureTablePrimaryKeyColumnDateTime !== undefined) { this.isAzureTablePrimaryKeyColumnDateTime = data.isAzureTablePrimaryKeyColumnDateTime; }
        if (data?.visualizationType !== undefined) { this.visualizationType = data.visualizationType; }
        if (data?.visualizationGridGroupByColumnName !== undefined) { this.visualizationGridGroupByColumnName = data.visualizationGridGroupByColumnName; }
        if (data?.visualizationGridGroupByInfoTextColumnName !== undefined) { this.visualizationGridGroupByInfoTextColumnName = data.visualizationGridGroupByInfoTextColumnName; }
        if (data?.visualizationPieChartSliceValueColumnName !== undefined) { this.visualizationPieChartSliceValueColumnName = data.visualizationPieChartSliceValueColumnName; }
        if (data?.visualizationPieChartSliceDescriptionColumnName !== undefined) { this.visualizationPieChartSliceDescriptionColumnName = data.visualizationPieChartSliceDescriptionColumnName; }
        if (data?.visualizationLineChartUTCDateTimeColumnName !== undefined) { this.visualizationLineChartUTCDateTimeColumnName = data.visualizationLineChartUTCDateTimeColumnName; }
        if (data?.visualizationLineChartValueColumnName !== undefined) { this.visualizationLineChartValueColumnName = data.visualizationLineChartValueColumnName; }
        if (data?.visualizationLineChartDescriptionColumnName !== undefined) { this.visualizationLineChartDescriptionColumnName = data.visualizationLineChartDescriptionColumnName; }
        if (data?.isVisualizationLineChartGridHorizLineHidden !== undefined) { this.isVisualizationLineChartGridHorizLineHidden = data.isVisualizationLineChartGridHorizLineHidden; }
        if (data?.isVisualizationLineChartGridVerticalLineHidden !== undefined) { this.isVisualizationLineChartGridVerticalLineHidden = data.isVisualizationLineChartGridVerticalLineHidden; }
        if (data?.isVisualizationLineChartLegendHidden !== undefined) { this.isVisualizationLineChartLegendHidden = data.isVisualizationLineChartLegendHidden; }
        if (data?.isVisualizationLineChartStairLines !== undefined) { this.isVisualizationLineChartStairLines = data.isVisualizationLineChartStairLines; }
        if (data?.visualizationLineChartGridVerticalMaxValue !== undefined) { this.visualizationLineChartGridVerticalMaxValue = data.visualizationLineChartGridVerticalMaxValue; }
        if (data?.visualizationLineChartGridVerticalMinValue !== undefined) { this.visualizationLineChartGridVerticalMinValue = data.visualizationLineChartGridVerticalMinValue; }
        if (data?.visualizationLineChartGridVerticalStepValue !== undefined) { this.visualizationLineChartGridVerticalStepValue = data.visualizationLineChartGridVerticalStepValue; }
        if (data?.isVisualizationLineChartVerticalLabelsHidden !== undefined) { this.isVisualizationLineChartVerticalLabelsHidden = data.isVisualizationLineChartVerticalLabelsHidden; }
        if (data?.visualizationLineChartGridVerticalTitle !== undefined) { this.visualizationLineChartGridVerticalTitle = data.visualizationLineChartGridVerticalTitle; }
        if (data?.visualizationLineChartGridHorizTitle !== undefined) { this.visualizationLineChartGridHorizTitle = data.visualizationLineChartGridHorizTitle; }
        if (data?.visualizationLineChartGridVerticalMaxValLabel !== undefined) { this.visualizationLineChartGridVerticalMaxValLabel = data.visualizationLineChartGridVerticalMaxValLabel; }
        if (data?.visualizationLineChartGridVerticalMinValLabel !== undefined) { this.visualizationLineChartGridVerticalMinValLabel = data.visualizationLineChartGridVerticalMinValLabel; }
        if (data?.isVisualizationLineChartGridVerticalMaxDynamic !== undefined) { this.isVisualizationLineChartGridVerticalMaxDynamic = data.isVisualizationLineChartGridVerticalMaxDynamic; }
        if (data?.visualizationFlowChartSourceNodeCodeColumnName !== undefined) { this.visualizationFlowChartSourceNodeCodeColumnName = data.visualizationFlowChartSourceNodeCodeColumnName; }
        if (data?.visualizationFlowChartSourceNodeDescriptionColumnName !== undefined) { this.visualizationFlowChartSourceNodeDescriptionColumnName = data.visualizationFlowChartSourceNodeDescriptionColumnName; }
        if (data?.visualizationFlowChartSourceNodeColorColumnName !== undefined) { this.visualizationFlowChartSourceNodeColorColumnName = data.visualizationFlowChartSourceNodeColorColumnName; }
        if (data?.visualizationFlowChartFlowDescriptionColumnName !== undefined) { this.visualizationFlowChartFlowDescriptionColumnName = data.visualizationFlowChartFlowDescriptionColumnName; }
        if (data?.visualizationFlowChartDestinationNodeCodeColumnName !== undefined) { this.visualizationFlowChartDestinationNodeCodeColumnName = data.visualizationFlowChartDestinationNodeCodeColumnName; }
        if (data?.visualizationCardViewTitleColumn !== undefined) { this.visualizationCardViewTitleColumn = data.visualizationCardViewTitleColumn; }
        if (data?.visualizationCardViewDescriptionColumn !== undefined) { this.visualizationCardViewDescriptionColumn = data.visualizationCardViewDescriptionColumn; }
        if (data?.visualizationCardViewIsImageAvailable !== undefined) { this.visualizationCardViewIsImageAvailable = data.visualizationCardViewIsImageAvailable; }
        if (data?.visualizationCardViewImageColumn !== undefined) { this.visualizationCardViewImageColumn = data.visualizationCardViewImageColumn; }
        if (data?.visualizationCardViewGroupByColumnName !== undefined) { this.visualizationCardViewGroupByColumnName = data.visualizationCardViewGroupByColumnName; }
        if (data?.visualizationCardViewGroupByInfoTextColumnName !== undefined) { this.visualizationCardViewGroupByInfoTextColumnName = data.visualizationCardViewGroupByInfoTextColumnName; }
        if (data?.visualizationFolderIDColumnName !== undefined) { this.visualizationFolderIDColumnName = data.visualizationFolderIDColumnName; }
        if (data?.visualizationFolderNameColumnName !== undefined) { this.visualizationFolderNameColumnName = data.visualizationFolderNameColumnName; }
        if (data?.visualizationFolderParentIDColumnName !== undefined) { this.visualizationFolderParentIDColumnName = data.visualizationFolderParentIDColumnName; }
        if (data?.visualizationFolderIsFolderColumnName !== undefined) { this.visualizationFolderIsFolderColumnName = data.visualizationFolderIsFolderColumnName; }
        if (data?.visualizationFolderIsDragDropAllowed !== undefined) { this.visualizationFolderIsDragDropAllowed = data.visualizationFolderIsDragDropAllowed; }
        if (data?.visualizationFolderDragDropEventContextObjectName !== undefined) { this.visualizationFolderDragDropEventContextObjectName = data.visualizationFolderDragDropEventContextObjectName; }
        if (data?.visualizationFolderDragDropEventTargetName !== undefined) { this.visualizationFolderDragDropEventTargetName = data.visualizationFolderDragDropEventTargetName; }
        if (data?.isBasicHeaderAutomaticallyAdded !== undefined) { this.isBasicHeaderAutomaticallyAdded = data.isBasicHeaderAutomaticallyAdded; }
        if (data?.filteringSqlLogic !== undefined) { this.filteringSqlLogic = data.filteringSqlLogic; }
        if (data?.reportButton !== undefined) { this.reportButton = data.reportButton; }
        if (data?.reportParam !== undefined) { this.reportParam = data.reportParam; }
        if (data?.reportColumn !== undefined) { this.reportColumn = data.reportColumn; }
    }

    /**
     * Create a new empty report model
     */
    public static createEmpty(): ReportModel {
        return new ReportModel();
    }

    /**
     * Create a report model from JSON data
     */
    public static fromJson(json: any): ReportModel {
        return new ReportModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        if (this.name !== undefined) { json.name = this.name; }
        if (this.titleText !== undefined) { json.titleText = this.titleText; }
        if (this.introText !== undefined) { json.introText = this.introText; }
        if (this.isCachingAllowed !== undefined) { json.isCachingAllowed = this.isCachingAllowed; }
        if (this.isButtonDropDownAllowed !== undefined) { json.isButtonDropDownAllowed = this.isButtonDropDownAllowed; }
        if (this.isCustomSqlUsed !== undefined) { json.isCustomSqlUsed = this.isCustomSqlUsed; }
        if (this.ratingLevelColumnName !== undefined) { json.ratingLevelColumnName = this.ratingLevelColumnName; }
        if (this.targetChildObject !== undefined) { json.targetChildObject = this.targetChildObject; }
        if (this.isRatingLevelChangingRowBackgroundColor !== undefined) { json.isRatingLevelChangingRowBackgroundColor = this.isRatingLevelChangingRowBackgroundColor; }
        if (this.cacheExpirationInMinutes !== undefined) { json.cacheExpirationInMinutes = this.cacheExpirationInMinutes; }
        if (this.isPagingAvailable !== undefined) { json.isPagingAvailable = this.isPagingAvailable; }
        if (this.isFilterSectionHidden !== undefined) { json.isFilterSectionHidden = this.isFilterSectionHidden; }
        if (this.isFilterSectionCollapsable !== undefined) { json.isFilterSectionCollapsable = this.isFilterSectionCollapsable; }
        if (this.isBreadcrumbSectionHidden !== undefined) { json.isBreadcrumbSectionHidden = this.isBreadcrumbSectionHidden; }
        if (this.isRefreshButtonHidden !== undefined) { json.isRefreshButtonHidden = this.isRefreshButtonHidden; }
        if (this.isExportButtonsHidden !== undefined) { json.isExportButtonsHidden = this.isExportButtonsHidden; }
        if (this.isSchedulingAllowed !== undefined) { json.isSchedulingAllowed = this.isSchedulingAllowed; }
        if (this.isFavoriteCreationAllowed !== undefined) { json.isFavoriteCreationAllowed = this.isFavoriteCreationAllowed; }
        if (this.isAutoRefresh !== undefined) { json.isAutoRefresh = this.isAutoRefresh; }
        if (this.isAutoRefreshVisible !== undefined) { json.isAutoRefreshVisible = this.isAutoRefreshVisible; }
        if (this.isAutoRefreshFrequencyVisible !== undefined) { json.isAutoRefreshFrequencyVisible = this.isAutoRefreshFrequencyVisible; }
        if (this.isAutoRefreshDegraded !== undefined) { json.isAutoRefreshDegraded = this.isAutoRefreshDegraded; }
        if (this.autoRefreshFrequencyInMinutes !== undefined) { json.autoRefreshFrequencyInMinutes = this.autoRefreshFrequencyInMinutes; }
        if (this.initObjectWorkflowName !== undefined) { json.initObjectWorkflowName = this.initObjectWorkflowName; }
        if (this.layoutName !== undefined) { json.layoutName = this.layoutName; }
        if (this.badgeCountPropertyName !== undefined) { json.badgeCountPropertyName = this.badgeCountPropertyName; }
        if (this.codeDescription !== undefined) { json.codeDescription = this.codeDescription; }
        if (this.defaultOrderByColumnName !== undefined) { json.defaultOrderByColumnName = this.defaultOrderByColumnName; }
        if (this.defaultOrderByDescending !== undefined) { json.defaultOrderByDescending = this.defaultOrderByDescending; }
        if (this.isHeaderLabelsVisible !== undefined) { json.isHeaderLabelsVisible = this.isHeaderLabelsVisible; }
        if (this.isHeaderVisible !== undefined) { json.isHeaderVisible = this.isHeaderVisible; }
        if (this.isReportDetailLabelColumnVisible !== undefined) { json.isReportDetailLabelColumnVisible = this.isReportDetailLabelColumnVisible; }
        if (this.noRowsReturnedText !== undefined) { json.noRowsReturnedText = this.noRowsReturnedText; }
        if (this.isAuthorizationRequired !== undefined) { json.isAuthorizationRequired = this.isAuthorizationRequired; }
        if (this.roleRequired !== undefined) { json.roleRequired = this.roleRequired; }
        if (this.isPage !== undefined) { json.isPage = this.isPage; }
        if (this.formIntroText !== undefined) { json.formIntroText = this.formIntroText; }
        if (this.isIgnoredInDocumentation !== undefined) { json.isIgnoredInDocumentation = this.isIgnoredInDocumentation; }
        if (this.defaultPageSize !== undefined) { json.defaultPageSize = this.defaultPageSize; }
        if (this.isPageUserSettingsDistinctForApp !== undefined) { json.isPageUserSettingsDistinctForApp = this.isPageUserSettingsDistinctForApp; }
        if (this.isFilterPersistant !== undefined) { json.isFilterPersistant = this.isFilterPersistant; }
        if (this.isAzureBlobStorageUsed !== undefined) { json.isAzureBlobStorageUsed = this.isAzureBlobStorageUsed; }
        if (this.isAzureTableUsed !== undefined) { json.isAzureTableUsed = this.isAzureTableUsed; }
        if (this.azureTableNameOverride !== undefined) { json.azureTableNameOverride = this.azureTableNameOverride; }
        if (this.azureTablePrimaryKeyColumn !== undefined) { json.azureTablePrimaryKeyColumn = this.azureTablePrimaryKeyColumn; }
        if (this.isAzureTablePrimaryKeyColumnDateTime !== undefined) { json.isAzureTablePrimaryKeyColumnDateTime = this.isAzureTablePrimaryKeyColumnDateTime; }
        if (this.visualizationType !== undefined) { json.visualizationType = this.visualizationType; }
        if (this.visualizationGridGroupByColumnName !== undefined) { json.visualizationGridGroupByColumnName = this.visualizationGridGroupByColumnName; }
        if (this.visualizationGridGroupByInfoTextColumnName !== undefined) { json.visualizationGridGroupByInfoTextColumnName = this.visualizationGridGroupByInfoTextColumnName; }
        if (this.visualizationPieChartSliceValueColumnName !== undefined) { json.visualizationPieChartSliceValueColumnName = this.visualizationPieChartSliceValueColumnName; }
        if (this.visualizationPieChartSliceDescriptionColumnName !== undefined) { json.visualizationPieChartSliceDescriptionColumnName = this.visualizationPieChartSliceDescriptionColumnName; }
        if (this.visualizationLineChartUTCDateTimeColumnName !== undefined) { json.visualizationLineChartUTCDateTimeColumnName = this.visualizationLineChartUTCDateTimeColumnName; }
        if (this.visualizationLineChartValueColumnName !== undefined) { json.visualizationLineChartValueColumnName = this.visualizationLineChartValueColumnName; }
        if (this.visualizationLineChartDescriptionColumnName !== undefined) { json.visualizationLineChartDescriptionColumnName = this.visualizationLineChartDescriptionColumnName; }
        if (this.isVisualizationLineChartGridHorizLineHidden !== undefined) { json.isVisualizationLineChartGridHorizLineHidden = this.isVisualizationLineChartGridHorizLineHidden; }
        if (this.isVisualizationLineChartGridVerticalLineHidden !== undefined) { json.isVisualizationLineChartGridVerticalLineHidden = this.isVisualizationLineChartGridVerticalLineHidden; }
        if (this.isVisualizationLineChartLegendHidden !== undefined) { json.isVisualizationLineChartLegendHidden = this.isVisualizationLineChartLegendHidden; }
        if (this.isVisualizationLineChartStairLines !== undefined) { json.isVisualizationLineChartStairLines = this.isVisualizationLineChartStairLines; }
        if (this.visualizationLineChartGridVerticalMaxValue !== undefined) { json.visualizationLineChartGridVerticalMaxValue = this.visualizationLineChartGridVerticalMaxValue; }
        if (this.visualizationLineChartGridVerticalMinValue !== undefined) { json.visualizationLineChartGridVerticalMinValue = this.visualizationLineChartGridVerticalMinValue; }
        if (this.visualizationLineChartGridVerticalStepValue !== undefined) { json.visualizationLineChartGridVerticalStepValue = this.visualizationLineChartGridVerticalStepValue; }
        if (this.isVisualizationLineChartVerticalLabelsHidden !== undefined) { json.isVisualizationLineChartVerticalLabelsHidden = this.isVisualizationLineChartVerticalLabelsHidden; }
        if (this.visualizationLineChartGridVerticalTitle !== undefined) { json.visualizationLineChartGridVerticalTitle = this.visualizationLineChartGridVerticalTitle; }
        if (this.visualizationLineChartGridHorizTitle !== undefined) { json.visualizationLineChartGridHorizTitle = this.visualizationLineChartGridHorizTitle; }
        if (this.visualizationLineChartGridVerticalMaxValLabel !== undefined) { json.visualizationLineChartGridVerticalMaxValLabel = this.visualizationLineChartGridVerticalMaxValLabel; }
        if (this.visualizationLineChartGridVerticalMinValLabel !== undefined) { json.visualizationLineChartGridVerticalMinValLabel = this.visualizationLineChartGridVerticalMinValLabel; }
        if (this.isVisualizationLineChartGridVerticalMaxDynamic !== undefined) { json.isVisualizationLineChartGridVerticalMaxDynamic = this.isVisualizationLineChartGridVerticalMaxDynamic; }
        if (this.visualizationFlowChartSourceNodeCodeColumnName !== undefined) { json.visualizationFlowChartSourceNodeCodeColumnName = this.visualizationFlowChartSourceNodeCodeColumnName; }
        if (this.visualizationFlowChartSourceNodeDescriptionColumnName !== undefined) { json.visualizationFlowChartSourceNodeDescriptionColumnName = this.visualizationFlowChartSourceNodeDescriptionColumnName; }
        if (this.visualizationFlowChartSourceNodeColorColumnName !== undefined) { json.visualizationFlowChartSourceNodeColorColumnName = this.visualizationFlowChartSourceNodeColorColumnName; }
        if (this.visualizationFlowChartFlowDescriptionColumnName !== undefined) { json.visualizationFlowChartFlowDescriptionColumnName = this.visualizationFlowChartFlowDescriptionColumnName; }
        if (this.visualizationFlowChartDestinationNodeCodeColumnName !== undefined) { json.visualizationFlowChartDestinationNodeCodeColumnName = this.visualizationFlowChartDestinationNodeCodeColumnName; }
        if (this.visualizationCardViewTitleColumn !== undefined) { json.visualizationCardViewTitleColumn = this.visualizationCardViewTitleColumn; }
        if (this.visualizationCardViewDescriptionColumn !== undefined) { json.visualizationCardViewDescriptionColumn = this.visualizationCardViewDescriptionColumn; }
        if (this.visualizationCardViewIsImageAvailable !== undefined) { json.visualizationCardViewIsImageAvailable = this.visualizationCardViewIsImageAvailable; }
        if (this.visualizationCardViewImageColumn !== undefined) { json.visualizationCardViewImageColumn = this.visualizationCardViewImageColumn; }
        if (this.visualizationCardViewGroupByColumnName !== undefined) { json.visualizationCardViewGroupByColumnName = this.visualizationCardViewGroupByColumnName; }
        if (this.visualizationCardViewGroupByInfoTextColumnName !== undefined) { json.visualizationCardViewGroupByInfoTextColumnName = this.visualizationCardViewGroupByInfoTextColumnName; }
        if (this.visualizationFolderIDColumnName !== undefined) { json.visualizationFolderIDColumnName = this.visualizationFolderIDColumnName; }
        if (this.visualizationFolderNameColumnName !== undefined) { json.visualizationFolderNameColumnName = this.visualizationFolderNameColumnName; }
        if (this.visualizationFolderParentIDColumnName !== undefined) { json.visualizationFolderParentIDColumnName = this.visualizationFolderParentIDColumnName; }
        if (this.visualizationFolderIsFolderColumnName !== undefined) { json.visualizationFolderIsFolderColumnName = this.visualizationFolderIsFolderColumnName; }
        if (this.visualizationFolderIsDragDropAllowed !== undefined) { json.visualizationFolderIsDragDropAllowed = this.visualizationFolderIsDragDropAllowed; }
        if (this.visualizationFolderDragDropEventContextObjectName !== undefined) { json.visualizationFolderDragDropEventContextObjectName = this.visualizationFolderDragDropEventContextObjectName; }
        if (this.visualizationFolderDragDropEventTargetName !== undefined) { json.visualizationFolderDragDropEventTargetName = this.visualizationFolderDragDropEventTargetName; }
        if (this.isBasicHeaderAutomaticallyAdded !== undefined) { json.isBasicHeaderAutomaticallyAdded = this.isBasicHeaderAutomaticallyAdded; }
        if (this.filteringSqlLogic !== undefined) { json.filteringSqlLogic = this.filteringSqlLogic; }
        if (this.reportButton !== undefined && this.reportButton.length > 0) {
            json.reportButton = this.reportButton;
        }
        if (this.reportParam !== undefined && this.reportParam.length > 0) {
            json.reportParam = this.reportParam;
        }
        if (this.reportColumn !== undefined && this.reportColumn.length > 0) {
            json.reportColumn = this.reportColumn;
        }
        
        return json;
    }
}