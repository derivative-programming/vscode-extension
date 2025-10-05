/**
 * Forecast Functions
 * Calculates project timeline forecasts and completion predictions
 * Last Modified: October 5, 2025
 */

/**
 * Calculate development forecast for all remaining stories
 * @param {Array} items - All user story items
 * @param {Object} config - Forecast configuration
 * @returns {Object} Forecast data including completion date, hours, risk level
 */
function calculateDevelopmentForecast(items, config) {
    if (!items || items.length === 0) {
        return null;
    }
    
    // Extract forecast config from the full config object
    const forecastConfig = (config && config.forecastConfig) ? config.forecastConfig : getDefaultForecastConfig();
    
    // Get completed and incomplete stories
    const completedStories = items.filter(item => item.status === "Done");
    const incompleteStories = items.filter(item => item.status !== "Done");
    
    if (completedStories.length === 0) {
        return null; // Need velocity data
    }
    
    // Calculate average velocity (pass the full config which contains sprints)
    const averageVelocity = forecastConfig.velocityOverride || calculateAverageVelocity(items, config);
    
    // Calculate remaining work
    const totalRemainingPoints = incompleteStories.reduce((sum, item) => {
        const points = parseInt(item.storyPoints) || 0;
        return sum + points;
    }, 0);
    
    const totalRemainingHours = totalRemainingPoints * forecastConfig.hoursPerPoint;
    
    // Calculate working days needed
    const hoursPerDay = forecastConfig.workingHoursPerDay * forecastConfig.parallelWorkFactor;
    const totalRemainingDays = totalRemainingHours / hoursPerDay;
    
    // Project completion date
    const today = new Date();
    const projectedCompletionDate = calculateCompletionDate(
        today,
        totalRemainingDays,
        forecastConfig
    );
    
    // Calculate risk level
    const riskAssessment = assessProjectRisk(items, forecastConfig, averageVelocity);
    
    // Identify bottlenecks
    const bottlenecks = identifyBottlenecks(items, forecastConfig);
    
    // Generate recommendations
    const recommendations = generateRecommendations(items, forecastConfig, riskAssessment);
    
    return {
        projectedCompletionDate,
        totalRemainingHours,
        totalRemainingDays,
        totalRemainingPoints,
        averageVelocity,
        riskLevel: riskAssessment.level,
        riskScore: riskAssessment.score,
        bottlenecks,
        recommendations,
        storySchedules: calculateStorySchedules(incompleteStories, forecastConfig, today)
    };
}

/**
 * Calculate average velocity from completed sprints
 * @param {Array} items - All user story items
 * @param {Object} config - Configuration with sprint data
 * @returns {number} Average velocity in story points per sprint
 */
function calculateAverageVelocity(items, config) {
    if (!config || !config.sprints || config.sprints.length === 0) {
        // Fallback: calculate from completed stories
        const completedStories = items.filter(item => item.status === "Done");
        if (completedStories.length === 0) {
            return 0;
        }
        const totalPoints = completedStories.reduce((sum, item) => sum + (parseInt(item.storyPoints) || 0), 0);
        return totalPoints / Math.max(1, completedStories.length) * 5; // Assume 5 stories per sprint
    }
    
    // Calculate velocity from completed sprints
    const completedSprints = config.sprints.filter(s => s.status === "completed");
    if (completedSprints.length === 0) {
        return 0;
    }
    
    const velocities = completedSprints.map(sprint => {
        const sprintStories = items.filter(item => 
            item.assignedSprint === sprint.sprintId && item.status === "Done"
        );
        return sprintStories.reduce((sum, item) => sum + (parseInt(item.storyPoints) || 0), 0);
    });
    
    const totalVelocity = velocities.reduce((sum, v) => sum + v, 0);
    return totalVelocity / completedSprints.length;
}

/**
 * Calculate completion date accounting for working days and holidays
 * @param {Date} startDate - Start date for calculation
 * @param {number} workingDays - Number of working days needed
 * @param {Object} config - Forecast configuration
 * @returns {Date} Projected completion date
 */
