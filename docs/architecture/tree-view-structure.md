# Tree View Structure
- Tree view is provided by JsonTreeDataProvider in src/providers/jsonTreeDataProvider.ts
- Main hierarchy: PROJECT → DATA OBJECTS → [PAGES (containing FORMS/REPORTS)] → MODEL SERVICES
- PAGES item groups UI-related components (FORMS and REPORTS) under a single parent
- FORMS and REPORTS retain their original contextValues and functionality when nested under PAGES
- Advanced properties setting controls visibility of PAGES, FORMS, and REPORTS sections
