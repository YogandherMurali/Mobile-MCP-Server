# Developer Guide - Adding New Platforms & Features

## Quick Start Checklist

When adding a new platform or feature, follow this checklist:

- [ ] 1. Create Generator Class
- [ ] 2. Add to Main Server Imports  
- [ ] 3. Register MCP Tools
- [ ] 4. Add Tool Handlers
- [ ] 5. Create REST Endpoints
- [ ] 6. Update Documentation Endpoints
- [ ] 7. Test All Endpoints
- [ ] 8. Update README

## Step-by-Step Example: Adding Flutter Platform

Let's walk through adding Flutter support as a complete example:

### Step 1: Create Generator Class

Create `src/generators/platforms/FlutterGenerator.js`:

```javascript
export class FlutterGenerator {
    generateLogin({ authType = 'email-password', includeValidation = true, designSystem = 'material', companyBranding = true }) {
        return `
import 'package:flutter/material.dart';
${authType === 'biometric' ? "import 'package:local_auth/local_auth.dart';" : ''}
${authType === 'oauth' ? "import 'package:google_sign_in/google_sign_in.dart';" : ''}

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  ${authType === 'biometric' ? 'final LocalAuthentication localAuth = LocalAuthentication();' : ''}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Login'),
        backgroundColor: ${designSystem === 'material' ? 'Theme.of(context).primaryColor' : 'Colors.blue'},
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ${companyBranding ? `
              Container(
                height: 100,
                child: Image.asset('assets/logo.png'),
              ),
              SizedBox(height: 32),
              ` : ''}
              
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                ${includeValidation ? `
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!RegExp(r'^[\\w-\\.]+@[\\w-]+\\.[a-z]+\$').hasMatch(value)) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
                ` : ''}
              ),
              
              SizedBox(height: 16),
              
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                ${includeValidation ? `
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your password';
                  }
                  if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
                ` : ''}
              ),
              
              SizedBox(height: 24),
              
              ElevatedButton(
                onPressed: _handleLogin,
                child: Text('Login'),
                style: ElevatedButton.styleFrom(
                  minimumSize: Size(double.infinity, 48),
                ),
              ),
              
              ${authType === 'biometric' ? `
              SizedBox(height: 16),
              OutlinedButton(
                onPressed: _handleBiometricLogin,
                child: Text('Use Biometric'),
                style: OutlinedButton.styleFrom(
                  minimumSize: Size(double.infinity, 48),
                ),
              ),
              ` : ''}
            ],
          ),
        ),
      ),
    );
  }

  void _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      // Implement login logic
      try {
        // Call your authentication service
        print('Logging in with email: \${_emailController.text}');
        // Navigate to home screen on success
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: \$e')),
        );
      }
    }
  }

  ${authType === 'biometric' ? `
  void _handleBiometricLogin() async {
    try {
      final isAvailable = await localAuth.canCheckBiometrics;
      if (isAvailable) {
        final isAuthenticated = await localAuth.authenticate(
          localizedReason: 'Authenticate to access your account',
        );
        if (isAuthenticated) {
          // Navigate to home screen
          print('Biometric authentication successful');
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Biometric authentication not available')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Biometric authentication failed: \$e')),
      );
    }
  }
  ` : ''}
}`;
    }

    generateSQLiteSetup({ entities = [], includeRepository = true, includeMigrations = true, cacheStrategy = 'memory' }) {
        const entitiesCode = entities.map(entity => `
class ${entity} {
  final int? id;
  final String name;
  final DateTime createdAt;

  ${entity}({
    this.id,
    required this.name,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory ${entity}.fromMap(Map<String, dynamic> map) {
    return ${entity}(
      id: map['id'],
      name: map['name'],
      createdAt: DateTime.parse(map['createdAt']),
    );
  }
}`).join('\n');

        return `
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), 'app_database.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
      ${includeMigrations ? 'onUpgrade: _onUpgrade,' : ''}
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    ${entities.map(entity => `
    await db.execute('''
      CREATE TABLE ${entity.toLowerCase()} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    ''');`).join('\n')}
  }

  ${includeMigrations ? `
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Handle database migrations here
    if (oldVersion < 2) {
      // Migration logic for version 2
    }
  }
  ` : ''}
}

${entitiesCode}

