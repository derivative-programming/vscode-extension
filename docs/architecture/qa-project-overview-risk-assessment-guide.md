# QA Project Overview - Risk Assessment Quick Reference

## Risk Score Calculation

The risk assessment algorithm evaluates four factors and assigns a cumulative score from 0 to 100.

### Factor 1: Story-to-Tester Ratio (0-30 points)

Measures workload distribution across QA resources.

| Condition | Score | Interpretation |
|-----------|-------|----------------|
| > 10 stories per tester | +30 | Severe overload, urgent resource needs |
| 6-10 stories per tester | +15 | Moderate overload, resource optimization needed |
| ≤ 5 stories per tester | +0 | Healthy workload distribution |

**Example Calculations**:
- 20 stories, 2 testers: 10 stories/tester → +30 points
- 12 stories, 2 testers: 6 stories/tester → +15 points
- 8 stories, 2 testers: 4 stories/tester → +0 points

### Factor 2: Timeline Pressure (0-20 points)

Evaluates project duration and urgency.

| Condition | Score | Interpretation |
|-----------|-------|----------------|
| > 14 working days | +20 | Extended timeline increases coordination risk |
| 8-14 working days | +10 | Moderate timeline, manageable |
| ≤ 7 working days | +0 | Short timeline, low risk |

**Rationale**: Longer projects have higher risk due to:
- More dependencies
- Greater chance of scope changes
- Increased coordination needs
- Higher probability of resource availability issues

### Factor 3: Average Test Time (0-20 points)

Assesses complexity and efficiency of testing process.

| Condition | Score | Interpretation |
|-----------|-------|----------------|
| > 8 hours per story | +20 | Very complex tests, automation candidate |
| 5-8 hours per story | +10 | Moderately complex, optimization opportunity |
| ≤ 4 hours per story | +0 | Efficient testing process |

**Implications**:
- Long test times indicate:
  - Complex feature testing
  - Manual testing burden
  - Lack of test automation
  - Opportunity for process improvement

### Factor 4: Blocked Stories (0-20 points)

Counts stories with blockers or dependencies.

| Condition | Score | Interpretation |
|-----------|-------|----------------|
| 4+ blocked stories | +20 (capped) | Critical blocking issues |
| 1-3 blocked stories | +5 per story | Moderate blocking issues |
| 0 blocked stories | +0 | No blockers, clear path |

**Note**: Score is capped at +20 regardless of number of blocked stories.

## Risk Level Determination

Final risk level is determined by total score:

| Total Score | Risk Level | Border Color | Recommended Actions |
|-------------|------------|--------------|---------------------|
| 50-100 | 🔴 High | Red | Immediate intervention required |
| 25-49 | 🟡 Medium | Yellow | Optimization and monitoring |
| 0-24 | 🟢 Low | Green | Continue current approach |

## Example Scenarios

### Scenario 1: Healthy Project (Low Risk)

**Configuration**:
- Stories to test: 8
- QA resources: 2
- Avg test time: 4 hours
- Working days: 5
- Blocked stories: 0

**Calculation**:
- Story/tester ratio: 8/2 = 4 → +0 points
- Timeline: 5 days → +0 points
- Test time: 4 hours → +0 points
- Blocked: 0 → +0 points

**Total Score**: 0 points  
**Risk Level**: 🟢 Low  
**Recommendation**: "QA forecast looks healthy - maintain current testing pace"

---

### Scenario 2: Moderate Workload (Medium Risk)

**Configuration**:
- Stories to test: 15
- QA resources: 2
- Avg test time: 6 hours
- Working days: 10
- Blocked stories: 1

**Calculation**:
- Story/tester ratio: 15/2 = 7.5 → +15 points
- Timeline: 10 days → +10 points
- Test time: 6 hours → +10 points
- Blocked: 1 → +5 points

**Total Score**: 40 points  
**Risk Level**: 🟡 Medium  
**Recommendations**:
- "Each tester has 7.5 stories - consider parallel testing"
- "Consider test automation to reduce average test time"
- "Resolve 1 blocked story to maintain testing flow"

---

### Scenario 3: Resource Constrained (High Risk)

**Configuration**:
- Stories to test: 40
- QA resources: 2
- Avg test time: 8 hours
- Working days: 35
- Blocked stories: 3

**Calculation**:
- Story/tester ratio: 40/2 = 20 → +30 points
- Timeline: 35 days → +20 points
- Test time: 8 hours → +20 points
- Blocked: 3 → +15 points