function calculateCompletionDate(startDate, workingDays, config) {
    const date = new Date(startDate);
    let daysRemaining = Math.ceil(workingDays);
    const holidays = new Set((config.holidays || []).map(h => new Date(h).toDateString()));
    
    while (daysRemaining > 0) {
        date.setDate(date.getDate() + 1);
        
        // Skip weekends if configured
        if (config.excludeWeekends !== false) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue; // Skip Sunday (0) and Saturday (6)
            }
        }
        
        // Skip holidays
        if (holidays.has(date.toDateString())) {
            continue;
        }
        
        daysRemaining--;
    }
    
    return date;
}

/**
 * Calculate individual story schedules
 * @param {Array} stories - Incomplete stories to schedule
 * @param {Object} config - Forecast configuration
 * @param {Date} startDate - Start date for scheduling
 * @returns {Array} Array of story schedules with start/end dates
 */
function calculateStorySchedules(stories, config, startDate) {
    const schedules = [];
    let currentDate = new Date(startDate);
    
    // Sort stories by priority and dependencies
    const sortedStories = sortStoriesForScheduling(stories);
    
    for (const story of sortedStories) {
        const storyPoints = parseInt(story.storyPoints) || 1;
        const hoursNeeded = storyPoints * config.hoursPerPoint;
        const daysNeeded = hoursNeeded / (config.workingHoursPerDay * config.parallelWorkFactor);
        
        const storyStartDate = new Date(currentDate);
        const storyEndDate = calculateCompletionDate(storyStartDate, daysNeeded, config);
        
        schedules.push({
            storyId: story.storyNumber || story.id,
            storyText: story.story,
            priority: story.priority,
            status: story.status,
            storyPoints,
            hoursNeeded,
            daysNeeded,
            startDate: storyStartDate,
            endDate: storyEndDate,
            developer: story.developer || "Unassigned",
            dependencies: story.dependencies || []
        });
        
        currentDate = new Date(storyEndDate);
    }
    
    return schedules;
}

/**
 * Sort stories for scheduling based on priority and dependencies
 * @param {Array} stories - Stories to sort
 * @returns {Array} Sorted stories
 */
function sortStoriesForScheduling(stories) {
    const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
    
    return stories.slice().sort((a, b) => {
        // First by status (blocked stories last)
        if (a.status === "Blocked" && b.status !== "Blocked") {
            return 1;
        }
        if (b.status === "Blocked" && a.status !== "Blocked") {
            return -1;
        }
        
        // Then by priority
        const aPriority = priorityOrder[a.priority] ?? 4;
        const bPriority = priorityOrder[b.priority] ?? 4;
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // Then by story points (smaller first for quick wins)
        const aPoints = parseInt(a.storyPoints) || 0;
        const bPoints = parseInt(b.storyPoints) || 0;
        return aPoints - bPoints;
    });
}

/**
 * Assess project risk based on various factors
 * @param {Array} items - All user story items
 * @param {Object} config - Forecast configuration
 * @param {number} averageVelocity - Average velocity
 * @returns {Object} Risk assessment with level and score
 */
function assessProjectRisk(items, config, averageVelocity) {
    let riskScore = 0;
    const factors = [];
    
    // Factor 1: Low velocity
    if (averageVelocity < 10) {
        riskScore += 30;
        factors.push("Low team velocity");
    }
    
    // Factor 2: Blocked stories
    const blockedStories = items.filter(item => item.status === "Blocked");
    if (blockedStories.length > 0) {
        const blockedPercentage = (blockedStories.length / items.length) * 100;
        riskScore += Math.min(25, blockedPercentage);
        factors.push(`${blockedStories.length} blocked stories`);
    }
    
    // Factor 3: Large unestimated stories
    const unestimatedStories = items.filter(item => 
        item.status !== "Done" && (!item.storyPoints || item.storyPoints === "?")
    );
    if (unestimatedStories.length > 0) {
        riskScore += 20;
        factors.push(`${unestimatedStories.length} unestimated stories`);
    }
    
    // Factor 4: High concentration of critical/high priority
    const highPriorityIncomplete = items.filter(item => 
        item.status !== "Done" && (item.priority === "Critical" || item.priority === "High")
    );
    const incompleteCount = items.filter(item => item.status !== "Done").length;
    if (incompleteCount > 0) {
        const highPriorityPercentage = (highPriorityIncomplete.length / incompleteCount) * 100;
        if (highPriorityPercentage > 50) {
            riskScore += 15;
            factors.push("High concentration of high-priority work");
        }
    }
    
    // Factor 5: Velocity variance
    if (config.sprints && config.sprints.length >= 3) {
        const velocities = calculateSprintVelocities(items, config);
        const variance = calculateVariance(velocities);
        if (variance > 20) {
            riskScore += 10;
            factors.push("High velocity variance");
        }
    }
    
    // Determine risk level
    let level = "low";
    if (riskScore >= 60) {
        level = "high";
    } else if (riskScore >= 30) {
        level = "medium";
    }
    
    return { level, score: riskScore, factors };
}

