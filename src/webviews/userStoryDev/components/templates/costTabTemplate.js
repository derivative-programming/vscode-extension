/**
 * Cost Tab Template
 * Displays monthly cost breakdown by developer
 * Last Modified: October 11, 2025
 */

/**
 * Generate the cost analysis tab content
 * @param {Array} items - All user story items
 * @param {Object} config - Configuration with developers and forecast settings
 * @returns {string} HTML for cost tab
 */
function generateCostTab(items, config) {
    return `
        <div class="cost-tab-container">
            <div class="cost-header">
                <h3>
                    <span class="codicon codicon-credit-card"></span>
                    Cost Analysis by Month
                </h3>
                <div class="cost-actions">
                    <button onclick="downloadCostCsv()" class="icon-button" title="Download CSV">
                        <i class="codicon codicon-cloud-download"></i>
                    </button>
                    <button onclick="refreshCostAnalysis()" class="icon-button" title="Refresh">
                        <i class="codicon codicon-refresh"></i>
                    </button>
                </div>
            </div>

            <div class="cost-filters">
                <label>
                    <input type="checkbox" id="costShowPastMonths" checked onchange="refreshCostAnalysis()">
                    Show Past Months
                </label>
                <label>
                    <input type="checkbox" id="costShowFutureMonths" checked onchange="refreshCostAnalysis()">
                    Show Future Months
                </label>
                <label>
                    <input type="checkbox" id="costShowCurrentMonth" checked onchange="refreshCostAnalysis()">
                    Show Current Month
                </label>
            </div>

            <div id="costAnalysisContainer">
                ${generateCostAnalysisTable(items, config)}
            </div>
        </div>
    `;
}

/**
 * Generate the cost analysis table
 * @param {Array} items - All user story items
 * @param {Object} config - Configuration
 * @returns {string} HTML table
 */
function generateCostAnalysisTable(items, config) {
    const costData = calculateMonthlyCosts(items, config);
    
    if (costData.months.length === 0) {
        return `
            <div class="empty-state">
                <span class="codicon codicon-graph"></span>
                <p>No cost data available</p>
                <p class="empty-state-hint">Assign story points and developers to calculate costs</p>
            </div>
        `;
    }

    const developers = config?.developers || [];
    
    return `
        <div class="cost-table-wrapper">
            <table class="cost-table">
                <thead>
                    <tr>
                        <th class="developer-column">Developer</th>
                        ${costData.months.map(month => `
                            <th class="month-column ${month.isCurrent ? 'current-month' : ''}" title="${month.fullDate}">
                                ${month.display}
                                ${month.isCurrent ? '<span class="current-badge">Current</span>' : ''}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${generateDeveloperRows(costData, developers)}
                    ${generateUnassignedRow(costData)}
                    ${generateTotalRow(costData)}
                </tbody>
            </table>
        </div>
        
        <div class="cost-summary">
            <div class="summary-card">
                <div class="summary-label">Total Project Cost</div>
                <div class="summary-value">${formatCurrency(costData.grandTotal)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Average Monthly Cost</div>
                <div class="summary-value">${formatCurrency(costData.averageMonthly)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Peak Monthly Cost</div>
                <div class="summary-value">${formatCurrency(costData.peakMonthly)}</div>
            </div>
        </div>
    `;
}

/**
 * Generate rows for each developer
 * @param {Object} costData - Cost calculation data
 * @param {Array} developers - Developer configurations
 * @returns {string} HTML rows
 */
function generateDeveloperRows(costData, developers) {
    return developers.map(dev => {
        const devCosts = costData.developerCosts.get(dev.name) || {};
        const devTotal = costData.developerTotals.get(dev.name) || 0;
        
        return `
            <tr class="developer-row">
                <td class="developer-name">
                    <span class="codicon codicon-person"></span>
                    ${dev.name}
                </td>
                ${costData.months.map(month => {
                    const cost = devCosts[month.key] || 0;
                    return `
                        <td class="cost-cell ${month.isCurrent ? 'current-month' : ''} ${cost > 0 ? 'has-cost' : ''}">
                            ${cost > 0 ? formatCurrency(cost) : '-'}
                        </td>
                    `;
                }).join('')}
            </tr>
        `;
    }).join('');
}

/**
 * Generate row for unassigned tasks
 * @param {Object} costData - Cost calculation data
 * @returns {string} HTML row
 */
function generateUnassignedRow(costData) {
    const unassignedCosts = costData.developerCosts.get('Unassigned') || {};
    const unassignedTotal = costData.developerTotals.get('Unassigned') || 0;
    
    if (unassignedTotal === 0) {
        return ''; // Don't show row if no unassigned costs
    }
    
    return `
        <tr class="unassigned-row">
            <td class="developer-name unassigned">
                <span class="codicon codicon-question"></span>
                Unassigned
            </td>
            ${costData.months.map(month => {
                const cost = unassignedCosts[month.key] || 0;
                return `
                    <td class="cost-cell ${month.isCurrent ? 'current-month' : ''} ${cost > 0 ? 'has-cost' : ''}">
                        ${cost > 0 ? formatCurrency(cost) : '-'}
                    </td>
                `;
            }).join('')}
        </tr>
    `;
}

/**
 * Generate total row
 * @param {Object} costData - Cost calculation data
 * @returns {string} HTML row
 */
function generateTotalRow(costData) {
    return `
        <tr class="total-row">
            <td class="developer-name total">
                <strong>Total</strong>
            </td>
            ${costData.months.map(month => {
                const cost = costData.monthlyTotals[month.key] || 0;
                return `
                    <td class="cost-cell total ${month.isCurrent ? 'current-month' : ''}">
                        <strong>${formatCurrency(cost)}</strong>
                    </td>
                `;
            }).join('')}
        </tr>
    `;
}

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency
 */
function formatCurrency(value) {
    if (!value || value === 0) {
        return '$0';
    }
    return `$${Math.round(value).toLocaleString()}`;
}
