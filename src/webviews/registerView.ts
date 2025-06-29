// Register webview for Model Services registration
// Created: June 29, 2025

import * as vscode from "vscode";
import { AuthService } from "../services/authService";

/**
 * Opens a webview panel for Model Services registration
 * @param context The VS Code extension context
 * @param onRegisterSuccess Callback function to execute after successful registration
 */
export async function showRegisterView(context: vscode.ExtensionContext, onRegisterSuccess?: () => void): Promise<void> {
    // Create webview panel for registration
    const panel = vscode.window.createWebviewPanel(
        "modelServicesRegister",
        "Register for AppDNA Model Services",
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
    
    // Set the HTML content
    panel.webview.html = getRegisterViewContent();

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

            case "register":
                try {
                    const success = await authService.register(
                        message.email, 
                        message.password, 
                        message.confirmPassword,
                        message.firstName,
                        message.lastName,
                        message.optIntoTerms
                    );
                    
                    if (success) {
                        panel.webview.postMessage({ command: "registerSuccess" });
                        
                        // Close the panel after successful registration
                        setTimeout(() => {
                            panel.dispose();
                            
                            // Call the success callback if provided
                            if (onRegisterSuccess) {
                                onRegisterSuccess();
                            }
                        }, 1000);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    panel.webview.postMessage({ 
                        command: "registerError",
                        message: errorMessage
                    });
                    vscode.window.showErrorMessage(`Registration failed: ${errorMessage}`);
                }
                return;
                
            case "cancel":
                panel.dispose();
                return;
                
            case "login":
                // Close register view and open login view
                panel.dispose();
                const { showLoginView } = await import('./loginView.js');
                await showLoginView(context, onRegisterSuccess);
                return;
        }
    });
}

/**
 * Generates the HTML content for the register webview
 * @returns HTML content as a string
 */
function getRegisterViewContent(): string {
    // Get the model services URL from settings to display to user
    const config = vscode.workspace.getConfiguration("appDNA");
    const apiUrl = config.get<string>("modelServiceUrl") || "Not configured";
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register for AppDNA Model Services</title>
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
        .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 15px;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin: 0;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .checkbox-group label {
            margin: 0;
            font-size: 0.9em;
            line-height: 1.4;
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
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
        .success {
            color: var(--vscode-terminal-ansiGreen);
            margin-top: 15px;
            padding: 10px;
            display: none;
            border: 1px solid var(--vscode-terminal-ansiGreen);
            background-color: var(--vscode-inputValidation-infoBackground);
        }
        .login-link {
            margin-top: 15px;
            text-align: center;
        }
        .login-link a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }
        .login-link a:hover {
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
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--vscode-panel-border);
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        .footer a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }
        .footer a:hover {
            color: var(--vscode-textLink-activeForeground);
            text-decoration: underline;
        }
        .info {
            margin-top: 20px;
            padding: 10px;
            font-style: italic;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Register for AppDNA Model Services</h1>
        <form id="registerForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required autofocus>
            </div>
            <div class="form-group">
                <label for="firstName">First Name:</label>
                <input type="text" id="firstName" name="firstName" required>
            </div>
            <div class="form-group">
                <label for="lastName">Last Name:</label>
                <input type="text" id="lastName" name="lastName" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="optIntoTerms" name="optIntoTerms" required>
                <label for="optIntoTerms">I agree to the terms of service and acknowledge that my models will be sent to AppDNA Model Services for processing. This service is provided for amusement purposes only with no guarantees of accuracy.</label>
            </div>
            <div id="errorMessage" class="error"></div>
            <div id="successMessage" class="success">Registration successful! Welcome to AppDNA Model Services!</div>
            <div class="buttons">
                <button type="button" id="cancelButton" class="secondary">Cancel</button>
                <button type="submit" id="submitButton">Register</button>
            </div>
            <div class="login-link">
                <p>Already have an account? <a href="#" id="loginLink">Sign in here</a></p>
            </div>
        </form>
        
        <div class="terms">
            <p><strong>Terms of Service:</strong> By registering, you agree that your models will be sent to AppDNA Model Services for processing.</p>
            <p>This service is provided for amusement purposes only with no guarantees of accuracy for any particular purpose.</p>
            <p>By using this service, you acknowledge that the provider accepts no liability for any damages, data loss, or other issues that may arise from using this service. You agree to indemnify and hold harmless the service provider from all claims.</p>
        </div>
        
        <div class="info">
            <p>Service URL: ${apiUrl}</p>
            <p>Register to access code generation and other model services.</p>
        </div>
        
        <div class="footer">
            <p>Learn more about this extension on <a href="https://github.com/derivative-programming/vscode-extension" target="_blank">GitHub</a></p>
        </div>
    </div>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            
            function onReady() {
                const registerForm = document.getElementById('registerForm');
                const errorMessage = document.getElementById('errorMessage');
                const successMessage = document.getElementById('successMessage');
                const cancelButton = document.getElementById('cancelButton');
                const submitButton = document.getElementById('submitButton');
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
                        case 'registerError':
                            errorMessage.textContent = message.message || 'Registration failed. Please try again.';
                            errorMessage.style.display = 'block';
                            successMessage.style.display = 'none';
                            submitButton.disabled = false;
                            break;
                        case 'registerSuccess':
                            errorMessage.style.display = 'none';
                            successMessage.style.display = 'block';
                            submitButton.disabled = true;
                            break;
                    }
                });

                // Notify extension when webview is ready
                vscode.postMessage({ command: 'webviewReady' });

                // Handle form submission
                registerForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const email = document.getElementById('email').value;
                    const firstName = document.getElementById('firstName').value;
                    const lastName = document.getElementById('lastName').value;
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const optIntoTerms = document.getElementById('optIntoTerms').checked;
                    
                    // Client-side validation
                    if (!email || !firstName || !lastName || !password || !confirmPassword) {
                        errorMessage.textContent = 'Please fill in all required fields.';
                        errorMessage.style.display = 'block';
                        return;
                    }
                    
                    if (password !== confirmPassword) {
                        errorMessage.textContent = 'Passwords do not match.';
                        errorMessage.style.display = 'block';
                        return;
                    }
                    
                    if (!optIntoTerms) {
                        errorMessage.textContent = 'You must agree to the terms of service to register.';
                        errorMessage.style.display = 'block';
                        return;
                    }
                    
                    // Disable submit button during processing
                    submitButton.disabled = true;
                    errorMessage.style.display = 'none';
                    
                    // Send registration data to the extension
                    vscode.postMessage({
                        command: 'register',
                        email: email,
                        firstName: firstName,
                        lastName: lastName,
                        password: password,
                        confirmPassword: confirmPassword,
                        optIntoTerms: optIntoTerms
                    });
                });
                
                // Handle cancel button
                cancelButton.addEventListener('click', function() {
                    vscode.postMessage({
                        command: 'cancel'
                    });
                });
                
                // Handle login link
                const loginLink = document.getElementById('loginLink');
                if (loginLink) {
                    loginLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        vscode.postMessage({
                            command: 'login'
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
