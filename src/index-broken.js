import http from 'http';
import crypto from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { MAUILoginGenerator } from './generators/MAUILoginGenerator.js';

// Initialize generators
const mauiLoginGenerator = new MAUILoginGenerator();

// Create server instance
const server = new Server(
    {
        name: 'mobile-development-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define tool schemas
const EchoSchema = z.object({
    message: z.string(),
});

const GenerateMAUILoginSchema = z.object({
    companyName: z.string().describe('Company name for branding (e.g., OneAdvanced)'),
    primaryColor: z.string().optional().describe('Primary brand color (hex code)'),
    secondaryColor: z.string().optional().describe('Secondary brand color (hex code)'),
    logoUrl: z.string().optional().describe('URL or path to company logo'),
    includeValidation: z.boolean().optional().default(true).describe('Include email validation'),
    includeRememberMe: z.boolean().optional().default(true).describe('Include remember me checkbox'),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'echo',
                description: 'Echo back a message - useful for testing the MCP server connection',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'The message to echo back',
                        },
                    },
                    required: ['message'],
                },
            },
            {
                name: 'generate-maui-login',
                description: 'Generate a complete MAUI login page with branding, validation, and authentication',
                inputSchema: {
                    type: 'object',
                    properties: {
                        companyName: {
                            type: 'string',
                            description: 'Company name for branding (e.g., OneAdvanced)',
                        },
                        primaryColor: {
                            type: 'string',
                            description: 'Primary brand color (hex code)',
                        },
                        secondaryColor: {
                            type: 'string',
                            description: 'Secondary brand color (hex code)',
                        },
                        logoUrl: {
                            type: 'string',
                            description: 'URL or path to company logo',
                        },
                        includeValidation: {
                            type: 'boolean',
                            description: 'Include email validation',
                            default: true,
                        },
                        includeRememberMe: {
                            type: 'boolean',
                            description: 'Include remember me checkbox',
                            default: true,
                        },
                    },
                    required: ['companyName'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'echo': {
            const { message } = EchoSchema.parse(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Echo: ${message}`,
                    },
                ],
            };
        }

        case 'generate-maui-login': {
            const options = GenerateMAUILoginSchema.parse(args);
            
            try {
                const result = await mauiLoginGenerator.generate(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated MAUI login page for ${options.companyName}:\n\n${result.summary}\n\nFiles created:\n${result.files.map(f => `- ${f.name}: ${f.description}`).join('\n')}\n\nFeatures included:\n${result.features.map(f => `- ${f}`).join('\n')}\n\n--- LoginPage.xaml ---\n${result.files[0].content}\n\n--- LoginPage.xaml.cs ---\n${result.files[1].content}\n\n--- Colors.xaml ---\n${result.files[2].content}\n\n--- Styles.xaml ---\n${result.files[3].content}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating MAUI login: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});

// Main server initialization function
async function startServer() {
  // Create transport
  const transport = new StreamableHTTPServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Create HTTP server
  const httpServer = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle MCP endpoint
    if (req.url === '/mcp' || req.url?.startsWith('/mcp')) {
      // Parse request body for POST requests
      let body = null;
      if (req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks);
        try {
          body = JSON.parse(rawBody.toString());
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
      }

      // Handle request with transport
      await transport.handleRequest(req, res, body);
      return;
    }

    // Handle root endpoint
    if (req.url === '/' || req.url === '') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        name: 'Mobile Development MCP Server',
        version: '1.0.0',
        status: 'running',
        endpoints: ['/mcp']
      }));
      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  // Start server
  const port = process.env.PORT || 2205;
  const host = process.env.HOST || '0.0.0.0';

  httpServer.listen(port, host, () => {
    console.log(`🚀 MCP Server running on http://${host}:${port}`);
    console.log('✅ Ready to accept connections');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(console.error);
  'generate-sqlite-setup',
  'Generate SQLite database setup and models for mobile platforms',
  {
    platform: z.enum(['kotlin', 'swift', 'maui', 'react-native'])
      .describe('Target mobile platform'),
    entities: z.array(z.string())
      .describe('Database entities/tables to create'),
    includeRepository: z.boolean()
      .default(true)
      .describe('Include repository pattern'),
    includeMigrations: z.boolean()
      .default(true)
      .describe('Include database migrations'),
    cacheStrategy: z.enum(['none', 'memory', 'disk'])
      .default('memory')
      .describe('Caching strategy')
  },
  async ({ platform, entities, includeRepository, includeMigrations, cacheStrategy }) => {
    let code = '';
    let fileName = '';
    
    switch (platform) {
      case 'kotlin':
        fileName = 'DatabaseSetup.kt';
        code = generateKotlinSQLite({ entities, includeRepository, includeMigrations, cacheStrategy });
        break;
      case 'swift':
        fileName = 'DatabaseManager.swift';
        code = generateSwiftSQLite({ entities, includeRepository, includeMigrations, cacheStrategy });
        break;
      case 'maui':
        fileName = 'DatabaseContext.cs';
        code = generateMAUISQLite({ entities, includeRepository, includeMigrations, cacheStrategy });
        break;
      case 'react-native':
        fileName = 'DatabaseSetup.ts';
        code = generateReactNativeSQLite({ entities, includeRepository, includeMigrations, cacheStrategy });
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Generated ${platform} SQLite setup:\n\nFile: ${fileName}\n\n\`\`\`${platform}\n${code}\n\`\`\``
        }
      ]
    };
  }
);

// 3. Generate Offline Setup
server.tool(
  'generate-offline-setup',
  'Generate offline functionality and sync mechanisms',
  {
    platform: z.enum(['kotlin', 'swift', 'maui', 'react-native'])
      .describe('Target mobile platform'),
    syncStrategy: z.enum(['immediate', 'periodic', 'manual'])
      .default('periodic')
      .describe('Data synchronization strategy'),
    conflictResolution: z.enum(['client-wins', 'server-wins', 'manual'])
      .default('server-wins')
      .describe('Conflict resolution strategy'),
    includeNetworkDetection: z.boolean()
      .default(true)
      .describe('Include network connectivity detection'),
    includeQueueSystem: z.boolean()
      .default(true)
      .describe('Include request queue for offline operations')
  },
  async ({ platform, syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem }) => {
    let code = '';
    let fileName = '';
    
    switch (platform) {
      case 'kotlin':
        fileName = 'OfflineManager.kt';
        code = generateKotlinOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem });
        break;
      case 'swift':
        fileName = 'OfflineManager.swift';
        code = generateSwiftOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem });
        break;
      case 'maui':
        fileName = 'OfflineService.cs';
        code = generateMAUIOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem });
        break;
      case 'react-native':
        fileName = 'OfflineManager.ts';
        code = generateReactNativeOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem });
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Generated ${platform} offline setup:\n\nFile: ${fileName}\n\n\`\`\`${platform}\n${code}\n\`\`\``
        }
      ]
    };
  }
);

