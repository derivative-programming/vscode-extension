// Description: Handles the user stories QA webview display with filtering and sorting.
// Created: August 4, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let userStoriesQAData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'storyNumber',
    sortDescending: false
};

// Keep track of all items for filtering
let allItems = [];

// Keep track of selected items
let selectedItems = new Set();

// Keep track of current chart type (bar or pie)
let currentChartType = 'bar';

// Helper function to show spinner
function showSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "flex";
    }
}

// Helper function to hide spinner
function hideSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "none";
    }
}

// Toggle filter section visibility (global function for onclick)
function toggleFilterSection() {
    const filterContent = document.getElementById('filterContent');
    const chevron = document.getElementById('filterChevron');
    
    if (filterContent && chevron) {
        const isCollapsed = filterContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            filterContent.classList.remove('collapsed');
            chevron.classList.remove('codicon-chevron-right');
            chevron.classList.add('codicon-chevron-down');
        } else {
            filterContent.classList.add('collapsed');
            chevron.classList.remove('codicon-chevron-down');
            chevron.classList.add('codicon-chevron-right');
        }
    }
}

// Apply filters to the data (global function for onclick)
function applyFilters() {
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.toLowerCase() || '';
    const qaStatusFilter = document.getElementById('filterQAStatus')?.value || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        const matchesQAStatus = !qaStatusFilter || item.qaStatus === qaStatusFilter;
        
        return matchesStoryNumber && matchesStoryText && matchesQAStatus;
    });
    
    // Update userStoriesQAData with filtered results
    userStoriesQAData.items = filteredItems;
    userStoriesQAData.totalRecords = filteredItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterStoryNumber').value = '';
    document.getElementById('filterStoryText').value = '';
    document.getElementById('filterQAStatus').value = '';
    
    // Reset to show all items
    userStoriesQAData.items = allItems.slice();
    userStoriesQAData.totalRecords = allItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Calculate QA status distribution from current data
function calculateQAStatusDistribution() {
    const distribution = {
        'pending': 0,
        'ready-to-test': 0,
        'started': 0,
        'success': 0,
        'failure': 0
    };
    
    // Count items by status
    allItems.forEach(item => {
        const status = item.qaStatus || 'pending';
        if (distribution.hasOwnProperty(status)) {
            distribution[status]++;
        }
    });
    
    return distribution;
}

// Get semantic color for QA status
function getQAStatusColor(value) {
    const colors = {
        'pending': '#858585',       // Gray
        'ready-to-test': '#0078d4', // Blue
        'started': '#f39c12',        // Orange
        'success': '#28a745',        // Green
        'failure': '#d73a49'         // Red
    };
    return colors[value] || '#858585';
}

// Update QA summary statistics
function updateQASummaryStats(distribution) {
    const totalStories = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const successCount = distribution.success || 0;
    const completedCount = (distribution.success || 0) + (distribution.failure || 0);
    
    const successRate = totalStories > 0 ? ((successCount / totalStories) * 100).toFixed(1) : '0.0';
    const completionRate = totalStories > 0 ? ((completedCount / totalStories) * 100).toFixed(1) : '0.0';
    
    // Update DOM
    const totalStoriesEl = document.getElementById('qa-total-stories');
    const successRateEl = document.getElementById('qa-success-rate');
    const completionRateEl = document.getElementById('qa-completion-rate');
    
    if (totalStoriesEl) {
        totalStoriesEl.textContent = totalStories;
    }
    if (successRateEl) {
        successRateEl.textContent = successRate + '%';
    }
    if (completionRateEl) {
        completionRateEl.textContent = completionRate + '%';
    }
}

// Render QA status distribution histogram
function renderQAStatusDistributionHistogram() {
    console.log('[userStoriesQAView] Rendering QA status distribution histogram');
    
    const vizDiv = document.getElementById('qa-distribution-visualization');
    const loadingDiv = document.getElementById('qa-distribution-loading');
    
    if (!vizDiv) {
        console.warn('[userStoriesQAView] qa-distribution-visualization div not found');
        return;
    }
    
    // Show loading, hide visualization
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
    }
    vizDiv.classList.add('hidden');
    
    // Clear previous SVG
    vizDiv.innerHTML = '';
    
    // Calculate distribution
    const distribution = calculateQAStatusDistribution();
    updateQASummaryStats(distribution);
    
    // Fixed status order (workflow-based)
    const statusOrder = ['pending', 'ready-to-test', 'started', 'success', 'failure'];
    const statusLabels = {
        'pending': 'Pending',
        'ready-to-test': 'Ready to Test',
        'started': 'Started',
        'success': 'Success',
        'failure': 'Failure'
    };
    
    // Prepare data array
    const data = statusOrder.map(status => ({
        status: status,
        label: statusLabels[status],
        count: distribution[status] || 0,
        color: getQAStatusColor(status)
    }));
    
    // D3.js rendering
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = Math.max(600, vizDiv.clientWidth - 40) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select('#qa-distribution-visualization')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    // X scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.2);
    
    // Y scale
    const maxCount = d3.max(data, d => d.count) || 1;
    const y = d3.scaleLinear()
        .domain([0, maxCount])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')
        .attr('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '11px');
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .attr('fill', 'var(--vscode-editor-foreground)');
    
    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '12px')
        .text('Number of Stories');
    
    // Style axis lines
    svg.selectAll('.domain, .tick line')
        .attr('stroke', 'var(--vscode-panel-border)');
    
    // Create tooltip div if it doesn't exist
    let tooltip = d3.select('.qa-distribution-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'qa-distribution-tooltip')
            .style('opacity', 0);
    }
    
    // Bars
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.label))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.count))
        .attr('height', d => height - y(d.count))
        .attr('fill', d => d.color)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            const totalStories = data.reduce((sum, item) => sum + item.count, 0);
            const percentage = totalStories > 0 ? ((d.count / totalStories) * 100).toFixed(1) : '0.0';
            
            tooltip.html('<strong>' + d.label + '</strong><br/>Count: ' + d.count + '<br/>Percentage: ' + percentage + '%')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).style('opacity', 1);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Count labels on bars
    svg.selectAll('.bar-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => x(d.label) + x.bandwidth() / 2)
        .attr('y', d => y(d.count) - 5)
        .attr('text-anchor', 'middle')
        .text(d => d.count)
        .attr('fill', 'var(--vscode-editor-foreground)')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    
    // Hide loading, show visualization
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
    vizDiv.classList.remove('hidden');
    
    console.log('[userStoriesQAView] QA status distribution histogram rendered successfully');
}

// Render QA status distribution as pie chart
function renderQAStatusDistributionPieChart() {
    console.log('[userStoriesQAView] Rendering QA status distribution pie chart');
    
    const vizDiv = document.getElementById('qa-distribution-visualization');
    const loadingDiv = document.getElementById('qa-distribution-loading');
    
    if (!vizDiv) {
        console.warn('[userStoriesQAView] qa-distribution-visualization div not found');
        return;
    }
    
    // Show loading, hide visualization
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
    }
    vizDiv.classList.add('hidden');
    
    // Clear previous SVG
    vizDiv.innerHTML = '';
    
    // Calculate distribution
    const distribution = calculateQAStatusDistribution();
    updateQASummaryStats(distribution);
    
    // Fixed status order (workflow-based)
    const statusOrder = ['pending', 'ready-to-test', 'started', 'success', 'failure'];
    const statusLabels = {
        'pending': 'Pending',
        'ready-to-test': 'Ready to Test',
        'started': 'Started',
        'success': 'Success',
        'failure': 'Failure'
    };
    
    // Prepare data array - filter out zero values for pie chart
    const data = statusOrder
        .map(status => ({
            status: status,
            label: statusLabels[status],
            count: distribution[status] || 0,
            color: getQAStatusColor(status)
        }))
        .filter(d => d.count > 0); // Only include non-zero slices
    
    if (data.length === 0) {
        vizDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">No data to display</div>';
        if (loadingDiv) {
            loadingDiv.classList.add('hidden');
        }
        vizDiv.classList.remove('hidden');
        return;
    }
    
    // D3.js pie chart rendering
    const width = Math.max(600, vizDiv.clientWidth - 40);
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;
    
    const svg = d3.select('#qa-distribution-visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');
    
    // Create pie layout
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null); // Maintain original order
    
    // Create arc generator
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    // Create arc for hover effect (slightly larger)
    const arcHover = d3.arc()
        .innerRadius(0)
        .outerRadius(radius + 10);
    
    // Create tooltip div if it doesn't exist
    let tooltip = d3.select('.qa-distribution-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'qa-distribution-tooltip')
            .style('opacity', 0);
    }
    
    // Calculate total for percentages
    const totalStories = data.reduce((sum, item) => sum + item.count, 0);
    
    // Create pie slices
    const slices = svg.selectAll('.slice')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'slice');
    
    // Add paths for each slice
    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', 'var(--vscode-editor-background)')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arcHover)
                .style('opacity', 0.8);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            const percentage = ((d.data.count / totalStories) * 100).toFixed(1);
            
            tooltip.html('<strong>' + d.data.label + '</strong><br/>Count: ' + d.data.count + '<br/>Percentage: ' + percentage + '%')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arc)
                .style('opacity', 1);
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Add percentage labels on slices
    slices.append('text')
        .attr('transform', d => {
            const pos = arc.centroid(d);
            return 'translate(' + pos[0] + ',' + pos[1] + ')';
        })
        .attr('text-anchor', 'middle')
        .attr('fill', '#FFFFFF')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
        .style('pointer-events', 'none')
        .each(function(d) {
            const percentage = ((d.data.count / totalStories) * 100).toFixed(1);
            // Only show label if slice is large enough (> 5%)
            if (parseFloat(percentage) > 5) {
                d3.select(this).text(percentage + '%');
            }
        });
    
    // Add legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + (radius + 20) + ',' + (-radius + 20) + ')');
    
    const legendItems = legend.selectAll('.legend-item')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => 'translate(0,' + (i * 25) + ')');
    
    legendItems.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', d => d.color);
    
    legendItems.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .attr('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '12px')
        .text(d => d.label + ' (' + d.count + ')');
    
    // Hide loading, show visualization
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
    vizDiv.classList.remove('hidden');
    
    console.log('[userStoriesQAView] QA status distribution pie chart rendered successfully');
}

// Render QA status distribution based on current chart type
function renderQAStatusDistribution() {
    if (currentChartType === 'pie') {
        renderQAStatusDistributionPieChart();
    } else {
        renderQAStatusDistributionHistogram();
    }
}

// Generate PNG from QA distribution histogram
function generateQADistributionPNG() {
    console.log('[userStoriesQAView] Generating QA distribution PNG');
    
    const svgElement = document.querySelector('#qa-distribution-visualization svg');
    if (!svgElement) {
        console.error('[userStoriesQAView] SVG element not found for PNG generation');
        alert('Please render the histogram first');
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
            command: 'saveQADistributionPNG',
            data: {
                base64: pngDataUrl
            }
        });
        
        console.log('[userStoriesQAView] PNG data sent to extension');
    };
    
    img.onerror = function(error) {
        console.error('[userStoriesQAView] Error loading SVG for PNG conversion:', error);
        alert('Error generating PNG image');
    };
    
    img.src = url;
}

