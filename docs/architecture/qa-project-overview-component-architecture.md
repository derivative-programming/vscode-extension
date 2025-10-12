# QA Project Overview - Component Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Action                                   │
│  (Opens Forecast Tab / Clicks Refresh / Updates Config)        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          calculateAndRenderForecast()                            │
│  Coordinates the entire forecast rendering pipeline              │
└────────────────┬──────────────────┬─────────────────────────────┘
                 │                  │
                 ▼                  ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│ calculateQAForecast()    │  │ DOM Element References         │
│                          │  │ - forecast-processing          │
│ Returns Extended Object: │  │ - gantt-loading                │
│ {                        │  │ - forecast-gantt               │
│   items: [...],          │  │ - forecast-empty-state         │
│   projectedCompletion,   │  │ - qa-project-overview         │
│   totalHours,            │  └────────────────────────────────┘
│   totalDays,             │
│   totalStories,          │
│   totalCost,             │
│   remainingCost,         │
│   riskLevel,             │
│   riskScore,             │
│   bottlenecks,           │
│   recommendations        │
│ }                        │
└────────┬─────────────────┘
         │
         │ Calls 3 sub-functions:
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│ assessQARisk()           │      │ identifyQABottlenecks()  │
│                          │      │                          │
│ Input:                   │      │ Input:                   │
│ - stories                │      │ - stories                │
│ - resources              │      │ - resources              │
│ - avgTestTime            │      │ - avgTestTime            │
│ - totalDays              │      │                          │
│                          │      │ Output:                  │
│ Output:                  │      │ - bottlenecks[] array    │
│ - level: "low|med|high"  │      │   {type, severity, msg}  │
│ - score: 0-100           │      │                          │
│ - reasons[]              │      │ Types:                   │
│                          │      │ - resources              │
│ Risk Factors:            │      │ - testTime               │
│ - Story/tester ratio     │      │ - blocked                │
│ - Timeline pressure      │      └──────────────────────────┘
│ - Long test times        │                  │
│ - Blocked stories        │                  │
└──────────────────────────┘                  │
         │                                    │
         │                                    ▼
         │               ┌────────────────────────────────────┐
         │               │ generateQARecommendations()        │
         │               │                                    │
         │               │ Input:                             │
         │               │ - stories                          │
         │               │ - resources                        │
         │               │ - avgTestTime                      │
         │               │ - riskAssessment                   │
         │               │                                    │
         │               │ Output:                            │
         │               │ - recommendations[] array          │
         │               │   {priority, message}              │
         │               │                                    │
         │               │ Priorities:                        │
         └───────────────┤ - high (risk mitigation)           │
                         │ - medium (optimization)            │
                         │ - low (general guidance)           │
                         └────────────────────────────────────┘
                                        │
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             │                                                      │
             ▼                                                      ▼
┌──────────────────────────────┐                   ┌──────────────────────────────┐
│ updateProjectOverview()      │                   │ updateForecastSummary()      │
│                              │                   │ (Legacy Summary Stats)       │
│ Renders Project Overview:    │                   │                              │
│ - formatCurrency()           │                   │ Updates:                     │
│ - generateQAForecastMetric() │                   │ - forecast-total-stories     │
│ - generateQARiskAssessment() │                   │ - forecast-daily-capacity    │
│ - generateQARecommendations()│                   │ - forecast-completion-date   │
│                              │                   │ - forecast-working-days      │
│ Updates DOM:                 │                   └──────────────────────────────┘
│ - qa-project-overview        │
└──────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Rendered Project Overview                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Project Overview ▼                            [Toggle] │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  ┌─────────────┬──────────────┬──────────────┐        │    │
│  │  │ 📅 Date     │ 🕒 Hours     │ 📅 Days      │        │    │
│  │  │ Projected   │ Remaining    │ Remaining    │        │    │
│  │  ├─────────────┼──────────────┼──────────────┤        │    │
│  │  │ 🧪 Stories  │ 💲 Total     │ 💲 Remaining │        │    │
│  │  │ to Test     │ QA Cost      │ QA Cost      │        │    │
│  │  └─────────────┴──────────────┴──────────────┘        │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │ ⚠️ Risk Assessment: [Level]              │         │    │
│  │  │ Key bottlenecks identified:              │         │    │
│  │  │  • Bottleneck 1                          │         │    │
│  │  │  • Bottleneck 2                          │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │ 💡 Recommendations                       │         │    │
│  │  │  • Recommendation 1                      │         │    │
│  │  │  • Recommendation 2                      │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 renderForecastGantt()                            │
│                 (D3.js Gantt Chart)                              │
└─────────────────────────────────────────────────────────────────┘
```

## Function Dependencies

### HTML Generation Functions

```
updateProjectOverview()
├── formatCurrency() [inline]
├── generateQAForecastMetric()
│   └── Returns HTML for individual metric card
├── generateQARiskAssessment()
│   └── Returns HTML for risk section with bottlenecks list
└── generateQARecommendations()
    └── Returns HTML for recommendations section
```

### Calculation Functions

```
calculateQAForecast()
├── [Existing] getNextWorkingTime()
├── [Existing] addWorkingHours()
├── [NEW] assessQARisk()
│   ├── Calculates story/tester ratio
│   ├── Evaluates timeline pressure
│   ├── Checks test time duration
│   └── Counts blocked stories
├── [NEW] identifyQABottlenecks()
│   ├── Resource constraints check
│   ├── Test time analysis
│   └── Blocker detection
└── [NEW] generateQARecommendations()
    ├── Risk-based recommendations
    ├── Workload suggestions
    └── Optimization opportunities
