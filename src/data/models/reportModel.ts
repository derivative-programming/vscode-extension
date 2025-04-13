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
    name: string;
    titleText: string;
    introText: string;
    isCachingAllowed: string;
    isButtonDropDownAllowed: string;
    isCustomSqlUsed: string;
    ratingLevelColumnName: string;
    targetChildObject: string;
    isRatingLevelChangingRowBackgroundColor: string;
    cacheExpirationInMinutes: string;
    isPagingAvailable: string;
    isFilterSectionHidden: string;
    isFilterSectionCollapsable: string;
    isBreadcrumbSectionHidden: string;
    isRefreshButtonHidden: string;
    isExportButtonsHidden: string;
    isSchedulingAllowed: string;
    isFavoriteCreationAllowed: string;
    isAutoRefresh: string;
    isAutoRefreshVisible: string;
    isAutoRefreshFrequencyVisible: string;
    isAutoRefreshDegraded: string;
    autoRefreshFrequencyInMinutes: string;
    initObjectWorkflowName: string;
    layoutName: string;
    badgeCountPropertyName: string;
    codeDescription: string;
    defaultOrderByColumnName: string;
    defaultOrderByDescending: string;
    isHeaderLabelsVisible: string;
    isHeaderVisible: string;
    isReportDetailLabelColumnVisible: string;
    noRowsReturnedText: string;
    isAuthorizationRequired: string;
    roleRequired: string;
    isPage: string;
    formIntroText: string;
    isIgnoredInDocumentation: string;
    defaultPageSize: string;
    isPageUserSettingsDistinctForApp: string;
    isFilterPersistant: string;
    isAzureBlobStorageUsed: string;
    isAzureTableUsed: string;
    azureTableNameOverride: string;
    azureTablePrimaryKeyColumn: string;
    isAzureTablePrimaryKeyColumnDateTime: string;
    visualizationType: string;
    visualizationGridGroupByColumnName: string;
    visualizationGridGroupByInfoTextColumnName: string;
    visualizationPieChartSliceValueColumnName: string;
    visualizationPieChartSliceDescriptionColumnName: string;
    visualizationLineChartUTCDateTimeColumnName: string;
    visualizationLineChartValueColumnName: string;
    visualizationLineChartDescriptionColumnName: string;
    isVisualizationLineChartGridHorizLineHidden: string;
    isVisualizationLineChartGridVerticalLineHidden: string;
    isVisualizationLineChartLegendHidden: string;
    isVisualizationLineChartStairLines: string;
    visualizationLineChartGridVerticalMaxValue: string;
    visualizationLineChartGridVerticalMinValue: string;
    visualizationLineChartGridVerticalStepValue: string;
    isVisualizationLineChartVerticalLabelsHidden: string;
    visualizationLineChartGridVerticalTitle: string;
    visualizationLineChartGridHorizTitle: string;
    visualizationLineChartGridVerticalMaxValLabel: string;
    visualizationLineChartGridVerticalMinValLabel: string;
    isVisualizationLineChartGridVerticalMaxDynamic: string;
    visualizationFlowChartSourceNodeCodeColumnName: string;
    visualizationFlowChartSourceNodeDescriptionColumnName: string;
    visualizationFlowChartSourceNodeColorColumnName: string;
    visualizationFlowChartFlowDescriptionColumnName: string;
    visualizationFlowChartDestinationNodeCodeColumnName: string;
    visualizationCardViewTitleColumn: string;
    visualizationCardViewDescriptionColumn: string;
    visualizationCardViewIsImageAvailable: string;
    visualizationCardViewImageColumn: string;
    visualizationCardViewGroupByColumnName: string;
    visualizationCardViewGroupByInfoTextColumnName: string;
    visualizationFolderIDColumnName: string;
    visualizationFolderNameColumnName: string;
    visualizationFolderParentIDColumnName: string;
    visualizationFolderIsFolderColumnName: string;
    visualizationFolderIsDragDropAllowed: string;
    visualizationFolderDragDropEventContextObjectName: string;
    visualizationFolderDragDropEventTargetName: string;
    isBasicHeaderAutomaticallyAdded: string;
    filteringSqlLogic: string;
    reportButton: ReportButtonSchema[];
    reportParam: ReportParamSchema[];
    reportColumn: ReportColumnSchema[];

    constructor(data?: Partial<ReportSchema>) {
        this.name = data?.name || "";
        this.titleText = data?.titleText || "";
        this.introText = data?.introText || "";
        this.isCachingAllowed = data?.isCachingAllowed || "false";
        this.isButtonDropDownAllowed = data?.isButtonDropDownAllowed || "false";
        this.isCustomSqlUsed = data?.isCustomSqlUsed || "false";
        this.ratingLevelColumnName = data?.ratingLevelColumnName || "";
        this.targetChildObject = data?.targetChildObject || "";
        this.isRatingLevelChangingRowBackgroundColor = data?.isRatingLevelChangingRowBackgroundColor || "false";
        this.cacheExpirationInMinutes = data?.cacheExpirationInMinutes || "";
        this.isPagingAvailable = data?.isPagingAvailable || "true";
        this.isFilterSectionHidden = data?.isFilterSectionHidden || "false";
        this.isFilterSectionCollapsable = data?.isFilterSectionCollapsable || "true";
        this.isBreadcrumbSectionHidden = data?.isBreadcrumbSectionHidden || "false";
        this.isRefreshButtonHidden = data?.isRefreshButtonHidden || "false";
        this.isExportButtonsHidden = data?.isExportButtonsHidden || "false";
        this.isSchedulingAllowed = data?.isSchedulingAllowed || "false";
        this.isFavoriteCreationAllowed = data?.isFavoriteCreationAllowed || "false";
        this.isAutoRefresh = data?.isAutoRefresh || "false";
        this.isAutoRefreshVisible = data?.isAutoRefreshVisible || "false";
        this.isAutoRefreshFrequencyVisible = data?.isAutoRefreshFrequencyVisible || "false";
        this.isAutoRefreshDegraded = data?.isAutoRefreshDegraded || "false";
        this.autoRefreshFrequencyInMinutes = data?.autoRefreshFrequencyInMinutes || "";
        this.initObjectWorkflowName = data?.initObjectWorkflowName || "";
        this.layoutName = data?.layoutName || "";
        this.badgeCountPropertyName = data?.badgeCountPropertyName || "";
        this.codeDescription = data?.codeDescription || "";
        this.defaultOrderByColumnName = data?.defaultOrderByColumnName || "";
        this.defaultOrderByDescending = data?.defaultOrderByDescending || "false";
        this.isHeaderLabelsVisible = data?.isHeaderLabelsVisible || "true";
        this.isHeaderVisible = data?.isHeaderVisible || "true";
        this.isReportDetailLabelColumnVisible = data?.isReportDetailLabelColumnVisible || "true";
        this.noRowsReturnedText = data?.noRowsReturnedText || "No Results Found";
        this.isAuthorizationRequired = data?.isAuthorizationRequired || "false";
        this.roleRequired = data?.roleRequired || "";
        this.isPage = data?.isPage || "true";
        this.formIntroText = data?.formIntroText || "";
        this.isIgnoredInDocumentation = data?.isIgnoredInDocumentation || "false";
        this.defaultPageSize = data?.defaultPageSize || "";
        this.isPageUserSettingsDistinctForApp = data?.isPageUserSettingsDistinctForApp || "false";
        this.isFilterPersistant = data?.isFilterPersistant || "false";
        this.isAzureBlobStorageUsed = data?.isAzureBlobStorageUsed || "false";
        this.isAzureTableUsed = data?.isAzureTableUsed || "false";
        this.azureTableNameOverride = data?.azureTableNameOverride || "";
        this.azureTablePrimaryKeyColumn = data?.azureTablePrimaryKeyColumn || "";
        this.isAzureTablePrimaryKeyColumnDateTime = data?.isAzureTablePrimaryKeyColumnDateTime || "false";
        this.visualizationType = data?.visualizationType || "Grid";
        this.visualizationGridGroupByColumnName = data?.visualizationGridGroupByColumnName || "";
        this.visualizationGridGroupByInfoTextColumnName = data?.visualizationGridGroupByInfoTextColumnName || "";
        this.visualizationPieChartSliceValueColumnName = data?.visualizationPieChartSliceValueColumnName || "";
        this.visualizationPieChartSliceDescriptionColumnName = data?.visualizationPieChartSliceDescriptionColumnName || "";
        this.visualizationLineChartUTCDateTimeColumnName = data?.visualizationLineChartUTCDateTimeColumnName || "";
        this.visualizationLineChartValueColumnName = data?.visualizationLineChartValueColumnName || "";
        this.visualizationLineChartDescriptionColumnName = data?.visualizationLineChartDescriptionColumnName || "";
        this.isVisualizationLineChartGridHorizLineHidden = data?.isVisualizationLineChartGridHorizLineHidden || "false";
        this.isVisualizationLineChartGridVerticalLineHidden = data?.isVisualizationLineChartGridVerticalLineHidden || "false";
        this.isVisualizationLineChartLegendHidden = data?.isVisualizationLineChartLegendHidden || "false";
        this.isVisualizationLineChartStairLines = data?.isVisualizationLineChartStairLines || "false";
        this.visualizationLineChartGridVerticalMaxValue = data?.visualizationLineChartGridVerticalMaxValue || "";
        this.visualizationLineChartGridVerticalMinValue = data?.visualizationLineChartGridVerticalMinValue || "";
        this.visualizationLineChartGridVerticalStepValue = data?.visualizationLineChartGridVerticalStepValue || "";
        this.isVisualizationLineChartVerticalLabelsHidden = data?.isVisualizationLineChartVerticalLabelsHidden || "false";
        this.visualizationLineChartGridVerticalTitle = data?.visualizationLineChartGridVerticalTitle || "";
        this.visualizationLineChartGridHorizTitle = data?.visualizationLineChartGridHorizTitle || "";
        this.visualizationLineChartGridVerticalMaxValLabel = data?.visualizationLineChartGridVerticalMaxValLabel || "";
        this.visualizationLineChartGridVerticalMinValLabel = data?.visualizationLineChartGridVerticalMinValLabel || "";
        this.isVisualizationLineChartGridVerticalMaxDynamic = data?.isVisualizationLineChartGridVerticalMaxDynamic || "false";
        this.visualizationFlowChartSourceNodeCodeColumnName = data?.visualizationFlowChartSourceNodeCodeColumnName || "";
        this.visualizationFlowChartSourceNodeDescriptionColumnName = data?.visualizationFlowChartSourceNodeDescriptionColumnName || "";
        this.visualizationFlowChartSourceNodeColorColumnName = data?.visualizationFlowChartSourceNodeColorColumnName || "";
        this.visualizationFlowChartFlowDescriptionColumnName = data?.visualizationFlowChartFlowDescriptionColumnName || "";
        this.visualizationFlowChartDestinationNodeCodeColumnName = data?.visualizationFlowChartDestinationNodeCodeColumnName || "";
        this.visualizationCardViewTitleColumn = data?.visualizationCardViewTitleColumn || "";
        this.visualizationCardViewDescriptionColumn = data?.visualizationCardViewDescriptionColumn || "";
        this.visualizationCardViewIsImageAvailable = data?.visualizationCardViewIsImageAvailable || "";
        this.visualizationCardViewImageColumn = data?.visualizationCardViewImageColumn || "";
        this.visualizationCardViewGroupByColumnName = data?.visualizationCardViewGroupByColumnName || "";
        this.visualizationCardViewGroupByInfoTextColumnName = data?.visualizationCardViewGroupByInfoTextColumnName || "";
        this.visualizationFolderIDColumnName = data?.visualizationFolderIDColumnName || "";
        this.visualizationFolderNameColumnName = data?.visualizationFolderNameColumnName || "";
        this.visualizationFolderParentIDColumnName = data?.visualizationFolderParentIDColumnName || "";
        this.visualizationFolderIsFolderColumnName = data?.visualizationFolderIsFolderColumnName || "";
        this.visualizationFolderIsDragDropAllowed = data?.visualizationFolderIsDragDropAllowed || "false";
        this.visualizationFolderDragDropEventContextObjectName = data?.visualizationFolderDragDropEventContextObjectName || "";
        this.visualizationFolderDragDropEventTargetName = data?.visualizationFolderDragDropEventTargetName || "";
        this.isBasicHeaderAutomaticallyAdded = data?.isBasicHeaderAutomaticallyAdded || "";
        this.filteringSqlLogic = data?.filteringSqlLogic || "";
        this.reportButton = data?.reportButton || [];
        this.reportParam = data?.reportParam || [];
        this.reportColumn = data?.reportColumn || [];
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            titleText: this.titleText,
            introText: this.introText,
            isCachingAllowed: this.isCachingAllowed,
            isButtonDropDownAllowed: this.isButtonDropDownAllowed,
            isCustomSqlUsed: this.isCustomSqlUsed,
            ratingLevelColumnName: this.ratingLevelColumnName,
            targetChildObject: this.targetChildObject,
            isRatingLevelChangingRowBackgroundColor: this.isRatingLevelChangingRowBackgroundColor,
            cacheExpirationInMinutes: this.cacheExpirationInMinutes,
            isPagingAvailable: this.isPagingAvailable,
            isFilterSectionHidden: this.isFilterSectionHidden,
            isFilterSectionCollapsable: this.isFilterSectionCollapsable,
            isBreadcrumbSectionHidden: this.isBreadcrumbSectionHidden,
            isRefreshButtonHidden: this.isRefreshButtonHidden,
            isExportButtonsHidden: this.isExportButtonsHidden,
            isSchedulingAllowed: this.isSchedulingAllowed,
            isFavoriteCreationAllowed: this.isFavoriteCreationAllowed,
            isAutoRefresh: this.isAutoRefresh,
            isAutoRefreshVisible: this.isAutoRefreshVisible,
            isAutoRefreshFrequencyVisible: this.isAutoRefreshFrequencyVisible,
            isAutoRefreshDegraded: this.isAutoRefreshDegraded,
            autoRefreshFrequencyInMinutes: this.autoRefreshFrequencyInMinutes,
            initObjectWorkflowName: this.initObjectWorkflowName,
            layoutName: this.layoutName,
            badgeCountPropertyName: this.badgeCountPropertyName,
            codeDescription: this.codeDescription,
            defaultOrderByColumnName: this.defaultOrderByColumnName,
            defaultOrderByDescending: this.defaultOrderByDescending,
            isHeaderLabelsVisible: this.isHeaderLabelsVisible,
            isHeaderVisible: this.isHeaderVisible,
            isReportDetailLabelColumnVisible: this.isReportDetailLabelColumnVisible,
            noRowsReturnedText: this.noRowsReturnedText,
            isAuthorizationRequired: this.isAuthorizationRequired,
            roleRequired: this.roleRequired,
            isPage: this.isPage,
            formIntroText: this.formIntroText,
            isIgnoredInDocumentation: this.isIgnoredInDocumentation,
            defaultPageSize: this.defaultPageSize,
            isPageUserSettingsDistinctForApp: this.isPageUserSettingsDistinctForApp,
            isFilterPersistant: this.isFilterPersistant,
            isAzureBlobStorageUsed: this.isAzureBlobStorageUsed,
            isAzureTableUsed: this.isAzureTableUsed,
            azureTableNameOverride: this.azureTableNameOverride,
            azureTablePrimaryKeyColumn: this.azureTablePrimaryKeyColumn,
            isAzureTablePrimaryKeyColumnDateTime: this.isAzureTablePrimaryKeyColumnDateTime,
            visualizationType: this.visualizationType,
            visualizationGridGroupByColumnName: this.visualizationGridGroupByColumnName,
            visualizationGridGroupByInfoTextColumnName: this.visualizationGridGroupByInfoTextColumnName,
            visualizationPieChartSliceValueColumnName: this.visualizationPieChartSliceValueColumnName,
            visualizationPieChartSliceDescriptionColumnName: this.visualizationPieChartSliceDescriptionColumnName,
            visualizationLineChartUTCDateTimeColumnName: this.visualizationLineChartUTCDateTimeColumnName,
            visualizationLineChartValueColumnName: this.visualizationLineChartValueColumnName,
            visualizationLineChartDescriptionColumnName: this.visualizationLineChartDescriptionColumnName,
            isVisualizationLineChartGridHorizLineHidden: this.isVisualizationLineChartGridHorizLineHidden,
            isVisualizationLineChartGridVerticalLineHidden: this.isVisualizationLineChartGridVerticalLineHidden,
            isVisualizationLineChartLegendHidden: this.isVisualizationLineChartLegendHidden,
            isVisualizationLineChartStairLines: this.isVisualizationLineChartStairLines,
            visualizationLineChartGridVerticalMaxValue: this.visualizationLineChartGridVerticalMaxValue,
            visualizationLineChartGridVerticalMinValue: this.visualizationLineChartGridVerticalMinValue,
            visualizationLineChartGridVerticalStepValue: this.visualizationLineChartGridVerticalStepValue,
            isVisualizationLineChartVerticalLabelsHidden: this.isVisualizationLineChartVerticalLabelsHidden,
            visualizationLineChartGridVerticalTitle: this.visualizationLineChartGridVerticalTitle,
            visualizationLineChartGridHorizTitle: this.visualizationLineChartGridHorizTitle,
            visualizationLineChartGridVerticalMaxValLabel: this.visualizationLineChartGridVerticalMaxValLabel,
            visualizationLineChartGridVerticalMinValLabel: this.visualizationLineChartGridVerticalMinValLabel,
            isVisualizationLineChartGridVerticalMaxDynamic: this.isVisualizationLineChartGridVerticalMaxDynamic,
            visualizationFlowChartSourceNodeCodeColumnName: this.visualizationFlowChartSourceNodeCodeColumnName,
            visualizationFlowChartSourceNodeDescriptionColumnName: this.visualizationFlowChartSourceNodeDescriptionColumnName,
            visualizationFlowChartSourceNodeColorColumnName: this.visualizationFlowChartSourceNodeColorColumnName,
            visualizationFlowChartFlowDescriptionColumnName: this.visualizationFlowChartFlowDescriptionColumnName,
            visualizationFlowChartDestinationNodeCodeColumnName: this.visualizationFlowChartDestinationNodeCodeColumnName,
            visualizationCardViewTitleColumn: this.visualizationCardViewTitleColumn,
            visualizationCardViewDescriptionColumn: this.visualizationCardViewDescriptionColumn,
            visualizationCardViewIsImageAvailable: this.visualizationCardViewIsImageAvailable,
            visualizationCardViewImageColumn: this.visualizationCardViewImageColumn,
            visualizationCardViewGroupByColumnName: this.visualizationCardViewGroupByColumnName,
            visualizationCardViewGroupByInfoTextColumnName: this.visualizationCardViewGroupByInfoTextColumnName,
            visualizationFolderIDColumnName: this.visualizationFolderIDColumnName,
            visualizationFolderNameColumnName: this.visualizationFolderNameColumnName,
            visualizationFolderParentIDColumnName: this.visualizationFolderParentIDColumnName,
            visualizationFolderIsFolderColumnName: this.visualizationFolderIsFolderColumnName,
            visualizationFolderIsDragDropAllowed: this.visualizationFolderIsDragDropAllowed,
            visualizationFolderDragDropEventContextObjectName: this.visualizationFolderDragDropEventContextObjectName,
            visualizationFolderDragDropEventTargetName: this.visualizationFolderDragDropEventTargetName,
            isBasicHeaderAutomaticallyAdded: this.isBasicHeaderAutomaticallyAdded,
            filteringSqlLogic: this.filteringSqlLogic,
            reportButton: this.reportButton,
            reportParam: this.reportParam,
            reportColumn: this.reportColumn
        };
    }
}