// ============================================
// QA Forecast Functions
// ============================================

// Global variable to store QA configuration
let qaConfig = null;

// Open QA Configuration Modal
function openQAConfigModal() {
    const modal = document.getElementById("qaConfigModal");
    if (!modal) return;
    
    // Request config from extension
    vscode.postMessage({
        command: "loadQAConfig"
    });
    
    // Show modal (config will be populated when received)
    modal.classList.add("active");
}

// Close QA Configuration Modal
function closeQAConfigModal() {
    const modal = document.getElementById("qaConfigModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

// Save QA Configuration Modal
function saveQAConfigModal() {
    const avgTestTimeInput = document.getElementById("configAvgTestTime");
    const qaResourcesInput = document.getElementById("configQAResources");
    const defaultQARateInput = document.getElementById("configDefaultQARate");
    
    if (!avgTestTimeInput || !qaResourcesInput || !defaultQARateInput) return;
    
    // Validate inputs
    const avgTestTime = parseFloat(avgTestTimeInput.value);
    const qaResources = parseInt(qaResourcesInput.value);
    const defaultQARate = parseFloat(defaultQARateInput.value);
    
    if (isNaN(avgTestTime) || avgTestTime <= 0) {
        vscode.postMessage({
            command: "showErrorMessage",
            message: "Average test time must be a positive number"
        });
        return;
    }
    
    if (isNaN(qaResources) || qaResources < 1) {
        vscode.postMessage({
            command: "showErrorMessage",
            message: "Number of QA resources must be at least 1"
        });
        return;
    }
    
    if (isNaN(defaultQARate) || defaultQARate < 0) {
        vscode.postMessage({
            command: "showErrorMessage",
            message: "Default QA rate must be a non-negative number"
        });
        return;
    }
    
    // Collect working hours
    const workingHours = {};
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
    days.forEach(day => {
        const enabledCheckbox = document.getElementById(day + "Enabled");
        const startTimeInput = document.getElementById(day + "Start");
        const endTimeInput = document.getElementById(day + "End");
        
        if (enabledCheckbox && startTimeInput && endTimeInput) {
            workingHours[day] = {
                enabled: enabledCheckbox.checked,
                startTime: startTimeInput.value,
                endTime: endTimeInput.value
            };
        }
    });
    
    // Validate at least one day is enabled
    const hasEnabledDay = Object.values(workingHours).some(day => day.enabled);
    if (!hasEnabledDay) {
        vscode.postMessage({
            command: "showErrorMessage",
            message: "At least one working day must be enabled"
        });
        return;
    }
    
    // Get display options
    const hideNonWorkingHoursCheckbox = document.getElementById("configHideNonWorkingHours");
    const hideNonWorkingHours = hideNonWorkingHoursCheckbox ? hideNonWorkingHoursCheckbox.checked : false;
    
    // Create config object
    const config = {
        avgTestTime: avgTestTime,
        qaResources: qaResources,
        defaultQARate: defaultQARate,
        hideNonWorkingHours: hideNonWorkingHours,
        workingHours: workingHours
    };
    
    // Save config
    vscode.postMessage({
        command: "saveQAConfig",
        config: config
    });
    
    closeQAConfigModal();
}

// Populate working hours table
function populateWorkingHoursTable(config) {
    const tbody = document.getElementById("workingHoursTable");
    if (!tbody) return;
    
    const days = [
        { key: "monday", label: "Monday" },
        { key: "tuesday", label: "Tuesday" },
        { key: "wednesday", label: "Wednesday" },
        { key: "thursday", label: "Thursday" },
        { key: "friday", label: "Friday" },
        { key: "saturday", label: "Saturday" },
        { key: "sunday", label: "Sunday" }
    ];
    
    tbody.innerHTML = "";
    
    days.forEach(day => {
        const dayConfig = config.workingHours[day.key] || { enabled: false, startTime: "09:00", endTime: "17:00" };
        
        // Calculate hours
        const startParts = dayConfig.startTime.split(":");
        const endParts = dayConfig.endTime.split(":");
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        const hours = ((endMinutes - startMinutes) / 60).toFixed(1);
        
        const row = document.createElement("tr");
        row.innerHTML = "<td style=\"text-align: center;\">" +
            "<input type=\"checkbox\" id=\"" + day.key + "Enabled\" " + (dayConfig.enabled ? "checked" : "") + ">" +
            "</td>" +
            "<td>" + day.label + "</td>" +
            "<td><input type=\"time\" id=\"" + day.key + "Start\" value=\"" + dayConfig.startTime + "\"></td>" +
            "<td><input type=\"time\" id=\"" + day.key + "End\" value=\"" + dayConfig.endTime + "\"></td>" +
            "<td class=\"hours-cell\">" + hours + "</td>";
        tbody.appendChild(row);
        
        // Add event listener to checkbox and time inputs to update summary
        const checkbox = row.querySelector("#" + day.key + "Enabled");
        const startInput = row.querySelector("#" + day.key + "Start");
        const endInput = row.querySelector("#" + day.key + "End");
        if (checkbox) {
            checkbox.addEventListener("change", function() { updateConfigSummary(); });
        }
        if (startInput) {
            startInput.addEventListener("change", function() { updateConfigSummary(); });
        }
        if (endInput) {
            endInput.addEventListener("change", function() { updateConfigSummary(); });
        }
    });
}

// Update config summary section
function updateConfigSummary() {
    const avgTestTimeInput = document.getElementById("configAvgTestTime");
    const qaResourcesInput = document.getElementById("configQAResources");
    const summaryDiv = document.querySelector(".config-summary");
    
    if (!avgTestTimeInput || !qaResourcesInput || !summaryDiv) return;
    
    const avgTestTime = parseFloat(avgTestTimeInput.value) || 0;
    const qaResources = parseInt(qaResourcesInput.value) || 1;
    
    // Calculate working days and hours per week
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    let workingDaysCount = 0;
    let totalHoursPerWeek = 0;
    
    days.forEach(day => {
        const enabledCheckbox = document.getElementById(day + "Enabled");
        const startTimeInput = document.getElementById(day + "Start");
        const endTimeInput = document.getElementById(day + "End");
        
        if (enabledCheckbox && enabledCheckbox.checked && startTimeInput && endTimeInput) {
            workingDaysCount++;
            
            // Calculate hours for this day
            const startParts = startTimeInput.value.split(":");
            const endParts = endTimeInput.value.split(":");
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            const hoursThisDay = (endMinutes - startMinutes) / 60;
            totalHoursPerWeek += hoursThisDay;
        }
    });
    
    const dailyCapacity = totalHoursPerWeek > 0 ? (totalHoursPerWeek * qaResources / workingDaysCount) : 0;
    const storiesPerDay = avgTestTime > 0 ? (dailyCapacity / avgTestTime) : 0;
    
    summaryDiv.innerHTML = "<div><strong>Working Days per Week:</strong> " + workingDaysCount + "</div>" +
        "<div><strong>Total Hours per Week:</strong> " + totalHoursPerWeek.toFixed(1) + " hours</div>" +
        "<div><strong>Daily Capacity:</strong> " + dailyCapacity.toFixed(1) + " hours</div>" +
        "<div><strong>Stories per Day:</strong> " + storiesPerDay.toFixed(2) + " stories</div>";
}

// Refresh forecast
function refreshForecast() {
    if (!qaConfig) {
        vscode.postMessage({
            command: "showInfoMessage",
            message: "Please configure QA settings first"
        });
        openQAConfigModal();
        return;
    }
    
    calculateAndRenderForecast();
}

// Open User Journey for a specific page (global function)
function openUserJourneyForPage(targetPage, pageRole) {
    console.log('[userStoriesQAView] Opening User Journey for page:', targetPage, 'with role:', pageRole);
    
    // Send command to extension to open Page Flow with User Journey tab
    vscode.postMessage({
        command: 'openUserJourneyForPage',
        targetPage: targetPage,
        pageRole: pageRole
    });
}

// Export forecast data to CSV
function exportForecastData() {
    // Get forecast data
    const forecastResult = calculateQAForecast();
    if (!forecastResult || !forecastResult.items || forecastResult.items.length === 0) {
        vscode.postMessage({
            command: "showInfoMessage",
            message: "No forecast data to export"
        });
        return;
    }
    
    // Convert to CSV
    const csvLines = ["Story Number,Story Name,Test Start,Test End,Duration (hours),Tester"];
    forecastResult.items.forEach(item => {
        const startDate = new Date(item.startDate).toLocaleString();
        const endDate = new Date(item.endDate).toLocaleString();
        const duration = ((item.endDate - item.startDate) / (1000 * 60 * 60)).toFixed(2);
        const storyName = (item.storyName || "").replace(/,/g, ";"); // Escape commas
        csvLines.push(item.storyNumber + "," + storyName + "," + startDate + "," + endDate + "," + duration + ",Tester " + (item.testerIndex + 1));
    });
    
    const csvContent = csvLines.join("\n");
    
    // Send to extension for file save
    vscode.postMessage({
        command: "exportForecastCSV",
        csvContent: csvContent
    });
}

// Calculate QA forecast schedule
function calculateQAForecast() {
    console.log("[calculateQAForecast] Starting calculation", { hasConfig: !!qaConfig, itemsCount: allItems ? allItems.length : 0 });
    
    if (!qaConfig || !allItems) {
        console.log("[calculateQAForecast] Missing config or items");
        return [];
    }
    
    // Get stories that are "ready-to-test"
    // Sort by devCompletedDate (most recent first), then by story number
    const readyToTestStories = allItems.filter(item => 
        item.qaStatus === "ready-to-test" && !item.isIgnored
    ).sort((a, b) => {
        const dateA = a.devCompletedDate || '';
        const dateB = b.devCompletedDate || '';
        
        // Both have dates - sort by date descending (most recent first)
        if (dateA && dateB) {
            return dateB.localeCompare(dateA);
        }
        
        // Only A has date - A comes first
        if (dateA && !dateB) return -1;
        
        // Only B has date - B comes first
        if (!dateA && dateB) return 1;
        
        // Neither has date - sort by story number
        const numA = parseInt(a.storyNumber) || 0;
        const numB = parseInt(b.storyNumber) || 0;
        return numA - numB;
    });
    
    console.log("[calculateQAForecast] Found ready-to-test stories:", readyToTestStories.length);
    
    if (readyToTestStories.length === 0) {
        console.log("[calculateQAForecast] No ready-to-test stories found");
        return [];
    }
    
    const avgTestTime = qaConfig.avgTestTime;
    const qaResources = qaConfig.qaResources;
    const workingHours = qaConfig.workingHours;
    
    console.log("[calculateQAForecast] Using config:", { avgTestTime, qaResources, workingHoursKeys: Object.keys(workingHours) });
    
    // Initialize testers with current date and time
    const testers = [];
    const now = new Date();
    
    for (let i = 0; i < qaResources; i++) {
        testers.push({
            index: i,
            availableAt: new Date(now)
        });
    }
    
    // Schedule each story
    const forecastItems = [];
    
    readyToTestStories.forEach(story => {
        // Find the tester who will be available earliest
        testers.sort((a, b) => a.availableAt - b.availableAt);
        const tester = testers[0];
        
        // Calculate start date (next working time after tester is available)
        let startDate = new Date(tester.availableAt);
        startDate = getNextWorkingTime(startDate, workingHours);
        
        // Calculate end date (add avgTestTime hours of working time)
        const endDate = addWorkingHours(startDate, avgTestTime, workingHours);
        
        // Create forecast item
        forecastItems.push({
            storyNumber: story.storyNumber,
            storyName: story.storyName,
            startDate: startDate,
            endDate: endDate,
            testerIndex: tester.index
        });
        
        // Update tester availability
        tester.availableAt = new Date(endDate);
    });
    
    // Calculate additional metrics for Project Overview
    const totalStories = forecastItems.length;
    const projectedCompletionDate = totalStories > 0 ? forecastItems[forecastItems.length - 1].endDate : null;
    
    // Calculate total hours
    const totalRemainingHours = totalStories * avgTestTime;
    
    // Calculate working days
    const uniqueDates = new Set();
    forecastItems.forEach(item => {
        let currentDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        
        while (currentDate <= endDate) {
            const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][currentDate.getDay()];
            const dayConfig = workingHours[dayName];
            if (dayConfig && dayConfig.enabled) {
                uniqueDates.add(currentDate.toDateString());
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    const totalRemainingDays = uniqueDates.size;
    
    // Calculate costs using defaultQARate
    const defaultQARate = qaConfig.defaultQARate || 50;
    const totalCost = totalRemainingHours * defaultQARate;
    const remainingCost = totalCost; // All work is remaining in QA forecast
    
    // Assess risk level based on various factors
    const riskAssessment = assessQARisk(readyToTestStories, qaResources, avgTestTime, totalRemainingDays);
    
    // Identify bottlenecks
    const bottlenecks = identifyQABottlenecks(readyToTestStories, qaResources, avgTestTime);
    
    // Calculate recommendations
    const recommendations = calculateQARecommendations(readyToTestStories, qaResources, avgTestTime, riskAssessment);
    
    return {
        items: forecastItems,
        projectedCompletionDate,
        totalRemainingHours,
        totalRemainingDays,
        totalStories,
        totalCost,
        remainingCost,
        riskLevel: riskAssessment.level,
        riskScore: riskAssessment.score,
        bottlenecks,
        recommendations
    };
}

// Assess QA risk level
function assessQARisk(stories, resources, avgTestTime, totalDays) {
    let score = 0;
    const reasons = [];
    
    // Factor 1: Number of stories per QA resource
    const storiesPerResource = stories.length / Math.max(1, resources);
    if (storiesPerResource > 10) {
        score += 30;
        reasons.push("High story-to-tester ratio");
    } else if (storiesPerResource > 5) {
        score += 15;
        reasons.push("Moderate story-to-tester ratio");
    }
    
    // Factor 2: Timeline pressure (stories taking more than 2 weeks)
    if (totalDays > 14) {
        score += 20;
        reasons.push("Extended timeline");
    } else if (totalDays > 7) {
        score += 10;
        reasons.push("Moderate timeline");
    }
    
    // Factor 3: Long test times
    if (avgTestTime > 8) {
        score += 20;
        reasons.push("Long average test time");
    } else if (avgTestTime > 4) {
        score += 10;
        reasons.push("Moderate average test time");
    }
    
    // Factor 4: Blocked stories
    const blockedCount = stories.filter(s => s.qaStatus === "blocked").length;
    if (blockedCount > 0) {
        score += Math.min(20, blockedCount * 5);
        reasons.push(`${blockedCount} blocked story(ies)`);
    }
    
    // Determine risk level
    let level = "low";
    if (score >= 50) {
        level = "high";
    } else if (score >= 25) {
        level = "medium";
    }
    
    return {
        level,
        score,
        reasons
    };
}

// Identify QA bottlenecks
function identifyQABottlenecks(stories, resources, avgTestTime) {
    const bottlenecks = [];
    
    // Bottleneck 1: Insufficient QA resources
    if (stories.length > resources * 5) {
        bottlenecks.push({
            type: "resources",
            severity: "high",
            message: `${stories.length} stories for ${resources} QA resource(s) - consider adding more testers`
        });
    } else if (stories.length > resources * 3) {
        bottlenecks.push({
            type: "resources",
            severity: "medium",
            message: `${stories.length} stories for ${resources} QA resource(s) - workload is moderate`
        });
    }
    
    // Bottleneck 2: Long test times
    if (avgTestTime > 8) {
        bottlenecks.push({
            type: "testTime",
            severity: "high",
            message: `Average test time is ${avgTestTime} hours - consider test automation or simplification`
        });
    } else if (avgTestTime > 6) {
        bottlenecks.push({
            type: "testTime",
            severity: "medium",
            message: `Average test time is ${avgTestTime} hours - may benefit from optimization`
        });
    }
    
    // Bottleneck 3: Blocked stories
    const blockedStories = stories.filter(s => s.qaStatus === "blocked");
    if (blockedStories.length > 0) {
        bottlenecks.push({
            type: "blocked",
            severity: "high",
            message: `${blockedStories.length} story(ies) blocked - resolve blockers to improve flow`
        });
    }
    
    return bottlenecks;
}

// Calculate QA recommendations (data function)
function calculateQARecommendations(stories, resources, avgTestTime, riskAssessment) {
    const recommendations = [];
    
    // Recommendation based on risk level
    if (riskAssessment.level === "high") {
        recommendations.push({
            priority: "high",
            message: "Consider adding additional QA resources or extending timeline"
        });
    }
    
    // Recommendation based on story count
    const storiesPerResource = stories.length / Math.max(1, resources);
    if (storiesPerResource > 8) {
        recommendations.push({
            priority: "high",
            message: `Each tester has ${storiesPerResource.toFixed(1)} stories - consider parallel testing or additional resources`
        });
    }
    
    // Recommendation based on test time
    if (avgTestTime > 6) {
        recommendations.push({
            priority: "medium",
            message: "Consider test automation to reduce average test time"
        });
    }
    
    // Recommendation for blocked stories
    const blockedCount = stories.filter(s => s.qaStatus === "blocked").length;
    if (blockedCount > 0) {
        recommendations.push({
            priority: "high",
            message: `Resolve ${blockedCount} blocked story(ies) to maintain testing flow`
        });
    }
    
    // If no specific recommendations, provide general guidance
    if (recommendations.length === 0) {
        recommendations.push({
            priority: "low",
            message: "QA forecast looks healthy - maintain current testing pace"
        });
    }
    
    return recommendations;
}

// Get next working time from a given date
function getNextWorkingTime(date, workingHours) {
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let currentDate = new Date(date);
    let attempts = 0;
    const maxAttempts = 14; // Two weeks of searching
    
    while (attempts < maxAttempts) {
        const dayName = daysOfWeek[currentDate.getDay()];
        const dayConfig = workingHours[dayName];
        
        if (dayConfig && dayConfig.enabled) {
            // Parse start and end times
            const startParts = dayConfig.startTime.split(":");
            const endParts = dayConfig.endTime.split(":");
            
            const startTime = new Date(currentDate);
            startTime.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);
            
            const endTime = new Date(currentDate);
            endTime.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
            
            // If current time is before start time, return start time
            if (currentDate < startTime) {
                return new Date(startTime);
            }
            
            // If current time is within working hours, return current time
            if (currentDate >= startTime && currentDate < endTime) {
                return new Date(currentDate);
            }
            
            // If current time is after end time, move to next day
        }
        
        // Move to start of next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
        attempts++;
    }
    
    // Fallback: return original date if no working time found
    return new Date(date);
}

// Add working hours to a date
function addWorkingHours(startDate, hoursToAdd, workingHours) {
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let currentDate = new Date(startDate);
    let remainingHours = hoursToAdd;
    let attempts = 0;
    const maxAttempts = 365; // One year of searching
    
    while (remainingHours > 0 && attempts < maxAttempts) {
        const dayName = daysOfWeek[currentDate.getDay()];
        const dayConfig = workingHours[dayName];
        
        if (dayConfig && dayConfig.enabled) {
            // Parse start and end times
            const startParts = dayConfig.startTime.split(":");
            const endParts = dayConfig.endTime.split(":");
            
            const startTime = new Date(currentDate);
            startTime.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);
            
            const endTime = new Date(currentDate);
            endTime.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
            
            // Calculate available hours in this day
            let availableStart = currentDate < startTime ? startTime : currentDate;
            let availableHours = (endTime - availableStart) / (1000 * 60 * 60);
            
            if (availableHours > 0) {
                if (remainingHours <= availableHours) {
                    // Can finish within this day
                    currentDate = new Date(availableStart);
                    currentDate.setTime(currentDate.getTime() + remainingHours * 60 * 60 * 1000);
                    return currentDate;
                } else {
                    // Use all available hours and continue to next day
                    remainingHours -= availableHours;
                }
            }
        }
        
        // Move to start of next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
        attempts++;
    }
    
    // Fallback: return calculated date even if not in working hours
    return currentDate;
}

// Calculate and render forecast
function calculateAndRenderForecast() {
    console.log("[calculateAndRenderForecast] Starting render");
    
    const processingOverlay = document.getElementById("forecast-processing");
    const loadingDiv = document.getElementById("gantt-loading");
    const vizDiv = document.getElementById("forecast-gantt");
    const emptyDiv = document.getElementById("forecast-empty-state");
    
    console.log("[calculateAndRenderForecast] Found elements:", { processing: !!processingOverlay, loading: !!loadingDiv, viz: !!vizDiv, empty: !!emptyDiv });
    
    if (!loadingDiv || !vizDiv || !emptyDiv) {
        console.log("[calculateAndRenderForecast] Missing required elements");
        return;
    }
    
    // Show processing overlay
    if (processingOverlay) {
        processingOverlay.classList.add("active");
    }
    
    // Hide other states
    loadingDiv.style.display = "none";
    vizDiv.style.display = "none";
    emptyDiv.style.display = "none";
    
    // Use setTimeout to allow the processing overlay to render before calculation
    setTimeout(() => {
        // Calculate forecast
        const forecastResult = calculateQAForecast();
        
        console.log("[calculateAndRenderForecast] Forecast result calculated:", forecastResult ? forecastResult.items.length : 0, "items");
        
        // Hide processing overlay
        if (processingOverlay) {
            processingOverlay.classList.remove("active");
        }
        
        if (!forecastResult || !forecastResult.items || forecastResult.items.length === 0) {
            console.log("[calculateAndRenderForecast] No forecast data, showing empty state");
            emptyDiv.style.display = "block";
            return;
        }
        
        vizDiv.style.display = "block";
        
        console.log("[calculateAndRenderForecast] Updating Project Overview and rendering Gantt");
        
        // Update Project Overview section
        updateProjectOverview(forecastResult);
        
        // Render Gantt chart
        renderForecastGantt(forecastResult.items);
    }, 50);
}

// Update Project Overview section
function updateProjectOverview(forecastResult) {
    const projectOverviewDiv = document.getElementById("qa-project-overview");
    if (!projectOverviewDiv) {
        console.log("[updateProjectOverview] Project overview div not found");
        return;
    }
    
    const {
        projectedCompletionDate,
        totalRemainingHours,
        totalRemainingDays,
        totalStories,
        totalCost,
        remainingCost,
        riskLevel,
        bottlenecks,
        recommendations
    } = forecastResult;
    
    // Format completion date
    const formattedDate = projectedCompletionDate ? 
        new Date(projectedCompletionDate).toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "short", 
            day: "numeric" 
        }) : "N/A";
    
    // Format currency
    const formatCurrency = (value) => {
        return "$" + value.toLocaleString("en-US", { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
    };
    
    // Determine risk class
    const riskClass = riskLevel === "high" ? "risk-high" : 
                      riskLevel === "medium" ? "risk-medium" : "risk-low";
    
    // Generate Project Overview HTML
    projectOverviewDiv.innerHTML = `
        <div class="forecast-stats-content">
            <h4 class="forecast-stats-title" onclick="toggleQAProjectOverview()" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Project Overview</span>
                <span id="qa-project-overview-toggle-icon" class="codicon codicon-chevron-down"></span>
            </h4>
            
            <div id="qa-project-overview-details" class="project-overview-details">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                    ${generateQAForecastMetric(
                        "calendar",
                        "Projected Completion",
                        formattedDate,
                        riskClass
                    )}
                    
                    ${generateQAForecastMetric(
                        "clock",
                        "Remaining Hours",
                        totalRemainingHours.toFixed(1) + " hrs",
                        ""
                    )}
                    
                    ${generateQAForecastMetric(
                        "calendar",
                        "Remaining Work Days",
                        totalRemainingDays.toFixed(1) + " days",
                        ""
                    )}
                    
                    ${generateQAForecastMetric(
                        "beaker",
                        "Stories to Test",
                        totalStories.toString(),
                        ""
                    )}
                    
                    ${generateQAForecastMetric(
                        "symbol-currency",
                        "Total QA Cost",
                        formatCurrency(totalCost),
                        ""
                    )}
                    
                    ${generateQAForecastMetric(
                        "symbol-currency",
                        "Remaining QA Cost",
                        formatCurrency(remainingCost),
                        remainingCost > totalCost * 0.5 ? "risk-medium" : ""
                    )}
                </div>
                
                ${generateQARiskAssessment(riskLevel, bottlenecks)}
                ${generateQARecommendations(recommendations)}
            </div>
        </div>
    `;
}

// Generate a QA forecast metric card
function generateQAForecastMetric(icon, label, value, riskClass) {
    return `
        <div class="forecast-metric ${riskClass}">
            <div class="forecast-metric-icon">
                <i class="codicon codicon-${icon}"></i>
            </div>
            <div class="forecast-metric-content">
                <div class="forecast-metric-label">${label}</div>
                <div class="forecast-metric-value">${value}</div>
            </div>
        </div>
    `;
}

// Generate QA risk assessment section
function generateQARiskAssessment(riskLevel, bottlenecks) {
    if (!bottlenecks || bottlenecks.length === 0) {
        return "";
    }
    
    const riskClass = riskLevel === "high" ? "risk-high" : 
                      riskLevel === "medium" ? "risk-medium" : "risk-low";
    
    const riskLabel = riskLevel === "high" ? "High Risk" : 
                      riskLevel === "medium" ? "Medium Risk" : "Low Risk";
    
    const bottlenecksList = bottlenecks.map(b => `
        <li class="bottleneck-item ${b.severity}">
            <i class="codicon codicon-warning"></i>
            <span>${b.message}</span>
        </li>
    `).join("");
    
    return `
        <div class="forecast-risk-section ${riskClass}">
            <h5 class="forecast-risk-title">
                <i class="codicon codicon-shield"></i>
                Risk Assessment: <span class="risk-level">${riskLabel}</span>
            </h5>
            <div class="forecast-risk-content">
                <p class="risk-description">Key bottlenecks identified:</p>
                <ul class="bottleneck-list">
                    ${bottlenecksList}
                </ul>
            </div>
        </div>
    `;
}

// Generate QA recommendations section
function generateQARecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
        return "";
    }
    
    const recommendationsList = recommendations.map(r => `
        <li class="recommendation-item priority-${r.priority}">
            <i class="codicon codicon-light-bulb"></i>
            <span>${r.message}</span>
        </li>
    `).join("");
    
    return `
        <div class="forecast-recommendations-section">
            <h5 class="forecast-recommendations-title">
                <i class="codicon codicon-lightbulb"></i>
                Recommendations
            </h5>
            <ul class="recommendations-list">
                ${recommendationsList}
            </ul>
        </div>
    `;
}

// Toggle QA Project Overview visibility
function toggleQAProjectOverview() {
    const detailsDiv = document.getElementById("qa-project-overview-details");
    const toggleIcon = document.getElementById("qa-project-overview-toggle-icon");
    
    if (!detailsDiv || !toggleIcon) return;
    
    if (detailsDiv.style.display === "none") {
        detailsDiv.style.display = "block";
        toggleIcon.className = "codicon codicon-chevron-down";
    } else {
        detailsDiv.style.display = "none";
        toggleIcon.className = "codicon codicon-chevron-right";
    }
}

// Render forecast Gantt chart using D3
function renderForecastGantt(forecastData) {
    // Clear existing chart
    const vizDiv = document.getElementById("forecast-gantt");
    if (!vizDiv) return;
    vizDiv.innerHTML = "";
    
    // Check if non-working hours should be hidden
    const shouldHideNonWorkingHours = qaConfig && qaConfig.hideNonWorkingHours === true;
    console.log('[renderForecastGantt] shouldHideNonWorkingHours:', shouldHideNonWorkingHours);
    
    // Set dimensions
    const margin = { top: 60, right: 40, bottom: 20, left: 100 };
    
    // Calculate time span and dimensions
    const minDate = d3.min(forecastData, d => d.startDate);
    const maxDate = d3.max(forecastData, d => d.endDate);
    
    // Start from beginning of first hour, end at end of last hour
    const startDate = new Date(minDate);
    startDate.setMinutes(0, 0, 0);
    const endDate = new Date(maxDate);
    endDate.setMinutes(59, 59, 999);
    
    // Calculate total hours (will be adjusted after filtering if needed)
    const totalHours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
    
    // Set column width for each hour
    const hourWidth = 30;
    // Width will be recalculated after allHours is determined
    let width = totalHours * hourWidth;
    const height = forecastData.length * 35;
    
    // Create SVG
    const svg = d3.select("#forecast-gantt")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Create scales
    const xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, width]);
    
    const yScale = d3.scaleBand()
        .domain(forecastData.map(d => d.storyNumber))
        .range([0, height])
        .padding(0.15);
    
    // Define color scale for testers
    const colorScale = d3.scaleOrdinal()
        .domain([...new Set(forecastData.map(d => d.testerIndex))])
        .range(d3.schemeCategory10);
    
    // Create array of all hours in range
    const allHoursUnfiltered = [];
    let currentHour = new Date(startDate);
    while (currentHour <= endDate) {
        allHoursUnfiltered.push(new Date(currentHour));
        currentHour = new Date(currentHour.getTime() + 60 * 60 * 1000); // Add 1 hour
    }
    
    // Filter out non-working hours if hideNonWorkingHours is enabled
    const allHours = shouldHideNonWorkingHours 
        ? allHoursUnfiltered.filter(h => {
            // Check if this hour is within working hours based on qaConfig
            const dayOfWeek = h.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];
            
            // Get working hours config for this day
            const dayConfig = qaConfig.workingHours[dayName];
            
            // If day is not enabled, filter it out
            if (!dayConfig || !dayConfig.enabled) {
                return false;
            }
            
            // Check if hour is within the day's working hours
            const hour = h.getHours();
            const startHour = parseInt(dayConfig.startTime.split(':')[0]);
            const endHour = parseInt(dayConfig.endTime.split(':')[0]);
            
            return hour >= startHour && hour < endHour;
        })
        : allHoursUnfiltered;
    
    // Update width based on actual hours to display
    width = allHours.length * hourWidth;
    
    // Create a mapping function to convert date/time to x position
    // This accounts for filtered hours when hideNonWorkingHours is enabled
    const getXPosition = (date) => {
        if (!shouldHideNonWorkingHours) {
            // Use continuous time scale
            return xScale(date);
        } else {
            // Find the nearest hour in the filtered allHours array
            let closestIndex = 0;
            let closestDiff = Math.abs(allHours[0].getTime() - date.getTime());
            
            for (let i = 1; i < allHours.length; i++) {
                const diff = Math.abs(allHours[i].getTime() - date.getTime());
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestIndex = i;
                }
            }
            
            // Calculate fractional position within the hour
            const hourStart = allHours[closestIndex].getTime();
            const hourEnd = hourStart + 60 * 60 * 1000;
            const fraction = (date.getTime() - hourStart) / (hourEnd - hourStart);
            
            return (closestIndex + fraction) * hourWidth;
        }
    };
    
    // Group hours by day for day headers
    const dayGroups = [];
    let currentDayKey = null;
    let dayStart = 0;
    
    allHours.forEach((hour, index) => {
        const dayKey = d3.timeFormat("%Y-%m-%d")(hour);
        if (dayKey !== currentDayKey) {
            if (currentDayKey !== null) {
                dayGroups.push({ 
                    date: new Date(allHours[dayStart]), 
                    start: dayStart, 
                    end: index - 1 
                });
            }
            currentDayKey = dayKey;
            dayStart = index;
        }
    });
    if (currentDayKey !== null) {
        dayGroups.push({ 
            date: new Date(allHours[dayStart]), 
            start: dayStart, 
            end: allHours.length - 1 
        });
    }
    
    // Draw day headers
    dayGroups.forEach(day => {
        const x1 = day.start * hourWidth;
        const x2 = (day.end + 1) * hourWidth;
        
        svg.append("rect")
            .attr("x", x1)
            .attr("y", -50)
            .attr("width", x2 - x1)
            .attr("height", 20)
            .attr("fill", "#f0f0f0")
            .attr("stroke", "#999");
        
        svg.append("text")
            .attr("x", (x1 + x2) / 2)
            .attr("y", -35)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .text(d3.timeFormat("%b %d, %Y")(day.date));
    });
    
    // Draw hour headers (show hour number 0-23)
    svg.selectAll(".hour-header")
        .data(allHours)
        .enter()
        .append("text")
        .attr("class", "hour-header")
        .attr("x", (d, i) => i * hourWidth + hourWidth / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .text(d => d3.timeFormat("%H")(d));
    
    // Draw vertical grid lines for each hour
    svg.selectAll(".hour-line")
        .data(allHours)
        .enter()
        .append("line")
        .attr("class", "hour-line")
        .attr("x1", (d, i) => i * hourWidth)
        .attr("x2", (d, i) => i * hourWidth)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 0.5);
    
    // Highlight non-working hours (based on default 9-5 schedule) - only if not hidden
    // Note: shouldHideNonWorkingHours is already defined at the top of the function
    if (!shouldHideNonWorkingHours) {
        svg.selectAll(".non-working")
            .data(allHours.filter(h => {
                const hour = h.getHours();
                return hour < 9 || hour >= 17;
            }))
            .enter()
            .append("rect")
            .attr("class", "non-working")
            .attr("x", d => {
                const hourIndex = allHours.findIndex(hour => hour.getTime() === d.getTime());
                return hourIndex * hourWidth;
            })
            .attr("y", 0)
            .attr("width", hourWidth)
            .attr("height", height)
            .attr("fill", "#f5f5f5")
            .attr("opacity", 0.5);
    }
    
    // Draw story name labels on Y-axis
    svg.selectAll(".story-label")
        .data(forecastData)
        .enter()
        .append("text")
        .attr("class", "story-label")
        .attr("x", -5)
        .attr("y", d => yScale(d.storyNumber) + yScale.bandwidth() / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "11px")
        .text(d => "Story " + d.storyNumber);
    
    // Add current hour marker
    const now = new Date();
    if (now >= startDate && now <= endDate) {
        const currentHourIndex = allHours.findIndex(h => 
            h.getFullYear() === now.getFullYear() &&
            h.getMonth() === now.getMonth() &&
            h.getDate() === now.getDate() &&
            h.getHours() === now.getHours()
        );
        
        if (currentHourIndex >= 0) {
            svg.append("rect")
                .attr("x", currentHourIndex * hourWidth)
                .attr("y", -50)
                .attr("width", hourWidth)
                .attr("height", height + 50)
                .attr("fill", "orange")
                .attr("opacity", 0.2);
            
            svg.append("line")
                .attr("x1", currentHourIndex * hourWidth)
                .attr("x2", currentHourIndex * hourWidth)
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
        .style("display", "none");
    
    // Add bars for each story
    svg.selectAll(".bar")
        .data(forecastData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => getXPosition(d.startDate))
        .attr("y", d => yScale(d.storyNumber))
        .attr("width", d => Math.max(2, getXPosition(d.endDate) - getXPosition(d.startDate)))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.testerIndex))
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
            
            // Find the full story item to get the story text
            const storyItem = allItems.find(item => item.storyNumber === d.storyNumber);
            const storyText = storyItem ? storyItem.storyText : "No description";
            
            tooltip.style("display", "block")
                .html("<strong>Story " + d.storyNumber + "</strong><br/>" +
                    storyText + "<br/>" +
                    "<strong>Start:</strong> " + startTime + "<br/>" +
                    "<strong>End:</strong> " + endTime + "<br/>" +
                    "<strong>Duration:</strong> " + duration + " hrs<br/>" +
                    "<strong>Tester:</strong> Tester " + (d.testerIndex + 1))
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.85).attr("stroke-width", 0.5);
            tooltip.style("display", "none");
        })
        .on("click", function(event, d) {
            // Find the full story item and open detail modal
            const storyItem = allItems.find(item => item.storyNumber === d.storyNumber);
            if (storyItem) {
                tooltip.style("display", "none");
                openCardModal(storyItem.storyId);
            }
        });
    
    // Add tester avatars/labels on bars (only if bar is wide enough)
    svg.selectAll(".bar-label")
        .data(forecastData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => {
            const barWidth = getXPosition(d.endDate) - getXPosition(d.startDate);
            return barWidth > 15 ? getXPosition(d.startDate) + barWidth / 2 : getXPosition(d.startDate) - 15;
        })
        .attr("y", d => yScale(d.storyNumber) + yScale.bandwidth() / 2)
        .attr("text-anchor", d => {
            const barWidth = getXPosition(d.endDate) - getXPosition(d.startDate);
            return barWidth > 15 ? "middle" : "end";
        })
        .attr("dominant-baseline", "middle")
        .attr("fill", d => {
            const barWidth = xScale(d.endDate) - xScale(d.startDate);
            return barWidth > 15 ? "#fff" : "#666";
        })
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("pointer-events", "none")
        .text(d => "T" + (d.testerIndex + 1));
}