${includeRepository ? entities.map(entity => `
class ${entity}Repository {
  final DatabaseHelper _dbHelper = DatabaseHelper();

  Future<List<${entity}>> getAll() async {
    final db = await _dbHelper.database;
    final maps = await db.query('${entity.toLowerCase()}');
    return List.generate(maps.length, (i) => ${entity}.fromMap(maps[i]));
  }

  Future<int> insert(${entity} ${entity.toLowerCase()}) async {
    final db = await _dbHelper.database;
    return await db.insert('${entity.toLowerCase()}', ${entity.toLowerCase()}.toMap());
  }

  Future<int> update(${entity} ${entity.toLowerCase()}) async {
    final db = await _dbHelper.database;
    return await db.update(
      '${entity.toLowerCase()}',
      ${entity.toLowerCase()}.toMap(),
      where: 'id = ?',
      whereArgs: [${entity.toLowerCase()}.id],
    );
  }

  Future<int> delete(int id) async {
    final db = await _dbHelper.database;
    return await db.delete(
      '${entity.toLowerCase()}',
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
`).join('\n') : ''}

// Cache Strategy: ${cacheStrategy}
// Migrations: ${includeMigrations}
// Repository Pattern: ${includeRepository}`;
    }

    generateOfflineSetup({ syncStrategy = 'periodic', conflictResolution = 'server-wins', includeNetworkDetection = true, includeQueueSystem = true }) {
        return `
import 'dart:convert';
import 'dart:async';
${includeNetworkDetection ? "import 'package:connectivity_plus/connectivity_plus.dart';" : ''}
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class OfflineRequest {
  final String id;
  final String endpoint;
  final String method;
  final Map<String, dynamic>? data;
  final DateTime timestamp;

  OfflineRequest({
    required this.id,
    required this.endpoint,
    required this.method,
    this.data,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'endpoint': endpoint,
    'method': method,
    'data': data,
    'timestamp': timestamp.toIso8601String(),
  };

  factory OfflineRequest.fromJson(Map<String, dynamic> json) => OfflineRequest(
    id: json['id'],
    endpoint: json['endpoint'],
    method: json['method'],
    data: json['data'],
    timestamp: DateTime.parse(json['timestamp']),
  );
}

class OfflineManager {
  static final OfflineManager _instance = OfflineManager._internal();
  factory OfflineManager() => _instance;
  OfflineManager._internal();

  ${includeNetworkDetection ? 'bool _isConnected = false;' : ''}
  ${includeQueueSystem ? 'List<OfflineRequest> _requestQueue = [];' : ''}
  Timer? _syncTimer;

  Future<void> initialize() async {
    ${includeNetworkDetection ? '_initNetworkMonitoring();' : ''}
    _initSyncStrategy();
    ${includeQueueSystem ? 'await _loadRequestQueue();' : ''}
  }

  ${includeNetworkDetection ? `
  void _initNetworkMonitoring() {
    Connectivity().onConnectivityChanged.listen((ConnectivityResult result) {
      bool wasConnected = _isConnected;
      _isConnected = result != ConnectivityResult.none;
      
      if (!wasConnected && _isConnected) {
        // Connection restored
        _processQueuedRequests();
      }
    });
  }

  bool get isNetworkAvailable => _isConnected;
  ` : ''}

  ${includeQueueSystem ? `
  Future<void> queueRequest({
    required String endpoint,
    required String method,
    Map<String, dynamic>? data,
  }) async {
    final request = OfflineRequest(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      endpoint: endpoint,
      method: method,
      data: data,
      timestamp: DateTime.now(),
    );

    _requestQueue.add(request);
    await _saveRequestQueue();
  }

  Future<void> _loadRequestQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = prefs.getString('offline_request_queue');
    if (queueJson != null) {
      final List<dynamic> queueList = json.decode(queueJson);
      _requestQueue = queueList.map((item) => OfflineRequest.fromJson(item)).toList();
    }
  }

  Future<void> _saveRequestQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = json.encode(_requestQueue.map((r) => r.toJson()).toList());
    await prefs.setString('offline_request_queue', queueJson);
  }

  Future<void> _processQueuedRequests() async {
    if (!_isConnected || _requestQueue.isEmpty) return;

    final requests = List<OfflineRequest>.from(_requestQueue);
    _requestQueue.clear();
    await _saveRequestQueue();

    for (final request in requests) {
      try {
        await _processRequest(request);
      } catch (e) {
        print('Failed to process queued request: \$e');
        _requestQueue.add(request);
      }
    }

    if (_requestQueue.isNotEmpty) {
      await _saveRequestQueue();
    }
  }

  Future<void> _processRequest(OfflineRequest request) async {
    final response = await http.Request(request.method, Uri.parse(request.endpoint))
      ..headers['Content-Type'] = 'application/json'
      ..body = request.data != null ? json.encode(request.data) : null;

    final streamedResponse = await response.send();
    if (streamedResponse.statusCode >= 400) {
      throw Exception('Request failed: \${streamedResponse.statusCode}');
    }
  }
  ` : ''}

  void _initSyncStrategy() {
    switch ('${syncStrategy}') {
      case 'immediate':
        // Sync immediately when connection is available
        break;
      case 'periodic':
        _schedulePeriodicSync();
        break;
      case 'manual':
        // Wait for manual trigger
        break;
    }
  }

  void _schedulePeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(Duration(minutes: 5), (timer) {
      if (_isConnected) {
        syncData();
      }
    });
  }

  Future<void> syncData() async {
    if (!_isConnected) return;

    try {
      ${includeQueueSystem ? 'await _processQueuedRequests();' : ''}
      // Additional sync logic here
    } catch (e) {
      print('Sync failed: \$e');
    }
  }

  T handleConflict<T>(T localData, T serverData) {
    switch ('${conflictResolution}') {
      case 'client-wins':
        return localData;
      case 'server-wins':
        return serverData;
      case 'manual':
        // Show conflict resolution UI
        return _promptUserForResolution(localData, serverData);
      default:
        return serverData;
    }
  }

  T _promptUserForResolution<T>(T localData, T serverData) {
    // Implementation would show conflict resolution UI
    // For now, return server data as default
    return serverData;
  }

  void dispose() {
    _syncTimer?.cancel();
  }
}

// Sync Strategy: ${syncStrategy}
// Conflict Resolution: ${conflictResolution}
// Network Detection: ${includeNetworkDetection}
// Queue System: ${includeQueueSystem}`;
    }
}
```

### Step 2: Add to Main Server

In `src/index.js`, add the import and instantiation:

```javascript
// Add to imports section
import { FlutterGenerator } from './generators/platforms/FlutterGenerator.js';

