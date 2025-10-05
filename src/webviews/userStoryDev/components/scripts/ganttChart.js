/**
 * Gantt Chart Rendering
 * D3.js-based Gantt chart for project timeline visualization
 * Last Modified: October 5, 2025
 */

// Global state for Gantt chart
let currentGanttData = null;
let currentGanttConfig = null;
let currentGroupBy = "status";
let currentFilter = "all";
let currentZoomLevel = "week";

/**
 * Render Gantt chart with story timelines
 * @param {Array} items - All user story items
 * @param {Object} forecast - Forecast data with story schedules
 * @param {Object} config - Forecast configuration
 * @param {string} containerId - Container element ID
 */
function renderGanttChart(items, forecast, config, containerId = "gantt-chart-container") {
    if (!forecast || !forecast.storySchedules || forecast.storySchedules.length === 0) {
        showGanttEmptyState(containerId, "No schedule data available");
        return;
    }
    
    // Store current data for redraws
    currentGanttData = { items, forecast, schedules: forecast.storySchedules };
    currentGanttConfig = config;
    
    // Clear loading state
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Gantt chart container not found:", containerId);
        return;
    }
    container.innerHTML = "";
    
    // Filter schedules based on current filter
    const filteredSchedules = filterSchedules(forecast.storySchedules, currentFilter);
    
    if (filteredSchedules.length === 0) {
        showGanttEmptyState(containerId, "No stories match the current filter");
        return;
    }
    
    // Group schedules if needed
    const groupedSchedules = groupSchedules(filteredSchedules, currentGroupBy);
    
    // Render D3 chart
    renderGanttD3Chart(groupedSchedules, containerId);
}

/**
 * Filter schedules based on filter criteria
 * @param {Array} schedules - Story schedules
 * @param {string} filter - Filter type
 * @returns {Array} Filtered schedules
 */
function filterSchedules(schedules, filter) {
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];
    
    switch (filter) {
        case "incomplete":
            return schedules.filter(s => forecastableStatuses.includes(s.devStatus));
        case "complete":
            return schedules.filter(s => s.devStatus === "completed");
        case "blocked":
            return schedules.filter(s => s.devStatus === "blocked");
        case "critical":
            return schedules.filter(s => s.priority === "Critical");
        default:
            return schedules;
    }
}

/**
 * Group schedules by specified field
 * @param {Array} schedules - Story schedules
 * @param {string} groupBy - Grouping field
 * @returns {Array} Grouped schedules with group labels
 */
function groupSchedules(schedules, groupBy) {
    if (groupBy === "none") {
        return schedules.map(s => ({ ...s, group: "Stories" }));
    }
    
    return schedules.map(s => ({
        ...s,
        group: s[groupBy] || "Unspecified"
    }));
}

/**
 * Render D3.js Gantt chart
 * @param {Array} schedules - Grouped and filtered schedules
 * @param {string} containerId - Container element ID
 */
