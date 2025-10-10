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
    
    // Dev statuses to include in forecast (not yet completed)
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];
    
    // Get completed and incomplete stories (use devStatus field)
    const completedStories = items.filter(item => item.devStatus === "completed");
    const incompleteStories = items.filter(item => forecastableStatuses.includes(item.devStatus));
    
    if (incompleteStories.length === 0) {
        return null; // No stories to forecast
    }
    
    // Calculate average velocity (pass the full config which contains sprints)
    // If no completed stories, use a default velocity or velocity override
    let averageVelocity = forecastConfig.velocityOverride;
    if (!averageVelocity) {
        averageVelocity = calculateAverageVelocity(items, config);
        // If still no velocity (no completed stories), use default of 10 points per sprint
        if (averageVelocity === 0) {
            averageVelocity = 10;
        }
    }
    
    // Calculate remaining work
    const totalRemainingPoints = incompleteStories.reduce((sum, item) => {
        const points = parseInt(item.storyPoints) || 0;
        return sum + points;
    }, 0);
    
    // Calculate story schedules first (uses accurate hour-by-hour calculation)
    const today = new Date();
    const storySchedules = calculateStorySchedules(incompleteStories, forecastConfig, today);
    
    // Calculate accurate remaining hours and days from actual story schedules
    let totalRemainingHours;
    let totalRemainingDays;
    let projectedCompletionDate;
    
    if (storySchedules && storySchedules.length > 0) {
        // Sum actual hours needed from all story schedules (most accurate)
        totalRemainingHours = storySchedules.reduce((sum, schedule) => {
            return sum + schedule.hoursNeeded;
        }, 0);
        
        // Calculate actual working days from today to completion date
        // This accounts for per-day working hours, weekends, holidays
        projectedCompletionDate = storySchedules.reduce((latest, schedule) => {
            return schedule.endDate > latest ? schedule.endDate : latest;
        }, storySchedules[0].endDate);
        
        // Calculate working days between now and completion
        totalRemainingDays = calculateWorkingDaysBetween(today, projectedCompletionDate, forecastConfig);
        
    } else {
        // Fallback to legacy calculation if schedules can't be generated
        totalRemainingHours = totalRemainingPoints * forecastConfig.hoursPerPoint;
        const hoursPerDay = forecastConfig.workingHoursPerDay * forecastConfig.parallelWorkFactor;
        totalRemainingDays = totalRemainingHours / hoursPerDay;
        projectedCompletionDate = calculateCompletionDate(
            today,
            totalRemainingDays,
            forecastConfig
        );
    }
    
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
        storySchedules: storySchedules
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
        // Fallback: calculate from completed stories (use devStatus field)
        const completedStories = items.filter(item => item.devStatus === "completed");
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
            item.assignedSprint === sprint.sprintId && item.devStatus === "completed"
        );
        return sprintStories.reduce((sum, item) => sum + (parseInt(item.storyPoints) || 0), 0);
    });
    
    const totalVelocity = velocities.reduce((sum, v) => sum + v, 0);
    return totalVelocity / completedSprints.length;
}

/**
 * Calculate working days between two dates accounting for working hours, weekends, and holidays
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} config - Forecast configuration
 * @returns {number} Number of working days (can be fractional)
 */
