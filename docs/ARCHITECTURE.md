# Mobile Development MCP Server - Architecture Documentation

## Overview

This server follows a **Hybrid Architecture** that seamlessly supports both **MCP (Model Context Protocol)** and **REST API** protocols. The system is designed for mobile development code generation across multiple platforms.

## Core Architecture Principles

### 1. Hybrid Protocol Support
- **Single Server Instance** handles both MCP and REST protocols
- **Unified Tool Logic** - same generators serve both protocols
- **Seamless Protocol Detection** based on request path

### 2. Platform-Agnostic Design
- **Modular Generator Classes** for each platform
- **Consistent Method Signatures** across all generators
- **Standardized Options Pattern** for configuration

### 3. Template-Based Code Generation
- **Clean Separation** between logic and output
- **Conditional Sections** for feature inclusion
- **Variable Replacement** for customization

## Directory Structure

```
Mobile-MCP-Server/
├── src/
│   ├── index.js                    # Main hybrid server
│   └── generators/
│       ├── MAUILoginGenerator.js   # MAUI-specific generator
│       └── platforms/              # Platform-specific generators
│           ├── KotlinGenerator.js  # Android/Kotlin generator
│           ├── SwiftGenerator.js   # iOS/Swift generator
│           └── ReactNativeGenerator.js # React Native generator
├── templates/
│   └── maui/                       # MAUI template files
│       ├── LoginPage.xaml.template
│       ├── LoginPage.xaml.cs.template
│       ├── Colors.xaml.template
│       └── Styles.xaml.template
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md             # This file
    └── COMPREHENSIVE_API_TEST.md
```

## Generator Class Pattern

### Standard Generator Structure

Each platform generator must follow this pattern:

```javascript
export class PlatformGenerator {
    // Core methods that all generators must implement
    generateLogin(options) { /* ... */ }
    generateSQLiteSetup(options) { /* ... */ }
    generateOfflineSetup(options) { /* ... */ }
    
    // Platform-specific helper methods
    // ...
}
```

### Standard Options Pattern

All generator methods accept options with these patterns:

#### Login Options
```javascript
{
    authType: 'email-password' | 'biometric' | 'oauth' | 'sso',
    includeValidation: boolean (default: true),
    designSystem: 'material' | 'cupertino' | 'custom',
    companyBranding: boolean (default: true)
}
```

#### SQLite/Database Options
```javascript
{
    entities: string[],                    // Required
    includeRepository: boolean (default: true),
    includeMigrations: boolean (default: true),
    cacheStrategy: 'none' | 'memory' | 'disk'
}
```

#### Offline Options
```javascript
{
    syncStrategy: 'immediate' | 'periodic' | 'manual',
    conflictResolution: 'client-wins' | 'server-wins' | 'manual',
    includeNetworkDetection: boolean (default: true),
    includeQueueSystem: boolean (default: true)
}
```

## Adding a New Platform

### Step 1: Create Generator Class

Create `src/generators/platforms/NewPlatformGenerator.js`:

```javascript
export class NewPlatformGenerator {
    generateLogin({ authType = 'email-password', includeValidation = true, designSystem = 'material', companyBranding = true }) {
        // Implementation specific to new platform
        return `/* Generated code for ${authType} login */`;
    }

    generateSQLiteSetup({ entities = [], includeRepository = true, includeMigrations = true, cacheStrategy = 'memory' }) {
        // Implementation specific to new platform
        return `/* Generated database setup for ${entities.join(', ')} */`;
    }

    generateOfflineSetup({ syncStrategy = 'periodic', conflictResolution = 'server-wins', includeNetworkDetection = true, includeQueueSystem = true }) {
        // Implementation specific to new platform
        return `/* Generated offline functionality */`;
    }
}
```

### Step 2: Register in Main Server

In `src/index.js`, add the import and instantiation:

```javascript
// Add import
import { NewPlatformGenerator } from './generators/platforms/NewPlatformGenerator.js';

// Add instantiation
const newPlatformGenerator = new NewPlatformGenerator();
```

### Step 3: Add MCP Tools

In the `ListToolsRequestSchema` handler, add tools following this pattern:

```javascript
{
    name: 'generate-newplatform-login',
    description: 'Generate complete login flow for NewPlatform apps',
    inputSchema: {
        type: 'object',
        properties: {
            authType: {
                type: 'string',
                enum: ['email-password', 'biometric', 'oauth', 'sso'],
                default: 'email-password',
                description: 'Authentication type',
            },
            // ... other standard options
        },
    },
},
{
    name: 'generate-newplatform-sqlite',
    description: 'Generate database setup for NewPlatform apps',
    inputSchema: {
        // ... standard SQLite options schema
    },
},
{
    name: 'generate-newplatform-offline',
    description: 'Generate offline functionality for NewPlatform apps',
    inputSchema: {
        // ... standard offline options schema
    },
}
```

### Step 4: Add Tool Handlers

In the `CallToolRequestSchema` handler, add cases:

```javascript
case 'generate-newplatform-login': {
    const options = args;
    try {
        const result = newPlatformGenerator.generateLogin(options);
        return {
            content: [
                {
                    type: 'text',
                    text: `Generated NewPlatform login flow with ${options.authType || 'email-password'} authentication:\n\n${result}`,
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error generating NewPlatform login: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}
// Add similar cases for sqlite and offline
```

### Step 5: Add REST API Endpoints

In the HTTP server section, add endpoints following the pattern:

```javascript
// NewPlatform Login endpoint
if (pathname === '/api/generate-newplatform-login') {
    if (req.method !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
        return;
    }

    const body = await parseBody();
    const options = body; // Could add validation schema if needed
    
    try {
        const result = newPlatformGenerator.generateLogin(options);
        sendJSON({
            status: 'success',
            data: result
        });
    } catch (error) {
        sendError(`Error generating NewPlatform login: ${error.message}`);
    }
    return;
}
// Add similar endpoints for sqlite and offline
```

### Step 6: Update Documentation Endpoints

Update the following endpoints to include the new platform:

#### Health Endpoint (`/health`)
```javascript
platforms: ['MAUI', 'Kotlin/Android', 'Swift/iOS', 'React Native', 'NewPlatform'],
endpoints: {
    api: {
        // ... existing endpoints
        generateNewPlatformLogin: 'POST /api/generate-newplatform-login',
        generateNewPlatformSQLite: 'POST /api/generate-newplatform-sqlite',
        generateNewPlatformOffline: 'POST /api/generate-newplatform-offline'
    }
}
```

#### API Info Endpoint (`/api`)
```javascript
endpoints: [
    // ... existing endpoints
    {
        path: '/api/generate-newplatform-login',
        method: 'POST',
        description: 'Generate NewPlatform login flow',
        example: {
            authType: 'biometric',
            includeValidation: true,
            designSystem: 'material',
            companyBranding: true
        }
    }
    // Add similar objects for sqlite and offline
]
```

#### Root Info Endpoint (`/`)
```javascript
platforms: {
    // ... existing platforms
    newPlatform: "NewPlatform description"
},
protocols: {
    mcp: {
        tools: [
            // ... existing tools
            'generate-newplatform-login',
            'generate-newplatform-sqlite',
            'generate-newplatform-offline'
        ]
    },
    rest: {
        endpoints: [
            // ... existing endpoints
            '/api/generate-newplatform-login',
            '/api/generate-newplatform-sqlite',
            '/api/generate-newplatform-offline'
        ]
    }
}
```

## Naming Conventions

### File Naming
- **Generator Classes**: `PlatformNameGenerator.js` (PascalCase)
- **Template Files**: `component.type.template` (lowercase with dots)

### API Endpoints
- **Pattern**: `/api/generate-platform-feature`
- **Examples**: 
  - `/api/generate-kotlin-login`
  - `/api/generate-swift-sqlite`
  - `/api/generate-react-native-offline`

### MCP Tool Names
- **Pattern**: `generate-platform-feature`
- **Examples**:
  - `generate-kotlin-login`
  - `generate-swift-sqlite`
  - `generate-react-native-offline`

### Variable Naming
- **Generator Instances**: `platformNameGenerator` (camelCase)
- **Options Objects**: Standard names like `options`, `args`

## Error Handling Pattern

All endpoints and tools follow this error handling pattern:

```javascript
try {
    const result = generator.method(options);
    // Success response
    return successResponse(result);
} catch (error) {
    // Error response
    return errorResponse(`Error generating...: ${error.message}`);
}
```

## Response Format Standards

### REST API Success Response
```javascript
{
    status: 'success',
    data: generatedCode
}
```

### REST API Error Response
```javascript
{
    status: 'error',
    error: errorMessage
}
```

### MCP Tool Success Response
```javascript
{
    content: [
        {
            type: 'text',
            text: `Generated... ${description}:\n\n${generatedCode}`,
        },
    ],
}
```

### MCP Tool Error Response
```javascript
{
    content: [
        {
            type: 'text',
            text: `Error...: ${error.message}`,
        },
    ],
    isError: true,
}
```

## Testing New Platforms

When adding a new platform, test in this order:

1. **Generator Class**: Test the generator methods directly
2. **MCP Tools**: Test via MCP protocol calls
3. **REST Endpoints**: Test via HTTP requests
4. **Documentation**: Verify all info endpoints are updated
5. **Health Check**: Confirm new endpoints appear in health response

### Example Test Commands

```bash
# Test REST API
curl -X POST http://localhost:2205/api/generate-newplatform-login \
  -H "Content-Type: application/json" \
  -d '{"authType": "biometric"}'

# Test MCP Protocol
curl -X POST http://localhost:2205/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate-newplatform-login",
      "arguments": {"authType": "biometric"}
    }
  }'

# Verify health endpoint
curl -s http://localhost:2205/health | jq .endpoints.api
```

## Code Quality Standards

### Generator Code Quality
- **Consistent Indentation**: Use proper code formatting for target platform
- **Comprehensive Features**: Include error handling, validation, best practices
- **Production Ready**: Generated code should be ready for production use
- **Documentation**: Include comments explaining key sections

### Error Messages
- **Descriptive**: Clear indication of what went wrong
- **Actionable**: Suggest how to fix the issue
- **Consistent Format**: Follow established error message patterns

## Integration Points

### MCP Protocol Integration
- All tools are automatically exposed via MCP protocol
- Use standard MCP tool schema patterns
- Follow MCP response formats

### REST API Integration
- All tools are accessible via REST endpoints
- Use standard HTTP status codes
- Follow consistent JSON response format

### Documentation Integration
- Auto-update all info endpoints when adding platforms
- Maintain endpoint counts and platform lists
- Include usage examples for new platforms

---

## Summary

This architecture ensures:
- ✅ **Consistency** across all platforms and tools
- ✅ **Scalability** for adding new platforms easily
- ✅ **Maintainability** through clear patterns and separation of concerns
- ✅ **Protocol Flexibility** supporting both MCP and REST seamlessly
- ✅ **Production Readiness** with proper error handling and testing

Follow these patterns when extending the system, and the new components will integrate seamlessly with the existing architecture.
