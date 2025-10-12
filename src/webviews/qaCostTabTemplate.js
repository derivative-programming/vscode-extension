/**
 * QA Cost Tab Template
 * Displays monthly cost breakdown by tester
 * Last Modified: October 12, 2025
 */

/**
 * Generate the QA cost analysis tab content
 * @param {Array} items - All user story items
 * @param {Object} config - QA Configuration with testers and forecast settings
 * @returns {string} HTML for cost tab
 */
function generateQACostTab(items, config) {
    return `
        <div class="cost-tab-container">
            <div class="cost-header">
                <h3>
                    <span class="codicon codicon-credit-card"></span>
                    QA Cost Analysis by Month
                </h3>
                <div class="cost-actions">
                    <button onclick="downloadQACostCsv()" class="icon-button" title="Download CSV">
                        <i class="codicon codicon-cloud-download"></i>
                    </button>
                    <button onclick="refreshQACostAnalysis()" class="icon-button" title="Refresh">
                        <i class="codicon codicon-refresh"></i>
                    </button>
                </div>
            </div>

            <div class="cost-filters">
                <label>
                    <input type="checkbox" id="qaCostShowPastMonths" checked onchange="refreshQACostAnalysis()">
                    Show Past Months
                </label>
                <label>
                    <input type="checkbox" id="qaCostShowFutureMonths" checked onchange="refreshQACostAnalysis()">
                    Show Future Months
                </label>
                <label>
                    <input type="checkbox" id="qaCostShowCurrentMonth" checked onchange="refreshQACostAnalysis()">
                    Show Current Month
                </label>
            </div>

            <div id="qaCostTableContainer">
                ${generateQACostAnalysisTable(items, config)}
            </div>
        </div>
    `;
}

/**
 * Generate the QA cost analysis table
 * @param {Array} items - All user story items
 * @param {Object} config - QA Configuration
 * @returns {string} HTML table
 */
function generateQACostAnalysisTable(items, config) {
    const costData = calculateQAMonthlyCosts(items, config);
    
    if (costData.months.length === 0) {
        return `
            <div class="empty-state">
                <span class="codicon codicon-graph"></span>
                <p>No cost data available</p>
                <p class="empty-state-hint">Set test hours and assign testers to calculate costs</p>
            </div>
        `;
    }

    const testers = config?.qaResources || 1;
    
    return `
        <div class="cost-table-wrapper">
            <table class="cost-table">
                <thead>
                    <tr>
                        <th class="tester-column">Tester</th>
                        ${costData.months.map(month => `
                            <th class="month-column ${month.isCurrent ? 'current-month' : ''}" title="${month.fullDate}">
                                ${month.display}
                                ${month.isCurrent ? '<span class="current-badge">Current</span>' : ''}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${generateTesterRows(costData, testers)}
                    ${generateQATotalRow(costData)}
                </tbody>
            </table>
        </div>
        
        <div class="cost-summary">
            <div class="summary-card">
                <div class="summary-label">Total QA Cost</div>
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
 * Generate rows for each tester
 * @param {Object} costData - Cost calculation data
 * @param {number} testers - Number of QA testers
 * @returns {string} HTML rows
 */
function generateTesterRows(costData, testers) {
    const rows = [];
    for (let i = 0; i < testers; i++) {
        const testerName = `Tester ${i + 1}`;
        const testerCosts = costData.testerCosts.get(testerName) || {};
        const testerTotal = costData.testerTotals.get(testerName) || 0;
        
        rows.push(`
            <tr class="tester-row">
                <td class="tester-name">
                    <span class="codicon codicon-person"></span>
                    ${testerName}
                </td>
                ${costData.months.map(month => {
                    const cost = testerCosts[month.key] || 0;
                    return `
                        <td class="cost-cell ${month.isCurrent ? 'current-month' : ''} ${cost > 0 ? 'has-cost' : ''}">
                            ${cost > 0 ? formatCurrency(cost) : '-'}
                        </td>
                    `;
                }).join('')}
            </tr>
        `);
    }
    return rows.join('');
}

/**
 * Generate total row
 * @param {Object} costData - Cost calculation data
 * @returns {string} HTML row
 */
function generateQATotalRow(costData) {
    return `
        <tr class="total-row">
            <td class="tester-name total">
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