// Initialize tab functionality
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// Switch between tabs
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Handle tab-specific logic
    if (tabName === 'analysis') {
        // Render QA status distribution (bar or pie chart based on current selection)
        console.log('[userStoriesQAView] Analysis tab selected - rendering distribution');
        renderQAStatusDistribution();
    } else if (tabName === 'board') {
        // Render Kanban board
        console.log('[userStoriesQAView] Board tab selected - rendering kanban board');
        renderKanbanBoard();
    } else if (tabName === 'forecast') {
        // Render forecast if config is available
        console.log('[userStoriesQAView] Forecast tab selected - rendering forecast');
        if (qaConfig) {
            calculateAndRenderForecast();
        } else {
            // Request config from extension
            vscode.postMessage({
                command: 'loadQAConfig'
            });
        }
    } else if (tabName === 'details') {
        // Refresh details tab to show latest data
        console.log('[userStoriesQAView] Details tab selected - refreshing table');
        renderTable();
        renderRecordInfo();
    }
}

// Refresh data (global function for onclick)
function refresh() {
    showSpinner();
    vscode.postMessage({
        command: 'refresh'
    });
}

// Toggle board filter section visibility (global function for onclick)
function toggleBoardFilterSection() {
    const filterContent = document.getElementById('boardFilterContent');
    const chevron = document.getElementById('boardFilterChevron');
    
    if (filterContent && chevron) {
        const isCollapsed = filterContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            filterContent.classList.remove('collapsed');
            chevron.classList.remove('codicon-chevron-right');
            chevron.classList.add('codicon-chevron-down');
        } else {
            filterContent.classList.add('collapsed');
            chevron.classList.remove('codicon-chevron-down');
            chevron.classList.add('codicon-chevron-right');
        }
    }
}

