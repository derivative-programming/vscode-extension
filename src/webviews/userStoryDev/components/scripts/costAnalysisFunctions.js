/**
 * Cost Analysis Functions
 * Calculates monthly costs by developer
 * Last Modified: October 11, 2025
 */

/**
 * Calculate monthly costs breakdown
 * @param {Array} items - All user story items
 * @param {Object} config - Configuration with developers and forecast
 * @returns {Object} Cost data organized by month and developer
 */
function calculateMonthlyCosts(items, config) {
    const forecastConfig = (config && config.forecastConfig) ? config.forecastConfig : getDefaultForecastConfig();
    const developers = config?.developers || [];
    
    // Get filters
    const showPast = document.getElementById('costShowPastMonths')?.checked ?? true;
    const showFuture = document.getElementById('costShowFutureMonths')?.checked ?? true;
    const showCurrent = document.getElementById('costShowCurrentMonth')?.checked ?? true;
    
    // Create developer rate lookup
    const developerRates = new Map();
    developers.forEach(dev => {
        developerRates.set(dev.name, dev.hourlyRate || forecastConfig.defaultDeveloperRate || 60);
    });
    
    // Calculate forecast to get scheduled dates for incomplete stories
    const forecast = calculateDevelopmentForecast(items, config);
    const scheduleLookup = new Map();
    if (forecast && forecast.storySchedules) {
        forecast.storySchedules.forEach(schedule => {
            scheduleLookup.set(schedule.storyId, schedule);
        });
    }
    
    // Get all stories with schedules
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked', 'completed'];
    const storiesWithWork = items.filter(item => forecastableStatuses.includes(item.devStatus));
    
    // Calculate costs by month and developer
    const monthlyData = new Map(); // month key -> { developers: Map<dev, cost>, total: number }
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    storiesWithWork.forEach(story => {
        const developer = story.assignedTo || story.developer || 'Unassigned';
        const storyPoints = parseInt(story.storyPoints) || 0;
        const hoursNeeded = storyPoints * forecastConfig.hoursPerPoint;
        const hourlyRate = developerRates.get(developer) || forecastConfig.defaultDeveloperRate || 60;
        const storyCost = hoursNeeded * hourlyRate;
        
        // Determine which month this story belongs to
        let storyMonth = null;
        
        if (story.devStatus === 'completed' && story.actualEndDate) {
            // Use actual end date for completed stories
            storyMonth = new Date(story.actualEndDate);
        } else {
            // For incomplete stories, use forecast schedule if available
            const schedule = scheduleLookup.get(story.storyId);
            if (schedule && schedule.startDate) {
                storyMonth = new Date(schedule.startDate);
            } else if (story.startDate) {
                // Fall back to story's start date
                storyMonth = new Date(story.startDate);
            } else if (story.estimatedEndDate) {
                // Fall back to estimated end date
                storyMonth = new Date(story.estimatedEndDate);
            }
        }
        
        if (!storyMonth || isNaN(storyMonth.getTime())) {
            return; // Skip stories without valid dates
        }
        
        // Normalize to first of month
        storyMonth.setDate(1);
        storyMonth.setHours(0, 0, 0, 0);
        const monthKey = `${storyMonth.getFullYear()}-${String(storyMonth.getMonth() + 1).padStart(2, '0')}`;
        
        // Get or create month entry
        if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
                date: new Date(storyMonth),
                developers: new Map(),
                total: 0
            });
        }
        
        const monthEntry = monthlyData.get(monthKey);
        const currentDevCost = monthEntry.developers.get(developer) || 0;
        monthEntry.developers.set(developer, currentDevCost + storyCost);
        monthEntry.total += storyCost;
    });
    
    // Sort months and filter by date range
    const sortedMonths = Array.from(monthlyData.entries())
        .sort((a, b) => a[1].date - b[1].date)
        .filter(([key, data]) => {
            const monthDate = data.date;
            const isCurrent = monthDate.getFullYear() === currentMonth.getFullYear() && 
                            monthDate.getMonth() === currentMonth.getMonth();
            const isPast = monthDate < currentMonth;
            const isFuture = monthDate > currentMonth;
            
            if (isCurrent && !showCurrent) {
                return false;
            }
            if (isPast && !showPast) {
                return false;
            }
            if (isFuture && !showFuture) {
                return false;
            }
            return true;
        });
    
    // Build month display info
    const months = sortedMonths.map(([key, data]) => {
        const monthDate = data.date;
        const isCurrent = monthDate.getFullYear() === currentMonth.getFullYear() && 
                         monthDate.getMonth() === currentMonth.getMonth();
        
        return {
            key: key,
            display: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            fullDate: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            isCurrent: isCurrent
        };
    });
    
    // Build developer costs structure
    const developerCosts = new Map();
    const developerTotals = new Map();
    const monthlyTotals = {};
    
    developers.forEach(dev => {
        developerCosts.set(dev.name, {});
        developerTotals.set(dev.name, 0);
    });
    developerCosts.set('Unassigned', {});
    developerTotals.set('Unassigned', 0);
    
    sortedMonths.forEach(([key, data]) => {
        monthlyTotals[key] = data.total;
        
        data.developers.forEach((cost, developer) => {
            if (!developerCosts.has(developer)) {
                developerCosts.set(developer, {});
                developerTotals.set(developer, 0);
            }
            developerCosts.get(developer)[key] = cost;
            developerTotals.set(developer, developerTotals.get(developer) + cost);
        });
    });
    
    // Calculate summary metrics
    const grandTotal = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
    const averageMonthly = months.length > 0 ? grandTotal / months.length : 0;
    const peakMonthly = Math.max(...Object.values(monthlyTotals), 0);
    
    return {
        months,
        developerCosts,
        developerTotals,
        monthlyTotals,
        grandTotal,
        averageMonthly,
        peakMonthly
    };
}

/**
 * Refresh cost analysis display
 */
function refreshCostAnalysis() {
    showSpinner();
    
    setTimeout(() => {
        const container = document.getElementById('costAnalysisContainer');
        if (container && allItems && devConfig) {
            container.innerHTML = generateCostAnalysisTable(allItems, devConfig);
        }
        hideSpinner();
    }, 100);
}

/**
 * Download cost analysis as CSV
 */
function downloadCostCsv() {
    console.log('[UserStoryDev] Cost CSV export button clicked');
    const costData = calculateMonthlyCosts(allItems, devConfig);
    const developers = devConfig?.developers || [];
    
    // Build CSV content
    const headers = ['Developer', ...costData.months.map(m => m.display)];
    const rows = [];
    
    // Developer rows
    developers.forEach(dev => {
        const devCosts = costData.developerCosts.get(dev.name) || {};
        const row = [
            dev.name,
            ...costData.months.map(month => {
                const cost = devCosts[month.key] || 0;
                return cost > 0 ? cost.toFixed(2) : '0';
            })
        ];
        rows.push(row);
    });
    
    // Unassigned row
    const unassignedCosts = costData.developerCosts.get('Unassigned') || {};
    const unassignedTotal = costData.developerTotals.get('Unassigned') || 0;
    if (unassignedTotal > 0) {
        const row = [
            'Unassigned',
            ...costData.months.map(month => {
                const cost = unassignedCosts[month.key] || 0;
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
    const filename = `user_story_cost_analysis_${timestamp}.csv`;
    
    // Send to extension to save in workspace and open immediately
    vscode.postMessage({
        command: 'saveCsvToWorkspace',
        data: {
            content: csvContent,
            filename: filename
        }
    });
    URL.revokeObjectURL(url);
}