```

## Component Interaction Flow

```
User Opens Forecast Tab
        │
        ▼
Extension loads HTML
        │
        ▼
Webview loads JavaScript
        │
        ▼
Request QA data
        │
        ▼
Extension sends:
├── allItems (user stories)
├── qaConfig (configuration)
└── devData (for devCompletedDate)
        │
        ▼
calculateAndRenderForecast() triggered
        │
        ├─► calculateQAForecast()
        │   ├─► assessQARisk()
        │   ├─► identifyQABottlenecks()
        │   └─► generateQARecommendations()
        │
        ├─► updateProjectOverview()
        │   ├─► generateQAForecastMetric() (×6)
        │   ├─► generateQARiskAssessment()
        │   └─► generateQARecommendations()
        │
        ├─► updateForecastSummary()
        │
        └─► renderForecastGantt()
```

## Configuration Dependencies

```
qaConfig (from app-dna-user-story-qa-config.json)
├── avgTestTime ────────────► Risk assessment
├── qaResources ────────────► Bottleneck detection
├── defaultQARate ──────────► Cost calculations
└── workingHours ───────────► Day calculations
    ├── monday
    ├── tuesday
    ├── wednesday
    ├── thursday
    ├── friday
    ├── saturday
    └── sunday
        ├── enabled (boolean)
        ├── startTime (HH:MM)
        └── endTime (HH:MM)
```

## CSS Class Hierarchy

```
.qa-project-overview
└── .forecast-stats-content
    ├── .forecast-stats-title
    │   └── .codicon (chevron)
    │
    └── .project-overview-details
        ├── [Metrics Grid]
        │   └── .forecast-metric
        │       ├── .forecast-metric-icon
        │       │   └── .codicon
        │       └── .forecast-metric-content
        │           ├── .forecast-metric-label
        │           └── .forecast-metric-value
        │
        ├── [Risk Section]
        │   └── .forecast-risk-section
        │       ├── .forecast-risk-title
        │       │   ├── .codicon
        │       │   └── .risk-level
        │       └── .forecast-risk-content
        │           ├── .risk-description
        │           └── .bottleneck-list
        │               └── .bottleneck-item
        │                   ├── .codicon
        │                   └── [text]
        │
        └── [Recommendations Section]
            └── .forecast-recommendations-section
                ├── .forecast-recommendations-title
                │   └── .codicon
                └── .recommendations-list
                    └── .recommendation-item
                        ├── .codicon
                        └── [text]
```

## Risk Calculation Algorithm

```
Initial Score = 0

Factor 1: Story/Tester Ratio
├── IF stories/testers > 10  → +30 points
├── ELSE IF > 5              → +15 points
└── ELSE                     → +0 points

Factor 2: Timeline Pressure
├── IF totalDays > 14        → +20 points
├── ELSE IF > 7              → +10 points
└── ELSE                     → +0 points

Factor 3: Test Time
├── IF avgTestTime > 8       → +20 points
├── ELSE IF > 4              → +10 points
└── ELSE                     → +0 points

Factor 4: Blocked Stories
└── FOR EACH blocked story   → +5 points (max +20)

Final Score = Sum of all factors (0-100)

Risk Level Determination:
├── IF score >= 50           → "high"
├── ELSE IF score >= 25      → "medium"
└── ELSE                     → "low"
```

## Event Handlers

```
User Interactions
├── Click "Project Overview" title
│   └── toggleQAProjectOverview()
│       ├── Toggle display: none ↔ block
│       └── Rotate icon: chevron-down ↔ chevron-right
│
├── Click "Refresh Forecast"
│   └── calculateAndRenderForecast()
│       └── (Full pipeline shown above)
│
├── Click "Configure Forecast"
│   └── showQAConfigModal()
│       └── User changes avgTestTime, qaResources, defaultQARate
│           └── On Save → calculateAndRenderForecast()
│
└── Click "Export CSV"
    └── exportForecastData()
        └── Uses forecastResult.items (not full object)
```

## File Structure

```
Extension
├── Backend (TypeScript)
│   └── src/commands/userStoriesQACommands.ts
│       ├── HTML structure
│       │   └── <div id="qa-project-overview">
│       └── CSS styles (inline)
│           ├── .qa-project-overview
│           ├── .forecast-stats-content
│           ├── .forecast-metric (+ variants)
│           ├── .forecast-risk-section (+ variants)
│           └── .forecast-recommendations-section
│
└── Frontend (JavaScript)
    └── src/webviews/userStoriesQAView.js
        ├── Data Functions
        │   ├── calculateQAForecast()
        │   ├── assessQARisk()
        │   ├── identifyQABottlenecks()
        │   └── generateQARecommendations()
        │
        ├── Rendering Functions
        │   ├── calculateAndRenderForecast()
        │   ├── updateProjectOverview()
        │   ├── generateQAForecastMetric()
        │   ├── generateQARiskAssessment()
        │   └── generateQARecommendations()
        │
        └── UI Functions
            ├── toggleQAProjectOverview()
            ├── updateForecastSummary()
            └── renderForecastGantt()
```

## Key Design Patterns

1. **Single Responsibility**: Each function has one clear purpose
2. **Separation of Concerns**: Calculation ≠ Rendering ≠ UI Interaction
3. **Template Generation**: HTML built with string concatenation for simplicity
4. **Risk Scoring**: Additive algorithm easy to understand and modify
5. **Extensibility**: Easy to add new metrics, risk factors, or recommendations
6. **Progressive Enhancement**: Works with existing forecast, adds value on top
