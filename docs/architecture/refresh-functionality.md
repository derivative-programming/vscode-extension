# Refresh Functionality Enhancement
The refresh button now uses an optimized approach:
- Sends a message to the extension to get fresh model data
- Updates only the flow data without reloading the entire webview
- Preserves user state (zoom level, role filters, search terms)
- Shows loading and success notifications for better UX
- Re-populates role filters based on updated data
- Avoids page flicker and maintains user context

Previous implementation reloaded the entire HTML which caused loss of state and poor user experience.