// Add to generator instantiation section
const flutterGenerator = new FlutterGenerator();
```

### Step 3: Register MCP Tools

In the `ListToolsRequestSchema` handler, add the Flutter tools:

```javascript
// Add these objects to the tools array
{
    name: 'generate-flutter-login',
    description: 'Generate complete login flow for Flutter apps',
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
    name: 'generate-flutter-sqlite',
    description: 'Generate SQLite database setup for Flutter apps',
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
    name: 'generate-flutter-offline',
    description: 'Generate offline functionality for Flutter apps',
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

### Step 4: Add Tool Handlers

In the `CallToolRequestSchema` handler, add the Flutter cases:

```javascript
// Flutter/Dart tools
case 'generate-flutter-login': {
    const options = args;
    try {
        const result = flutterGenerator.generateLogin(options);
        return {
            content: [
                {
                    type: 'text',
                    text: `Generated Flutter login flow with ${options.authType || 'email-password'} authentication:\n\n${result}`,
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error generating Flutter login: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}

case 'generate-flutter-sqlite': {
    const options = args;
    try {
        const result = flutterGenerator.generateSQLiteSetup(options);
        return {
            content: [
                {
                    type: 'text',
                    text: `Generated Flutter SQLite setup for entities: ${options.entities.join(', ')}\n\n${result}`,
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error generating Flutter SQLite setup: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}

case 'generate-flutter-offline': {
    const options = args;
    try {
        const result = flutterGenerator.generateOfflineSetup(options);
        return {
            content: [
                {
                    type: 'text',
                    text: `Generated Flutter offline functionality with ${options.syncStrategy || 'periodic'} sync strategy:\n\n${result}`,
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error generating Flutter offline setup: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}
```

### Step 5: Create REST Endpoints

Add these endpoints in the HTTP server section:

```javascript
// Flutter Login endpoint
if (pathname === '/api/generate-flutter-login') {
    if (req.method !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
        return;
    }

    const body = await parseBody();
    const options = body;
    
    try {
        const result = flutterGenerator.generateLogin(options);
        sendJSON({
            status: 'success',
            data: result
        });
    } catch (error) {
        sendError(`Error generating Flutter login: ${error.message}`);
    }
    return;
}

// Flutter SQLite endpoint
if (pathname === '/api/generate-flutter-sqlite') {
    if (req.method !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
        return;
    }

    const body = await parseBody();
    const options = body;
    
    try {
        const result = flutterGenerator.generateSQLiteSetup(options);
        sendJSON({
            status: 'success',
            data: result
        });
    } catch (error) {
        sendError(`Error generating Flutter SQLite setup: ${error.message}`);
    }
    return;
}

// Flutter Offline endpoint
if (pathname === '/api/generate-flutter-offline') {
    if (req.method !== 'POST') {
        sendError('Method not allowed. Use POST.', 405);
        return;
    }

    const body = await parseBody();
    const options = body;
    
    try {
        const result = flutterGenerator.generateOfflineSetup(options);
        sendJSON({
            status: 'success',
            data: result
        });
    } catch (error) {
        sendError(`Error generating Flutter offline setup: ${error.message}`);
    }
    return;
}
```

### Step 6: Update Documentation Endpoints

#### Update Health Endpoint
```javascript
platforms: ['MAUI', 'Kotlin/Android', 'Swift/iOS', 'React Native', 'Flutter'],
endpoints: {
    api: {
        // ... existing endpoints
        generateFlutterLogin: 'POST /api/generate-flutter-login',
        generateFlutterSQLite: 'POST /api/generate-flutter-sqlite',
        generateFlutterOffline: 'POST /api/generate-flutter-offline'
    }
}
```

#### Update API Info Endpoint
```javascript
endpoints: [
    // ... existing endpoints
    {
        path: '/api/generate-flutter-login',
        method: 'POST',
        description: 'Generate Flutter login flow',
        example: {
            authType: 'biometric',
            includeValidation: true,
            designSystem: 'material',
            companyBranding: true
        }
    },
    {
        path: '/api/generate-flutter-sqlite',
        method: 'POST',
        description: 'Generate Flutter SQLite setup',
        example: {
            entities: ['User', 'Product'],
            includeRepository: true,
            includeMigrations: true,
            cacheStrategy: 'memory'
        }
    },
    {
        path: '/api/generate-flutter-offline',
        method: 'POST',
        description: 'Generate Flutter offline functionality',
        example: {
            syncStrategy: 'periodic',
            conflictResolution: 'server-wins',
            includeNetworkDetection: true,
            includeQueueSystem: true
        }
    }
]
```

#### Update Root Info Endpoint
```javascript
platforms: {
    // ... existing platforms
    flutter: "Cross-platform development with Flutter/Dart"
},
protocols: {
    mcp: {
        tools: [
            // ... existing tools
            'generate-flutter-login',
            'generate-flutter-sqlite',
            'generate-flutter-offline'
        ]
    },
    rest: {
        endpoints: [
            // ... existing endpoints
            '/api/generate-flutter-login',
            '/api/generate-flutter-sqlite',
            '/api/generate-flutter-offline'
        ]
    }
}
```

### Step 7: Test All Endpoints

```bash
# Test Flutter login generation
curl -X POST http://localhost:2205/api/generate-flutter-login \
  -H "Content-Type: application/json" \
  -d '{
    "authType": "biometric",
    "includeValidation": true,
    "designSystem": "material",
    "companyBranding": true
  }'

# Test Flutter SQLite generation
curl -X POST http://localhost:2205/api/generate-flutter-sqlite \
  -H "Content-Type: application/json" \
  -d '{
    "entities": ["User", "Product", "Order"],
    "includeRepository": true,
    "includeMigrations": true,
    "cacheStrategy": "memory"
  }'

# Test Flutter offline functionality
curl -X POST http://localhost:2205/api/generate-flutter-offline \
  -H "Content-Type: application/json" \
  -d '{
    "syncStrategy": "periodic",
    "conflictResolution": "server-wins",
    "includeNetworkDetection": true,
    "includeQueueSystem": true
  }'

# Verify health endpoint shows new platform
curl -s http://localhost:2205/health | jq .platforms

# Verify API info shows new endpoints
curl -s http://localhost:2205/api | jq '.endpoints | length'
```

## Testing Checklist

When adding a new platform, verify:

- [ ] Generator class works in isolation
- [ ] MCP tools are listed in `/mcp` tools/list call
- [ ] MCP tools execute correctly via tools/call
- [ ] REST endpoints respond correctly
- [ ] Health endpoint lists new platform and endpoints
- [ ] API info endpoint includes new endpoints
- [ ] Root endpoint shows updated platform count
- [ ] Error handling works for invalid requests
- [ ] Generated code is syntactically correct
- [ ] All options work as expected

## Common Patterns to Follow

### Option Validation
Always provide sensible defaults and validate required fields:

```javascript
generateMethod({ 
    requiredField, 
    optionalField = 'default',
    booleanField = true 
}) {
    if (!requiredField) {
        throw new Error('requiredField is required');
    }
    // Implementation
}
```

### Error Messages
Make error messages descriptive and actionable:

```javascript
throw new Error(`Invalid authType '${authType}'. Must be one of: email-password, biometric, oauth, sso`);
```

### Code Generation
Generate production-ready code with proper:
- Error handling
- Input validation  
- Documentation/comments
- Consistent formatting
- Best practices for the platform

### Endpoint Consistency
- Use POST for all generation endpoints
- Return JSON with consistent structure
- Include proper HTTP status codes
- Validate request content-type

This completes the Flutter platform addition! The same pattern applies to any new platform or feature.