// Apply board filters (global function for input events)
function applyBoardFilters() {
    const storyNumberFilter = document.getElementById('boardFilterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('boardFilterStoryText')?.value.toLowerCase() || '';
    
    // Filter is applied during render, so just re-render
    renderKanbanBoard();
}

// Clear board filters (global function for onclick)
function clearBoardFilters() {
    document.getElementById('boardFilterStoryNumber').value = '';
    document.getElementById('boardFilterStoryText').value = '';
    
    // Re-render the board
    renderKanbanBoard();
}

// Render Kanban board
function renderKanbanBoard() {
    console.log('[userStoriesQAView] Rendering Kanban board');
    
    // Apply filters
    const storyNumberFilter = document.getElementById('boardFilterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('boardFilterStoryText')?.value.toLowerCase() || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        
        return matchesStoryNumber && matchesStoryText;
    });
    
    // Group items by status
    const statusGroups = {
        'pending': [],
        'ready-to-test': [],
        'started': [],
        'success': [],
        'failure': []
    };
    
    filteredItems.forEach(item => {
        const status = item.qaStatus || 'pending';
        if (statusGroups[status]) {
            statusGroups[status].push(item);
        }
    });
    
    // Sort items within each status group by devCompletedDate
    // Stories with devCompletedDate appear first, sorted by most recent date first (descending)
    // Stories without devCompletedDate appear after, sorted by story number
    Object.keys(statusGroups).forEach(status => {
        statusGroups[status].sort((a, b) => {
            const dateA = a.devCompletedDate || '';
            const dateB = b.devCompletedDate || '';
            
            // Both have dates - sort by date descending (most recent first)
            if (dateA && dateB) {
                return dateB.localeCompare(dateA); // Descending order
            }
            
            // Only A has date - A comes first
            if (dateA && !dateB) {
                return -1;
            }
            
            // Only B has date - B comes first
            if (!dateA && dateB) {
                return 1;
            }
            
            // Neither has date - sort by story number
            const numA = typeof a.storyNumber === 'number' ? a.storyNumber : parseInt(a.storyNumber) || 0;
            const numB = typeof b.storyNumber === 'number' ? b.storyNumber : parseInt(b.storyNumber) || 0;
            return numA - numB;
        });
    });
    
    // Render each column
    Object.keys(statusGroups).forEach(status => {
        const column = document.getElementById('column-' + status);
        const countElement = document.getElementById('count-' + status);
        
        if (!column || !countElement) {
            return;
        }
        
        const items = statusGroups[status];
        countElement.textContent = items.length;
        
        // Clear column
        column.innerHTML = '';
        
        // Add cards
        items.forEach(item => {
            const card = createKanbanCard(item);
            column.appendChild(card);
        });
    });
    
    console.log('[userStoriesQAView] Kanban board rendered');
}