// Code generation functions for different platforms

// Kotlin Login Generation
function generateKotlinLogin({ authType, includeValidation, designSystem, companyBranding }) {
  return `
class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var viewModel: LoginViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        setupValidation()
        setupAuth()
    }
    
    private fun setupUI() {
        // ${companyBranding ? 'Company branding applied' : 'Standard design'}
        // Design system: ${designSystem}
        ${companyBranding ? `
        binding.logoImageView.setImageResource(R.drawable.company_logo)
        binding.loginButton.setBackgroundColor(ContextCompat.getColor(this, R.color.company_primary))
        ` : ''}
    }
    
    private fun setupValidation() {
        ${includeValidation ? `
        binding.emailEditText.addTextChangedListener(EmailValidator())
        binding.passwordEditText.addTextChangedListener(PasswordValidator())
        ` : '// Validation disabled'}
    }
    
    private fun setupAuth() {
        binding.loginButton.setOnClickListener {
            ${authType === 'email-password' ? 'performEmailLogin()' : 
              authType === 'biometric' ? 'performBiometricLogin()' : 
              authType === 'oauth' ? 'performOAuthLogin()' : 'performSSOLogin()'}
        }
    }
    
    private fun performEmailLogin() {
        val email = binding.emailEditText.text.toString()
        val password = binding.passwordEditText.text.toString()
        
        viewModel.loginWithEmail(email, password) { success ->
            if (success) {
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            } else {
                showError("Login failed")
            }
        }
    }
}`;
}

