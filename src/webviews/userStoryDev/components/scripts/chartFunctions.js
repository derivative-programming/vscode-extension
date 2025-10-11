// Description: D3.js chart rendering functions for analytics visualizations
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Get VS Code color scheme for charts
 * @returns {Object} Color mappings
 */
function getVSCodeChartColors() {
    return {
        // Status colors
        status: {
            'on-hold': 'var(--vscode-charts-gray)',
            'ready-for-dev': 'var(--vscode-charts-blue)',
            'in-progress': 'var(--vscode-charts-yellow)',
            'blocked': 'var(--vscode-charts-red)',
            'completed': 'var(--vscode-charts-green)'
        },
        // Priority colors
        priority: {
            'critical': 'var(--vscode-charts-red)',
            'high': 'var(--vscode-charts-orange)',
            'medium': 'var(--vscode-charts-yellow)',
            'low': 'var(--vscode-charts-blue)',
            'none': 'var(--vscode-charts-gray)'
        },
        // General colors
        primary: 'var(--vscode-charts-blue)',
        success: 'var(--vscode-charts-green)',
        warning: 'var(--vscode-charts-yellow)',
        danger: 'var(--vscode-charts-red)',
        text: 'var(--vscode-foreground)',
        grid: 'var(--vscode-panel-border)',
        background: 'var(--vscode-editor-background)'
    };
}

/**
 * Clear chart container
 * @param {string} containerId - Chart container ID
 */
function clearChart(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Render status distribution pie chart
 * @param {Array} items - User story items
 * @param {string} containerId - Container element ID
 */
function renderStatusDistributionChart(items, containerId) {
    clearChart(containerId);
    
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
    // Count items by status
    const statusCounts = {};
    items.forEach(item => {
        const status = item.devStatus || 'ready-for-dev';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const data = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
    }));
    
    if (data.length === 0) {
        container.innerHTML = '<div class="chart-no-data">No data available</div>';
        return;
    }
    
    const colors = getVSCodeChartColors();
    const width = container.clientWidth;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;
    
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);
    
    const arcs = svg.selectAll('arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');
    
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => colors.status[d.data.status] || colors.primary)
        .attr('stroke', colors.background)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1.05)');
            
            showTooltip(event, `${formatStatus(d.data.status)}: ${d.data.count} stories`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1)');
            
            hideTooltip();
        });
    
    // Add labels
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .style('font-size', '12px')
        .text(d => d.data.count);
}

/**
 * Render priority distribution pie chart
 * @param {Array} items - User story items
 * @param {string} containerId - Container element ID
 */
function renderPriorityDistributionChart(items, containerId) {
    clearChart(containerId);
    
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
    // Count items by priority
    const priorityCounts = {};
    items.forEach(item => {
        const priority = item.priority || 'none';
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });
    
    const data = Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count
    }));
    
    if (data.length === 0) {
        container.innerHTML = '<div class="chart-no-data">No data available</div>';
        return;
    }
    
    const colors = getVSCodeChartColors();
    const width = container.clientWidth;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;
    
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);
    
    const arcs = svg.selectAll('arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');
    
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => colors.priority[d.data.priority] || colors.primary)
        .attr('stroke', colors.background)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1.05)');
            
            showTooltip(event, `${formatPriority(d.data.priority)}: ${d.data.count} stories`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1)');
            
            hideTooltip();
        });
    
    // Add labels
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .style('font-size', '12px')
        .text(d => d.data.count);
}

/**
 * Render velocity bar chart
 * @param {Array} velocityData - Velocity data by sprint
 * @param {string} containerId - Container element ID
 */
function renderVelocityChart(velocityData, containerId) {
    clearChart(containerId);
    
    const container = document.getElementById(containerId);
    if (!container || !velocityData || velocityData.length === 0) {
        if (container) {
            container.innerHTML = '<div class="chart-no-data">No velocity data available</div>';
        }
        return;
    }
    
    const colors = getVSCodeChartColors();
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const x = d3.scaleBand()
        .domain(velocityData.map(d => d.sprintName))
        .range([0, width])
        .padding(0.3);
    
    const maxPoints = d3.max(velocityData, d => Math.max(d.plannedPoints, d.completedPoints));
    
    const y = d3.scaleLinear()
        .domain([0, maxPoints])
        .range([height, 0]);
    
    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('fill', colors.text);
    
    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', colors.text);
    
    // Add Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .attr('fill', colors.text)
        .text('Story Points');
    
    // Add planned bars
    svg.selectAll('.bar-planned')
        .data(velocityData)
        .enter()
        .append('rect')
        .attr('class', 'bar-planned')
        .attr('x', d => x(d.sprintName))
        .attr('y', d => y(d.plannedPoints))
        .attr('width', x.bandwidth() / 2)
        .attr('height', d => height - y(d.plannedPoints))
        .attr('fill', colors.primary)
        .attr('opacity', 0.6)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            showTooltip(event, `${d.sprintName} - Planned: ${d.plannedPoints} pts`);
        })
        .on('mouseout', hideTooltip);
    
    // Add completed bars
    svg.selectAll('.bar-completed')
        .data(velocityData)
        .enter()
        .append('rect')
        .attr('class', 'bar-completed')
        .attr('x', d => x(d.sprintName) + x.bandwidth() / 2)
        .attr('y', d => y(d.completedPoints))
        .attr('width', x.bandwidth() / 2)
        .attr('height', d => height - y(d.completedPoints))
        .attr('fill', colors.success)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            showTooltip(event, `${d.sprintName} - Completed: ${d.completedPoints} pts (${d.completionRate}%)`);
        })
        .on('mouseout', hideTooltip);
}