// Create a Kanban card element
function createKanbanCard(item) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.setAttribute('data-story-id', item.storyId);
    card.setAttribute('data-current-status', item.qaStatus || 'pending');
    
    // Card number
    const cardNumber = document.createElement('div');
    cardNumber.className = 'kanban-card-number';
    cardNumber.textContent = item.storyNumber || '';
    card.appendChild(cardNumber);
    
    // Card text
    const cardText = document.createElement('div');
    cardText.className = 'kanban-card-text';
    cardText.textContent = item.storyText || '';
    cardText.title = item.storyText || ''; // Full text on hover
    card.appendChild(cardText);
    
    // Card footer (optional info)
    const hasNotes = item.qaNotes && item.qaNotes.trim() !== '';
    const hasDate = item.dateVerified && item.dateVerified.trim() !== '';
    
    if (hasNotes || hasDate) {
        const cardFooter = document.createElement('div');
        cardFooter.className = 'kanban-card-footer';
        
        if (hasNotes) {
            const notesIndicator = document.createElement('span');
            notesIndicator.className = 'kanban-card-has-notes';
            notesIndicator.innerHTML = '<i class="codicon codicon-note"></i> Notes';
            notesIndicator.title = item.qaNotes;
            cardFooter.appendChild(notesIndicator);
        }
        
        if (hasDate) {
            const dateIndicator = document.createElement('span');
            dateIndicator.className = 'kanban-card-date';
            dateIndicator.innerHTML = '<i class="codicon codicon-calendar"></i> ' + item.dateVerified;
            cardFooter.appendChild(dateIndicator);
        }
        
        card.appendChild(cardFooter);
    }
    
    // Click event to open modal
    card.addEventListener('click', function(e) {
        // Don't open modal if we're dragging
        if (e.defaultPrevented) {
            return;
        }
        openCardModal(item.storyId);
    });
    
    // Drag event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    return card;
}

// Handle drag start
function handleDragStart(e) {
    const card = e.target;
    card.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.getAttribute('data-story-id'));
    
    console.log('[userStoriesQAView] Drag started for story:', card.getAttribute('data-story-id'));
}

// Handle drag end
function handleDragEnd(e) {
    const card = e.target;
    card.classList.remove('dragging');
    
    // Remove drag-over class from all columns
    document.querySelectorAll('.kanban-column-content').forEach(column => {
        column.classList.remove('drag-over');
    });
}

// Handle drag over (allow drop)
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const column = e.currentTarget;
    column.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(e) {
    const column = e.currentTarget;
    
    // Only remove if we're actually leaving the column (not entering a child element)
    if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
    }
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    
    const column = e.currentTarget;
    column.classList.remove('drag-over');
    
    const storyId = e.dataTransfer.getData('text/plain');
    const newStatus = column.getAttribute('data-status');
    
    if (!storyId || !newStatus) {
        console.error('[userStoriesQAView] Invalid drop: missing storyId or status');
        return;
    }
    
    console.log('[userStoriesQAView] Card dropped - Story:', storyId, 'New Status:', newStatus);
    
    // Find the item and update locally
    const item = allItems.find(i => i.storyId === storyId);
    if (item) {
        const oldStatus = item.qaStatus;
        
        // Don't do anything if status hasn't changed
        if (oldStatus === newStatus) {
            console.log('[userStoriesQAView] Status unchanged, no update needed');
            return;
        }
        
        item.qaStatus = newStatus;
        
        // Set date verified if status is success or failure
        if (newStatus === 'success' || newStatus === 'failure') {
            item.dateVerified = new Date().toISOString().split('T')[0];
        }
        
        // Update in userStoriesQAData as well
        const dataItem = userStoriesQAData.items.find(i => i.storyId === storyId);
        if (dataItem) {
            dataItem.qaStatus = newStatus;
            if (newStatus === 'success' || newStatus === 'failure') {
                dataItem.dateVerified = new Date().toISOString().split('T')[0];
            }
        }
        
        // Re-render the board
        renderKanbanBoard();
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: newStatus,
                qaNotes: item.qaNotes || '',
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
        
        console.log('[userStoriesQAView] Card status updated and saved');
    } else {
        console.error('[userStoriesQAView] Item not found:', storyId);
    }
}