**Total Score**: 85 points  
**Risk Level**: 🔴 High  
**Recommendations**:
- "Consider adding additional QA resources or extending timeline" (HIGH)
- "Each tester has 20.0 stories - consider parallel testing or additional resources" (HIGH)
- "Consider test automation to reduce average test time" (MEDIUM)
- "Resolve 3 blocked stories to maintain testing flow" (HIGH)

---

### Scenario 4: Long Test Times (High Risk)

**Configuration**:
- Stories to test: 10
- QA resources: 1
- Avg test time: 10 hours
- Working days: 18
- Blocked stories: 0

**Calculation**:
- Story/tester ratio: 10/1 = 10 → +30 points
- Timeline: 18 days → +20 points
- Test time: 10 hours → +20 points
- Blocked: 0 → +0 points

**Total Score**: 70 points  
**Risk Level**: 🔴 High  
**Recommendations**:
- "Consider adding additional QA resources or extending timeline" (HIGH)
- "Each tester has 10.0 stories - consider parallel testing" (HIGH)
- "Consider test automation to reduce average test time" (MEDIUM)

---

## Bottleneck Identification

Bottlenecks are identified separately from risk scoring and provide specific areas for improvement:

### Bottleneck Type 1: Resource Constraints

| Stories/Tester | Severity | Message Template |
|----------------|----------|------------------|
| > 5 | High | "{X} stories for {Y} QA resource(s) - consider adding more testers" |
| 3-5 | Medium | "{X} stories for {Y} QA resource(s) - workload is moderate" |
| < 3 | None | No bottleneck identified |

### Bottleneck Type 2: Test Time Duration

| Avg Test Time | Severity | Message Template |
|---------------|----------|------------------|
| > 8 hours | High | "Average test time is {X} hours - consider test automation or simplification" |
| 6-8 hours | Medium | "Average test time is {X} hours - may benefit from optimization" |
| < 6 hours | None | No bottleneck identified |

### Bottleneck Type 3: Blocked Stories

| Blocked Count | Severity | Message Template |
|---------------|----------|------------------|
| ≥ 1 | High | "{X} story(ies) blocked - resolve blockers to improve flow" |
| 0 | None | No bottleneck identified |

## Tuning the Algorithm

If you need to adjust risk sensitivity, modify these values in `assessQARisk()`:

```javascript
// Story/tester thresholds
if (storiesPerResource > 10) {  // Change 10 to adjust high threshold
    score += 30;                 // Change 30 to adjust weight
} else if (storiesPerResource > 5) {  // Change 5 to adjust medium threshold
    score += 15;                 // Change 15 to adjust weight
}

// Timeline thresholds
if (totalDays > 14) {           // Change 14 to adjust high threshold
    score += 20;                 // Change 20 to adjust weight
} else if (totalDays > 7) {     // Change 7 to adjust medium threshold
    score += 10;                 // Change 10 to adjust weight
}

// Test time thresholds
if (avgTestTime > 8) {          // Change 8 to adjust high threshold
    score += 20;                 // Change 20 to adjust weight
} else if (avgTestTime > 4) {   // Change 4 to adjust medium threshold
    score += 10;                 // Change 10 to adjust weight
}

// Risk level thresholds
if (score >= 50) {              // Change 50 to adjust high risk threshold
    level = "high";
} else if (score >= 25) {       // Change 25 to adjust medium risk threshold
    level = "medium";
}
```

## Integration with Metrics

Risk level affects the visual display:

| Risk Level | Projected Completion Border | Remaining Cost Indicator |
|------------|----------------------------|--------------------------|
| High | Red border | Yellow if > 50% of total |
| Medium | Yellow border | Yellow if > 50% of total |
| Low | Green border | Normal (no color) |

## Future Enhancements

Potential additions to risk algorithm:

1. **Historical Performance**: Compare to past QA cycles
2. **Test Automation Coverage**: Lower risk with higher automation
3. **Defect Density**: Stories with known bugs increase risk
4. **Dependency Complexity**: Inter-story dependencies
5. **Tester Experience Level**: Senior vs. junior resource mix
6. **Retest Rate**: Stories requiring multiple test passes
7. **Environment Stability**: Test environment availability
8. **Time of Year**: Holiday periods, fiscal year end

## References

- Implementation: `src/webviews/userStoriesQAView.js:assessQARisk()`
- Documentation: `docs/architecture/qa-view-project-overview-implementation.md`
- Component Architecture: `docs/architecture/qa-project-overview-component-architecture.md`