// Swift Login Generation
function generateSwiftLogin({ authType, includeValidation, designSystem, companyBranding }) {
  return `
import UIKit

class LoginViewController: UIViewController {
    @IBOutlet weak var emailTextField: UITextField!
    @IBOutlet weak var passwordTextField: UITextField!
    @IBOutlet weak var loginButton: UIButton!
    @IBOutlet weak var logoImageView: UIImageView!
    
    private let viewModel = LoginViewModel()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupValidation()
        setupAuth()
    }
    
    private func setupUI() {
        // ${companyBranding ? 'Company branding applied' : 'Standard design'}
        // Design system: ${designSystem}
        ${companyBranding ? `
        logoImageView.image = UIImage(named: "company-logo")
        loginButton.backgroundColor = UIColor(named: "CompanyPrimary")
        ` : ''}
        
        loginButton.layer.cornerRadius = 8
        loginButton.setTitle("Sign In", for: .normal)
    }
    
    private func setupValidation() {
        ${includeValidation ? `
        emailTextField.addTarget(self, action: #selector(emailTextChanged), for: .editingChanged)
        passwordTextField.addTarget(self, action: #selector(passwordTextChanged), for: .editingChanged)
        ` : '// Validation disabled'}
    }
    
    private func setupAuth() {
        loginButton.addTarget(self, action: #selector(loginTapped), for: .touchUpInside)
    }
    
    @objc private func loginTapped() {
        ${authType === 'email-password' ? 'performEmailLogin()' : 
          authType === 'biometric' ? 'performBiometricLogin()' : 
          authType === 'oauth' ? 'performOAuthLogin()' : 'performSSOLogin()'}
    }
    
    private func performEmailLogin() {
        guard let email = emailTextField.text,
              let password = passwordTextField.text else { return }
        
        viewModel.loginWithEmail(email: email, password: password) { [weak self] success in
            DispatchQueue.main.async {
                if success {
                    self?.performSegue(withIdentifier: "showMain", sender: nil)
                } else {
                    self?.showError("Login failed")
                }
            }
        }
    }
}`;
}

// MAUI Login Generation
function generateMAUILogin({ authType, includeValidation, designSystem, companyBranding }) {
  const xamlContent = `<?xml version="1.0" encoding="utf-8" ?>
<ContentPage
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
    x:Class="MobileApp.Pages.LoginPage"
    Style="{StaticResource DefaultPage}"
    xmlns:local="clr-namespace:MobileApp.Helpers"
    xmlns:ext="clr-namespace:MobileApp.Extensions"
    xmlns:controls="clr-namespace:MobileApp.Controls"
    xmlns:ios="clr-namespace:Microsoft.Maui.Controls.PlatformConfiguration.iOSSpecific;assembly=Microsoft.Maui.Controls"
    ios:Page.UseSafeArea="true">

    <ContentPage.Resources>
        <ResourceDictionary>
            <!-- Colors -->
            <Color x:Key="PrimaryBlue">#2196f3</Color>
            <Color x:Key="BackgroundGray">#F3F3F3</Color>
            <Color x:Key="FieldBorderColor">#ced4da</Color>
            <Color x:Key="TextColor">#495057</Color>
            <Color x:Key="PlaceholderColor">#999999</Color>
            <Color x:Key="UserLabelColor">#777777</Color>
            
            <!-- Frame Style -->
            <Style x:Key="LoginFrame" TargetType="Frame">
                <Setter Property="BorderColor" Value="{StaticResource FieldBorderColor}"/>
                <Setter Property="BackgroundColor" Value="White"/>
                <Setter Property="Padding" Value="0"/>
                <Setter Property="Margin" Value="0,5,0,15"/>
                <Setter Property="HeightRequest" Value="40"/>
                <Setter Property="HasShadow" Value="False"/>
                <Setter Property="CornerRadius" Value="4"/>
            </Style>
            
            <!-- Button Style -->
            <Style x:Key="LoginButtonStyle" TargetType="Button">
                <Setter Property="HorizontalOptions" Value="Fill" />
                <Setter Property="VerticalOptions" Value="CenterAndExpand" />
                <Setter Property="BackgroundColor" Value="{StaticResource PrimaryBlue}" />
                <Setter Property="TextColor" Value="White" />
                <Setter Property="FontSize" Value="16" />
                <Setter Property="FontAttributes" Value="Bold" />
                <Setter Property="CornerRadius" Value="4" />
            </Style>

            ${authType === 'oauth' || authType === 'sso' ? `
            <!-- Secondary Button Style for OAuth/SSO -->
            <Style x:Key="SecondaryButtonStyle" TargetType="Button">
                <Setter Property="HorizontalOptions" Value="Fill" />
                <Setter Property="BackgroundColor" Value="Transparent" />
                <Setter Property="TextColor" Value="{StaticResource PrimaryBlue}" />
                <Setter Property="FontSize" Value="16" />
                <Setter Property="BorderColor" Value="{StaticResource PrimaryBlue}" />
                <Setter Property="BorderWidth" Value="1" />
                <Setter Property="CornerRadius" Value="4" />
            </Style>` : ''}
        </ResourceDictionary>
    </ContentPage.Resources>

    <ContentPage.Content>
        <StackLayout Orientation="Vertical" VerticalOptions="FillAndExpand" HorizontalOptions="FillAndExpand">

            <!-- App Bar Placeholder -->
            <ContentView AutomationId="AppBarContent" x:Name="AppBarContent" HorizontalOptions="FillAndExpand" VerticalOptions="Start">
            </ContentView>

            <ScrollView VerticalOptions="FillAndExpand" HorizontalOptions="FillAndExpand">
                <StackLayout Orientation="Vertical" VerticalOptions="FillAndExpand" HorizontalOptions="FillAndExpand">
                    
                    ${includeValidation ? `
                    <!-- Error Messages Stack -->
                    <StackLayout Orientation="Vertical" HorizontalOptions="CenterAndExpand" VerticalOptions="CenterAndExpand" 
                                x:Name="MessagesStack" AutomationId="MessagesStack" IsVisible="False" 
                                Margin="30,30,30,30" MaximumWidthRequest="500">
                        <Frame VerticalOptions="CenterAndExpand" HorizontalOptions="CenterAndExpand" 
                               Padding="0,0,0,0" CornerRadius="10" BackgroundColor="White" 
                               BorderColor="{StaticResource FieldBorderColor}" IsClippedToBounds="True" Margin="0,0,0,0">
                            <Frame VerticalOptions="CenterAndExpand" HorizontalOptions="CenterAndExpand" 
                                   Padding="0,0,0,0" CornerRadius="10" BackgroundColor="White" 
                                   BorderColor="{StaticResource FieldBorderColor}" IsClippedToBounds="True" Margin="5,5,5,5">
                                <Label AutomationId="MessageLabel" x:Name="MessageLabel" FontSize="15" 
                                       HorizontalOptions="CenterAndExpand" VerticalOptions="CenterAndExpand" 
                                       TextColor="{StaticResource TextColor}" Margin="30,30,30,30" />
                            </Frame>
                        </Frame>
                    </StackLayout>` : ''}
                    
                    <!-- Login Controls -->
                    <StackLayout Orientation="Vertical" x:Name="LoginControlsStack" AutomationId="LoginControlsStack" IsVisible="True">
                        
                        ${companyBranding ? `
                        <!-- Logo Section -->
                        <StackLayout Padding="10,50,10,10" VerticalOptions="Start" WidthRequest="300" HorizontalOptions="Center" Margin="0,0,0,10">
                            <Image AutomationId="ImgLogo" x:Name="imgLogo" WidthRequest="300" Source="company_logo.png" />
                        </StackLayout>` : ''}

                        <StackLayout Padding="10,10,10,10" VerticalOptions="StartAndExpand" WidthRequest="300" HorizontalOptions="Center">

                            ${authType === 'biometric' ? `
                            <!-- User Profile Picture for Biometric -->
                            <Border HeightRequest="80" WidthRequest="80" HorizontalOptions="Center" VerticalOptions="Center"
                                    StrokeShape="RoundRectangle 80" Grid.RowSpan="2" Grid.Column="0" Grid.Row="0">
                                <Grid>
                                    <Image AutomationId="UserImg" x:Name="UserImg" WidthRequest="80" HeightRequest="80" 
                                           HorizontalOptions="Center" Source="icon_no_photo.png" Aspect="AspectFit">
                                    </Image>
                                </Grid>
                            </Border>` : ''}

                            <!-- Welcome Message -->
                            <StackLayout x:Name="WelcomeStack" HorizontalOptions="Center" Margin="0,20,0,20">
                                <Label Text="Welcome Back" 
                                       FontSize="28" 
                                       FontAttributes="Bold"
                                       HorizontalOptions="Center"
                                       TextColor="{StaticResource TextColor}" />
                                ${authType === 'biometric' ? `
                                <Label AutomationId="UsernameLabel" x:Name="UsernameLabel" Margin="0,10,0,0" 
                                       FontSize="20" TextColor="{StaticResource UserLabelColor}" 
                                       HorizontalOptions="Center" />` : ''}
                            </StackLayout>

                            ${authType === 'email-password' ? `
                            <!-- Email Field -->
                            <StackLayout x:Name="EmailStack" HeightRequest="49" Margin="0,10,0,0">
                                <Frame Style="{StaticResource LoginFrame}">
                                    <Entry TextColor="{StaticResource TextColor}" AutomationId="EmailEntry" x:Name="EmailEntry" 
                                           Placeholder="Email" Keyboard="Email" PlaceholderColor="{StaticResource PlaceholderColor}"
                                           ${includeValidation ? 'TextChanged="OnEmailTextChanged"' : ''}/>
                                </Frame>
                            </StackLayout>

                            <!-- Password Field -->
                            <Frame Style="{StaticResource LoginFrame}" x:Name="PasswordFrame">
                                <Entry TextColor="{StaticResource TextColor}" AutomationId="PasswordEntry" x:Name="PasswordEntry" 
                                       Placeholder="Password" IsPassword="True" PlaceholderColor="{StaticResource PlaceholderColor}"
                                       ${includeValidation ? 'TextChanged="OnPasswordTextChanged"' : ''}/>
                            </Frame>` : ''}

                            ${authType === 'biometric' ? `
                            <!-- Biometric Login Button -->
                            <Frame Style="{StaticResource LoginFrame}" Margin="0,25,0,0">
                                <Button AutomationId="BiometricLoginBtn" x:Name="BiometricLoginBtn" 
                                        Text="Use Biometric Login" 
                                        Style="{StaticResource LoginButtonStyle}" 
                                        Clicked="OnBiometricLoginClicked" />
                            </Frame>

                            <!-- PIN Field (fallback) -->
                            <Frame Style="{StaticResource LoginFrame}" x:Name="PinFrame" Margin="0,25,0,0" IsVisible="false">
                                <Entry TextColor="{StaticResource TextColor}" AutomationId="PinEntry" x:Name="PinEntry" 
                                       Placeholder="PIN" IsPassword="True" Keyboard="Numeric" PlaceholderColor="{StaticResource PlaceholderColor}"/>
                            </Frame>` : ''}

                            ${authType === 'email-password' || authType === 'biometric' ? `
                            <!-- Login Button -->
                            <Frame AutomationId="BtnLoginFrame" x:Name="BtnLoginFrame" Style="{StaticResource LoginFrame}" Margin="0,25,0,0">
                                <Button AutomationId="BtnLogin" x:Name="BtnLogin" 
                                        Text="${authType === 'biometric' ? 'Sign In with PIN' : 'Sign In'}" 
                                        Style="{StaticResource LoginButtonStyle}" 
                                        Clicked="OnLoginClicked" />
                            </Frame>` : ''}

                            ${authType === 'oauth' ? `
                            <!-- OAuth Login -->
                            <StackLayout x:Name="OAuthLoginContainer" Margin="0,20,0,0">
                                <Frame Style="{StaticResource LoginFrame}" AutomationId="OAuthLoginFrame" x:Name="OAuthLoginFrame" 
                                       BorderColor="{StaticResource TextColor}">
                                    <Button AutomationId="OAuthLoginBtn" x:Name="OAuthLoginBtn" 
                                            Text="Sign in with Google" 
                                            Style="{StaticResource SecondaryButtonStyle}"
                                            Clicked="OnOAuthLoginClicked" />
                                </Frame>
                                
                                <Frame Style="{StaticResource LoginFrame}" AutomationId="MicrosoftLoginFrame" x:Name="MicrosoftLoginFrame" 
                                       BorderColor="{StaticResource TextColor}">
                                    <StackLayout HorizontalOptions="Fill" VerticalOptions="Fill" Orientation="Horizontal">
                                        <Image AutomationId="ImgMsLogo" x:Name="ImgMsLogo" WidthRequest="21" HeightRequest="21" 
                                               Margin="10,0,5,0" Source="ic_ms_logo.png" />
                                        <Label AutomationId="MsLoginLabel" x:Name="MsLoginLabel" Text="Sign in with Microsoft" 
                                               HorizontalOptions="FillAndExpand" VerticalOptions="FillAndExpand" VerticalTextAlignment="Center"  
                                               FontSize="16" BackgroundColor="White" TextColor="{StaticResource TextColor}" HeightRequest="40" />
                                    </StackLayout>
                                </Frame>
                            </StackLayout>` : ''}

                            ${authType === 'sso' ? `
                            <!-- SSO Login -->
                            <Frame Style="{StaticResource LoginFrame}" AutomationId="SsoLoginFrame" x:Name="SsoLoginFrame"  
                                   Margin="0,20,0,0" BorderColor="{StaticResource TextColor}">
                                <StackLayout HorizontalOptions="Fill" VerticalOptions="Fill" Orientation="Horizontal">
                                    ${companyBranding ? `
                                    <Image AutomationId="ImgCompanyLogo" x:Name="ImgCompanyLogo" WidthRequest="21" HeightRequest="21" 
                                           Margin="10,0,5,0" Source="company_icon.png" />` : ''}
                                    <Label AutomationId="SsoLoginLabel" x:Name="SsoLoginLabel" Text="Sign-in with SSO" 
                                           HorizontalOptions="FillAndExpand" VerticalOptions="FillAndExpand" VerticalTextAlignment="Center"  
                                           FontSize="16" BackgroundColor="White" TextColor="{StaticResource TextColor}" HeightRequest="40" />
                                </StackLayout>
                            </Frame>` : ''}

                            <!-- Additional Options -->
                            <StackLayout x:Name="OptionsStack" HorizontalOptions="Center" Margin="0,20,0,0">
                                ${authType === 'biometric' ? `
                                <Label AutomationId="ChangeUser" x:Name="ChangeUser" Text="Log in as a different user" 
                                       TextColor="{StaticResource PrimaryBlue}" FontSize="16" />
                                
                                <Label AutomationId="StoredUser" x:Name="StoredUser" Text="Use last logged account" 
                                       TextColor="{StaticResource PrimaryBlue}" FontSize="16" Margin="0,10,0,0" />` : ''}
                                
                                ${includeValidation ? `
                                <Label AutomationId="ForgotPassword" x:Name="ForgotPassword" Text="Forgot Password?" 
                                       TextColor="{StaticResource PrimaryBlue}" FontSize="16" Margin="0,10,0,0" />` : ''}
                            </StackLayout>

                        </StackLayout>
                    </StackLayout>
                </StackLayout>
            </ScrollView>
        </StackLayout>
    </ContentPage.Content>
</ContentPage>`;

  const codeContent = `using System;
using System.Threading.Tasks;
using Microsoft.Maui.Controls;
${authType === 'biometric' ? 'using Microsoft.Maui.Authentication.WebAuthenticator;' : ''}
${authType === 'oauth' ? 'using Microsoft.Maui.Authentication.WebAuthenticator;' : ''}

namespace MobileApp.Pages
{
    public partial class LoginPage : ContentPage
    {
        #region Properties
        
        private bool _isBusy = false;
        public bool IsBusy
        {
            get => _isBusy;
            set
            {
                _isBusy = value;
                ${authType === 'email-password' || authType === 'biometric' ? `
                BtnLogin.IsEnabled = !value;
                BtnLogin.Text = value ? "Signing in..." : "${authType === 'biometric' ? 'Sign In with PIN' : 'Sign In'}";` : ''}
            }
        }

        ${authType === 'biometric' ? `
        private string LastLoggedUserName = string.Empty;` : ''}
        
        #endregion

        #region Constructor

        public LoginPage()
        {
            InitializeComponent();
            InitializeControls();
        }

        #endregion

        #region Private Methods

        private void InitializeControls()
        {
            try
            {
                NavigationPage.SetHasBackButton(this, false);
                NavigationPage.SetHasNavigationBar(this, false);

                ${companyBranding ? `
                // Set logo source
                imgLogo.Source = "company_logo.png";` : ''}

                // Wire up event handlers
                SetupEventHandlers();
                
                ${authType === 'biometric' ? `
                // Load last logged user
                LoadLastLoggedUser();` : ''}
            }
            catch (Exception ex)
            {
                DisplayAlert("Error", $"Failed to initialize: {ex.Message}", "OK");
            }
        }

        private void SetupEventHandlers()
        {
            ${authType === 'email-password' ? `
            BtnLogin.Clicked += OnLoginClicked;` : ''}
            
            ${authType === 'biometric' ? `
            BiometricLoginBtn.Clicked += OnBiometricLoginClicked;
            BtnLogin.Clicked += OnPinLoginClicked;
            ChangeUser.GestureRecognizers.Add(new TapGestureRecognizer 
            { 
                Command = new Command(OnChangeUserTapped) 
            });
            StoredUser.GestureRecognizers.Add(new TapGestureRecognizer 
            { 
                Command = new Command(OnStoredUserTapped) 
            });` : ''}
            
            ${authType === 'oauth' ? `
            OAuthLoginBtn.Clicked += OnOAuthLoginClicked;` : ''}
            
            ${authType === 'sso' ? `
            var ssoTapGesture = new TapGestureRecognizer();
            ssoTapGesture.Tapped += OnSsoLoginTapped;
            SsoLoginFrame.GestureRecognizers.Add(ssoTapGesture);` : ''}
            
            ${includeValidation ? `
            ForgotPassword.GestureRecognizers.Add(new TapGestureRecognizer 
            { 
                Command = new Command(OnForgotPasswordTapped) 
            });` : ''}
        }

        ${authType === 'biometric' ? `
        private async void LoadLastLoggedUser()
        {
            try
            {
                // Load from secure storage
                LastLoggedUserName = await SecureStorage.GetAsync("LastLoggedUser") ?? string.Empty;
                if (!string.IsNullOrEmpty(LastLoggedUserName))
                {
                    UsernameLabel.Text = LastLoggedUserName;
                    StoredUser.IsVisible = true;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error loading last logged user: {ex.Message}");
            }
        }` : ''}

        #endregion

        #region Event Handlers

        ${authType === 'email-password' ? `
        private async void OnLoginClicked(object sender, EventArgs e)
        {
            if (IsBusy) return;

            try
            {
                IsBusy = true;
                
                ${includeValidation ? `
                if (!ValidateInputs())
                {
                    IsBusy = false;
                    return;
                }` : ''}

                var email = EmailEntry.Text?.Trim();
                var password = PasswordEntry.Text;

                // Perform login
                var loginResult = await PerformEmailPasswordLogin(email, password);
                
                if (loginResult.Success)
                {
                    // Navigate to main page
                    await Shell.Current.GoToAsync("//main");
                }
                else
                {
                    await DisplayAlert("Login Failed", loginResult.ErrorMessage, "OK");
                }
            }
            catch (Exception ex)
            {
                await DisplayAlert("Error", $"Login failed: {ex.Message}", "OK");
            }
            finally
            {
                IsBusy = false;
            }
        }` : ''}

        ${authType === 'biometric' ? `
        private async void OnBiometricLoginClicked(object sender, EventArgs e)
        {
            try
            {
                var result = await PerformBiometricAuthentication();
                
                if (result.Success)
                {
                    await Shell.Current.GoToAsync("//main");
                }
                else
                {
                    // Show PIN entry as fallback
                    PinFrame.IsVisible = true;
                    BiometricLoginBtn.Text = "Use PIN Instead";
                }
            }
            catch (Exception ex)
            {
                await DisplayAlert("Error", $"Biometric authentication failed: {ex.Message}", "OK");
            }
        }

        private async void OnPinLoginClicked(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(PinEntry.Text))
            {
                await DisplayAlert("Error", "Please enter your PIN", "OK");
                return;
            }

            var result = await PerformPinLogin(PinEntry.Text);
            
            if (result.Success)
            {
                await Shell.Current.GoToAsync("//main");
            }
            else
            {
                await DisplayAlert("Error", "Invalid PIN", "OK");
            }
        }` : ''}

        ${authType === 'oauth' ? `
        private async void OnOAuthLoginClicked(object sender, EventArgs e)
        {
            try
            {
                var result = await PerformOAuthLogin("google");
                
                if (result.Success)
                {
                    await Shell.Current.GoToAsync("//main");
                }
                else
                {
                    await DisplayAlert("Login Failed", result.ErrorMessage, "OK");
                }
            }
            catch (Exception ex)
            {
                await DisplayAlert("Error", $"OAuth login failed: {ex.Message}", "OK");
            }
        }` : ''}

        ${authType === 'sso' ? `
        private async void OnSsoLoginTapped(object sender, EventArgs e)
        {
            try
            {
                var result = await PerformSsoLogin();
                
                if (result.Success)
                {
                    await Shell.Current.GoToAsync("//main");
                }
                else
                {
                    await DisplayAlert("Login Failed", result.ErrorMessage, "OK");
                }
            }
            catch (Exception ex)
            {
                await DisplayAlert("Error", $"SSO login failed: {ex.Message}", "OK");
            }
        }` : ''}

        ${includeValidation ? `
        private void OnEmailTextChanged(object sender, TextChangedEventArgs e)
        {
            // Real-time email validation
            var email = e.NewTextValue;
            var isValid = IsValidEmail(email);
            
            // Update UI based on validation
            EmailEntry.TextColor = isValid ? Color.FromArgb("#495057") : Color.FromArgb("#f44336");
        }

        private void OnPasswordTextChanged(object sender, TextChangedEventArgs e)
        {
            // Real-time password validation
            var password = e.NewTextValue;
            var isValid = !string.IsNullOrEmpty(password) && password.Length >= 6;
            
            // Update UI based on validation
            PasswordEntry.TextColor = isValid ? Color.FromArgb("#495057") : Color.FromArgb("#f44336");
        }

        private void OnForgotPasswordTapped()
        {
            // Navigate to forgot password page
            Shell.Current.GoToAsync("//forgotpassword");
        }` : ''}

        #endregion

        #region Authentication Methods

        ${authType === 'email-password' ? `
        private async Task<LoginResult> PerformEmailPasswordLogin(string email, string password)
        {
            // Implement your email/password authentication logic here
            // This could call your API service
            
            await Task.Delay(1000); // Simulate network call
            
            // Replace with actual authentication logic
            if (email == "admin@company.com" && password == "password123")
            {
                return new LoginResult { Success = true };
            }
            
            return new LoginResult { Success = false, ErrorMessage = "Invalid credentials" };
        }` : ''}

        ${authType === 'biometric' ? `
        private async Task<LoginResult> PerformBiometricAuthentication()
        {
            try
            {
                var result = await BiometricAuthenticationService.GetAvailabilityAsync();
                
                if (result == BiometricAuthenticationStatus.Available)
                {
                    var authResult = await BiometricAuthenticationService.AuthenticateAsync(
                        new BiometricAuthenticationRequest
                        {
                            Title = "Authenticate",
                            Subtitle = "Use your biometric to authenticate",
                            Description = "Place your finger on the sensor or look at the camera",
                            FallbackTitle = "Use PIN",
                            NegativeText = "Cancel"
                        });

                    return new LoginResult { Success = authResult.Status == BiometricAuthenticationStatus.Succeeded };
                }
                
                return new LoginResult { Success = false, ErrorMessage = "Biometric authentication not available" };
            }
            catch (Exception ex)
            {
                return new LoginResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        private async Task<LoginResult> PerformPinLogin(string pin)
        {
            // Implement PIN validation logic
            await Task.Delay(500);
            
            // Replace with actual PIN validation
            var storedPin = await SecureStorage.GetAsync("UserPin");
            
            return new LoginResult 
            { 
                Success = pin == storedPin,
                ErrorMessage = pin != storedPin ? "Invalid PIN" : null
            };
        }` : ''}

        ${authType === 'oauth' ? `
        private async Task<LoginResult> PerformOAuthLogin(string provider)
        {
            try
            {
                WebAuthenticatorResult authResult = null;
                
                if (provider == "google")
                {
                    authResult = await WebAuthenticator.AuthenticateAsync(
                        new WebAuthenticatorOptions
                        {
                            Url = new Uri("https://accounts.google.com/oauth/authorize?..."),
                            CallbackUrl = new Uri("myapp://authenticated")
                        });
                }
                
                if (authResult != null)
                {
                    // Process the authentication result
                    var accessToken = authResult.AccessToken;
                    
                    // Call your backend to exchange token
                    return await ExchangeOAuthToken(accessToken, provider);
                }
                
                return new LoginResult { Success = false, ErrorMessage = "OAuth authentication failed" };
            }
            catch (Exception ex)
            {
                return new LoginResult { Success = false, ErrorMessage = ex.Message };
            }
        }` : ''}

        ${authType === 'sso' ? `
        private async Task<LoginResult> PerformSsoLogin()
        {
            try
            {
                // Implement SSO authentication logic
                // This typically involves redirecting to your SSO provider
                
                var authResult = await WebAuthenticator.AuthenticateAsync(
                    new WebAuthenticatorOptions
                    {
                        Url = new Uri("https://your-sso-provider.com/auth"),
                        CallbackUrl = new Uri("myapp://authenticated")
                    });
                
                if (authResult != null)
                {
                    var token = authResult.AccessToken;
                    return await ValidateSsoToken(token);
                }
                
                return new LoginResult { Success = false, ErrorMessage = "SSO authentication failed" };
            }
            catch (Exception ex)
            {
                return new LoginResult { Success = false, ErrorMessage = ex.Message };
            }
        }` : ''}

        #endregion

        #region Validation Methods

        ${includeValidation ? `
        private bool ValidateInputs()
        {
            ${authType === 'email-password' ? `
            var email = EmailEntry.Text?.Trim();
            var password = PasswordEntry.Text;

            if (string.IsNullOrEmpty(email))
            {
                DisplayAlert("Validation Error", "Please enter your email", "OK");
                return false;
            }

            if (!IsValidEmail(email))
            {
                DisplayAlert("Validation Error", "Please enter a valid email address", "OK");
                return false;
            }

            if (string.IsNullOrEmpty(password))
            {
                DisplayAlert("Validation Error", "Please enter your password", "OK");
                return false;
            }

            if (password.Length < 6)
            {
                DisplayAlert("Validation Error", "Password must be at least 6 characters", "OK");
                return false;
            }` : ''}

            return true;
        }

        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
                return false;

            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }` : ''}

        #endregion
    }

    #region Helper Classes

    public class LoginResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }

    #endregion
}`;

  return {
    xaml: xamlContent,
    codeFile: codeContent,
    additionalFiles: [
      {
        name: "Colors.xaml",
        content: generateMAUIColors()
      },
      {
        name: "Styles.xaml", 
        content: generateMAUIStyles()
      }
    ]
  };
}

// Helper functions for MAUI ResourceDictionary files
function generateMAUIColors() {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<ResourceDictionary 
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml">

    <!-- Company Color Palette -->
    
    <!-- Primary Blue Colors -->
    <Color x:Key="PrimaryBlue">#2196f3</Color>
    <Color x:Key="BlueLight">#e3f2fd</Color>
    <Color x:Key="Blue100">#bbdefb</Color>
    <Color x:Key="Blue200">#90caf9</Color>
    <Color x:Key="Blue300">#64b5f6</Color>
    <Color x:Key="Blue500">#2196f3</Color>
    
    <!-- Blue Grey Colors -->
    <Color x:Key="BlueGrey900">#263238</Color>
    <Color x:Key="BlueGrey700">#455A64</Color>
    <Color x:Key="BlueGrey500">#607d8b</Color>
    <Color x:Key="BlueGrey300">#90A4AE</Color>
    <Color x:Key="BlueGrey200">#B0BEC5</Color>
    <Color x:Key="BlueGrey100">#CFD8DC</Color>
    <Color x:Key="BlueGrey50">#ECEFF1</Color>
    
    <!-- Grey Colors -->
    <Color x:Key="Grey400">#BDBDBD</Color>
    <Color x:Key="Grey300">#E0E0E0</Color>
    <Color x:Key="Grey200">#EEEEEE</Color>
    <Color x:Key="Grey100">#F5F5F5</Color>
    
    <!-- Orange Colors -->
    <Color x:Key="Orange50">#fff3e0</Color>
    <Color x:Key="Orange100">#FFE0B2</Color>
    <Color x:Key="Orange500">#ff9800</Color>
    <Color x:Key="Orange600">#FB8C00</Color>
    
    <!-- Semantic Colors -->
    <Color x:Key="BackgroundColor">#F3F3F3</Color>
    <Color x:Key="SurfaceColor">#ffffff</Color>
    <Color x:Key="TextPrimary">#495057</Color>
    <Color x:Key="TextSecondary">#777777</Color>
    <Color x:Key="TextPlaceholder">#999999</Color>
    <Color x:Key="BorderColor">#ced4da</Color>
    <Color x:Key="SelectedItemColor">#FFE0B2</Color>
    
    <!-- Validation Colors -->
    <Color x:Key="ErrorColor">#f44336</Color>
    <Color x:Key="WarningColor">#ff9800</Color>
    <Color x:Key="SuccessColor">#4caf50</Color>
    <Color x:Key="InfoColor">#2196f3</Color>
    
</ResourceDictionary>`;
}

function generateMAUIStyles() {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<ResourceDictionary 
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml">

    <!-- Page Styles -->
    <Style x:Key="DefaultPage" TargetType="ContentPage">
        <Setter Property="BackgroundColor" Value="{StaticResource BackgroundColor}" />
    </Style>

    <!-- Frame Styles -->
    <Style x:Key="EnabledFrame" TargetType="Frame">
        <Setter Property="BorderColor" Value="{StaticResource BorderColor}"/>
        <Setter Property="BackgroundColor" Value="{StaticResource SurfaceColor}"/>
        <Setter Property="Padding" Value="0"/>
        <Setter Property="Margin" Value="0,0,0,10"/>
        <Setter Property="HeightRequest" Value="40"/>
        <Setter Property="HasShadow" Value="False"/>
        <Setter Property="CornerRadius" Value="4"/>
    </Style>

    <Style x:Key="LoginFrame" TargetType="Frame" BasedOn="{StaticResource EnabledFrame}">
        <Setter Property="Margin" Value="0,5,0,15"/>
    </Style>

    <!-- Button Styles -->
    <Style x:Key="ButtonStyle" TargetType="Button">
        <Setter Property="HorizontalOptions" Value="Fill" />
        <Setter Property="VerticalOptions" Value="CenterAndExpand" />
        <Setter Property="BackgroundColor" Value="{StaticResource PrimaryBlue}" />
        <Setter Property="TextColor" Value="White" />
        <Setter Property="FontSize" Value="16" />
        <Setter Property="CornerRadius" Value="4" />
        <Setter Property="FontAttributes" Value="Bold" />
    </Style>

    <Style x:Key="ButtonStyleDisabled" TargetType="Button">
        <Setter Property="HorizontalOptions" Value="Fill" />
        <Setter Property="VerticalOptions" Value="CenterAndExpand" />
        <Setter Property="BackgroundColor" Value="{StaticResource Grey300}" />
        <Setter Property="TextColor" Value="{StaticResource TextSecondary}" />
        <Setter Property="FontSize" Value="16" />
        <Setter Property="CornerRadius" Value="4" />
    </Style>

    <Style x:Key="SecondaryButtonStyle" TargetType="Button">
        <Setter Property="HorizontalOptions" Value="Fill" />
        <Setter Property="VerticalOptions" Value="CenterAndExpand" />
        <Setter Property="BackgroundColor" Value="Transparent" />
        <Setter Property="TextColor" Value="{StaticResource PrimaryBlue}" />
        <Setter Property="FontSize" Value="16" />
        <Setter Property="BorderColor" Value="{StaticResource PrimaryBlue}" />
        <Setter Property="BorderWidth" Value="1" />
        <Setter Property="CornerRadius" Value="4" />
    </Style>

    <!-- Entry Styles -->
    <Style x:Key="EntryStyle" TargetType="Entry">
        <Setter Property="TextColor" Value="{StaticResource TextPrimary}" />
        <Setter Property="PlaceholderColor" Value="{StaticResource TextPlaceholder}" />
        <Setter Property="FontSize" Value="16" />
        <Setter Property="HeightRequest" Value="40" />
    </Style>

    <!-- Label Styles -->
    <Style x:Key="TitleLabelStyle" TargetType="Label">
        <Setter Property="FontSize" Value="28" />
        <Setter Property="FontAttributes" Value="Bold" />
        <Setter Property="TextColor" Value="{StaticResource TextPrimary}" />
        <Setter Property="HorizontalOptions" Value="Center" />
    </Style>

    <Style x:Key="SubtitleLabelStyle" TargetType="Label">
        <Setter Property="FontSize" Value="16" />
        <Setter Property="TextColor" Value="{StaticResource TextSecondary}" />
        <Setter Property="HorizontalOptions" Value="Center" />
    </Style>

    <Style x:Key="LinkLabelStyle" TargetType="Label">
        <Setter Property="FontSize" Value="16" />
        <Setter Property="TextColor" Value="{StaticResource PrimaryBlue}" />
        <Setter Property="HorizontalOptions" Value="Center" />
    </Style>

</ResourceDictionary>`;
}
function generateReactNativeLogin({ authType, includeValidation, designSystem, companyBranding }) {
  return `
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    ${includeValidation ? `
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
    ` : 'return true;'}
  };

  const handleLogin = async () => {
    ${includeValidation ? `
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    ` : ''}

    try {
      ${authType === 'email-password' ? `
      const response = await loginWithEmail(email, password);
      ` : authType === 'biometric' ? `
      const response = await loginWithBiometric();
      ` : authType === 'oauth' ? `
      const response = await loginWithOAuth();
      ` : `
      const response = await loginWithSSO();
      `}
      
      if (response.success) {
        // Navigate to main screen
      } else {
        Alert.alert('Error', 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    }
  };

  return (
    <View style={styles.container}>
      ${companyBranding ? `
      <Image 
        source={require('../assets/company-logo.png')} 
        style={styles.logo} 
      />
      ` : ''}
      
      <Text style={[styles.title, ${companyBranding ? 'styles.brandedTitle' : ''}]}>
        Welcome Back
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, ${companyBranding ? 'styles.brandedButton' : ''}]}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  ${companyBranding ? `
  brandedTitle: {
    color: '#1976D2', // Company primary color
  },
  brandedButton: {
    backgroundColor: '#1976D2', // Company primary color
  },
  ` : ''}
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;`;
}

// SQLite generation functions (simplified for brevity)
function generateKotlinSQLite({ entities, includeRepository, includeMigrations, cacheStrategy }) {
  return `@Database(entities = [${entities.join(', ')}], version = 1)
abstract class AppDatabase : RoomDatabase() {
    // Database implementation for Kotlin
    // Entities: ${entities.join(', ')}
    // Repository: ${includeRepository}
    // Migrations: ${includeMigrations}
    // Cache: ${cacheStrategy}
}`;
}

function generateSwiftSQLite({ entities, includeRepository, includeMigrations, cacheStrategy }) {
  return `import SQLite3

class DatabaseManager {
    // SQLite implementation for Swift
    // Entities: ${entities.join(', ')}
    // Repository: ${includeRepository}
    // Migrations: ${includeMigrations}
    // Cache: ${cacheStrategy}
}`;
}

function generateMAUISQLite({ entities, includeRepository, includeMigrations, cacheStrategy }) {
  return `using SQLite;

public class DatabaseContext {
    // SQLite implementation for MAUI
    // Entities: ${entities.join(', ')}
    // Repository: ${includeRepository}
    // Migrations: ${includeMigrations}
    // Cache: ${cacheStrategy}
}`;
}

function generateReactNativeSQLite({ entities, includeRepository, includeMigrations, cacheStrategy }) {
  return `import SQLite from 'react-native-sqlite-storage';

class DatabaseManager {
    // SQLite implementation for React Native
    // Entities: ${entities.join(', ')}
    // Repository: ${includeRepository}
    // Migrations: ${includeMigrations}
    // Cache: ${cacheStrategy}
}`;
}

// Offline generation functions (simplified for brevity)
function generateKotlinOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem }) {
  return `class OfflineManager {
    // Offline implementation for Kotlin
    // Sync: ${syncStrategy}
    // Conflicts: ${conflictResolution}
    // Network Detection: ${includeNetworkDetection}
    // Queue System: ${includeQueueSystem}
}`;
}

function generateSwiftOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem }) {
  return `class OfflineManager {
    // Offline implementation for Swift
    // Sync: ${syncStrategy}
    // Conflicts: ${conflictResolution}
    // Network Detection: ${includeNetworkDetection}
    // Queue System: ${includeQueueSystem}
}`;
}

function generateMAUIOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem }) {
  return `public class OfflineService {
    // Offline implementation for MAUI
    // Sync: ${syncStrategy}
    // Conflicts: ${conflictResolution}
    // Network Detection: ${includeNetworkDetection}
    // Queue System: ${includeQueueSystem}
}`;
}

function generateReactNativeOffline({ syncStrategy, conflictResolution, includeNetworkDetection, includeQueueSystem }) {
  return `class OfflineManager {
    // Offline implementation for React Native
    // Sync: ${syncStrategy}
    // Conflicts: ${conflictResolution}
    // Network Detection: ${includeNetworkDetection}
    // Queue System: ${includeQueueSystem}
}`;
}

// Main server initialization function
async function startServer() {
  // Create transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  // Connect server to transport
  await server.connect(transport);

  // Create HTTP server
  const httpServer = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle MCP endpoint
    if (req.url === '/mcp' || req.url?.startsWith('/mcp')) {
      // Parse request body for POST requests
      let body = null;
      if (req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks);
        try {
          body = JSON.parse(rawBody.toString());
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
      }

      // Handle request with transport
      await transport.handleRequest(req, res, body);
      return;
    }

    // Handle root endpoint
    if (req.url === '/' || req.url === '') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        name: 'Mobile Development MCP Server',
        version: '1.0.0',
        status: 'running',
        endpoints: ['/mcp']
      }));
      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  // Start server
  const port = process.env.PORT || 2205;
  const host = process.env.HOST || '0.0.0.0';

  httpServer.listen(port, host, () => {
    console.log(`🚀 MCP Server running on http://${host}:${port}`);
    console.log('✅ Ready to accept connections');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(console.error);