function renderGanttD3Chart(schedules, containerId) {
    const container = document.getElementById(containerId);
    const containerWidth = container.offsetWidth;
    const margin = { top: 40, right: 120, bottom: 60, left: 200 };
    const width = containerWidth - margin.left - margin.right;
    const rowHeight = 40;
    const height = schedules.length * rowHeight;
    
    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", height + margin.top + margin.bottom)
        .style("overflow", "visible");
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Calculate date range
    const allDates = schedules.flatMap(s => [s.startDate, s.endDate]);
    const minDate = d3.min(allDates);
    const maxDate = d3.max(allDates);
    const today = new Date();
    
    // X scale (time)
    const xScale = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, width]);
    
    // Y scale (stories)
    const yScale = d3.scaleBand()
        .domain(schedules.map((s, i) => i))
        .range([0, height])
        .padding(0.2);
    
    // Color scale by priority (for incomplete stories)
    const priorityColorScale = d3.scaleOrdinal()
        .domain(["Critical", "High", "Medium", "Low"])
        .range(["#d73a49", "#f39c12", "#0078d4", "#858585"]);
    
    // Color scale by dev status
    const devStatusColorScale = d3.scaleOrdinal()
        .domain(["on-hold", "ready-for-dev", "in-progress", "blocked", "completed"])
        .range(["#858585", "#0078d4", "#f39c12", "#d73a49", "#10b981"]);
    
    // Grid lines (vertical - dates)
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeDay.every(getTickInterval()))
        .tickFormat(d3.timeFormat("%b %d"));
    
    g.append("g")
        .attr("class", "gantt-x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    
    // Y axis (story labels)
    g.append("g")
        .attr("class", "gantt-y-axis")
        .selectAll(".gantt-y-label")
        .data(schedules)
        .enter()
        .append("text")
        .attr("class", "gantt-y-label")
        .attr("x", -10)
        .attr("y", (d, i) => yScale(i) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => `${d.storyId}: ${truncateText(d.storyText, 25)}`)
        .style("font-size", "12px")
        .style("fill", "var(--vscode-foreground)")
        .append("title")
        .text(d => `${d.storyId}: ${d.storyText}`);
    
    // Today line
    if (today >= minDate && today <= maxDate) {
        g.append("line")
            .attr("class", "gantt-today-line")
            .attr("x1", xScale(today))
            .attr("x2", xScale(today))
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke", "#fbbf24")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5");
        
        g.append("text")
            .attr("x", xScale(today))
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("fill", "#fbbf24")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Today");
    }
    
    // Story bars
    const bars = g.selectAll(".gantt-bar")
        .data(schedules)
        .enter()
        .append("g")
        .attr("class", "gantt-bar-group");
    
    bars.append("rect")
        .attr("class", "gantt-bar")
        .attr("x", d => xScale(d.startDate))
        .attr("y", (d, i) => yScale(i))
        .attr("width", d => Math.max(2, xScale(d.endDate) - xScale(d.startDate)))
        .attr("height", yScale.bandwidth())
        .attr("rx", 4)
        .style("fill", d => {
            // Color by dev status for forecasted stories
            return devStatusColorScale(d.devStatus) || priorityColorScale(d.priority) || "#6b7280";
        })
        .style("opacity", 0.8)
        .style("stroke", "var(--vscode-panel-border)")
        .style("stroke-width", 1)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .style("opacity", 1)
                .style("stroke-width", 2);
            showGanttTooltip(event, d);
        })
        .on("mouseout", function() {
            d3.select(this)
                .style("opacity", 0.8)
                .style("stroke-width", 1);
            hideGanttTooltip();
        });
    
    // Story points labels on bars
    bars.append("text")
        .attr("x", d => xScale(d.startDate) + (xScale(d.endDate) - xScale(d.startDate)) / 2)
        .attr("y", (d, i) => yScale(i) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .text(d => `${d.storyPoints}pts`);
    
    // Developer labels
    bars.append("text")
        .attr("x", d => xScale(d.endDate) + 5)
        .attr("y", (d, i) => yScale(i) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("fill", "var(--vscode-descriptionForeground)")
        .style("font-size", "10px")
        .text(d => d.developer);
    
    // Dependencies (if any)
    // TODO: Add dependency arrows if story relationships are defined
}

/**
 * Get tick interval based on zoom level
 * @returns {number} Number of days between ticks
 */
function getTickInterval() {
    switch (currentZoomLevel) {
        case "day": return 1;
        case "week": return 7;
        case "month": return 30;
        default: return 7;
    }
}

/**
 * Show tooltip for Gantt bar
 * @param {Event} event - Mouse event
 * @param {Object} data - Story schedule data
 */
function showGanttTooltip(event, data) {
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "gantt-tooltip")
        .style("position", "absolute")
        .style("background", "var(--vscode-editorHoverWidget-background)")
        .style("border", "1px solid var(--vscode-editorHoverWidget-border)")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)");
    
    tooltip.html(`
        <div><strong>${data.storyId}</strong></div>
        <div style="margin-top: 4px;">${truncateText(data.storyText, 50)}</div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--vscode-panel-border);">
            <div><strong>Priority:</strong> ${data.priority}</div>
            <div><strong>Dev Status:</strong> ${formatDevStatus(data.devStatus)}</div>
            <div><strong>Points:</strong> ${data.storyPoints}</div>
            <div><strong>Developer:</strong> ${data.developer}</div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--vscode-panel-border);">
            <div><strong>Start:</strong> ${formatDateShort(data.startDate)}</div>
            <div><strong>End:</strong> ${formatDateShort(data.endDate)}</div>
            <div><strong>Duration:</strong> ${data.daysNeeded.toFixed(1)} days</div>
        </div>
    `);
    
    tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
}

