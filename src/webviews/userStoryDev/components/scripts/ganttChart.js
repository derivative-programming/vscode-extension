/**
 * Gantt Chart Rendering
 * D3.js-based Gantt chart for project timeline visualization
 * Last Modified: October 10, 2025
 */

// Global state for Gantt chart
let currentGanttData = null;
let currentGanttConfig = null;
let currentGroupBy = "status";
let currentFilter = "all";
let currentZoomLevel = "hour";

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
 * Render D3.js Gantt chart with adjustable zoom
 * @param {Array} schedules - Grouped and filtered schedules
 * @param {string} containerId - Container element ID
 */
function renderGanttD3Chart(schedules, containerId) {
    const container = document.getElementById(containerId);
    const containerWidth = container.offsetWidth;
    const margin = { top: 60, right: 40, bottom: 20, left: 150 };
    const width = containerWidth - margin.left - margin.right;
    const rowHeight = 30;
    const height = schedules.length * rowHeight;
    
    // Adjust pixel width based on zoom level
    let pixelsPerUnit = 30;
    let timeUnit = "hour";
    
    switch (currentZoomLevel) {
        case "hour":
            pixelsPerUnit = 30; // 30px per hour
            timeUnit = "hour";
            break;
        case "day":
            pixelsPerUnit = 50; // 50px per day
            timeUnit = "day";
            break;
        case "week":
            pixelsPerUnit = 80; // 80px per week
            timeUnit = "week";
            break;
        case "month":
            pixelsPerUnit = 100; // 100px per month
            timeUnit = "month";
            break;
        default:
            pixelsPerUnit = 30;
            timeUnit = "hour";
    }
    
    const hourWidth = pixelsPerUnit; // Keep variable name for compatibility
    
    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", height + margin.top + margin.bottom)
        .style("overflow-x", "auto")
        .style("overflow-y", "visible");
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Calculate date range
    const allDates = schedules.flatMap(s => [s.startDate, s.endDate]);
    const minDate = d3.min(allDates);
    const maxDate = d3.max(allDates);
    
    // Round to start and end of days
    const startDate = new Date(minDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(maxDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Generate array of time units based on zoom level
    const allTimeUnits = [];
    const currentTime = new Date(startDate);
    
    switch (timeUnit) {
        case "hour":
            while (currentTime <= endDate) {
                allTimeUnits.push(new Date(currentTime));
                currentTime.setHours(currentTime.getHours() + 1);
            }
            break;
        case "day":
            while (currentTime <= endDate) {
                allTimeUnits.push(new Date(currentTime));
                currentTime.setDate(currentTime.getDate() + 1);
            }
            break;
        case "week":
            while (currentTime <= endDate) {
                allTimeUnits.push(new Date(currentTime));
                currentTime.setDate(currentTime.getDate() + 7);
            }
            break;
        case "month":
            while (currentTime <= endDate) {
                allTimeUnits.push(new Date(currentTime));
                currentTime.setMonth(currentTime.getMonth() + 1);
            }
            break;
    }
    
    const totalUnits = allTimeUnits.length;
    const totalWidth = totalUnits * pixelsPerUnit;
    
    // Keep allHours for compatibility with existing code
    const allHours = allTimeUnits;
    
    // Update SVG width based on hour count
    svg.attr("width", Math.max(containerWidth, totalWidth + margin.left + margin.right));
    
    // X scale (time) - hourly precision
    const xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, totalWidth]);
    
    // Y scale (stories)
    const yScale = d3.scaleBand()
        .domain(schedules.map((s, i) => i))
        .range([0, height])
        .padding(0.2);
    
    // Color scale by priority (matching PRIORITY_LEVELS from priorityManagement.js)
    const priorityColorScale = d3.scaleOrdinal()
        .domain(["low", "medium", "high", "critical", "Low", "Medium", "High", "Critical"])
        .range([
            "#3794ff", "#ff9f40", "#ff6b6b", "#ff4040",  // lowercase
            "#3794ff", "#ff9f40", "#ff6b6b", "#ff4040"   // capitalized
        ]);
    
    // Color scale by dev status (for completed stories)
    const devStatusColorScale = d3.scaleOrdinal()
        .domain(["on-hold", "ready-for-dev", "in-progress", "blocked", "completed"])
        .range(["#858585", "#0078d4", "#f39c12", "#d73a49", "#10b981"]);
    
    // Developer color scale (similar to QA tester colors)
    const developerColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Get unique developers
    const developers = [...new Set(schedules.map(s => s.developer))];
    const developerIndices = {};
    developers.forEach((dev, idx) => {
        developerIndices[dev] = idx;
    });
    
    // Draw non-working hours background (only for hour view)
    if (timeUnit === "hour") {
        allHours.forEach((hour, index) => {
            const hourOfDay = hour.getHours();
            const dayOfWeek = hour.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isNonWorkingHour = hourOfDay < 9 || hourOfDay >= 17;
            
            if (isNonWorkingHour || isWeekend) {
                g.append("rect")
                    .attr("x", index * hourWidth)
                    .attr("y", -50)
                    .attr("width", hourWidth)
                    .attr("height", height + 50)
                    .attr("fill", isWeekend ? "#ff0000" : "#808080")
                    .attr("opacity", isWeekend ? 0.08 : 0.15)
                    .attr("stroke", "none");
            }
        });
    }
    
    // Draw non-working days background (for day/week/month views)
    if (timeUnit === "day" || timeUnit === "week" || timeUnit === "month") {
        allHours.forEach((timePoint, index) => {
            const dayOfWeek = timePoint.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            if (isWeekend) {
                g.append("rect")
                    .attr("x", index * pixelsPerUnit)
                    .attr("y", -50)
                    .attr("width", pixelsPerUnit)
                    .attr("height", height + 50)
                    .attr("fill", "#ff0000")
                    .attr("opacity", 0.08)
                    .attr("stroke", "none");
            }
        });
    }
    
    // Draw vertical grid lines for each time unit
    allHours.forEach((timePoint, index) => {
        g.append("line")
            .attr("x1", index * hourWidth)
            .attr("x2", index * hourWidth)
            .attr("y1", -50)
            .attr("y2", height)
            .attr("stroke", "var(--vscode-panel-border)")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.3);
    });
    
    // Draw headers based on zoom level
    if (timeUnit === "hour") {
        // Group hours by day for day headers
        const dayGroups = [];
        let currentDay = null;
        let dayStart = 0;
        
        allHours.forEach((hour, index) => {
            const dayKey = hour.toDateString();
            if (dayKey !== currentDay) {
                if (currentDay !== null) {
                    dayGroups.push({
                        day: currentDay,
                        start: dayStart,
                        end: index - 1,
                        date: allHours[dayStart]
                    });
                }
                currentDay = dayKey;
                dayStart = index;
            }
        });
        
        // Add last day group
        if (currentDay !== null) {
            dayGroups.push({
                day: currentDay,
                start: dayStart,
                end: allHours.length - 1,
                date: allHours[dayStart]
            });
        }
        
        // Draw day headers
        dayGroups.forEach(group => {
            const dayWidth = (group.end - group.start + 1) * hourWidth;
            g.append("rect")
                .attr("x", group.start * hourWidth)
                .attr("y", -50)
                .attr("width", dayWidth)
                .attr("height", 20)
                .attr("fill", "var(--vscode-editorGroupHeader-tabsBackground)")
                .attr("stroke", "var(--vscode-panel-border)")
                .attr("stroke-width", 1);
            
            g.append("text")
                .attr("x", group.start * hourWidth + dayWidth / 2)
                .attr("y", -35)
                .attr("text-anchor", "middle")
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("fill", "var(--vscode-foreground)")
                .text(d3.timeFormat("%b %d")(group.date));
        });
        
        // Draw hour headers
        allHours.forEach((hour, index) => {
            g.append("text")
                .attr("x", index * hourWidth + hourWidth / 2)
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .attr("font-size", "9px")
                .attr("fill", "var(--vscode-descriptionForeground)")
                .text(hour.getHours());
        });
    } else {
        // For day/week/month views, show single header row
        allHours.forEach((timePoint, index) => {
            let label = "";
            let formatString = "";
            
            switch (timeUnit) {
                case "day":
                    formatString = "%b %d";
                    break;
                case "week":
                    formatString = "Week of %b %d";
                    break;
                case "month":
                    formatString = "%B %Y";
                    break;
            }
            
            g.append("rect")
                .attr("x", index * hourWidth)
                .attr("y", -50)
                .attr("width", hourWidth)
                .attr("height", 30)
                .attr("fill", "var(--vscode-editorGroupHeader-tabsBackground)")
                .attr("stroke", "var(--vscode-panel-border)")
                .attr("stroke-width", 1);
            
            g.append("text")
                .attr("x", index * hourWidth + hourWidth / 2)
                .attr("y", -30)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .attr("fill", "var(--vscode-foreground)")
                .text(d3.timeFormat(formatString)(timePoint));
        });
    }
    
    // Draw story name labels on Y-axis
    g.selectAll(".story-label")
        .data(schedules)
        .enter()
        .append("text")
        .attr("class", "story-label")
        .attr("x", -5)
        .attr("y", (d, i) => yScale(i) + yScale.bandwidth() / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "11px")
        .attr("fill", "var(--vscode-foreground)")
        .text(d => `Story ${d.storyNumber || d.storyId}`)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            // Open story detail modal
            if (typeof openStoryDetailModal === "function") {
                openStoryDetailModal(d.storyId);
            }
        })
        .append("title")
        .text(d => d.storyText);
    
    // Add current time marker
    const now = new Date();
    if (now >= startDate && now <= endDate) {
        let currentIndex = -1;
        
        if (timeUnit === "hour") {
            currentIndex = allHours.findIndex(h => 
                h.getFullYear() === now.getFullYear() &&
                h.getMonth() === now.getMonth() &&
                h.getDate() === now.getDate() &&
                h.getHours() === now.getHours()
            );
        } else if (timeUnit === "day") {
            currentIndex = allHours.findIndex(h => 
                h.getFullYear() === now.getFullYear() &&
                h.getMonth() === now.getMonth() &&
                h.getDate() === now.getDate()
            );
        } else {
            // For week/month, find closest time unit
            currentIndex = allHours.findIndex((h, i) => {
                const next = allHours[i + 1];
                return h <= now && (!next || now < next);
            });
        }
        
        if (currentIndex >= 0) {
            g.append("rect")
                .attr("x", currentIndex * hourWidth)
                .attr("y", -50)
                .attr("width", hourWidth)
                .attr("height", height + 50)
                .attr("fill", "orange")
                .attr("opacity", 0.2);
            
            g.append("line")
                .attr("x1", currentIndex * hourWidth)
                .attr("x2", currentIndex * hourWidth)
                .attr("y1", -50)
                .attr("y2", height)
                .attr("stroke", "orange")
                .attr("stroke-width", 2);
        }
    }
    
    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "gantt-tooltip")
        .style("display", "none")
        .style("position", "absolute")
        .style("background", "var(--vscode-editorHoverWidget-background)")
        .style("border", "1px solid var(--vscode-editorHoverWidget-border)")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)");
    
    // Add bars for each story
    const bars = g.selectAll(".bar")
        .data(schedules)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.startDate))
        .attr("y", (d, i) => yScale(i))
        .attr("width", d => Math.max(2, xScale(d.endDate) - xScale(d.startDate)))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => {
            // Use green for completed stories, otherwise color by priority
            if (d.devStatus === "completed") {
                return "#10b981"; // Green for completed
            }
            return priorityColorScale(d.priority) || "#858585"; // Default gray if no priority
        })
        .attr("opacity", 0.85)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 1).attr("stroke-width", 1.5);
            const duration = ((d.endDate - d.startDate) / (1000 * 60 * 60)).toFixed(1);
            const startTime = d3.timeFormat("%b %d, %I:%M %p")(d.startDate);
            const endTime = d3.timeFormat("%b %d, %I:%M %p")(d.endDate);
            
            tooltip.style("display", "block")
                .html(`<strong>Story ${d.storyNumber || d.storyId}</strong><br/>` +
                    `${truncateText(d.storyText, 60)}<br/>` +
                    `<strong>Priority:</strong> ${formatPriority(d.priority)}<br/>` +
                    `<strong>Status:</strong> ${formatDevStatus(d.devStatus)}<br/>` +
                    `<strong>Start:</strong> ${startTime}<br/>` +
                    `<strong>End:</strong> ${endTime}<br/>` +
                    `<strong>Duration:</strong> ${duration} hrs<br/>` +
                    `<strong>Points:</strong> ${d.storyPoints}<br/>` +
                    `<strong>Developer:</strong> ${d.developer}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.85).attr("stroke-width", 0.5);
            tooltip.style("display", "none");
        })
        .on("click", function(event, d) {
            tooltip.style("display", "none");
            if (typeof openStoryDetailModal === "function") {
                openStoryDetailModal(d.storyId);
            }
        });
    
    // Add developer labels on bars (only if bar is wide enough)
    g.selectAll(".bar-label")
        .data(schedules)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => {
            const barWidth = xScale(d.endDate) - xScale(d.startDate);
            return barWidth > 20 ? xScale(d.startDate) + barWidth / 2 : xScale(d.startDate) - 20;
        })
        .attr("y", (d, i) => yScale(i) + yScale.bandwidth() / 2)
        .attr("text-anchor", d => {
            const barWidth = xScale(d.endDate) - xScale(d.startDate);
            return barWidth > 20 ? "middle" : "end";
        })
        .attr("dominant-baseline", "middle")
        .attr("fill", d => {
            const barWidth = xScale(d.endDate) - xScale(d.startDate);
            return barWidth > 20 ? "#fff" : "#666";
        })
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("pointer-events", "none")
        .text(d => `${d.storyPoints}pts`);
}

/**
 * Get tick interval based on zoom level
 * @returns {number} Number of days between ticks
 */
function getTickInterval() {
    switch (currentZoomLevel) {
        case "hour": return 0.04; // ~1 hour in days
        case "day": return 1;
        case "week": return 7;
        case "month": return 30;
        default: return 0.04;
    }
}

// Note: openStoryDetailModal is defined in modalFunctionality.js
// No need to redefine it here - it's already available globally

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
 * @param {string} zoomLevel - Zoom level (hour/day/week/month/reset)
 */
function zoomGanttChart(zoomLevel) {
    currentZoomLevel = zoomLevel === "reset" ? "hour" : zoomLevel;
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
    console.log('[UserStoryDev] Generating Gantt chart PNG');
    
    const svgElement = document.querySelector("#gantt-chart-container svg");
    if (!svgElement) {
        console.error('[UserStoryDev] SVG element not found for PNG generation');
        vscode.postMessage({ command: "showError", message: "No chart to export" });
        return;
    }
    
    // Clone the SVG and resolve CSS variables
    const svgClone = svgElement.cloneNode(true);
    const computedStyle = getComputedStyle(document.body);
    
    // Get computed colors
    const foregroundColor = computedStyle.getPropertyValue('--vscode-editor-foreground').trim() || '#cccccc';
    const borderColor = computedStyle.getPropertyValue('--vscode-panel-border').trim() || '#666666';
    
    // Replace CSS variables with computed values in all elements
    const elementsWithFill = svgClone.querySelectorAll('[fill*="var(--vscode"]');
    elementsWithFill.forEach(el => {
        el.setAttribute('fill', foregroundColor);
    });
    
    const elementsWithStroke = svgClone.querySelectorAll('[stroke*="var(--vscode"]');
    elementsWithStroke.forEach(el => {
        el.setAttribute('stroke', borderColor);
    });
    
    // Also handle style attributes that might contain CSS variables
    const elementsWithStyle = svgClone.querySelectorAll('[style*="var(--vscode"]');
    elementsWithStyle.forEach(el => {
        let style = el.getAttribute('style');
        if (style) {
            style = style.replace(/var\(--vscode-editor-foreground\)/g, foregroundColor);
            style = style.replace(/var\(--vscode-panel-border\)/g, borderColor);
            el.setAttribute('style', style);
        }
    });
    
    // Serialize the modified SVG
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);
    
    // Add XML declaration if not present
    if (!svgString.startsWith('<?xml')) {
        svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const svgRect = svgElement.getBoundingClientRect();
    canvas.width = svgRect.width * 2; // 2x for better quality
    canvas.height = svgRect.height * 2;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    
    // Fill with white background (not transparent)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, svgRect.width, svgRect.height);
    
    // Create image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        
        // Convert canvas to base64 PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        
        // Send to extension
        vscode.postMessage({
            command: 'saveGanttChartPNG',
            data: {
                base64: pngDataUrl
            }
        });
        
        console.log('[UserStoryDev] PNG data sent to extension');
    };
    
    img.onerror = function(error) {
        console.error('[UserStoryDev] Error loading SVG for PNG conversion:', error);
        vscode.postMessage({ command: "showError", message: "Error generating PNG image" });
    };
    
    img.src = url;
}

/**
 * Export Gantt schedule data as CSV
 */
function exportGanttChartCSV() {
    console.log('[UserStoryDev] Download Gantt CSV button clicked');
    
    if (!currentGanttData || !currentGanttData.schedules) {
        vscode.postMessage({ command: "showError", message: "No schedule data to export" });
        return;
    }
    
    vscode.postMessage({
        command: 'downloadGanttCsv',
        schedules: currentGanttData.schedules
    });
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

/**
 * Format priority for display
 * @param {string} priority - Priority value
 * @returns {string} Formatted priority label
 */
function formatPriority(priority) {
    if (!priority) {
        return "(Not Set)";
    }
    // Capitalize first letter
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}