// Toggle select all checkboxes (global function for onclick)
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;
    
    // Update selectedItems set
    selectedItems.clear();
    if (isChecked) {
        userStoriesQAData.items.forEach(item => {
            selectedItems.add(item.storyId);
        });
    }
    
    // Update all row checkboxes
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// Handle individual row checkbox change
function handleRowCheckboxChange(storyId, isChecked) {
    if (isChecked) {
        selectedItems.add(storyId);
    } else {
        selectedItems.delete(storyId);
    }
    
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const totalItems = userStoriesQAData.items.length;
    const selectedCount = selectedItems.size;
    
    if (selectedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedCount === totalItems) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
    
    // Update apply button state
    updateApplyButtonState();
}

// Handle row click to toggle checkbox
function handleRowClick(event, storyId) {
    // Don't toggle if the click was on an interactive element
    const target = event.target;
    if (target.type === 'checkbox' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
    }
    
    // Toggle the checkbox state
    const isCurrentlySelected = selectedItems.has(storyId);
    handleRowCheckboxChange(storyId, !isCurrentlySelected);
    
    // Update the actual checkbox element
    const checkbox = event.currentTarget.querySelector('.row-checkbox');
    if (checkbox) {
        checkbox.checked = !isCurrentlySelected;
    }
}

// Update apply button state based on selections and dropdown value
function updateApplyButtonState() {
    const applyButton = document.getElementById('applyButton');
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    
    if (applyButton && bulkStatusDropdown) {
        const hasSelection = selectedItems.size > 0;
        const hasStatus = bulkStatusDropdown.value !== '';
        applyButton.disabled = !(hasSelection && hasStatus);
    }
}

// Bulk update selected items (global function for onclick)
function bulkUpdateSelected() {
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    const selectedStatus = bulkStatusDropdown.value;
    
    if (selectedItems.size === 0) {
        alert('Please select items to update');
        return;
    }
    
    if (!selectedStatus) {
        alert('Please select a status');
        return;
    }

    console.log(`[Webview] Applying status '${selectedStatus}' to ${selectedItems.size} selected rows`);
    
    // Get first item to find qaFilePath
    const firstItem = userStoriesQAData.items.find(item => selectedItems.has(item.storyId));
    if (!firstItem) {
        return;
    }

    // Update local data immediately for each selected item
    const currentDate = new Date().toISOString().split('T')[0];
    selectedItems.forEach(storyId => {
        // Update in allItems array
        const allItem = allItems.find(item => item.storyId === storyId);
        if (allItem) {
            allItem.qaStatus = selectedStatus;
            if (selectedStatus === 'success' || selectedStatus === 'failure') {
                allItem.dateVerified = currentDate;
            }
        }
        
        // Update in filtered data as well
        const filteredItem = userStoriesQAData.items.find(item => item.storyId === storyId);
        if (filteredItem) {
            filteredItem.qaStatus = selectedStatus;
            if (selectedStatus === 'success' || selectedStatus === 'failure') {
                filteredItem.dateVerified = currentDate;
            }
        }
    });

    // Send bulk update message to save changes
    vscode.postMessage({
        command: 'bulkUpdateQAStatus',
        data: {
            selectedStoryIds: Array.from(selectedItems),
            qaStatus: selectedStatus,
            qaFilePath: firstItem.qaFilePath
        }
    });

    // Reset dropdown and clear selections
    bulkStatusDropdown.value = '';
    selectedItems.clear();
    updateApplyButtonState();
    
    // Re-render the table to show the updated status values immediately
    renderTable();
}

// Export to CSV (global function for onclick)
function exportToCSV() {
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: userStoriesQAData.items
        }
    });
}

// Handle QA status change
function handleQAStatusChange(storyId, newStatus) {
    // Find the item and update locally
    const item = userStoriesQAData.items.find(i => i.storyId === storyId);
    if (item) {
        item.qaStatus = newStatus;
        
        // Set date verified if status is success or failure
        if (newStatus === 'success' || newStatus === 'failure') {
            item.dateVerified = new Date().toISOString().split('T')[0];
            
            // Update the date cell in the current row without re-rendering entire table
            const row = document.querySelector(`#qaTableBody tr[data-story-id="${storyId}"]`);
            if (row) {
                const dateCell = row.querySelector('.date-verified-column');
                if (dateCell) {
                    dateCell.textContent = item.dateVerified;
                }
            }
        }
        
        // Also update in allItems
        const allItem = allItems.find(i => i.storyId === storyId);
        if (allItem) {
            allItem.qaStatus = newStatus;
            if (newStatus === 'success' || newStatus === 'failure') {
                allItem.dateVerified = new Date().toISOString().split('T')[0];
            }
        }
        
        // Don't re-render table - just update the specific cell data
        // The dropdown value is already set by the user interaction
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: newStatus,
                qaNotes: item.qaNotes || '',
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
    }
}

// Handle QA notes change
function handleQANotesChange(storyId, newNotes) {
    // Find the item and update locally
    const item = userStoriesQAData.items.find(i => i.storyId === storyId);
    if (item) {
        item.qaNotes = newNotes;
        
        // Also update in allItems
        const allItem = allItems.find(i => i.storyId === storyId);
        if (allItem) {
            allItem.qaNotes = newNotes;
        }
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: item.qaStatus || 'pending',
                qaNotes: newNotes,
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
    }
}

