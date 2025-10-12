/**
 * QA Cost Analysis Functions
 * Calculates monthly QA costs by tester
 * Last Modified: October 12, 2025
 */

/**
 * Calculate QA monthly costs breakdown
 * @param {Array} items - All user story items
 * @param {Object} config - QA Configuration
 * @returns {Object} Cost data organized by month and tester
 */
function calculateQAMonthlyCosts(items, config) {
    console.log('[calculateQAMonthlyCosts] Starting with items:', items?.length, 'config:', config);
    
    const qaConfig = config || {};
    const avgTestTime = parseFloat(qaConfig.avgTestTime) || 4;
    const defaultQARate = parseFloat(qaConfig.defaultQARate) || 50;
    const qaResources = parseInt(qaConfig.qaResources) || 1;
    
    console.log('[calculateQAMonthlyCosts] Using avgTestTime:', avgTestTime, 'defaultQARate:', defaultQARate, 'qaResources:', qaResources);
    
    // Get filters
    const showPast = document.getElementById('qaCostShowPastMonths')?.checked ?? true;
    const showFuture = document.getElementById('qaCostShowFutureMonths')?.checked ?? true;
    const showCurrent = document.getElementById('qaCostShowCurrentMonth')?.checked ?? true;
    
    // Calculate forecast to get scheduled dates for incomplete stories
    const forecastResult = calculateQAForecast(items, qaConfig);
    const forecast = forecastResult?.items || [];
    console.log('[calculateQAMonthlyCosts] Forecast result:', forecast.length, 'items');
    
    const scheduleLookup = new Map();
    if (forecast && Array.isArray(forecast)) {
        forecast.forEach(schedule => {
            scheduleLookup.set(schedule.storyNumber, schedule);
        });
    }
    
    // Get all stories with QA work
    const qaStatuses = ['pending', 'ready-to-test', 'started', 'success', 'failure'];
    const storiesWithQA = items.filter(item => qaStatuses.includes(item.qaStatus));
    
    console.log('[calculateQAMonthlyCosts] Stories with QA:', storiesWithQA.length);
    
    // Calculate costs by month and tester
    const monthlyData = new Map(); // month key -> { testers: Map<tester, cost>, total: number }
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    let storiesWithDates = 0;
    let storiesWithoutDates = 0;
    
    storiesWithQA.forEach(story => {
        const hoursNeeded = avgTestTime;
        const storyCost = hoursNeeded * defaultQARate;
        
        // Determine which month this story belongs to
        let storyMonth = null;
        let dateSource = 'none';
        
        if ((story.qaStatus === 'success' || story.qaStatus === 'failure') && story.qaActualEndDate) {
            // Use actual QA end date for completed stories
            storyMonth = new Date(story.qaActualEndDate);
            dateSource = 'qaActualEndDate';
        } else {
            // For incomplete stories, use forecast schedule if available
            const schedule = scheduleLookup.get(story.storyNumber);
            if (schedule && schedule.startDate) {
                storyMonth = new Date(schedule.startDate);
                dateSource = 'forecast.startDate';
            } else if (story.qaStartDate) {
                // Fall back to QA start date
                storyMonth = new Date(story.qaStartDate);
                dateSource = 'qaStartDate';
            } else if (story.qaEstimatedEndDate) {
                // Fall back to estimated end date
                storyMonth = new Date(story.qaEstimatedEndDate);
                dateSource = 'qaEstimatedEndDate';
            }
        }
        
        if (!storyMonth || isNaN(storyMonth.getTime())) {
            storiesWithoutDates++;
            return; // Skip stories without valid dates
        }
        
        storiesWithDates++;
        
        // Normalize to first of month
        storyMonth.setDate(1);
        storyMonth.setHours(0, 0, 0, 0);
        const monthKey = `${storyMonth.getFullYear()}-${String(storyMonth.getMonth() + 1).padStart(2, '0')}`;
        
        // Get or create month entry
        if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
                date: new Date(storyMonth),
                testers: new Map(),
                total: 0
            });
        }
        
        const monthEntry = monthlyData.get(monthKey);
        
        // Get tester from forecast schedule or default to Tester 1
        let tester = 'Tester 1';
        const schedule = scheduleLookup.get(story.storyNumber);
        if (schedule && schedule.testerIndex !== undefined) {
            tester = `Tester ${schedule.testerIndex + 1}`;
        }
        
        const currentTesterCost = monthEntry.testers.get(tester) || 0;
        monthEntry.testers.set(tester, currentTesterCost + storyCost);
        monthEntry.total += storyCost;
    });
    
    // Sort months and filter by date range
    const sortedMonths = Array.from(monthlyData.entries())
        .sort((a, b) => a[1].date - b[1].date)
        .filter(([key, data]) => {
            const monthDate = data.date;
            const isCurrentMonth = monthDate.getTime() === currentMonth.getTime();
            const isPastMonth = monthDate.getTime() < currentMonth.getTime();
            const isFutureMonth = monthDate.getTime() > currentMonth.getTime();
            
            if (isCurrentMonth && !showCurrent) {
                return false;
            }
            if (isPastMonth && !showPast) {
                return false;
            }
            if (isFutureMonth && !showFuture) {
                return false;
            }
            
            return true;
        });
    
    // Build result structure
    const months = sortedMonths.map(([key, data]) => ({
        key,
        display: formatMonthDisplay(data.date),
        fullDate: formatFullDate(data.date),
        isCurrent: data.date.getTime() === currentMonth.getTime()
    }));
    
    // Build tester costs map
    const testerCosts = new Map();
    const testerTotals = new Map();
    const monthlyTotals = {};
    
    for (let i = 0; i < qaResources; i++) {
        const testerName = `Tester ${i + 1}`;
        testerCosts.set(testerName, {});
        testerTotals.set(testerName, 0);
    }
    
    sortedMonths.forEach(([key, data]) => {
        let monthTotal = 0;
        data.testers.forEach((cost, testerName) => {
            const testerMap = testerCosts.get(testerName);
            if (testerMap) {
                testerMap[key] = cost;
                testerTotals.set(testerName, (testerTotals.get(testerName) || 0) + cost);
            }
            monthTotal += cost;
        });
        monthlyTotals[key] = monthTotal;
    });
    
    // Calculate summary stats
    const grandTotal = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
    const averageMonthly = months.length > 0 ? grandTotal / months.length : 0;
    const peakMonthly = Math.max(0, ...Object.values(monthlyTotals));
    
    console.log('[calculateQAMonthlyCosts] Results:', {
        totalStories: storiesWithQA.length,
        storiesWithDates,
        storiesWithoutDates,
        monthsFound: months.length,
        grandTotal
    });
    
    return {
        months,
        testerCosts,
        testerTotals,
        monthlyTotals,
        grandTotal,
        averageMonthly,
        peakMonthly
    };
}