function calculateWorkingDaysBetween(startDate, endDate, config) {
    if (!startDate || !endDate) {
        return 0;
    }
    
    // Get working hours helper if available
    const hasWorkingHoursHelper = typeof getWorkingHoursForDay === 'function';
    
    let workingDays = 0;
    const currentDate = new Date(startDate);
    const holidays = new Set((config.holidays || []).map(h => new Date(h).toDateString()));
    
    // Iterate day by day
    while (currentDate < endDate) {
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toDateString();
        
        // Skip holidays
        if (!holidays.has(dateString)) {
            if (hasWorkingHoursHelper) {
                // Use per-day working hours configuration
                const workingHours = getWorkingHoursForDay(config, dayOfWeek);
                if (workingHours && workingHours.enabled && workingHours.hours > 0) {
                    // Check if this is the last day (partial day)
                    const tomorrow = new Date(currentDate);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    
                    if (endDate < tomorrow) {
                        // Partial day - calculate fraction based on hours worked
                        const hoursWorked = (endDate - currentDate) / (1000 * 60 * 60);
                        const fractionOfDay = Math.min(hoursWorked / workingHours.hours, 1);
                        workingDays += fractionOfDay;
                    } else {
                        // Full working day
                        workingDays += 1;
                    }
                }
            } else {
                // Fallback: Use legacy excludeWeekends logic
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                if (config.excludeWeekends !== false && isWeekend) {
                    // Skip weekend
                } else {
                    workingDays += 1;
                }
            }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
    }
    
    return workingDays;
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
 * Calculate individual story schedules with hourly precision
 * @param {Array} stories - Incomplete stories to schedule
 * @param {Object} config - Forecast configuration
 * @param {Date} startDate - Start date for scheduling
 * @returns {Array} Array of story schedules with start/end dates
 */
function calculateStorySchedules(stories, config, startDate) {
    const schedules = [];
    let currentDate = new Date(startDate);
    
    // Ensure we start at next working hour (9am-5pm, Mon-Fri)
    currentDate = getNextWorkingHour(currentDate, config);
    
    // Sort stories by priority and dependencies
    const sortedStories = sortStoriesForScheduling(stories);
    
    for (const story of sortedStories) {
        const storyPoints = parseInt(story.storyPoints) || 1;
        const hoursNeeded = storyPoints * config.hoursPerPoint;
        const daysNeeded = hoursNeeded / (config.workingHoursPerDay * config.parallelWorkFactor);
        
        const storyStartDate = new Date(currentDate);
        const storyEndDate = calculateCompletionDateByHours(storyStartDate, hoursNeeded, config);
        
        schedules.push({
            storyId: story.storyId,
            storyNumber: story.storyNumber || story.id,
            storyText: story.storyText || story.story || '',
            priority: story.priority,
            devStatus: story.devStatus,
            storyPoints,
            hoursNeeded,
            daysNeeded,
            startDate: storyStartDate,
            endDate: storyEndDate,
            developer: story.assignedTo || story.developer || "Unassigned",
            dependencies: story.dependencies || []
        });
        
        currentDate = new Date(storyEndDate);
        // Move to next working hour after this story ends
        currentDate = getNextWorkingHour(currentDate, config);
    }
    
    return schedules;
}

/**
 * Get next working hour using configurable working hours
 * @param {Date} date - Starting date
 * @param {Object} config - Forecast configuration
 * @returns {Date} Next working hour
 */
function getNextWorkingHour(date, config) {
    // Use helper function from workingHoursHelper.js if available
    if (typeof getNextWorkingDateTime === 'function') {
        return getNextWorkingDateTime(date, config);
    }
    
    // Fallback to legacy 9am-5pm, Mon-Fri logic
    const result = new Date(date);
    
    // Skip weekends
    while (result.getDay() === 0 || result.getDay() === 6) {
        result.setDate(result.getDate() + 1);
        result.setHours(9, 0, 0, 0);
    }
    
    // If before 9am, set to 9am
    if (result.getHours() < 9) {
        result.setHours(9, 0, 0, 0);
    }
    // If after 5pm, move to 9am next day
    else if (result.getHours() >= 17) {
        result.setDate(result.getDate() + 1);
        result.setHours(9, 0, 0, 0);
        // Check if next day is weekend
        return getNextWorkingHour(result, config);
    }
    
    return result;
}

/**
 * Calculate completion date by adding working hours using configurable schedule
 * @param {Date} startDate - Start date
 * @param {number} hoursNeeded - Number of working hours needed
 * @param {Object} config - Forecast configuration
 * @returns {Date} Completion date
 */
function calculateCompletionDateByHours(startDate, hoursNeeded, config) {
    let currentDate = new Date(startDate);
    let hoursRemaining = hoursNeeded;
    let iterations = 0;
    const maxIterations = hoursNeeded * 24 * 2; // Safety limit
    
    while (hoursRemaining > 0 && iterations < maxIterations) {
        iterations++;
        
        // Check if current date/time is within working hours
        const dayOfWeek = currentDate.getDay();
        
        // Get working hours for this day using helper
        let workingHours;
        if (typeof getWorkingHoursForDay === 'function') {
            workingHours = getWorkingHoursForDay(config, dayOfWeek);
        } else {
            // Fallback: legacy 9am-5pm, Mon-Fri
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            workingHours = {
                enabled: !isWeekend,
                startHour: 9,
                endHour: 17,
                startTime: { hour: 9, minute: 0 },
                endTime: { hour: 17, minute: 0 }
            };
        }
        
        // Skip non-working days
        if (!workingHours.enabled) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0, 0, 0, 0);
            continue;
        }
        
        const currentHour = currentDate.getHours() + (currentDate.getMinutes() / 60);
        
        // If before working hours, jump to start time
        if (currentHour < workingHours.startHour) {
            currentDate.setHours(workingHours.startTime.hour, workingHours.startTime.minute, 0, 0);
            continue;
        }
        
        // If after working hours, jump to next day's start time
        if (currentHour >= workingHours.endHour) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0, 0, 0, 0);
            continue;
        }
        
        // We're in working hours, consume one hour
        hoursRemaining -= 1;
        currentDate.setHours(currentDate.getHours() + 1);
    }
    
    return currentDate;
}

/**
 * Sort stories for scheduling based on priority and dependencies
 * @param {Array} stories - Stories to sort
 * @returns {Array} Sorted stories
 */
