// filepath: c:\VR\Source\DP\vscode-extension\src\webviews\loginView.ts
// Login webview for Model Services authentication
// Created: May 4, 2025

import * as vscode from "vscode";
import { AuthService } from "../services/authService";

/**
 * Opens a webview panel for Model Services login
 * @param context The VS Code extension context
 * @param onLoginSuccess Callback function to execute after successful login
 */
export async function showLoginView(context: vscode.ExtensionContext, onLoginSuccess?: () => void): Promise<void> {
    // Create webview panel for login
    const panel = vscode.window.createWebviewPanel(
        "modelServicesLogin",
        "Login to AppDNA Model Services",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: false
        }
    );

    // Get the previously used email if available
    const authService = AuthService.getInstance();
    authService.initialize(context);
    const previousEmail = await authService.getEmail() || "";
    
    // Add debug logging
    console.log("[DEBUG] Previous email retrieved:", previousEmail);
    
    // Set the HTML content
    panel.webview.html = getLoginViewContent();

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async message => {
        switch (message.command) {
            case "webviewReady":
                if (previousEmail) {
                    panel.webview.postMessage({
                        command: "setEmailValue",
                        value: previousEmail
                    });
                }
                return;

            case "login":
                try {
                    const success = await authService.login(message.email, message.password);
                    
                    if (success) {
                        panel.webview.postMessage({ command: "loginSuccess" });
                        // vscode.window.showInformationMessage("Successfully logged in to AppDNA Model Services");
                        
                        // Close the panel after successful login
                        setTimeout(() => {
                            panel.dispose();
                            
                            // Call the success callback if provided
                            if (onLoginSuccess) {
                                onLoginSuccess();
                            }
                        }, 1000);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    panel.webview.postMessage({ 
                        command: "loginError",
                        message: errorMessage
                    });
                    vscode.window.showErrorMessage(`Login failed: ${errorMessage}`);
                }
                return;
                
            case "cancel":
                panel.dispose();
                return;
                
            case "register":
                // Open registration URL in the default web browser
                const registrationUrl = "https://secure.derivative-programming.com/ObjWF/Tac/TacRegister/f8324cfc-c6f9-4e92-bb88-a9e429d05e59";
                vscode.env.openExternal(vscode.Uri.parse(registrationUrl));
                // vscode.window.showInformationMessage("Opening registration page in your browser");
                return;

            case "debugEmailValue":
                // Log debug information when received from the webview
                console.log("[DEBUG-WEBVIEW] Email field value:", message.value);
                return;
        }
    });
}

/**
 * Generates the HTML content for the login webview
 * @returns HTML content as a string
 */
function getLoginViewContent(): string {
    // Get the model services URL from settings to display to user
    const config = vscode.workspace.getConfiguration("appDNA");
    const apiUrl = config.get<string>("modelServiceUrl") || "Not configured";
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login to AppDNA Model Services</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
        }
        input {
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            border-color: var(--vscode-focusBorder);
        }
        .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        button {
            padding: 8px 12px;
            cursor: pointer;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .error {
            color: var(--vscode-errorForeground);
            margin-top: 15px;
            padding: 10px;
            display: none;
            border: 1px solid var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
        }
        .info {
            margin-top: 20px;
            padding: 10px;
            font-style: italic;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
        .success {
            color: var(--vscode-terminal-ansiGreen);
            margin-top: 15px;
            padding: 10px;
            display: none;
            border: 1px solid var(--vscode-terminal-ansiGreen);
            background-color: var(--vscode-inputValidation-infoBackground);
        }
        .register-link {
            margin-top: 15px;
            text-align: center;
        }
        .register-link a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }
        .register-link a:hover {
            text-decoration: underline;
        }
        .terms {
            margin-top: 25px;
            padding: 10px;
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
            border-top: 1px solid var(--vscode-input-border);
        }
        .terms p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Login to AppDNA Model Services</h1>
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required autofocus>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div id="errorMessage" class="error"></div>
            <div id="successMessage" class="success">Login successful! Redirecting...</div>            <div class="buttons">
                <button type="button" id="cancelButton" class="secondary" style="visibility: hidden;">Cancel</button>
                <button type="submit">Login</button>
            </div>
            <div class="register-link">
                <p>Don't have an account? <a href="#" id="registerLink">Register here</a></p>
            </div>
        </form>
        
        <div class="terms">
            <p><strong>Terms of Service:</strong> By logging in, you agree that your models will be sent to AppDNA Model Services for processing.</p>
            <p>This service is provided for amusement purposes only with no guarantees of accuracy for any particular purpose.</p>
            <p>By using this service, you acknowledge that the provider accepts no liability for any damages, data loss, or other issues that may arise from using this service. You agree to indemnify and hold harmless the service provider from all claims.</p>
        </div>
        
        <div class="info">
            <p>Service URL: ${apiUrl}</p>
            <p>Login to access code generation and other model services.</p>
        </div>
    </div>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            function onReady() {
                const loginForm = document.getElementById('loginForm');
                const errorMessage = document.getElementById('errorMessage');
                const successMessage = document.getElementById('successMessage');
                const cancelButton = document.getElementById('cancelButton');
                const emailField = document.getElementById('email');

                // Listen for messages from the extension
                window.addEventListener('message', function(event) {
                    const message = event.data;
                    switch(message.command) {
                        case 'setEmailValue':
                            if (emailField) {
                                emailField.value = message.value || '';
                            }
                            break;
                        case 'loginError':
                            errorMessage.textContent = message.message || 'Login failed. Please try again.';
                            errorMessage.style.display = 'block';
                            successMessage.style.display = 'none';
                            break;
                        case 'loginSuccess':
                            errorMessage.style.display = 'none';
                            successMessage.style.display = 'block';
                            loginForm.querySelector('button[type="submit"]').disabled = true;
                            break;
                    }
                });

                // Notify extension when webview is ready
                vscode.postMessage({ command: 'webviewReady' });

                // Handle form submission
                loginForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    
                    if (!email || !password) {
                        errorMessage.textContent = 'Please enter both email and password.';
                        errorMessage.style.display = 'block';
                        return;
                    }
                    
                    // Send credentials to the extension
                    vscode.postMessage({
                        command: 'login',
                        email: email,
                        password: password
                    });
                });
                
                // Handle cancel button
                cancelButton.addEventListener('click', function() {
                    vscode.postMessage({
                        command: 'cancel'
                    });
                });
                
                // Handle register link
                const registerLink = document.getElementById('registerLink');
                if (registerLink) {
                    registerLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        vscode.postMessage({
                            command: 'register'
                        });
                    });
                }
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', onReady);
            } else {
                onReady();
            }
        })();
    </script>
</body>
</html>`;
}