import http from 'http';
import crypto from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { MAUILoginGenerator } from './generators/MAUILoginGenerator.js';
// Multi-platform generators
import { KotlinGenerator } from './generators/platforms/KotlinGenerator.js';
import { SwiftGenerator } from './generators/platforms/SwiftGenerator.js';
import { ReactNativeGenerator } from './generators/platforms/ReactNativeGenerator.js';

// Initialize generators
const mauiLoginGenerator = new MAUILoginGenerator();
const kotlinGenerator = new KotlinGenerator();
const swiftGenerator = new SwiftGenerator();
const reactNativeGenerator = new ReactNativeGenerator();

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
            // Kotlin/Android tools
            {
                name: 'generate-kotlin-login',
                description: 'Generate complete login flow for Kotlin Android apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        authType: {
                            type: 'string',
                            enum: ['email-password', 'biometric', 'oauth', 'sso'],
                            default: 'email-password',
                            description: 'Authentication type',
                        },
                        includeValidation: {
                            type: 'boolean',
                            default: true,
                            description: 'Include form validation',
                        },
                        designSystem: {
                            type: 'string',
                            enum: ['material', 'cupertino', 'custom'],
                            default: 'material',
                            description: 'Design system to follow',
                        },
                        companyBranding: {
                            type: 'boolean',
                            default: true,
                            description: 'Include company branding elements',
                        },
                    },
                },
            },
            {
                name: 'generate-kotlin-sqlite',
                description: 'Generate SQLite database setup for Kotlin Android apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Database entities/tables to create',
                        },
                        includeRepository: {
                            type: 'boolean',
                            default: true,
                            description: 'Include repository pattern',
                        },
                        includeMigrations: {
                            type: 'boolean',
                            default: true,
                            description: 'Include database migrations',
                        },
                        cacheStrategy: {
                            type: 'string',
                            enum: ['none', 'memory', 'disk'],
                            default: 'memory',
                            description: 'Caching strategy',
                        },
                    },
                    required: ['entities'],
                },
            },
            {
                name: 'generate-kotlin-offline',
                description: 'Generate offline functionality for Kotlin Android apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        syncStrategy: {
                            type: 'string',
                            enum: ['immediate', 'periodic', 'manual'],
                            default: 'periodic',
                            description: 'Data synchronization strategy',
                        },
                        conflictResolution: {
                            type: 'string',
                            enum: ['client-wins', 'server-wins', 'manual'],
                            default: 'server-wins',
                            description: 'Conflict resolution strategy',
                        },
                        includeNetworkDetection: {
                            type: 'boolean',
                            default: true,
                            description: 'Include network connectivity detection',
                        },
                        includeQueueSystem: {
                            type: 'boolean',
                            default: true,
                            description: 'Include request queue for offline operations',
                        },
                    },
                },
            },
            // Swift/iOS tools
            {
                name: 'generate-swift-login',
                description: 'Generate complete login flow for Swift iOS apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        authType: {
                            type: 'string',
                            enum: ['email-password', 'biometric', 'oauth', 'sso'],
                            default: 'email-password',
                            description: 'Authentication type',
                        },
                        includeValidation: {
                            type: 'boolean',
                            default: true,
                            description: 'Include form validation',
                        },
                        designSystem: {
                            type: 'string',
                            enum: ['material', 'cupertino', 'custom'],
                            default: 'cupertino',
                            description: 'Design system to follow',
                        },
                        companyBranding: {
                            type: 'boolean',
                            default: true,
                            description: 'Include company branding elements',
                        },
                    },
                },
            },
            {
                name: 'generate-swift-sqlite',
                description: 'Generate Core Data setup for Swift iOS apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Database entities/tables to create',
                        },
                        includeRepository: {
                            type: 'boolean',
                            default: true,
                            description: 'Include repository pattern',
                        },
                        includeMigrations: {
                            type: 'boolean',
                            default: true,
                            description: 'Include database migrations',
                        },
                        cacheStrategy: {
                            type: 'string',
                            enum: ['none', 'memory', 'disk'],
                            default: 'memory',
                            description: 'Caching strategy',
                        },
                    },
                    required: ['entities'],
                },
            },
            {
                name: 'generate-swift-offline',
                description: 'Generate offline functionality for Swift iOS apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        syncStrategy: {
                            type: 'string',
                            enum: ['immediate', 'periodic', 'manual'],
                            default: 'periodic',
                            description: 'Data synchronization strategy',
                        },
                        conflictResolution: {
                            type: 'string',
                            enum: ['client-wins', 'server-wins', 'manual'],
                            default: 'server-wins',
                            description: 'Conflict resolution strategy',
                        },
                        includeNetworkDetection: {
                            type: 'boolean',
                            default: true,
                            description: 'Include network connectivity detection',
                        },
                        includeQueueSystem: {
                            type: 'boolean',
                            default: true,
                            description: 'Include request queue for offline operations',
                        },
                    },
                },
            },
            // React Native tools
            {
                name: 'generate-react-native-login',
                description: 'Generate complete login flow for React Native apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        authType: {
                            type: 'string',
                            enum: ['email-password', 'biometric', 'oauth', 'sso'],
                            default: 'email-password',
                            description: 'Authentication type',
                        },
                        includeValidation: {
                            type: 'boolean',
                            default: true,
                            description: 'Include form validation',
                        },
                        designSystem: {
                            type: 'string',
                            enum: ['material', 'cupertino', 'custom'],
                            default: 'material',
                            description: 'Design system to follow',
                        },
                        companyBranding: {
                            type: 'boolean',
                            default: true,
                            description: 'Include company branding elements',
                        },
                    },
                },
            },
            {
                name: 'generate-react-native-sqlite',
                description: 'Generate SQLite database setup for React Native apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Database entities/tables to create',
                        },
                        includeRepository: {
                            type: 'boolean',
                            default: true,
                            description: 'Include repository pattern',
                        },
                        includeMigrations: {
                            type: 'boolean',
                            default: true,
                            description: 'Include database migrations',
                        },
                        cacheStrategy: {
                            type: 'string',
                            enum: ['none', 'memory', 'disk'],
                            default: 'memory',
                            description: 'Caching strategy',
                        },
                    },
                    required: ['entities'],
                },
            },
            {
                name: 'generate-react-native-offline',
                description: 'Generate offline functionality for React Native apps',
                inputSchema: {
                    type: 'object',
                    properties: {
                        syncStrategy: {
                            type: 'string',
                            enum: ['immediate', 'periodic', 'manual'],
                            default: 'periodic',
                            description: 'Data synchronization strategy',
                        },
                        conflictResolution: {
                            type: 'string',
                            enum: ['client-wins', 'server-wins', 'manual'],
                            default: 'server-wins',
                            description: 'Conflict resolution strategy',
                        },
                        includeNetworkDetection: {
                            type: 'boolean',
                            default: true,
                            description: 'Include network connectivity detection',
                        },
                        includeQueueSystem: {
                            type: 'boolean',
                            default: true,
                            description: 'Include request queue for offline operations',
                        },
                    },
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

        // Kotlin/Android tools
        case 'generate-kotlin-login': {
            const options = args;
            try {
                const result = kotlinGenerator.generateLogin(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated Kotlin login flow with ${options.authType || 'email-password'} authentication:\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating Kotlin login: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        case 'generate-kotlin-sqlite': {
            const options = args;
            try {
                const result = kotlinGenerator.generateSQLiteSetup(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated Kotlin SQLite setup for entities: ${options.entities.join(', ')}\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating Kotlin SQLite setup: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        case 'generate-kotlin-offline': {
            const options = args;
            try {
                const result = kotlinGenerator.generateOfflineSetup(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated Kotlin offline functionality with ${options.syncStrategy || 'periodic'} sync strategy:\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating Kotlin offline setup: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        // Swift/iOS tools
        case 'generate-swift-login': {
            const options = args;
            try {
                const result = swiftGenerator.generateLogin(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated Swift login flow with ${options.authType || 'email-password'} authentication:\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating Swift login: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        case 'generate-swift-sqlite': {
            const options = args;
            try {
                const result = swiftGenerator.generateSQLiteSetup(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated Swift Core Data setup for entities: ${options.entities.join(', ')}\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating Swift Core Data setup: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        case 'generate-swift-offline': {
            const options = args;
            try {
                const result = swiftGenerator.generateOfflineSetup(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated Swift offline functionality with ${options.syncStrategy || 'periodic'} sync strategy:\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating Swift offline setup: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        // React Native tools
        case 'generate-react-native-login': {
            const options = args;
            try {
                const result = reactNativeGenerator.generateLogin(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated React Native login flow with ${options.authType || 'email-password'} authentication:\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating React Native login: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        case 'generate-react-native-sqlite': {
            const options = args;
            try {
                const result = reactNativeGenerator.generateSQLiteSetup(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated React Native SQLite setup for entities: ${options.entities.join(', ')}\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating React Native SQLite setup: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }

        case 'generate-react-native-offline': {
            const options = args;
            try {
                const result = reactNativeGenerator.generateOfflineSetup(options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated React Native offline functionality with ${options.syncStrategy || 'periodic'} sync strategy:\n\n${result}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error generating React Native offline setup: ${error.message}`,
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

    // Parse URL for routing
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Helper function to parse request body
    const parseBody = async () => {
      if (req.method !== 'POST') return null;
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks);
      try {
        return JSON.parse(rawBody.toString());
      } catch (error) {
        throw new Error('Invalid JSON');
      }
    };

    // Helper function to send JSON response
    const sendJSON = (data, statusCode = 200) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data, null, 2));
    };

    // Helper function to send error response
    const sendError = (message, statusCode = 400) => {
      sendJSON({ error: message, status: 'error' }, statusCode);
    };

    try {
      // =================== REST API ENDPOINTS ===================
      
      // Health check endpoint
      if (pathname === '/health') {
        sendJSON({ 
          status: 'healthy', 
          service: 'Mobile Development MCP Server',
          version: '1.0.0',
          uptime: process.uptime(),
          platforms: ['MAUI', 'Kotlin/Android', 'Swift/iOS', 'React Native'],
          endpoints: {
            mcp: '/mcp',
            api: {
              echo: 'POST /api/echo',
              // MAUI endpoints
              generateMAUILogin: 'POST /api/generate-maui-login',
              // Kotlin/Android endpoints
              generateKotlinLogin: 'POST /api/generate-kotlin-login',
              generateKotlinSQLite: 'POST /api/generate-kotlin-sqlite',
              generateKotlinOffline: 'POST /api/generate-kotlin-offline',
              // Swift/iOS endpoints
              generateSwiftLogin: 'POST /api/generate-swift-login',
              generateSwiftSQLite: 'POST /api/generate-swift-sqlite',
              generateSwiftOffline: 'POST /api/generate-swift-offline',
              // React Native endpoints
              generateReactNativeLogin: 'POST /api/generate-react-native-login',
              generateReactNativeSQLite: 'POST /api/generate-react-native-sqlite',
              generateReactNativeOffline: 'POST /api/generate-react-native-offline'
            }
          },
          totalEndpoints: 11,
          features: ['Authentication', 'Database Setup', 'Offline Functionality'],
          protocols: ['MCP', 'REST API']
        });
        return;
      }

      // API Echo endpoint
      if (pathname === '/api/echo') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }
        
        const body = await parseBody();
        const { message } = EchoSchema.parse(body);
        
        sendJSON({
          status: 'success',
          data: {
            echo: message,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // API Generate MAUI Login endpoint
      if (pathname === '/api/generate-maui-login') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        const options = GenerateMAUILoginSchema.parse(body);
        
        const result = await mauiLoginGenerator.generate(options);
        
        sendJSON({
          status: 'success',
          data: {
            summary: result.summary,
            features: result.features,
            files: result.files.map(file => ({
              name: file.name,
              description: file.description,
              content: file.content
            }))
          }
        });
        return;
      }

      // =================== KOTLIN/ANDROID API ENDPOINTS ===================
      
      // Kotlin Login Generation
      if (pathname === '/api/generate-kotlin-login') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        const result = kotlinGenerator.generateLogin(body);
        
        sendJSON({
          status: 'success',
          platform: 'kotlin',
          feature: 'login',
          data: result
        });
        return;
      }

      // Kotlin SQLite Setup
      if (pathname === '/api/generate-kotlin-sqlite') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        if (!body.entities || !Array.isArray(body.entities)) {
          sendError('entities array is required');
          return;
        }
        
        const result = kotlinGenerator.generateSQLiteSetup(body);
        
        sendJSON({
          status: 'success',
          platform: 'kotlin',
          feature: 'sqlite',
          data: result
        });
        return;
      }

      // Kotlin Offline Setup
      if (pathname === '/api/generate-kotlin-offline') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        const result = kotlinGenerator.generateOfflineSetup(body);
        
        sendJSON({
          status: 'success',
          platform: 'kotlin',
          feature: 'offline',
          data: result
        });
        return;
      }

      // =================== SWIFT/IOS API ENDPOINTS ===================
      
      // Swift Login Generation
      if (pathname === '/api/generate-swift-login') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        const result = swiftGenerator.generateLogin(body);
        
        sendJSON({
          status: 'success',
          platform: 'swift',
          feature: 'login',
          data: result
        });
        return;
      }

      // Swift Core Data Setup
      if (pathname === '/api/generate-swift-sqlite') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        if (!body.entities || !Array.isArray(body.entities)) {
          sendError('entities array is required');
          return;
        }
        
        const result = swiftGenerator.generateSQLiteSetup(body);
        
        sendJSON({
          status: 'success',
          platform: 'swift',
          feature: 'coredata',
          data: result
        });
        return;
      }

      // Swift Offline Setup
      if (pathname === '/api/generate-swift-offline') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        const result = swiftGenerator.generateOfflineSetup(body);
        
        sendJSON({
          status: 'success',
          platform: 'swift',
          feature: 'offline',
          data: result
        });
        return;
      }

      // =================== REACT NATIVE API ENDPOINTS ===================
      
      // React Native Login Generation
      if (pathname === '/api/generate-react-native-login') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        const result = reactNativeGenerator.generateLogin(body);
        
        sendJSON({
          status: 'success',
          platform: 'react-native',
          feature: 'login',
          data: result
        });
        return;
      }

      // React Native SQLite Setup
      if (pathname === '/api/generate-react-native-sqlite') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        if (!body.entities || !Array.isArray(body.entities)) {
          sendError('entities array is required');
          return;
        }
        
        const result = reactNativeGenerator.generateSQLiteSetup(body);
        
        sendJSON({
          status: 'success',
          platform: 'react-native',
          feature: 'sqlite',
          data: result
        });
        return;
      }

      // React Native Offline Setup
      if (pathname === '/api/generate-react-native-offline') {
        if (req.method !== 'POST') {
          sendError('Method not allowed. Use POST.', 405);
          return;
        }

        const body = await parseBody();
        const result = reactNativeGenerator.generateOfflineSetup(body);
        
        sendJSON({
          status: 'success',
          platform: 'react-native',
          feature: 'offline',
          data: result
        });
        return;
      }

      // API endpoints listing
      if (pathname === '/api') {
        sendJSON({
          status: 'success',
          service: 'Mobile Development API',
          version: '1.0.0',
          description: 'Comprehensive mobile development code generation API',
          platforms: ['MAUI', 'Kotlin/Android', 'Swift/iOS', 'React Native'],
          endpoints: [
            {
              path: '/api/echo',
              method: 'POST',
              description: 'Echo back a message',
              example: { message: 'Hello World' }
            },
            // MAUI endpoints
            {
              path: '/api/generate-maui-login',
              method: 'POST', 
              description: 'Generate MAUI login page with branding',
              example: {
                companyName: 'OneAdvanced',
                primaryColor: '#007BFF',
                secondaryColor: '#6C757D',
                logoUrl: 'https://company.com/logo.png',
                includeValidation: true,
                includeRememberMe: true
              }
            },
            // Kotlin/Android endpoints
            {
              path: '/api/generate-kotlin-login',
              method: 'POST',
              description: 'Generate Kotlin login flow for Android',
              example: {
                authType: 'email-password',
                includeValidation: true,
                designSystem: 'material',
                companyBranding: true
              }
            },
            {
              path: '/api/generate-kotlin-sqlite',
              method: 'POST',
              description: 'Generate Kotlin SQLite setup with Room',
              example: {
                entities: ['User', 'Product'],
                includeRepository: true,
                includeMigrations: true,
                cacheStrategy: 'memory'
              }
            },
            {
              path: '/api/generate-kotlin-offline',
              method: 'POST',
              description: 'Generate Kotlin offline functionality',
              example: {
                syncStrategy: 'periodic',
                conflictResolution: 'server-wins',
                includeNetworkDetection: true,
                includeQueueSystem: true
              }
            },
            // Swift/iOS endpoints
            {
              path: '/api/generate-swift-login',
              method: 'POST',
              description: 'Generate Swift login flow for iOS',
              example: {
                authType: 'biometric',
                includeValidation: true,
                designSystem: 'cupertino',
                companyBranding: true
              }
            },
            {
              path: '/api/generate-swift-sqlite',
              method: 'POST',
              description: 'Generate Swift Core Data setup',
              example: {
                entities: ['User', 'Product'],
                includeRepository: true,
                includeMigrations: true,
                cacheStrategy: 'memory'
              }
            },
            {
              path: '/api/generate-swift-offline',
              method: 'POST',
              description: 'Generate Swift offline functionality',
              example: {
                syncStrategy: 'periodic',
                conflictResolution: 'server-wins',
                includeNetworkDetection: true,
                includeQueueSystem: true
              }
            },
            // React Native endpoints
            {
              path: '/api/generate-react-native-login',
              method: 'POST',
              description: 'Generate React Native login flow',
              example: {
                authType: 'oauth',
                includeValidation: true,
                designSystem: 'material',
                companyBranding: true
              }
            },
            {
              path: '/api/generate-react-native-sqlite',
              method: 'POST',
              description: 'Generate React Native SQLite setup',
              example: {
                entities: ['User', 'Product'],
                includeRepository: true,
                includeMigrations: true,
                cacheStrategy: 'memory'
              }
            },
            {
              path: '/api/generate-react-native-offline',
              method: 'POST',
              description: 'Generate React Native offline functionality',
              example: {
                syncStrategy: 'periodic',
                conflictResolution: 'server-wins',
                includeNetworkDetection: true,
                includeQueueSystem: true
              }
            }
          ]
        });
        return;
      }

      // =================== MCP PROTOCOL ENDPOINTS ===================
      
      // Handle MCP endpoint
      if (pathname === '/mcp' || pathname.startsWith('/mcp')) {
        // Parse request body for POST requests
        let body = null;
        if (req.method === 'POST') {
          body = await parseBody();
        }

        // Handle request with transport
        await transport.handleRequest(req, res, body);
        return;
      }

      // =================== ROOT AND INFO ENDPOINTS ===================
      
      // Handle root endpoint
      if (pathname === '/' || pathname === '') {
        sendJSON({ 
          name: 'Mobile Development Hybrid Server',
          version: '1.0.0',
          description: 'Comprehensive mobile development code generation server supporting both MCP protocol and REST API',
          platforms: {
            maui: 'Microsoft .NET MAUI (Multi-platform App UI)',
            kotlin: 'Android development with Kotlin',
            swift: 'iOS development with Swift',
            reactNative: 'Cross-platform with React Native'
          },
          features: {
            login: 'Authentication flows (email/password, biometric, OAuth, SSO)',
            database: 'SQLite/Core Data setup with repositories and migrations',
            offline: 'Offline functionality with sync strategies and conflict resolution'
          },
          protocols: {
            mcp: {
              endpoint: '/mcp',
              description: 'Model Context Protocol for AI assistants',
              tools: [
                'echo',
                'generate-maui-login',
                'generate-kotlin-login', 'generate-kotlin-sqlite', 'generate-kotlin-offline',
                'generate-swift-login', 'generate-swift-sqlite', 'generate-swift-offline',
                'generate-react-native-login', 'generate-react-native-sqlite', 'generate-react-native-offline'
              ]
            },
            rest: {
              endpoint: '/api',
              description: 'Simple REST API for direct HTTP calls',
              endpoints: [
                '/api/echo',
                '/api/generate-maui-login',
                '/api/generate-kotlin-login', '/api/generate-kotlin-sqlite', '/api/generate-kotlin-offline',
                '/api/generate-swift-login', '/api/generate-swift-sqlite', '/api/generate-swift-offline',
                '/api/generate-react-native-login', '/api/generate-react-native-sqlite', '/api/generate-react-native-offline'
              ]
            }
          },
          health: '/health'
        });
        return;
      }

      // 404 for other routes
      sendError('Not Found', 404);

    } catch (error) {
      console.error('Server error:', error);
      if (error.name === 'ZodError') {
        sendError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      } else {
        sendError(error.message || 'Internal server error', 500);
      }
    }
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
