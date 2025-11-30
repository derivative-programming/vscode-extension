# Route Verification: mcpBridge.ts vs routeRegistry.ts

## Date: November 30, 2025

## Summary

Verified all routes in `mcpBridge.ts` against `routeRegistry.ts`. 

**Status: ✅ COMPLETE - All routes now registered**

## Previously Missing Routes (NOW ADDED)

### Model Services - Additional Routes (5 routes added)
These routes were missing but have now been added to both files:

| Method | Path | Line in mcpBridge.ts | Status |
|--------|------|---------------------|--------|
| GET/POST | `/api/model-services/prep-request-details` | 6357 | ✅ Added |
| POST | `/api/model-services/merge-ai-processing-results` | 6825 | ✅ Added |
| GET | `/api/model-services/validation-request-details` | 7034 | ✅ Added |
| GET | `/api/model-services/fabrication-request-details` | 7118 | ✅ Added |
| GET | `/api/model-services/template-sets` | 7276 | ✅ Added |

## Routes Present in Both Files ✓

### User Stories (3 routes)
- ✓ GET `/api/user-stories` (line 67)
- ✓ POST `/api/user-stories` (line 5478)
- ✓ POST `/api/user-stories/update` (line 5581)

### Model & General (4 routes)
- ✓ GET `/api/model` (line 732)
- ✓ GET `/api/objects` (line 76)
- ✓ GET `/api/roles` (line 739)
- ✓ GET `/api/health` (line 5687)

### Data Object Usage (2 routes)
- ✓ GET `/api/data-object-usage` (line 770)
- ✓ GET `/api/data-object-usage/:name` (line 787)

### Data Objects (8 routes)
- ✓ GET `/api/data-objects` (line 85)
- ✓ GET `/api/data-objects-full` (line 101)
- ✓ GET `/api/data-objects/:name` (line 131)
- ✓ POST `/api/data-objects` (line 179)
- ✓ POST `/api/data-objects/update` (line 313)
- ✓ POST `/api/update-full-data-object` (line 392)
- ✓ POST `/api/data-objects/add-props` (line 508)
- ✓ POST `/api/data-objects/update-prop` (line 633)

### Forms (14 routes)
- ✓ GET `/api/forms` (line 846)
- ✓ POST `/api/create-form` (line 2411)
- ✓ POST `/api/update-form` (line 2479)
- ✓ POST `/api/update-full-form` (line 2562)
- ✓ POST `/api/add-form-param` (line 2739)
- ✓ POST `/api/update-form-param` (line 2831)
- ✓ POST `/api/move-form-param` (line 2928)
- ✓ POST `/api/add-form-button` (line 3310)
- ✓ POST `/api/update-form-button` (line 3396)
- ✓ POST `/api/move-form-button` (line 3064)
- ✓ POST `/api/add-form-output-var` (line 3493)
- ✓ POST `/api/update-form-output-var` (line 3579)
- ✓ POST `/api/move-form-output-var` (line 3187)

### Pages (1 route)
- ✓ GET `/api/pages` (line 812)

### Lookups (1 route)
- ✓ GET `/api/lookup-values` (line 4966)

### Reports (13 routes)
- ✓ GET `/api/reports` (line 3843)
- ✓ POST `/api/create-report` (line 3895)
- ✓ POST `/api/update-report` (line 3968)
- ✓ POST `/api/update-full-report` (line 3676)
- ✓ POST `/api/add-report-param` (line 4051)
- ✓ POST `/api/update-report-param` (line 4143)
- ✓ POST `/api/move-report-param` (line 4612)
- ✓ POST `/api/add-report-column` (line 4240)
- ✓ POST `/api/update-report-column` (line 4332)
- ✓ POST `/api/move-report-column` (line 4730)
- ✓ POST `/api/add-report-button` (line 4429)
- ✓ POST `/api/update-report-button` (line 4515)
- ✓ POST `/api/move-report-button` (line 4848)

### General Flows (10 routes)
- ✓ GET `/api/general-flows-summary` (line 897)
- ✓ GET `/api/general-flows` (line 972)
- ✓ POST `/api/update-general-flow` (line 1055)
- ✓ POST `/api/update-full-general-flow` (line 1153)
- ✓ POST `/api/add-general-flow-output-var` (line 1241)
- ✓ POST `/api/update-general-flow-output-var` (line 1347)
- ✓ POST `/api/move-general-flow-output-var` (line 1458)
- ✓ POST `/api/add-general-flow-param` (line 1573)
- ✓ POST `/api/update-general-flow-param` (line 1658)
- ✓ POST `/api/move-general-flow-param` (line 1756)

### Page Init Flows (6 routes)
- ✓ GET `/api/page-init-flows` (line 1853)
- ✓ POST `/api/update-page-init-flow` (line 1910)
- ✓ POST `/api/update-full-page-init-flow` (line 2000)
- ✓ POST `/api/add-page-init-flow-output-var` (line 2084)
- ✓ POST `/api/update-page-init-flow-output-var` (line 2177)
- ✓ POST `/api/move-page-init-flow-output-var` (line 2281)

### Model Services (13 routes - all registered)
- ✓ GET `/api/auth-status` (line 6152)
- ✓ GET `/api/model-services/model-features` (line 6172)
- ✓ GET `/api/model-services/prep-requests` (line 6283)
- ✓ POST `/api/model-services/create-prep-request` (line 6441)
- ✓ POST `/api/model-services/create-validation-request` (line 6569)
- ✓ POST `/api/model-services/create-fabrication-request` (line 6697)
- ✓ GET `/api/model-services/validation-requests` (line 7202)
- ✓ GET `/api/model-services/fabrication-requests` (line 7379)
- ✅ GET `/api/model-services/prep-request-details` (line 6357) **NEW**
- ✅ POST `/api/model-services/merge-ai-processing-results` (line 6825) **NEW**
- ✅ GET `/api/model-services/validation-request-details` (line 7034) **NEW**
- ✅ GET `/api/model-services/fabrication-request-details` (line 7118) **NEW**
- ✅ GET `/api/model-services/template-sets` (line 7276) **NEW**

## Total Route Count
- **mcpBridge.ts**: 75 routes (data bridge on port 3001)
- **routeRegistry.ts**: 75 routes registered ✅
- **Missing**: 0 routes ✅

## Changes Made

✅ Added 5 new route handlers to `src/services/mcpBridge/routes/modelServiceRoutes.ts`:
1. `getPrepRequestDetails()` - GET `/api/model-services/prep-request-details`
2. `mergeAiProcessingResults()` - POST `/api/model-services/merge-ai-processing-results`
3. `getValidationRequestDetails()` - GET `/api/model-services/validation-request-details`
4. `getFabricationRequestDetails()` - GET `/api/model-services/fabrication-request-details`
5. `getTemplateSets()` - GET `/api/model-services/template-sets`

✅ Added 5 new route registrations to `src/services/mcpBridge/utils/routeRegistry.ts`

**All routes are now properly registered and ready for use!**
