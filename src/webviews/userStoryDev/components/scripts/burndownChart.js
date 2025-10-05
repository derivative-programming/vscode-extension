// Description: D3.js burndown chart rendering for sprint progress tracking
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Render sprint burndown chart
 * @param {Object} sprint - Sprint object
 * @param {Array} items - All user story items
 * @param {string} containerId - Container element ID
 */
function renderSprintBurndownChart(sprint, items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Get sprint stories
    const sprintStories = items.filter(item => item.assignedSprint === sprint.sprintId);
    
    if (sprintStories.length === 0) {
        container.innerHTML = '<div class="chart-no-data">No stories assigned to this sprint</div>';
        return;
    }
    
    // Calculate burndown data
    const burndownData = calculateBurndownData(sprint, sprintStories);
    
    if (burndownData.length === 0) {
        container.innerHTML = '<div class="chart-no-data">No burndown data available</div>';
        return;
    }
    
    // Render D3 chart
    renderBurndownD3Chart(burndownData, sprint, containerId);
}

/**
 * Calculate burndown data points
 * @param {Object} sprint - Sprint object
 * @param {Array} sprintStories - Stories assigned to sprint
 * @returns {Array} Array of data points {day, date, ideal, actual}
 */
function calculateBurndownData(sprint, sprintStories) {
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    
    // Calculate total points
    const totalPoints = calculateTotalPoints(sprintStories);
    
    if (totalPoints === 0) {
        return [];
    }
    
    // Calculate number of days
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Generate data points for each day
    const dataPoints = [];
    
    for (let day = 0; day <= totalDays; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + day);
        
        // Ideal burndown (linear)
        const ideal = totalPoints - (totalPoints / totalDays) * day;
        
        // Actual burndown (based on completed stories)
        let actual = totalPoints;
        
        if (currentDate <= today) {
            // Calculate points completed by this date
            const completedByDate = sprintStories.filter(story => {
                if (story.devStatus === 'completed' && story.actualEndDate) {
                    const completedDate = new Date(story.actualEndDate);
                    return completedDate <= currentDate;
                }
                return false;
            });
            
            const completedPoints = calculateTotalPoints(completedByDate);
            actual = totalPoints - completedPoints;
        } else {
            // Future dates - no actual data yet
            actual = null;
        }
        
        dataPoints.push({
            day: day,
            date: currentDate.toISOString().split('T')[0],
            ideal: Math.max(0, ideal),
            actual: actual !== null ? Math.max(0, actual) : null
        });
    }
    
    return dataPoints;
}

/**
 * Render burndown chart using D3.js
 * @param {Array} data - Burndown data points
 * @param {Object} sprint - Sprint object
 * @param {string} containerId - Container element ID
 */
function renderBurndownD3Chart(data, sprint, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
    const colors = getVSCodeChartColors();
    const margin = { top: 20, right: 60, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.day)])
        .range([0, width]);
    
    const maxY = d3.max(data, d => Math.max(d.ideal, d.actual || 0));
    
    const yScale = d3.scaleLinear()
        .domain([0, maxY])
        .range([height, 0]);
    
    // Add grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );
    
    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale)
            .ticks(Math.min(data.length, 10))
            .tickFormat(d => `Day ${d}`)
        )
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('fill', colors.text);
    
    svg.selectAll('.domain, .tick line')
        .attr('stroke', colors.grid);
    
    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .attr('fill', colors.text);
    
    svg.selectAll('.domain, .tick line')
        .attr('stroke', colors.grid);
    
    // Add Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .attr('fill', colors.text)
        .text('Story Points Remaining');
    
    // Create line generators
    const idealLine = d3.line()
        .x(d => xScale(d.day))
        .y(d => yScale(d.ideal));
    
    const actualLine = d3.line()
        .defined(d => d.actual !== null)
        .x(d => xScale(d.day))
        .y(d => yScale(d.actual));
    
    // Add ideal line (dashed)
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', colors.grid)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', idealLine);
    
    // Add actual line
    const actualData = data.filter(d => d.actual !== null);
    
    if (actualData.length > 0) {
        svg.append('path')
            .datum(actualData)
            .attr('fill', 'none')
            .attr('stroke', colors.primary)
            .attr('stroke-width', 3)
            .attr('d', actualLine);
        
        // Add dots for actual data points
        svg.selectAll('.dot-actual')
            .data(actualData)
            .enter()
            .append('circle')
            .attr('class', 'dot-actual')
            .attr('cx', d => xScale(d.day))
            .attr('cy', d => yScale(d.actual))
            .attr('r', 4)
            .attr('fill', colors.primary)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('r', 6);
                showTooltip(event, `Day ${d.day} (${formatDateShort(d.date)}): ${d.actual.toFixed(1)} points remaining`);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('r', 4);
                hideTooltip();
            });
    }
    
    // Add legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 150}, 10)`);
    
    // Ideal line legend
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', colors.grid)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    
    legend.append('text')
        .attr('x', 35)
        .attr('y', 0)
        .attr('dy', '0.32em')
        .attr('fill', colors.text)
        .style('font-size', '12px')
        .text('Ideal');
    
    // Actual line legend
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 20)
        .attr('y2', 20)
        .attr('stroke', colors.primary)
        .attr('stroke-width', 3);
    
    legend.append('text')
        .attr('x', 35)
        .attr('y', 20)
        .attr('dy', '0.32em')
        .attr('fill', colors.text)
        .style('font-size', '12px')
        .text('Actual');
    
    // Add today marker if sprint is active
    const today = new Date();
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    
    if (today >= startDate && today <= endDate) {
        const todayDay = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        
        svg.append('line')
            .attr('x1', xScale(todayDay))
            .attr('x2', xScale(todayDay))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', colors.warning)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '3,3');
        
        svg.append('text')
            .attr('x', xScale(todayDay))
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .attr('fill', colors.warning)
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .text('Today');
    }
}

/**
 * Calculate sprint velocity (average points per day)
 * @param {Object} sprint - Sprint object
 * @param {Array} sprintStories - Stories assigned to sprint
 * @returns {Object} Velocity statistics
 */
function calculateSprintVelocityStats(sprint, sprintStories) {
    const totalPoints = calculateTotalPoints(sprintStories);
    const completedPoints = calculateTotalPoints(
        sprintStories.filter(story => story.devStatus === 'completed')
    );
    
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.min(
        totalDays,
        Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)))
    );
    
    const idealVelocity = totalDays > 0 ? totalPoints / totalDays : 0;
    const actualVelocity = elapsedDays > 0 ? completedPoints / elapsedDays : 0;
    
    const remainingPoints = totalPoints - completedPoints;
    const remainingDays = totalDays - elapsedDays;
    
    const projectedCompletion = actualVelocity > 0 
        ? remainingPoints / actualVelocity 
        : remainingDays;
    
    const isOnTrack = projectedCompletion <= remainingDays;
    
    return {
        totalPoints,
        completedPoints,
        remainingPoints,
        totalDays,
        elapsedDays,
        remainingDays,
        idealVelocity: Math.round(idealVelocity * 10) / 10,
        actualVelocity: Math.round(actualVelocity * 10) / 10,
        projectedCompletion: Math.ceil(projectedCompletion),
        isOnTrack,
        completionPercentage: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
    };
}

/**
 * Format date for display (short format)
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderSprintBurndownChart,
        calculateBurndownData,
        renderBurndownD3Chart,
        calculateSprintVelocityStats,
        formatDateShort
    };
}