function sortStoriesForScheduling(stories) {
    // Priority order (case-insensitive)
    const priorityOrder = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3
    };
    
    return stories.slice().sort((a, b) => {
        // First by devStatus (blocked stories last)
        if (a.devStatus === "blocked" && b.devStatus !== "blocked") {
            return 1;
        }
        if (b.devStatus === "blocked" && a.devStatus !== "blocked") {
            return -1;
        }
        
        // Then by priority (case-insensitive, undefined/empty goes last)
        const aPriorityKey = a.priority ? a.priority.toLowerCase() : null;
        const bPriorityKey = b.priority ? b.priority.toLowerCase() : null;
        
        const aPriority = aPriorityKey && priorityOrder[aPriorityKey] !== undefined 
            ? priorityOrder[aPriorityKey] 
            : 999; // Stories with no priority go last
        const bPriority = bPriorityKey && priorityOrder[bPriorityKey] !== undefined 
            ? priorityOrder[bPriorityKey] 
            : 999; // Stories with no priority go last
        
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // Then by story points (smaller first for quick wins)
        // Handle '?' and empty values - treat as very large (go last)
        const aPoints = (a.storyPoints && a.storyPoints !== '?') 
            ? parseInt(a.storyPoints) 
            : 999; // Stories with no points go last
        const bPoints = (b.storyPoints && b.storyPoints !== '?') 
            ? parseInt(b.storyPoints) 
            : 999; // Stories with no points go last
        
        if (aPoints !== bPoints) {
            return aPoints - bPoints;
        }
        
        // Finally, sort by story number for consistency
        const aNumber = parseInt(a.storyNumber) || 0;
        const bNumber = parseInt(b.storyNumber) || 0;
        return aNumber - bNumber;
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
    
    // Factor 2: Blocked stories (use devStatus field)
    const blockedStories = items.filter(item => item.devStatus === "blocked");
    if (blockedStories.length > 0) {
        const blockedPercentage = (blockedStories.length / items.length) * 100;
        riskScore += Math.min(25, blockedPercentage);
        factors.push(`${blockedStories.length} blocked stories`);
    }
    
    // Factor 3: Large unestimated stories (use devStatus field)
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];
    const unestimatedStories = items.filter(item => 
        forecastableStatuses.includes(item.devStatus) && (!item.storyPoints || item.storyPoints === "?")
    );
    if (unestimatedStories.length > 0) {
        riskScore += 20;
        factors.push(`${unestimatedStories.length} unestimated stories`);
    }
    
    // Factor 4: High concentration of critical/high priority (use devStatus field)
    const highPriorityIncomplete = items.filter(item => 
        forecastableStatuses.includes(item.devStatus) && (item.priority === "Critical" || item.priority === "High")
    );
    const incompleteCount = items.filter(item => forecastableStatuses.includes(item.devStatus)).length;
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
            item.assignedSprint === sprint.sprintId && item.devStatus === "completed"
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
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];
    
    // Blocked stories (use devStatus field)
    const blockedStories = items.filter(item => item.devStatus === "blocked");
    if (blockedStories.length > 0) {
        bottlenecks.push(`${blockedStories.length} blocked stories preventing progress`);
    }
    
    // Developer overload (use devStatus field)
    const developerWorkload = {};
    items.filter(item => forecastableStatuses.includes(item.devStatus)).forEach(item => {
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
    
    // Unassigned high-priority work (use devStatus field)
    const unassignedCritical = items.filter(item => 
        forecastableStatuses.includes(item.devStatus) && 
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
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];
    
    // Address blocked stories (use devStatus field)
    const blockedStories = items.filter(item => item.devStatus === "blocked");
    if (blockedStories.length > 0) {
        recommendations.push("Prioritize unblocking blocked stories to improve flow");
    }
    
    // Estimate unestimated stories (use devStatus field)
    const unestimatedStories = items.filter(item => 
        forecastableStatuses.includes(item.devStatus) && (!item.storyPoints || item.storyPoints === "?")
    );
    if (unestimatedStories.length > 0) {
        recommendations.push(`Estimate ${unestimatedStories.length} unestimated stories for better forecasting`);
    }
    
    // Balance developer workload (use devStatus field)
    const developerCounts = {};
    items.filter(item => forecastableStatuses.includes(item.devStatus)).forEach(item => {
        const dev = item.developer || "Unassigned";
        developerCounts[dev] = (developerCounts[dev] || 0) + 1;
    });
    
    const workloadValues = Object.values(developerCounts);
    if (workloadValues.length > 1) {
        const maxWorkload = Math.max(...workloadValues);
        const minWorkload = Math.min(...workloadValues);
        if (maxWorkload - minWorkload > 5) {
            recommendations.push("Consider rebalancing work across team members");
        }
    }
    
    // High risk mitigation
    if (riskAssessment && riskAssessment.level === "high") {
        recommendations.push("High risk detected - consider reducing scope or extending timeline");
    }
    
    // Low velocity
    const avgVelocity = calculateAverageVelocity(items, config);
    if (avgVelocity < 10) {
        recommendations.push("Low velocity - review team capacity and remove impediments");
    }
    
    return recommendations;
}