// Render the table
function renderTable() {
    const table = document.getElementById("qaTable");
    const thead = document.getElementById("qaTableHead");
    const tbody = document.getElementById("qaTableBody");
    
    if (!table || !thead || !tbody) {
        console.error("Table elements not found");
        return;
    }
    
    // Clear existing content
    thead.innerHTML = "";
    tbody.innerHTML = "";
    
    // Define table columns
    const columns = [
        { key: 'select', label: '', sortable: false, className: 'checkbox-column' },
        { key: 'storyNumber', label: 'Story Number', sortable: true, className: 'story-number-column' },
        { key: 'storyText', label: 'Story Text', sortable: true, className: 'story-text-column' },
        { key: 'devCompletedDate', label: 'Development Completed Date', sortable: true, className: 'dev-completed-date-column' },
        { key: 'qaStatus', label: 'Status', sortable: true, className: 'qa-status-column' },
        { key: 'qaNotes', label: 'Notes', sortable: false, className: 'qa-notes-column' },
        { key: 'dateVerified', label: 'Date Verified', sortable: true, className: 'date-verified-column' }
    ];
    
    // Create table header
    const headerRow = document.createElement("tr");
    columns.forEach(column => {
        const th = document.createElement("th");
        th.className = column.className || '';
        
        if (column.key === 'select') {
            // Select all checkbox in header
            const selectAllCheckbox = document.createElement("input");
            selectAllCheckbox.type = "checkbox";
            selectAllCheckbox.id = "selectAllCheckbox";
            selectAllCheckbox.addEventListener("change", toggleSelectAll);
            th.appendChild(selectAllCheckbox);
        } else if (column.sortable) {
            th.style.cursor = "pointer";
            th.classList.add("sortable");
            th.addEventListener("click", () => {
                // Toggle sort order if clicking the same column
                let sortDescending = false;
                if (userStoriesQAData.sortColumn === column.key) {
                    sortDescending = !userStoriesQAData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortUserStoriesQA",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (userStoriesQAData.sortColumn === column.key) {
                th.textContent = column.label + (userStoriesQAData.sortDescending ? " ▼" : " ▲");
            } else {
                th.textContent = column.label;
            }
        } else {
            th.textContent = column.label;
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create table body
    if (userStoriesQAData.items && userStoriesQAData.items.length > 0) {
        userStoriesQAData.items.forEach(item => {
            const row = document.createElement("tr");
            row.setAttribute("data-story-id", item.storyId); // Add story ID to row for easy identification
            
            // Checkbox column
            const checkboxCell = document.createElement("td");
            checkboxCell.className = "checkbox-column";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "row-checkbox";
            checkbox.checked = selectedItems.has(item.storyId);
            checkbox.addEventListener("change", (e) => {
                handleRowCheckboxChange(item.storyId, e.target.checked);
            });
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
            
            // Story Number
            const storyNumberCell = document.createElement("td");
            storyNumberCell.className = "story-number-column";
            storyNumberCell.textContent = item.storyNumber || '';
            row.appendChild(storyNumberCell);
            
            // Story Text
            const storyTextCell = document.createElement("td");
            storyTextCell.className = "story-text-column";
            storyTextCell.textContent = item.storyText || '';
            row.appendChild(storyTextCell);
            
            // Development Completed Date
            const devCompletedDateCell = document.createElement("td");
            devCompletedDateCell.className = "dev-completed-date-column";
            devCompletedDateCell.textContent = item.devCompletedDate || '';
            devCompletedDateCell.style.textAlign = 'center';
            row.appendChild(devCompletedDateCell);
            
            // QA Status
            const qaStatusCell = document.createElement("td");
            qaStatusCell.className = "qa-status-column";
            const qaStatusSelect = document.createElement("select");
            qaStatusSelect.className = "qa-status-select";
            
            const statusOptions = [
                { value: 'pending', text: 'Pending' },
                { value: 'ready-to-test', text: 'Ready to Test' },
                { value: 'started', text: 'Started' },
                { value: 'success', text: 'Success' },
                { value: 'failure', text: 'Failure' }
            ];
            
            statusOptions.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                qaStatusSelect.appendChild(optionElement);
            });
            
            // Set the value AFTER adding options
            qaStatusSelect.value = item.qaStatus || 'pending';
            
            qaStatusSelect.addEventListener("change", (e) => {
                handleQAStatusChange(item.storyId, e.target.value);
            });
            
            qaStatusCell.appendChild(qaStatusSelect);
            row.appendChild(qaStatusCell);
            
            // QA Notes
            const qaNotesCell = document.createElement("td");
            qaNotesCell.className = "qa-notes-column";
            const qaNotesTextArea = document.createElement("textarea");
            qaNotesTextArea.className = "qa-notes-input";
            qaNotesTextArea.value = item.qaNotes || '';
            qaNotesTextArea.placeholder = "Enter QA notes...";
            
            qaNotesTextArea.addEventListener("blur", (e) => {
                handleQANotesChange(item.storyId, e.target.value);
            });
            
            qaNotesCell.appendChild(qaNotesTextArea);
            row.appendChild(qaNotesCell);
            
            // Date Verified
            const dateVerifiedCell = document.createElement("td");
            dateVerifiedCell.className = "date-verified-column";
            dateVerifiedCell.textContent = item.dateVerified || '';
            row.appendChild(dateVerifiedCell);
            
            // Add click event listener to toggle checkbox when row is clicked
            row.style.cursor = "pointer";
            row.addEventListener("click", (e) => {
                handleRowClick(e, item.storyId);
            });
            
            tbody.appendChild(row);
        });
    } else {
        // Show empty state
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = columns.length;
        cell.textContent = "No processed user stories found";
        cell.style.textAlign = "center";
        cell.style.padding = "20px";
        cell.style.fontStyle = "italic";
        cell.style.color = "var(--vscode-descriptionForeground)";
        row.appendChild(cell);
        tbody.appendChild(row);
    }
}

// Render record information
function renderRecordInfo() {
    const recordInfo = document.getElementById("record-info");
    if (recordInfo) {
        const totalCount = userStoriesQAData.totalRecords || 0;
        const filteredCount = userStoriesQAData.items ? userStoriesQAData.items.length : 0;
        const selectedCount = selectedItems.size;
        
        let infoText = '';
        if (filteredCount === totalCount) {
            infoText = `${totalCount} processed stories`;
        } else {
            infoText = `${filteredCount} of ${totalCount} processed stories`;
        }
        
        if (selectedCount > 0) {
            infoText += ` (${selectedCount} selected)`;
        }
        
        recordInfo.textContent = infoText;
    }
}

// Keep track of currently opened card in modal
let currentModalStoryId = null;

// Open card detail modal (global function for onclick)
function openCardModal(storyId) {
    const item = allItems.find(i => i.storyId === storyId);
    if (!item) {
        console.error('[userStoriesQAView] Item not found:', storyId);
        return;
    }
    
    currentModalStoryId = storyId;
    
    // Populate modal fields
    document.getElementById('modalStoryNumber').textContent = item.storyNumber || 'N/A';
    document.getElementById('modalStoryText').textContent = item.storyText || 'N/A';
    document.getElementById('modalQAStatus').value = item.qaStatus || 'pending';
    document.getElementById('modalQANotes').value = item.qaNotes || '';
    document.getElementById('modalDateVerified').textContent = item.dateVerified || 'Not yet verified';
    
    // Populate page mapping list
    const pageListContainer = document.getElementById('modalPageList');
    const noPagesMessage = document.getElementById('modalNoPages');
    
    if (item.mappedPages && item.mappedPages.length > 0) {
        pageListContainer.innerHTML = '';
        pageListContainer.style.display = 'flex';
        noPagesMessage.style.display = 'none';
        
        item.mappedPages.forEach(page => {
            const pageItem = document.createElement('div');
            pageItem.className = 'page-list-item';
            
            const pageName = document.createElement('span');
            pageName.className = 'page-name';
            pageName.textContent = page.name;
            pageItem.appendChild(pageName);
            
            // Add start page badge if applicable
            if (page.isStartPage) {
                const startBadge = document.createElement('span');
                startBadge.className = 'page-badge start-page-badge';
                startBadge.textContent = 'START';
                startBadge.title = 'This is a start page';
                pageItem.appendChild(startBadge);
            }
            
            // Add role badge if applicable
            if (page.roleRequired) {
                const roleBadge = document.createElement('span');
                roleBadge.className = 'page-badge role-badge';
                roleBadge.textContent = page.roleRequired;
                roleBadge.title = 'Role required: ' + page.roleRequired;
                pageItem.appendChild(roleBadge);
            }
            
            // Add journey button to open page flow diagram
            const journeyButton = document.createElement('button');
            journeyButton.className = 'page-action-button';
            journeyButton.title = 'Show User Journey Page Flow Diagram';
            journeyButton.innerHTML = '<span class="codicon codicon-map" style="font-size:14px;"></span>';
            journeyButton.onclick = function(e) {
                e.stopPropagation();
                openUserJourneyForPage(page.name, page.roleRequired);
            };
            pageItem.appendChild(journeyButton);
            
            pageListContainer.appendChild(pageItem);
        });
    } else {
        pageListContainer.style.display = 'none';
        noPagesMessage.style.display = 'block';
    }
    
    // Show modal
    const modal = document.getElementById('cardDetailModal');
    modal.classList.add('active');
    
    // Focus on notes field
    setTimeout(() => {
        document.getElementById('modalQANotes').focus();
    }, 100);
    
    console.log('[userStoriesQAView] Opened modal for story:', storyId);
}

// Close card detail modal (global function for onclick)
function closeCardModal() {
    const modal = document.getElementById('cardDetailModal');
    modal.classList.remove('active');
    currentModalStoryId = null;
    
    console.log('[userStoriesQAView] Closed modal');
}

// Save card detail modal (global function for onclick)
function saveCardModal() {
    if (!currentModalStoryId) {
        console.error('[userStoriesQAView] No story ID for modal save');
        return;
    }
    
    const item = allItems.find(i => i.storyId === currentModalStoryId);
    if (!item) {
        console.error('[userStoriesQAView] Item not found for save:', currentModalStoryId);
        return;
    }
    
    // Get values from modal
    const newStatus = document.getElementById('modalQAStatus').value;
    const newNotes = document.getElementById('modalQANotes').value;
    const oldStatus = item.qaStatus;
    
    // Update item in allItems
    item.qaStatus = newStatus;
    item.qaNotes = newNotes;
    
    // Set date verified if status is success or failure
    if (newStatus === 'success' || newStatus === 'failure') {
        item.dateVerified = new Date().toISOString().split('T')[0];
    }
    
    // Update in userStoriesQAData as well
    const dataItem = userStoriesQAData.items.find(i => i.storyId === currentModalStoryId);
    if (dataItem) {
        dataItem.qaStatus = newStatus;
        dataItem.qaNotes = newNotes;
        if (newStatus === 'success' || newStatus === 'failure') {
            dataItem.dateVerified = new Date().toISOString().split('T')[0];
        }
    }
    
    // Re-render the board (will move card to new column if status changed)
    const boardTab = document.getElementById('board-tab');
    if (boardTab && boardTab.classList.contains('active')) {
        renderKanbanBoard();
    }
    
    // Re-render the forecast (will update based on status changes)
    const forecastTabElem = document.getElementById('forecast-tab');
    if (forecastTabElem && forecastTabElem.classList.contains('active') && qaConfig) {
        calculateAndRenderForecast();
    }
    
    // Save the change
    vscode.postMessage({
        command: 'saveQAChange',
        data: {
            storyId: currentModalStoryId,
            qaStatus: newStatus,
            qaNotes: newNotes,
            dateVerified: item.dateVerified || '',
            qaFilePath: item.qaFilePath
        }
    });
    
    console.log('[userStoriesQAView] Saved modal changes for story:', currentModalStoryId);
    
    // Close modal
    closeCardModal();
}

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'setUserStoriesQAData':
            console.log('Received QA data:', message.data);
            hideSpinner();
            
            if (message.data.error) {
                console.error('Error loading QA data:', message.data.error);
                // Show error state
                userStoriesQAData = {
                    items: [],
                    totalRecords: 0,
                    sortColumn: 'storyNumber',
                    sortDescending: false
                };
                allItems = [];
            } else {
                userStoriesQAData = message.data;
                allItems = message.data.items.slice(); // Create a copy for filtering
                selectedItems.clear(); // Clear selection when new data is loaded
            }
            
            renderTable();
            renderRecordInfo();
            updateApplyButtonState();
            
            // Also update kanban board if it's visible
            const boardTab = document.getElementById('board-tab');
            if (boardTab && boardTab.classList.contains('active')) {
                renderKanbanBoard();
            }
            
            // Also update forecast if it's visible and config is loaded
            const forecastTabElement = document.getElementById('forecast-tab');
            if (forecastTabElement && forecastTabElement.classList.contains('active')) {
                if (qaConfig) {
                    calculateAndRenderForecast();
                } else {
                    // Request config if not loaded yet
                    vscode.postMessage({
                        command: 'loadQAConfig'
                    });
                }
            }
            break;
        
        case 'switchToTab':
            // Switch to the specified tab
            if (message.data && message.data.tabName) {
                console.log('[UserStoriesQAView] Received switchToTab command:', message.data.tabName);
                switchTab(message.data.tabName);
            }
            break;
            
        case 'qaChangeSaved':
            console.log('QA change saved:', message.success);
            if (!message.success) {
                console.error('Error saving QA change:', message.error);
                // Could show a notification here
            }
            break;
            
        case 'csvExportReady':
            console.log('CSV export ready');
            if (message.success !== false) {
                // Send CSV content to extension to save to workspace (same pattern as userStoriesView)
                vscode.postMessage({
                    command: 'saveCsvToWorkspace',
                    data: {
                        content: message.csvContent,
                        filename: message.filename
                    }
                });
            } else {
                console.error('Error exporting CSV:', message.error);
                alert('Error exporting CSV: ' + (message.error || 'Unknown error'));
            }
            break;
        
        case 'qaConfigLoaded':
            console.log('QA config loaded:', message.config);
            // Store config globally
            qaConfig = message.config;
            
            // Populate config modal
            const avgTestTimeInput = document.getElementById('configAvgTestTime');
            const qaResourcesInput = document.getElementById('configQAResources');
            const defaultQARateInput = document.getElementById('configDefaultQARate');
            const hideNonWorkingHoursCheckbox = document.getElementById('configHideNonWorkingHours');
            
            if (avgTestTimeInput && qaConfig) {
                avgTestTimeInput.value = qaConfig.avgTestTime || 4;
            }
            
            if (qaResourcesInput && qaConfig) {
                qaResourcesInput.value = qaConfig.qaResources || 2;
            }
            
            if (defaultQARateInput && qaConfig) {
                defaultQARateInput.value = qaConfig.defaultQARate || 50;
            }
            
            if (hideNonWorkingHoursCheckbox && qaConfig) {
                hideNonWorkingHoursCheckbox.checked = qaConfig.hideNonWorkingHours || false;
            }
            
            // Populate working hours table
            if (qaConfig) {
                populateWorkingHoursTable(qaConfig);
                updateConfigSummary();
            }
            
            // If forecast tab is active, render it
            const forecastTab = document.getElementById('forecast-tab');
            if (forecastTab && forecastTab.classList.contains('active')) {
                calculateAndRenderForecast();
            }
            break;
        
        case 'qaConfigSaved':
            console.log('QA config saved:', message.success);
            if (message.success) {
                // Update global config
                qaConfig = message.config;
                
                // Refresh forecast if visible
                const forecastTab = document.getElementById('forecast-tab');
                if (forecastTab && forecastTab.classList.contains('active')) {
                    calculateAndRenderForecast();
                }
            } else {
                console.error('Error saving QA config:', message.error);
            }
            break;
            
        default:
            console.log('Unknown message:', message);
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('User Stories QA webview loaded');
    
    // Initialize tab functionality
    initializeTabs();
    
    // Setup filter event listeners for auto-apply
    const filterInputs = ['filterStoryNumber', 'filterStoryText', 'filterQAStatus'];
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Setup bulk actions event listeners
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    const applyButton = document.getElementById('applyButton');
    const exportButton = document.getElementById('exportButton');
    const refreshButton = document.getElementById('refreshButton');
    
    if (bulkStatusDropdown) {
        bulkStatusDropdown.addEventListener('change', () => {
            const hasSelection = selectedItems.size > 0;
            const hasStatus = bulkStatusDropdown.value !== '';
            applyButton.disabled = !(hasSelection && hasStatus);
        });
    }
    
    if (applyButton) {
        applyButton.addEventListener('click', bulkUpdateSelected);
    }
    
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
        // Apply same styling as refresh button
        exportButton.style.background = "none";
        exportButton.style.border = "none";
        exportButton.style.color = "var(--vscode-editor-foreground)";
        exportButton.style.padding = "4px 8px";
        exportButton.style.cursor = "pointer";
        exportButton.style.display = "flex";
        exportButton.style.alignItems = "center";
        exportButton.style.borderRadius = "4px";
        exportButton.style.transition = "background 0.15s";
        // Add hover effect
        exportButton.addEventListener("mouseenter", function() {
            exportButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        exportButton.addEventListener("mouseleave", function() {
            exportButton.style.background = "none";
        });
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', refresh);
        // Setup refresh button icon (following roleRequirementsView pattern exactly)
        refreshButton.innerHTML = '<span class="codicon codicon-refresh" style="font-size:16px;"></span>';
        refreshButton.title = "Refresh";
        refreshButton.style.background = "none";
        refreshButton.style.border = "none";
        refreshButton.style.color = "var(--vscode-editor-foreground)";
        refreshButton.style.padding = "4px 8px";
        refreshButton.style.cursor = "pointer";
        refreshButton.style.display = "flex";
        refreshButton.style.alignItems = "center";
        refreshButton.style.borderRadius = "4px";
        refreshButton.style.transition = "background 0.15s";
        
        // Add hover effect
        refreshButton.addEventListener("mouseenter", function() {
            refreshButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        refreshButton.addEventListener("mouseleave", function() {
            refreshButton.style.background = "none";
        });
    }
    
    // Setup chart type toggle buttons
    const chartTypeBarBtn = document.getElementById('chartTypeBar');
    const chartTypePieBtn = document.getElementById('chartTypePie');
    
    if (chartTypeBarBtn && chartTypePieBtn) {
        chartTypeBarBtn.addEventListener('click', function() {
            if (currentChartType !== 'bar') {
                console.log('[userStoriesQAView] Switching to bar chart');
                currentChartType = 'bar';
                chartTypeBarBtn.classList.add('active');
                chartTypePieBtn.classList.remove('active');
                renderQAStatusDistribution();
            }
        });
        
        chartTypePieBtn.addEventListener('click', function() {
            if (currentChartType !== 'pie') {
                console.log('[userStoriesQAView] Switching to pie chart');
                currentChartType = 'pie';
                chartTypePieBtn.classList.add('active');
                chartTypeBarBtn.classList.remove('active');
                renderQAStatusDistribution();
            }
        });
    }
    
    // Setup histogram refresh button
    const refreshQADistributionButton = document.getElementById('refreshQADistributionButton');
    if (refreshQADistributionButton) {
        refreshQADistributionButton.addEventListener('click', function() {
            console.log('[userStoriesQAView] Refreshing QA distribution');
            
            // Show processing overlay
            const processingOverlay = document.getElementById('qa-distribution-processing');
            if (processingOverlay) {
                processingOverlay.classList.add('active');
            }
            
            // Use setTimeout to allow overlay to show before rendering
            setTimeout(function() {
                renderQAStatusDistribution();
                
                // Hide processing overlay after render
                if (processingOverlay) {
                    processingOverlay.classList.remove('active');
                }
            }, 50);
        });
    }
    
    // Setup PNG generation button
    const generateQADistributionPngBtn = document.getElementById('generateQADistributionPngBtn');
    if (generateQADistributionPngBtn) {
        generateQADistributionPngBtn.addEventListener('click', function() {
            console.log('[userStoriesQAView] Generate PNG button clicked');
            generateQADistributionPNG();
        });
    }
    
    // Setup board filter event listeners
    const boardFilterInputs = ['boardFilterStoryNumber', 'boardFilterStoryText'];
    boardFilterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyBoardFilters);
            element.addEventListener('change', applyBoardFilters);
        }
    });
    
    // Setup board action buttons
    const boardExportButton = document.getElementById('boardExportButton');
    const boardRefreshButton = document.getElementById('boardRefreshButton');
    
    if (boardExportButton) {
        boardExportButton.addEventListener('click', exportToCSV);
        // Apply icon button styling
        boardExportButton.style.background = "none";
        boardExportButton.style.border = "none";
        boardExportButton.style.color = "var(--vscode-editor-foreground)";
        boardExportButton.style.padding = "4px 8px";
        boardExportButton.style.cursor = "pointer";
        boardExportButton.style.display = "flex";
        boardExportButton.style.alignItems = "center";
        boardExportButton.style.borderRadius = "4px";
        boardExportButton.style.transition = "background 0.15s";
        boardExportButton.addEventListener("mouseenter", function() {
            boardExportButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        boardExportButton.addEventListener("mouseleave", function() {
            boardExportButton.style.background = "none";
        });
    }
    
    if (boardRefreshButton) {
        boardRefreshButton.addEventListener('click', refresh);
        // Apply icon button styling
        boardRefreshButton.style.background = "none";
        boardRefreshButton.style.border = "none";
        boardRefreshButton.style.color = "var(--vscode-editor-foreground)";
        boardRefreshButton.style.padding = "4px 8px";
        boardRefreshButton.style.cursor = "pointer";
        boardRefreshButton.style.display = "flex";
        boardRefreshButton.style.alignItems = "center";
        boardRefreshButton.style.borderRadius = "4px";
        boardRefreshButton.style.transition = "background 0.15s";
        boardRefreshButton.addEventListener("mouseenter", function() {
            boardRefreshButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        boardRefreshButton.addEventListener("mouseleave", function() {
            boardRefreshButton.style.background = "none";
        });
    }
    
    // Setup drag and drop for kanban columns
    const kanbanColumns = document.querySelectorAll('.kanban-column-content');
    kanbanColumns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
    
    // Check if analysis tab is active on initial load and render distribution
    const analysisTab = document.getElementById('analysis-tab');
    if (analysisTab && analysisTab.classList.contains('active')) {
        console.log('[userStoriesQAView] Analysis tab is active on initial load - rendering distribution');
        setTimeout(function() {
            renderQAStatusDistribution();
        }, 100);
    }
    
    // Check if board tab is active on initial load and render kanban
    const boardTab = document.getElementById('board-tab');
    if (boardTab && boardTab.classList.contains('active')) {
        console.log('[userStoriesQAView] Board tab is active on initial load - rendering kanban board');
        setTimeout(function() {
            renderKanbanBoard();
        }, 100);
    }
    
    // Setup forecast action buttons
    const forecastConfigButton = document.getElementById('configForecastButton');
    const forecastRefreshButton = document.getElementById('forecastRefreshButton');
    const forecastExportButton = document.getElementById('forecastExportButton');
    
    if (forecastConfigButton) {
        forecastConfigButton.addEventListener('click', openQAConfigModal);
        // Apply icon button styling
        forecastConfigButton.style.background = "none";
        forecastConfigButton.style.border = "none";
        forecastConfigButton.style.color = "var(--vscode-editor-foreground)";
        forecastConfigButton.style.padding = "4px 8px";
        forecastConfigButton.style.cursor = "pointer";
        forecastConfigButton.style.display = "flex";
        forecastConfigButton.style.alignItems = "center";
        forecastConfigButton.style.borderRadius = "4px";
        forecastConfigButton.style.transition = "background 0.15s";
        forecastConfigButton.addEventListener("mouseenter", function() {
            forecastConfigButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        forecastConfigButton.addEventListener("mouseleave", function() {
            forecastConfigButton.style.background = "none";
        });
    }
    
    if (forecastRefreshButton) {
        forecastRefreshButton.addEventListener('click', refreshForecast);
        // Apply icon button styling
        forecastRefreshButton.style.background = "none";
        forecastRefreshButton.style.border = "none";
        forecastRefreshButton.style.color = "var(--vscode-editor-foreground)";
        forecastRefreshButton.style.padding = "4px 8px";
        forecastRefreshButton.style.cursor = "pointer";
        forecastRefreshButton.style.display = "flex";
        forecastRefreshButton.style.alignItems = "center";
        forecastRefreshButton.style.borderRadius = "4px";
        forecastRefreshButton.style.transition = "background 0.15s";
        forecastRefreshButton.addEventListener("mouseenter", function() {
            forecastRefreshButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        forecastRefreshButton.addEventListener("mouseleave", function() {
            forecastRefreshButton.style.background = "none";
        });
    }
    
    if (forecastExportButton) {
        forecastExportButton.addEventListener('click', exportForecastData);
        // Apply icon button styling
        forecastExportButton.style.background = "none";
        forecastExportButton.style.border = "none";
        forecastExportButton.style.color = "var(--vscode-editor-foreground)";
        forecastExportButton.style.padding = "4px 8px";
        forecastExportButton.style.cursor = "pointer";
        forecastExportButton.style.display = "flex";
        forecastExportButton.style.alignItems = "center";
        forecastExportButton.style.borderRadius = "4px";
        forecastExportButton.style.transition = "background 0.15s";
        forecastExportButton.addEventListener("mouseenter", function() {
            forecastExportButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        forecastExportButton.addEventListener("mouseleave", function() {
            forecastExportButton.style.background = "none";
        });
    }
    
    // Setup QA config modal event listeners
    const qaConfigCancelButton = document.getElementById('qaConfigCancelButton');
    const qaConfigSaveButton = document.getElementById('qaConfigSaveButton');
    const avgTestTimeInput = document.getElementById('configAvgTestTime');
    const qaResourcesInput = document.getElementById('configQAResources');
    
    if (qaConfigCancelButton) {
        qaConfigCancelButton.addEventListener('click', closeQAConfigModal);
    }
    
    if (qaConfigSaveButton) {
        qaConfigSaveButton.addEventListener('click', saveQAConfigModal);
    }
    
    if (avgTestTimeInput) {
        avgTestTimeInput.addEventListener('input', updateConfigSummary);
    }
    
    if (qaResourcesInput) {
        qaResourcesInput.addEventListener('input', updateConfigSummary);
    }
    
    // Setup config modal close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const configModal = document.getElementById('qaConfigModal');
            if (configModal && configModal.classList.contains('active')) {
                closeQAConfigModal();
            }
        }
    });
    
    // Setup config modal close on overlay click
    const qaConfigModal = document.getElementById('qaConfigModal');
    if (qaConfigModal) {
        qaConfigModal.addEventListener('click', function(e) {
            // Only close if clicking the overlay itself, not the modal content
            if (e.target === qaConfigModal) {
                closeQAConfigModal();
            }
        });
    }
    
    // Setup modal close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('cardDetailModal');
            if (modal && modal.classList.contains('active')) {
                closeCardModal();
            }
        }
    });
    
    // Setup modal close on overlay click
    const modalOverlay = document.getElementById('cardDetailModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            // Only close if clicking the overlay itself, not the modal content
            if (e.target === modalOverlay) {
                closeCardModal();
            }
        });
    }
    
    // Send ready message to extension
    vscode.postMessage({
        command: 'UserStoriesQAWebviewReady'
    });
});
