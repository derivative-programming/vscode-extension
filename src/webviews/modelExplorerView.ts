import * as vscode from "vscode";
import { ModelService } from "../services/modelService";
import { ObjectSchema } from "../data/interfaces";
import { ReportSchema } from "../data/interfaces/report.interface";

/**
 * Opens the model explorer webview that displays all objects and reports
 * @param context Extension context
 * @param modelService Instance of the ModelService
 * @param viewType The type of view to show ('objects' or 'reports')
 */
export function openModelExplorer(
    context: vscode.ExtensionContext,
    modelService: ModelService,
    viewType: "objects" | "reports" = "objects"
) {
    // Check if a model is loaded
    if (!modelService.isFileLoaded()) {
        vscode.window.showWarningMessage("No App DNA file is currently loaded.");
        return;
    }

    // Get data based on view type
    const items = viewType === "objects" 
        ? modelService.getAllObjects() 
        : modelService.getAllReports();

    if (items.length === 0) {
        vscode.window.showInformationMessage(`No ${viewType} found in the current model.`);
        return;
    }

    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        `modelExplorer${viewType}`,
        `App DNA ${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Set the webview's HTML content
    panel.webview.html = getWebviewContent(items, viewType);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case "showDetails":
                    // Show details for the selected item
                    const item = message.item;
                    if (item) {
                        vscode.window.showInformationMessage(`Selected ${viewType.slice(0, -1)}: ${item.name || "Unnamed"}`);
                        // Here you could open another detailed view
                    }
                    break;
                case "error":
                    vscode.window.showErrorMessage(message.message);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Get the HTML content for the model explorer webview
 * @param items Array of objects or reports to display
 * @param viewType The type of view ('objects' or 'reports')
 * @returns HTML content as a string
 */
function getWebviewContent(items: ObjectSchema[] | ReportSchema[], viewType: "objects" | "reports"): string {
    // Convert items to a JSON string for use in the webview
    const itemsJson = JSON.stringify(items);
    
    // Create a title for the view
    const title = viewType === "objects" ? "App DNA Objects" : "App DNA Reports";
    
    // Define columns based on view type
    const columns = viewType === "objects" 
        ? ["Name", "Namespace", "Description"] 
        : ["Name", "Title", "Description"];
    
    // Generate HTML for columns
    const columnHeaders = columns.map(col => `<th>${col}</th>`).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 10px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 {
            font-size: 1.5em;
            margin-bottom: 1em;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.5em;
        }
        .search-container {
            margin-bottom: 1em;
        }
        input[type="text"] {
            width: 100%;
            padding: 8px;
            margin-bottom: 1em;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            text-align: left;
            padding: 8px;
            background-color: var(--vscode-editor-lineHighlightBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        td {
            padding: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        tr:hover {
            background-color: var(--vscode-list-hoverBackground);
            cursor: pointer;
        }
        .readonly {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-placeholderForeground);
        }
        .empty-state {
            text-align: center;
            padding: 2em;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="search-container">
        <input type="text" id="searchInput" placeholder="Search ${viewType}...">
    </div>
    
    <table id="itemsTable">
        <thead>
            <tr>
                ${columnHeaders}
            </tr>
        </thead>
        <tbody id="itemsTableBody">
            <!-- Items will be inserted here dynamically -->
        </tbody>
    </table>
    
    <div id="emptyState" class="empty-state" style="display:none;">
        No ${viewType} found matching your search.
    </div>

    <script>
        // Initialize data
        const vscode = acquireVsCodeApi();
        const viewType = "${viewType}";
        const items = ${itemsJson};
        
        // Initialize the table
        const searchInput = document.getElementById('searchInput');
        const tableBody = document.getElementById('itemsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        // Function to render the table
        function renderTable(filteredItems) {
            tableBody.innerHTML = '';
            
            if (filteredItems.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            filteredItems.forEach(item => {
                const row = document.createElement('tr');
                
                // Add columns based on view type
                if (viewType === "objects") {
                    row.innerHTML = \`
                        <td>\${item.name || 'Unnamed Object'}</td>
                        <td>\${item.namespace || ''}</td>
                        <td>\${item.description || ''}</td>
                    \`;
                } else {
                    row.innerHTML = \`
                        <td>\${item.name || 'Unnamed Report'}</td>
                        <td>\${item.titleText || ''}</td>
                        <td>\${item.introText || ''}</td>
                    \`;
                }
                
                // Add click handler
                row.addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'showDetails',
                        item: item
                    });
                });
                
                tableBody.appendChild(row);
            });
        }
        
        // Filter items based on search input
        function filterItems(searchText) {
            if (!searchText) {
                return items;
            }
            
            searchText = searchText.toLowerCase();
            
            return items.filter(item => {
                // For objects
                if (viewType === "objects") {
                    return (
                        (item.name && item.name.toLowerCase().includes(searchText)) ||
                        (item.namespace && item.namespace.toLowerCase().includes(searchText)) ||
                        (item.description && item.description.toLowerCase().includes(searchText))
                    );
                }
                // For reports
                else {
                    return (
                        (item.name && item.name.toLowerCase().includes(searchText)) ||
                        (item.titleText && item.titleText.toLowerCase().includes(searchText)) ||
                        (item.introText && item.introText.toLowerCase().includes(searchText))
                    );
                }
            });
        }
        
        // Initial render
        renderTable(items);
        
        // Add search functionality
        searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value;
            const filteredItems = filterItems(searchText);
            renderTable(filteredItems);
        });
    </script>
</body>
</html>`;
}