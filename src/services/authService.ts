// filepath: c:\VR\Source\DP\vscode-extension\src\services\authService.ts
// Authentication service for Model Services API
// Created: May 4, 2025

import * as vscode from "vscode";

/**
 * Service responsible for authentication and secure storage of API credentials
 */
export class AuthService {
    private static instance: AuthService;
    private context: vscode.ExtensionContext | undefined;
    private isAuthenticated: boolean = false;
    
    // Constants for secure storage
    private readonly API_KEY_STORAGE_KEY = "appdna.modelServices.apiKey";
    private readonly EMAIL_STORAGE_KEY = "appdna.modelServices.email";
    
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {}
    
    /**
     * Get the singleton instance of AuthService
     */
    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    
    /**
     * Initialize the auth service with extension context for storage access
     * @param context The VS Code extension context
     */
    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        // Check if we already have stored credentials
        this.checkAuthentication();
    }
    
    /**
     * Check if there's a stored API key and set authentication status
     */
    private async checkAuthentication(): Promise<void> {
        if (!this.context) {
            return;
        }
        
        const apiKey = await this.context.secrets.get(this.API_KEY_STORAGE_KEY);
        this.isAuthenticated = !!apiKey;
    }
    
    /**
     * Perform login to model services API
     * @param email The email address for authentication
     * @param password The password for authentication
     * @returns Promise resolving to true if login was successful
     * @throws Error if login fails
     */
    public async login(email: string, password: string): Promise<boolean> {
        if (!this.context) {
            throw new Error("AuthService not initialized properly.");
        }
        
        try {
            // Define the API endpoint
            const apiUrl = "https://modelservicesapi.derivative-programming.com/api/v1_0/logins";
            
            // Call the login endpoint
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            
            // Parse the response
            const data = await response.json();
            
            // Debug logging for API response
            console.log("[DEBUG] Login API response:", JSON.stringify(data, null, 2));
            
            // Check for API-level success flag
            if (!data.success) {
                // Debug logging for entire response structure
                console.log("[DEBUG] Login failed. Full API response structure:");
                console.log("[DEBUG] data.success:", data.success);
                console.log("[DEBUG] data.message:", data.message);
                console.log("[DEBUG] data.validationError:", data.validationError);
                console.log("[DEBUG] typeof data.validationError:", typeof data.validationError);
                console.log("[DEBUG] Array.isArray(data.validationError):", Array.isArray(data.validationError));
                
                // Create a custom error with validation details
                const error: any = new Error(data.message || "Login failed with no specific error message");
                
                // Check for validation errors with multiple possible property names
                let validationErrors = data.validationError || data.validationErrors || data.ValidationError || data.ValidationErrors;
                
                // Only mark as validation error if there are actual validation errors
                if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
                    error.validationErrors = validationErrors;
                    error.isValidationError = true;
                    console.log("[DEBUG] Validation errors found:", validationErrors);
                } else {
                    error.isValidationError = false;
                    console.log("[DEBUG] No validation errors, general error:", data.message);
                }
                
                throw error;
            }
            
            if (!data.modelServicesAPIKey) {
                throw new Error("Login succeeded but no API key was returned.");
            }
            
            // Store the API key securely
            await this.context.secrets.store(this.API_KEY_STORAGE_KEY, data.modelServicesAPIKey);
            await this.context.secrets.store(this.EMAIL_STORAGE_KEY, email);
            
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            // Log and re-throw the error
            console.error("Login error:", error);
            this.isAuthenticated = false;
            throw error;
        }
    }
    
    /**
     * Perform registration to model services API
     * @param email The email address for registration
     * @param password The password for registration
     * @param confirmPassword The password confirmation
     * @param firstName The first name
     * @param lastName The last name
     * @param optIntoTerms Whether user agrees to terms of service
     * @returns Promise resolving to true if registration was successful
     * @throws Error if registration fails
     */
    public async register(
        email: string, 
        password: string, 
        confirmPassword: string,
        firstName: string,
        lastName: string,
        optIntoTerms: boolean
    ): Promise<boolean> {
        if (!this.context) {
            throw new Error("AuthService not initialized properly.");
        }
        
        try {
            // Define the API endpoint
            const apiUrl = "https://modelservicesapi.derivative-programming.com/api/v1_0/registers";
            
            // Call the register endpoint
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    confirmPassword, 
                    firstName, 
                    lastName, 
                    optIntoTerms 
                }),
            });
            
            // Parse the response
            const data = await response.json();
            
            // Debug logging for API response
            console.log("[DEBUG] Register API response:", JSON.stringify(data, null, 2));
            
            // Check for API-level success flag
            if (!data.success) {
                // Debug logging for entire response structure
                console.log("[DEBUG] Registration failed. Full API response structure:");
                console.log("[DEBUG] data.success:", data.success);
                console.log("[DEBUG] data.message:", data.message);
                console.log("[DEBUG] data.validationError:", data.validationError);
                console.log("[DEBUG] typeof data.validationError:", typeof data.validationError);
                console.log("[DEBUG] Array.isArray(data.validationError):", Array.isArray(data.validationError));
                
                // Create a custom error with validation details
                const error: any = new Error(data.message || "Registration failed with no specific error message");
                
                // Check for validation errors with multiple possible property names
                let validationErrors = data.validationError || data.validationErrors || data.ValidationError || data.ValidationErrors;
                
                // Only mark as validation error if there are actual validation errors
                if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
                    error.validationErrors = validationErrors;
                    error.isValidationError = true;
                    console.log("[DEBUG] Validation errors found:", validationErrors);
                } else {
                    error.isValidationError = false;
                    console.log("[DEBUG] No validation errors, general error:", data.message);
                }
                
                throw error;
            }
            
            if (!data.modelServicesAPIKey) {
                throw new Error("Registration succeeded but no API key was returned.");
            }
            
            // Store the API key and email securely (same as login)
            await this.context.secrets.store(this.API_KEY_STORAGE_KEY, data.modelServicesAPIKey);
            await this.context.secrets.store(this.EMAIL_STORAGE_KEY, email);
            
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            // Log and re-throw the error
            console.error("Registration error:", error);
            this.isAuthenticated = false;
            throw error;
        }
    }
    
    /**
     * Get the stored API key
     * @returns Promise resolving to the API key or undefined if not logged in
     */
    public async getApiKey(): Promise<string | undefined> {
        if (!this.context || !this.isAuthenticated) {
            return undefined;
        }
        
        return await this.context.secrets.get(this.API_KEY_STORAGE_KEY);
    }
    
    /**
     * Get the stored email
     * @returns Promise resolving to the email or undefined if no email is stored
     */
    public async getEmail(): Promise<string | undefined> {
        if (!this.context) {
            return undefined;
        }
        
        // Return the email regardless of authentication status
        // This allows pre-populating the login form with previously used email
        return await this.context.secrets.get(this.EMAIL_STORAGE_KEY);
    }
    
    /**
     * Logout and clear stored credentials (except email, so it can be pre-populated)
     */
    public async logout(): Promise<void> {
        if (!this.context) {
            return;
        }
        await this.context.secrets.delete(this.API_KEY_STORAGE_KEY);
        // Do NOT delete the email, so it can be pre-populated next time
        this.isAuthenticated = false;
    }
    
    /**
     * Check if user is currently authenticated
     * @returns True if authenticated, false otherwise
     */
    public isLoggedIn(): boolean {
        return this.isAuthenticated;
    }
}