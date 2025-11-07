# Code Templates for Adding New Platforms

## Generator Class Template

Copy and modify this template when creating a new platform generator:

```javascript
export class NewPlatformGenerator {
    generateLogin({ authType = 'email-password', includeValidation = true, designSystem = 'material', companyBranding = true }) {
        // TODO: Implement login generation for NewPlatform
        // Include support for different auth types: email-password, biometric, oauth, sso
        // Add validation if includeValidation is true
        // Apply design system: material, cupertino, custom
        // Include company branding if companyBranding is true
        
        return `
        // Generated NewPlatform login code
        // AuthType: ${authType}
        // Validation: ${includeValidation}
        // Design: ${designSystem}
        // Branding: ${companyBranding}
        `;
    }

    generateSQLiteSetup({ entities = [], includeRepository = true, includeMigrations = true, cacheStrategy = 'memory' }) {
        // TODO: Implement database setup for NewPlatform
        // Create entities/models for each item in entities array
        // Add repository pattern if includeRepository is true
        // Include migration logic if includeMigrations is true
        // Apply caching strategy: none, memory, disk
        
        const entitiesCode = entities.map(entity => `
        // ${entity} model/entity code for NewPlatform
        `).join('\n');

        return `
        // Generated NewPlatform database setup
        // Entities: ${entities.join(', ')}
        // Repository: ${includeRepository}
        // Migrations: ${includeMigrations}
        // Cache: ${cacheStrategy}
        
        ${entitiesCode}
        `;
    }

    generateOfflineSetup({ syncStrategy = 'periodic', conflictResolution = 'server-wins', includeNetworkDetection = true, includeQueueSystem = true }) {
        // TODO: Implement offline functionality for NewPlatform
        // Add network detection if includeNetworkDetection is true
        // Implement sync strategy: immediate, periodic, manual
        // Handle conflict resolution: client-wins, server-wins, manual
        // Add request queue if includeQueueSystem is true
        
        return `
        // Generated NewPlatform offline functionality
        // Sync: ${syncStrategy}
        // Conflicts: ${conflictResolution}
        // Network Detection: ${includeNetworkDetection}
        // Queue System: ${includeQueueSystem}
        `;
    }
}
```

## Main Server Integration Template

### Import Section
```javascript
// Add to imports in src/index.js
import { NewPlatformGenerator } from './generators/platforms/NewPlatformGenerator.js';

// Add to generator instantiation
const newPlatformGenerator = new NewPlatformGenerator();
```

### MCP Tools Registration Template
```javascript
// Add to tools array in ListToolsRequestSchema handler
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
    name: 'generate-newplatform-sqlite',
    description: 'Generate database setup for NewPlatform apps',
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
    name: 'generate-newplatform-offline',
    description: 'Generate offline functionality for NewPlatform apps',
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
```

### MCP Tool Handlers Template
```javascript
// Add to CallToolRequestSchema handler switch statement
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

case 'generate-newplatform-sqlite': {
    const options = args;
    try {
        const result = newPlatformGenerator.generateSQLiteSetup(options);
        return {
            content: [
                {
                    type: 'text',
                    text: `Generated NewPlatform SQLite setup for entities: ${options.entities.join(', ')}\n\n${result}`,
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error generating NewPlatform SQLite setup: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}

case 'generate-newplatform-offline': {
    const options = args;
    try {
        const result = newPlatformGenerator.generateOfflineSetup(options);
        return {
            content: [
                {
                    type: 'text',
                    text: `Generated NewPlatform offline functionality with ${options.syncStrategy || 'periodic'} sync strategy:\n\n${result}`,
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error generating NewPlatform offline setup: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}
```

### REST Endpoints Template
```javascript
// Add to HTTP server request handler
// NewPlatform Login endpoint
if (pathname === '/api/generate-newplatform-login') {
    if (req.method !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
        return;
    }

    const body = await parseBody();
    const options = body;
    
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

// NewPlatform SQLite endpoint
if (pathname === '/api/generate-newplatform-sqlite') {
    if (req.method !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
        return;
    }

    const body = await parseBody();
    const options = body;
    
    try {
        const result = newPlatformGenerator.generateSQLiteSetup(options);
        sendJSON({
            status: 'success',
            data: result
        });
    } catch (error) {
        sendError(`Error generating NewPlatform SQLite setup: ${error.message}`);
    }
    return;
}

// NewPlatform Offline endpoint
if (pathname === '/api/generate-newplatform-offline') {
    if (req.method !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
        return;
    }

    const body = await parseBody();
    const options = body;
    
    try {
        const result = newPlatformGenerator.generateOfflineSetup(options);
        sendJSON({
            status: 'success',
            data: result
        });
    } catch (error) {
        sendError(`Error generating NewPlatform offline setup: ${error.message}`);
    }
    return;
}
```