/**
 * Render cycle time line chart
 * @param {Array} cycleTimeData - Cycle time trend data
 * @param {string} containerId - Container element ID
 */
function renderCycleTimeChart(cycleTimeData, containerId) {
    clearChart(containerId);
    
    const container = document.getElementById(containerId);
    if (!container || !cycleTimeData || cycleTimeData.length === 0) {
        if (container) {
            container.innerHTML = '<div class="chart-no-data">No cycle time data available</div>';
        }
        return;
    }
    
    const colors = getVSCodeChartColors();
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const x = d3.scaleBand()
        .domain(cycleTimeData.map(d => d.period))
        .range([0, width])
        .padding(0.1);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(cycleTimeData, d => d.max)])
        .range([height, 0]);
    
    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('fill', colors.text);
    
    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', colors.text);
    
    // Add Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .attr('fill', colors.text)
        .text('Days');
    
    // Add line for average
    const line = d3.line()
        .x(d => x(d.period) + x.bandwidth() / 2)
        .y(d => y(d.average));
    
    svg.append('path')
        .datum(cycleTimeData)
        .attr('fill', 'none')
        .attr('stroke', colors.primary)
        .attr('stroke-width', 2)
        .attr('d', line);
    
    // Add dots
    svg.selectAll('.dot')
        .data(cycleTimeData)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.period) + x.bandwidth() / 2)
        .attr('cy', d => y(d.average))
        .attr('r', 4)
        .attr('fill', colors.primary)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 6);
            showTooltip(event, `${d.period}: Avg ${d.average} days (${d.count} stories)`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 4);
            hideTooltip();
        });
}

/**
 * Render developer workload bar chart
 * @param {Array} items - User story items
 * @param {Object} config - Configuration with developers list
 * @param {string} containerId - Container element ID
 */
function renderDeveloperWorkloadChart(items, config, containerId) {
    clearChart(containerId);
    
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
    // Count story points by developer
    const workload = {};
    items.forEach(item => {
        const dev = item.assignedTo || 'Unassigned';
        const points = parseInt(item.storyPoints) || 0;
        workload[dev] = (workload[dev] || 0) + points;
    });
    
    const data = Object.entries(workload)
        .map(([developer, points]) => ({ developer, points }))
        .sort((a, b) => b.points - a.points);
    
    if (data.length === 0) {
        container.innerHTML = '<div class="chart-no-data">No workload data available</div>';
        return;
    }
    
    const colors = getVSCodeChartColors();
    const margin = { top: 20, right: 20, bottom: 40, left: 120 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = Math.max(300, data.length * 40) - margin.top - margin.bottom;
    
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.points)])
        .range([0, width]);
    
    const y = d3.scaleBand()
        .domain(data.map(d => d.developer))
        .range([0, height])
        .padding(0.2);
    
    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', colors.text);
    
    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', colors.text);
    
    // Add bars
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.developer))
        .attr('width', d => x(d.points))
        .attr('height', y.bandwidth())
        .attr('fill', colors.primary)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('fill', colors.success);
            showTooltip(event, `${d.developer}: ${d.points} story points`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('fill', colors.primary);
            hideTooltip();
        });
    
    // Add value labels
    svg.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', d => x(d.points) + 5)
        .attr('y', d => y(d.developer) + y.bandwidth() / 2)
        .attr('dy', '.35em')
        .attr('fill', colors.text)
        .style('font-size', '12px')
        .text(d => d.points);
}

/**
 * Show tooltip
 * @param {Event} event - Mouse event
 * @param {string} text - Tooltip text
 */
function showTooltip(event, text) {
    let tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.className = 'chart-tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY - 28}px`;
}

/**
 * Hide tooltip
 */
function hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

/**
 * Format status for display
 */
function formatStatus(status) {
    return status.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Format priority for display
 */
function formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getVSCodeChartColors,
        clearChart,
        renderStatusDistributionChart,
        renderPriorityDistributionChart,
        renderVelocityChart,
        renderCycleTimeChart,
        renderDeveloperWorkloadChart
    };
}
