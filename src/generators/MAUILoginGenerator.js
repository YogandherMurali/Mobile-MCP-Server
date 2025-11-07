import fs from 'fs/promises';
import path from 'path';

export class MAUILoginGenerator {
    constructor() {
        this.templatePath = path.join(process.cwd(), 'templates', 'maui');
    }

    async generate(options) {
        try {
            const {
                companyName = 'Company',
                primaryColor = '#007BFF',
                secondaryColor = '#6C757D',
                logoUrl = '',
                includeValidation = true,
                includeRememberMe = true,
                includeBiometric = false,
                includeOAuth = false,
                includeSSO = false,
                includeUserPicture = false,
                includeDarkTheme = false,
                namespace = 'MyApp',
                className = 'LoginPage',
                customColors = '',
                customStyles = ''
            } = options;

            // Prepare template variables
            const variables = {
                COMPANY_NAME: companyName,
                PRIMARY_COLOR: primaryColor,
                SECONDARY_COLOR: secondaryColor,
                PRIMARY_DARK_COLOR: this.darkenColor(primaryColor, 20),
                PRIMARY_LIGHT_COLOR: this.lightenColor(primaryColor, 20),
                SECONDARY_DARK_COLOR: this.darkenColor(secondaryColor, 20),
                SECONDARY_LIGHT_COLOR: this.lightenColor(secondaryColor, 20),
                ACCENT_COLOR: this.adjustColor(primaryColor, 30),
                ACCENT_DARK_COLOR: this.darkenColor(this.adjustColor(primaryColor, 30), 20),
                ACCENT_LIGHT_COLOR: this.lightenColor(this.adjustColor(primaryColor, 30), 20),
                LOGO_URL: logoUrl,
                LOGO_SOURCE: logoUrl || 'logo.png',
                NAMESPACE: namespace,
                CLASS_NAME: className,
                LOGIN_BUTTON_TEXT: 'Sign In',
                CUSTOM_COLORS: customColors,
                CUSTOM_STYLES: customStyles
            };

            // Prepare conditional includes
            const includes = {
                INCLUDE_VALIDATION: includeValidation,
                INCLUDE_REMEMBER_ME: includeRememberMe,
                INCLUDE_BIOMETRIC: includeBiometric,
                INCLUDE_OAUTH: includeOAuth,
                INCLUDE_SSO: includeSSO,
                INCLUDE_USER_PICTURE: includeUserPicture,
                INCLUDE_DARK_THEME: includeDarkTheme,
                INCLUDE_COMPANY_BRANDING: !!logoUrl,
                INCLUDE_EMAIL_PASSWORD: true, // Always include basic email/password
                INCLUDE_LOGIN_BUTTON: true,
                INCLUDE_CUSTOM_COLORS: !!customColors,
                INCLUDE_CUSTOM_STYLES: !!customStyles
            };

            // Generate all files
            const files = await Promise.all([
                this.generateFromTemplate('LoginPage.xaml.template', variables, includes),
                this.generateFromTemplate('LoginPage.xaml.cs.template', variables, includes),
                this.generateFromTemplate('Colors.xaml.template', variables, includes),
                this.generateFromTemplate('Styles.xaml.template', variables, includes)
            ]);

            return {
                files: [
                    {
                        name: `${className}.xaml`,
                        content: files[0],
                        description: 'MAUI Login Page XAML Layout'
                    },
                    {
                        name: `${className}.xaml.cs`,
                        content: files[1],
                        description: 'MAUI Login Page Code-Behind'
                    },
                    {
                        name: 'Colors.xaml',
                        content: files[2],
                        description: 'Color Resource Dictionary'
                    },
                    {
                        name: 'Styles.xaml',
                        content: files[3],
                        description: 'Style Resource Dictionary'
                    }
                ],
                summary: `Generated MAUI login page with ${companyName} branding`,
                features: this.getFeatureList(includes)
            };
        } catch (error) {
            throw new Error(`Failed to generate MAUI login page: ${error.message}`);
        }
    }

    async generateFromTemplate(templateName, variables, includes) {
        try {
            const templatePath = path.join(this.templatePath, templateName);
            let template = await fs.readFile(templatePath, 'utf-8');

            // Process conditional sections first
            template = this.processConditionalSections(template, includes);

            // Replace variables
            template = this.replaceVariables(template, variables);

            return template;
        } catch (error) {
            throw new Error(`Failed to load template ${templateName}: ${error.message}`);
        }
    }

    processConditionalSections(template, includes) {
        // Process conditional blocks like {{#INCLUDE_FEATURE}}...{{/INCLUDE_FEATURE}}
        const conditionalRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        
        return template.replace(conditionalRegex, (match, condition, content) => {
            return includes[condition] ? content : '';
        });
    }

    replaceVariables(template, variables) {
        // Replace variables like {{VARIABLE}}
        const variableRegex = /\{\{(\w+)\}\}/g;
        
        return template.replace(variableRegex, (match, variable) => {
            return variables[variable] || match;
        });
    }

    darkenColor(hex, percent) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Darken by percentage
        const factor = (100 - percent) / 100;
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    lightenColor(hex, percent) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Lighten by percentage
        const factor = percent / 100;
        const newR = Math.round(r + (255 - r) * factor);
        const newG = Math.round(g + (255 - g) * factor);
        const newB = Math.round(b + (255 - b) * factor);
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    adjustColor(hex, adjustment) {
        // Simple color adjustment for accent colors
        hex = hex.replace('#', '');
        
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Adjust hue slightly for accent color
        const newR = Math.min(255, Math.max(0, r + adjustment));
        const newG = Math.min(255, Math.max(0, g - adjustment / 2));
        const newB = Math.min(255, Math.max(0, b + adjustment / 3));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    getFeatureList(includes) {
        const features = [];
        
        if (includes.INCLUDE_VALIDATION) features.push('Email validation');
        if (includes.INCLUDE_REMEMBER_ME) features.push('Remember me option');
        if (includes.INCLUDE_BIOMETRIC) features.push('Biometric authentication');
        if (includes.INCLUDE_OAUTH) features.push('OAuth login');
        if (includes.INCLUDE_SSO) features.push('SSO integration');
        if (includes.INCLUDE_USER_PICTURE) features.push('User profile pictures');
        if (includes.INCLUDE_DARK_THEME) features.push('Dark theme support');
        if (includes.INCLUDE_COMPANY_BRANDING) features.push('Company branding');
        
        return features;
    }
}