### Documentation Updates Template

#### Health Endpoint Update
```javascript
// Update platforms array
platforms: ['MAUI', 'Kotlin/Android', 'Swift/iOS', 'React Native', 'NewPlatform'],

// Update endpoints object
endpoints: {
    api: {
        // ... existing endpoints
        generateNewPlatformLogin: 'POST /api/generate-newplatform-login',
        generateNewPlatformSQLite: 'POST /api/generate-newplatform-sqlite',
        generateNewPlatformOffline: 'POST /api/generate-newplatform-offline'
    }
}
```

#### API Info Endpoint Update
```javascript
// Add to endpoints array
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
},
{
    path: '/api/generate-newplatform-sqlite',
    method: 'POST',
    description: 'Generate NewPlatform SQLite setup',
    example: {
        entities: ['User', 'Product'],
        includeRepository: true,
        includeMigrations: true,
        cacheStrategy: 'memory'
    }
},
{
    path: '/api/generate-newplatform-offline',
    method: 'POST',
    description: 'Generate NewPlatform offline functionality',
    example: {
        syncStrategy: 'periodic',
        conflictResolution: 'server-wins',
        includeNetworkDetection: true,
        includeQueueSystem: true
    }
}
```

#### Root Endpoint Update
```javascript
// Update platforms object
platforms: {
    // ... existing platforms
    newPlatform: "NewPlatform description here"
},

// Update protocols object
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

## Test Commands Template

```bash
# Test NewPlatform login generation
curl -X POST http://localhost:2205/api/generate-newplatform-login \
  -H "Content-Type: application/json" \
  -d '{
    "authType": "biometric",
    "includeValidation": true,
    "designSystem": "material",
    "companyBranding": true
  }'

# Test NewPlatform SQLite generation
curl -X POST http://localhost:2205/api/generate-newplatform-sqlite \
  -H "Content-Type: application/json" \
  -d '{
    "entities": ["User", "Product", "Order"],
    "includeRepository": true,
    "includeMigrations": true,
    "cacheStrategy": "memory"
  }'

# Test NewPlatform offline functionality
curl -X POST http://localhost:2205/api/generate-newplatform-offline \
  -H "Content-Type: application/json" \
  -d '{
    "syncStrategy": "periodic",
    "conflictResolution": "server-wins",
    "includeNetworkDetection": true,
    "includeQueueSystem": true
  }'

# Test MCP protocol
curl -X POST http://localhost:2205/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate-newplatform-login",
      "arguments": {
        "authType": "oauth",
        "includeValidation": true
      }
    }
  }'

# Verify health endpoint
curl -s http://localhost:2205/health | jq .platforms

# Count total endpoints
curl -s http://localhost:2205/api | jq '.endpoints | length'
```

## Quick Copy-Paste Steps

1. **Create Generator File**: Copy `Generator Class Template` to `src/generators/platforms/NewPlatformGenerator.js`
2. **Add Import**: Copy `Import Section` to top of `src/index.js`
3. **Register Tools**: Copy `MCP Tools Registration Template` to tools array
4. **Add Handlers**: Copy `MCP Tool Handlers Template` to switch statement
5. **Add Endpoints**: Copy `REST Endpoints Template` to HTTP handler
6. **Update Docs**: Apply `Documentation Updates Template` to all info endpoints
7. **Test**: Run `Test Commands Template` to verify everything works

## File Naming Conventions

- Generator: `PlatformNameGenerator.js` (PascalCase)
- Endpoints: `/api/generate-platform-feature` (lowercase with hyphens)
- Tools: `generate-platform-feature` (lowercase with hyphens)
- Variables: `platformNameGenerator` (camelCase)

This template system ensures consistency and speeds up development of new platforms!