/**
 * Hide Gantt tooltip
 */
function hideGanttTooltip() {
    d3.selectAll(".gantt-tooltip").remove();
}

/**
 * Show empty state in Gantt container
 * @param {string} containerId - Container element ID
 * @param {string} message - Empty state message
 */
function showGanttEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="gantt-empty-state">
                <span class="codicon codicon-graph-line"></span>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Update Gantt grouping
 * @param {string} groupBy - Grouping field
 */
function updateGanttGrouping(groupBy) {
    currentGroupBy = groupBy;
    if (currentGanttData && currentGanttConfig) {
        renderGanttChart(
            currentGanttData.items,
            currentGanttData.forecast,
            currentGanttConfig
        );
    }
}

/**
 * Filter Gantt chart
 * @param {string} filter - Filter type
 */
function filterGanttChart(filter) {
    currentFilter = filter;
    if (currentGanttData && currentGanttConfig) {
        renderGanttChart(
            currentGanttData.items,
            currentGanttData.forecast,
            currentGanttConfig
        );
    }
}

/**
 * Zoom Gantt chart
 * @param {string} zoomLevel - Zoom level (day/week/month/reset)
 */
function zoomGanttChart(zoomLevel) {
    currentZoomLevel = zoomLevel === "reset" ? "week" : zoomLevel;
    if (currentGanttData && currentGanttConfig) {
        renderGanttChart(
            currentGanttData.items,
            currentGanttData.forecast,
            currentGanttConfig
        );
    }
}

/**
 * Export Gantt chart as PNG
 * @param {string} format - Export format (png or csv)
 */
function exportGanttChart(format) {
    if (format === "png") {
        exportGanttChartPNG();
    } else if (format === "csv") {
        exportGanttChartCSV();
    }
}

/**
 * Export Gantt chart as PNG image
 */
function exportGanttChartPNG() {
    const svg = document.querySelector("#gantt-chart-container svg");
    if (!svg) {
        vscode.postMessage({ command: "showError", message: "No chart to export" });
        return;
    }
    
    // Serialize SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    // Create blob and download
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gantt-chart-${new Date().toISOString().split("T")[0]}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    
    vscode.postMessage({ command: "showInfo", message: "Gantt chart exported as SVG" });
}

/**
 * Export Gantt schedule data as CSV
 */
function exportGanttChartCSV() {
    if (!currentGanttData || !currentGanttData.schedules) {
        vscode.postMessage({ command: "showError", message: "No schedule data to export" });
        return;
    }
    
    const schedules = currentGanttData.schedules;
    
    // CSV headers
    const headers = ["Story ID", "Story", "Priority", "Dev Status", "Points", "Developer", "Start Date", "End Date", "Duration (days)"];
    
    // CSV rows
    const rows = schedules.map(s => [
        s.storyId,
        `"${s.storyText.replace(/"/g, '""')}"`, // Escape quotes
        s.priority,
        formatDevStatus(s.devStatus),
        s.storyPoints,
        s.developer,
        formatDateShort(s.startDate),
        formatDateShort(s.endDate),
        s.daysNeeded.toFixed(1)
    ]);
    
    // Combine
    const csvContent = [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");
    
    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gantt-schedule-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    vscode.postMessage({ command: "showInfo", message: "Schedule data exported as CSV" });
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || "";
    }
    return text.substring(0, maxLength) + "...";
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
function formatDateShort(date) {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        return "Invalid";
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Format dev status for display
 * @param {string} devStatus - Dev status value
 * @returns {string} Formatted dev status label
 */
function formatDevStatus(devStatus) {
    const statusMap = {
        'on-hold': 'On Hold',
        'ready-for-dev': 'Ready for Development',
        'in-progress': 'In Progress',
        'blocked': 'Blocked',
        'completed': 'Completed'
    };
    return statusMap[devStatus] || devStatus;
}