/**
 * Refresh the QA cost analysis display
 */
function refreshQACostAnalysis() {
    showSpinner();
    
    setTimeout(() => {
        const container = document.getElementById('qaCostTableContainer');
        if (container && allItems && qaConfig) {
            container.innerHTML = generateQACostAnalysisTable(allItems, qaConfig);
        }
        hideSpinner();
    }, 100);
}

/**
 * Download QA cost analysis as CSV
 */
function downloadQACostCsv() {
    console.log('[UserStoriesQA] Cost CSV export button clicked');
    const costData = calculateQAMonthlyCosts(allItems, qaConfig);
    
    if (costData.months.length === 0) {
        vscode.postMessage({
            command: 'showError',
            message: 'No cost data available to export'
        });
        return;
    }
    
    // Build CSV content
    const headers = ['Tester', ...costData.months.map(m => m.display)];
    const rows = [];
    
    // Tester rows
    const qaResources = qaConfig?.qaResources || 1;
    for (let i = 0; i < qaResources; i++) {
        const testerName = `Tester ${i + 1}`;
        const testerCosts = costData.testerCosts.get(testerName) || {};
        const row = [
            testerName,
            ...costData.months.map(month => {
                const cost = testerCosts[month.key] || 0;
                return cost > 0 ? cost.toFixed(2) : '0';
            })
        ];
        rows.push(row);
    }
    
    // Total row
    const totalRow = [
        'TOTAL',
        ...costData.months.map(month => {
            const cost = costData.monthlyTotals[month.key] || 0;
            return cost.toFixed(2);
        })
    ];
    rows.push(totalRow);
    
    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Generate timestamped filename
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    const timestamp = `${y}${m}${d}${h}${min}${s}`;
    const filename = `qa_cost_analysis_${timestamp}.csv`;
    
    // Send to extension to save in workspace and open immediately
    vscode.postMessage({
        command: 'saveCsvToWorkspace',
        data: {
            content: csvContent,
            filename: filename
        }
    });
}

/**
 * Format month for display
 * @param {Date} date - Month date
 * @returns {string} Formatted month (e.g., "Oct 2025")
 */
function formatMonthDisplay(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format full date string
 * @param {Date} date - Date
 * @returns {string} Formatted date
 */
function formatFullDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

/**
 * Format currency value (reused from template, but needed here for consistency)
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency
 */
function formatCurrency(value) {
    if (!value || value === 0) {
        return '$0';
    }
    return `$${Math.round(value).toLocaleString()}`;
}