/**
 * Calculate sprint velocities
 * @param {Array} items - All items
 * @param {Object} config - Configuration with sprints
 * @returns {Array} Velocities per sprint
 */
function calculateSprintVelocities(items, config) {
    return config.sprints.map(sprint => {
        const sprintStories = items.filter(item => 
            item.assignedSprint === sprint.sprintId && item.status === "Done"
        );
        return sprintStories.reduce((sum, item) => sum + (parseInt(item.storyPoints) || 0), 0);
    });
}

/**
 * Calculate variance of an array
 * @param {Array} values - Numeric values
 * @returns {number} Variance
 */
function calculateVariance(values) {
    if (values.length === 0) {
        return 0;
    }
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squareDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Identify bottlenecks in the project
 * @param {Array} items - All user story items
 * @param {Object} config - Forecast configuration
 * @returns {Array} List of bottleneck descriptions
 */
function identifyBottlenecks(items, config) {
    const bottlenecks = [];
    
    // Blocked stories
    const blockedStories = items.filter(item => item.status === "Blocked");
    if (blockedStories.length > 0) {
        bottlenecks.push(`${blockedStories.length} blocked stories preventing progress`);
    }
    
    // Developer overload
    const developerWorkload = {};
    items.filter(item => item.status !== "Done").forEach(item => {
        const dev = item.developer || "Unassigned";
        if (!developerWorkload[dev]) {
            developerWorkload[dev] = { count: 0, points: 0 };
        }
        developerWorkload[dev].count++;
        developerWorkload[dev].points += parseInt(item.storyPoints) || 0;
    });
    
    Object.entries(developerWorkload).forEach(([dev, load]) => {
        if (load.points > 40) {
            bottlenecks.push(`${dev} has ${load.points} story points (${load.count} stories) assigned`);
        }
    });
    
    // Unassigned high-priority work
    const unassignedCritical = items.filter(item => 
        item.status !== "Done" && 
        item.priority === "Critical" && 
        (!item.developer || item.developer === "Unassigned")
    );
    if (unassignedCritical.length > 0) {
        bottlenecks.push(`${unassignedCritical.length} critical stories unassigned`);
    }
    
    return bottlenecks;
}

/**
 * Generate recommendations based on project state
 * @param {Array} items - All user story items
 * @param {Object} config - Forecast configuration
 * @param {Object} riskAssessment - Risk assessment data
 * @returns {Array} List of recommendations
 */
function generateRecommendations(items, config, riskAssessment) {
    const recommendations = [];
    
    // Address blocked stories
    const blockedStories = items.filter(item => item.status === "Blocked");
    if (blockedStories.length > 0) {
        recommendations.push("Prioritize unblocking blocked stories to improve flow");
    }
    
    // Estimate unestimated stories
    const unestimatedStories = items.filter(item => 
        item.status !== "Done" && (!item.storyPoints || item.storyPoints === "?")
    );
    if (unestimatedStories.length > 0) {
        recommendations.push(`Estimate ${unestimatedStories.length} unestimated stories for better forecasting`);
    }
    
    // Balance developer workload
    const developerCounts = {};
    items.filter(item => item.status !== "Done").forEach(item => {
        const dev = item.developer || "Unassigned";
        developerCounts[dev] = (developerCounts[dev] || 0) + 1;
    });
    
    const maxWorkload = Math.max(...Object.values(developerCounts));
    const minWorkload = Math.min(...Object.values(developerCounts));
    if (maxWorkload - minWorkload > 5) {
        recommendations.push("Consider rebalancing work across team members");
    }
    
    // High risk mitigation
    if (riskAssessment.level === "high") {
        recommendations.push("High risk detected - consider reducing scope or extending timeline");
    }
    
    // Low velocity
    const avgVelocity = calculateAverageVelocity(items, config);
    if (avgVelocity < 10) {
        recommendations.push("Low velocity - review team capacity and remove impediments");
    }
    
    return recommendations;
}
