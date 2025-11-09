# Mobile MCP Server - Complete Capabilities Guide

## What Tasks Can This Server Do?

The Mobile MCP Server is a comprehensive code generation platform that can help mobile development teams by generating production-ready code components across **4 major mobile platforms**. It supports both **MCP (Model Context Protocol)** for AI assistants and **REST API** for direct HTTP access.

---

## 🎯 Core Capabilities Overview

### Supported Platforms
1. **MAUI (.NET Multi-platform App UI)** - Cross-platform framework from Microsoft
2. **Kotlin/Android** - Native Android development
3. **Swift/iOS** - Native iOS development  
4. **React Native** - Cross-platform JavaScript framework

### Supported Features
1. **Authentication Flows** - Login pages with various authentication methods
2. **Database Setup** - SQLite/Core Data configuration with repositories
3. **Offline Functionality** - Sync strategies and conflict resolution

---

## 📋 Complete Task Listing

### 1. MAUI Platform Tasks

#### Generate MAUI Login Page
**What it does:** Creates a complete, branded login page for MAUI applications with customizable styling, validation, and authentication logic.

**Available through:**
- **MCP Tool:** `generate-maui-login`
- **REST API:** `POST /api/generate-maui-login`

**Features:**
- Company branding (name, logo, colors)
- Email validation
- "Remember Me" functionality
- Password visibility toggle
- Custom styling with brand colors
- Complete XAML + C# code behind

**Example Usage (MCP):**
```json
{
  "name": "generate-maui-login",
  "arguments": {
    "companyName": "OneAdvanced",
    "primaryColor": "#007BFF",
    "secondaryColor": "#6C757D",
    "logoUrl": "https://company.com/logo.png",
    "includeValidation": true,
    "includeRememberMe": true
  }
}
```

**Example Usage (REST API):**
```bash
curl -X POST http://localhost:2205/api/generate-maui-login \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "OneAdvanced",
    "primaryColor": "#007BFF",
    "includeValidation": true
  }'
```

**Output:** Complete XAML files (LoginPage.xaml, Colors.xaml, Styles.xaml) and C# code-behind (LoginPage.xaml.cs)

---

### 2. Kotlin/Android Platform Tasks

#### Task 2.1: Generate Kotlin Login Flow
**What it does:** Creates authentication flow for Android apps with multiple authentication methods.

**Available through:**
- **MCP Tool:** `generate-kotlin-login`
- **REST API:** `POST /api/generate-kotlin-login`

**Authentication Types:**
- `email-password` - Traditional email/password login
- `biometric` - Fingerprint/Face recognition
- `oauth` - OAuth 2.0 integration
- `sso` - Single Sign-On

**Design Systems:**
- `material` - Material Design (default for Android)
- `cupertino` - iOS-style design
- `custom` - Custom design system

**Example Usage:**
```json
{
  "name": "generate-kotlin-login",
  "arguments": {
    "authType": "biometric",
    "includeValidation": true,
    "designSystem": "material",
    "companyBranding": true
  }
}
```

**Output:** Complete Kotlin code with ViewModel, UI components, and authentication logic

#### Task 2.2: Generate Kotlin SQLite Setup
**What it does:** Creates SQLite database setup using Room persistence library for Android.

**Available through:**
- **MCP Tool:** `generate-kotlin-sqlite`
- **REST API:** `POST /api/generate-kotlin-sqlite`

**Features:**
- Room database entities
- DAO (Data Access Objects)
- Repository pattern implementation
- Database migrations
- Caching strategies (memory/disk/none)

**Example Usage:**
```json
{
  "name": "generate-kotlin-sqlite",
  "arguments": {
    "entities": ["User", "Product", "Order"],
    "includeRepository": true,
    "includeMigrations": true,
    "cacheStrategy": "memory"
  }
}
```

**Output:** Complete Room database setup with entities, DAOs, repositories, and migration scripts

#### Task 2.3: Generate Kotlin Offline Functionality
**What it does:** Implements offline-first architecture with sync capabilities.

**Available through:**
- **MCP Tool:** `generate-kotlin-offline`
- **REST API:** `POST /api/generate-kotlin-offline`

**Sync Strategies:**
- `immediate` - Sync as soon as connectivity is restored
- `periodic` - Sync at regular intervals
- `manual` - User-triggered sync

**Conflict Resolution:**
- `client-wins` - Local changes take precedence
- `server-wins` - Server data overwrites local
- `manual` - User resolves conflicts

**Features:**
- Network connectivity detection
- Request queue for offline operations
- Automatic retry mechanisms
- Conflict resolution handling

**Example Usage:**
```json
{
  "name": "generate-kotlin-offline",
  "arguments": {
    "syncStrategy": "periodic",
    "conflictResolution": "server-wins",
    "includeNetworkDetection": true,
    "includeQueueSystem": true
  }
}
```

**Output:** Complete offline management system with WorkManager, connectivity detection, and sync logic

---

### 3. Swift/iOS Platform Tasks

#### Task 3.1: Generate Swift Login Flow
**What it does:** Creates authentication flow for iOS apps with various authentication methods.

**Available through:**
- **MCP Tool:** `generate-swift-login`
- **REST API:** `POST /api/generate-swift-login`

**Authentication Types:**
- `email-password` - Traditional login
- `biometric` - Touch ID / Face ID
- `oauth` - OAuth 2.0
- `sso` - Single Sign-On

**Design Systems:**
- `cupertino` - Native iOS design (default)
- `material` - Material Design
- `custom` - Custom design

**Example Usage:**
```json
{
  "name": "generate-swift-login",
  "arguments": {
    "authType": "biometric",
    "includeValidation": true,
    "designSystem": "cupertino",
    "companyBranding": true
  }
}
```

**Output:** SwiftUI views, authentication manager, and biometric integration code

#### Task 3.2: Generate Swift Core Data Setup
**What it does:** Creates Core Data stack for iOS data persistence.

**Available through:**
- **MCP Tool:** `generate-swift-sqlite`
- **REST API:** `POST /api/generate-swift-sqlite`

**Features:**
- Core Data model definitions
- NSManagedObject subclasses
- Repository pattern
- Migrations support
- Caching strategies

**Example Usage:**
```json
{
  "name": "generate-swift-sqlite",
  "arguments": {
    "entities": ["User", "Product", "Order"],
    "includeRepository": true,
    "includeMigrations": true,
    "cacheStrategy": "memory"
  }
}
```

**Output:** Complete Core Data setup with models, repositories, and persistent container configuration

#### Task 3.3: Generate Swift Offline Functionality
**What it does:** Implements offline-first capabilities for iOS apps.

**Available through:**
- **MCP Tool:** `generate-swift-offline`
- **REST API:** `POST /api/generate-swift-offline`

**Features:**
- Network reachability monitoring
- Background sync with URLSession
- Conflict resolution strategies
- Request queue management

**Example Usage:**
```json
{
  "name": "generate-swift-offline",
  "arguments": {
    "syncStrategy": "periodic",
    "conflictResolution": "server-wins",
    "includeNetworkDetection": true,
    "includeQueueSystem": true
  }
}
```

**Output:** Complete offline system with Combine publishers, network monitoring, and sync manager

---

### 4. React Native Platform Tasks

#### Task 4.1: Generate React Native Login Flow
**What it does:** Creates cross-platform authentication flow for React Native apps.

**Available through:**
- **MCP Tool:** `generate-react-native-login`
- **REST API:** `POST /api/generate-react-native-login`

**Authentication Types:**
- `email-password` - Standard login
- `biometric` - Fingerprint/Face recognition
- `oauth` - OAuth 2.0
- `sso` - Single Sign-On

**Example Usage:**
```json
{
  "name": "generate-react-native-login",
  "arguments": {
    "authType": "oauth",
    "includeValidation": true,
    "designSystem": "material",
    "companyBranding": true
  }
}
```

**Output:** React components, hooks, navigation setup, and authentication context

#### Task 4.2: Generate React Native SQLite Setup
**What it does:** Sets up SQLite database for React Native using react-native-sqlite-storage.

**Available through:**
- **MCP Tool:** `generate-react-native-sqlite`
- **REST API:** `POST /api/generate-react-native-sqlite`

**Features:**
- Database initialization
- CRUD operations
- Repository pattern
- Migrations
- TypeScript support

**Example Usage:**
```json
{
  "name": "generate-react-native-sqlite",
  "arguments": {
    "entities": ["User", "Product", "Order"],
    "includeRepository": true,
    "includeMigrations": true,
    "cacheStrategy": "memory"
  }
}
```

**Output:** Complete SQLite setup with database service, repositories, and migration scripts

#### Task 4.3: Generate React Native Offline Functionality
**What it does:** Implements offline-first architecture for React Native.

**Available through:**
- **MCP Tool:** `generate-react-native-offline`
- **REST API:** `POST /api/generate-react-native-offline`

**Features:**
- NetInfo for connectivity detection
- Redux/Context for offline state
- Queue management with redux-offline
- Automatic retry logic

**Example Usage:**
```json
{
  "name": "generate-react-native-offline",
  "arguments": {
    "syncStrategy": "periodic",
    "conflictResolution": "server-wins",
    "includeNetworkDetection": true,
    "includeQueueSystem": true
  }
}
```

**Output:** Complete offline system with state management, network hooks, and sync service

---

### 5. Utility Tasks

#### Task 5.1: Echo Test
**What it does:** Simple echo service for testing connectivity to the MCP server.

**Available through:**
- **MCP Tool:** `echo`
- **REST API:** `POST /api/echo`

**Example Usage (MCP):**
```json
{
  "name": "echo",
  "arguments": {
    "message": "Hello, MCP Server!"
  }
}
```

**Example Usage (REST API):**
```bash
curl -X POST http://localhost:2205/api/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, World!"}'
```

**Output:** Echoes back the message with timestamp

---

## 🔌 How to Access These Capabilities

### Option 1: Through MCP Protocol (for AI Assistants)

**Best for:** Claude Desktop, MCP-compatible AI tools

**MCP Endpoint:** `http://localhost:2205/mcp`

**Example MCP Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate-kotlin-login",
    "arguments": {
      "authType": "biometric",
      "includeValidation": true
    }
  }
}
```

**List Available Tools:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### Option 2: Through REST API (Direct HTTP)

**Best for:** Direct integration, scripting, custom applications

**API Endpoint:** `http://localhost:2205/api`

**Example REST Request:**
```bash
curl -X POST http://localhost:2205/api/generate-swift-login \
  -H "Content-Type: application/json" \
  -d '{
    "authType": "biometric",
    "includeValidation": true,
    "designSystem": "cupertino"
  }'
```

**Get API Documentation:**
```bash
curl http://localhost:2205/api
```

---

## 📊 Quick Reference Table

| Task | Platform | MCP Tool Name | REST Endpoint |
|------|----------|---------------|---------------|
| Login Flow | MAUI | `generate-maui-login` | `POST /api/generate-maui-login` |
| Login Flow | Kotlin/Android | `generate-kotlin-login` | `POST /api/generate-kotlin-login` |
| Login Flow | Swift/iOS | `generate-swift-login` | `POST /api/generate-swift-login` |
| Login Flow | React Native | `generate-react-native-login` | `POST /api/generate-react-native-login` |
| Database Setup | Kotlin/Android | `generate-kotlin-sqlite` | `POST /api/generate-kotlin-sqlite` |
| Database Setup | Swift/iOS | `generate-swift-sqlite` | `POST /api/generate-swift-sqlite` |
| Database Setup | React Native | `generate-react-native-sqlite` | `POST /api/generate-react-native-sqlite` |
| Offline Mode | Kotlin/Android | `generate-kotlin-offline` | `POST /api/generate-kotlin-offline` |
| Offline Mode | Swift/iOS | `generate-swift-offline` | `POST /api/generate-swift-offline` |
| Offline Mode | React Native | `generate-react-native-offline` | `POST /api/generate-react-native-offline` |
| Test Connection | All | `echo` | `POST /api/echo` |

---

## 🚀 Getting Started

### 1. Start the Server
```bash
npm start
# Server runs on http://localhost:2205
```

### 2. Check Health
```bash
curl http://localhost:2205/health
```

### 3. List Available Capabilities
```bash
# REST API
curl http://localhost:2205/api

# MCP Protocol
curl -X POST http://localhost:2205/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 4. Generate Your First Component
```bash
curl -X POST http://localhost:2205/api/generate-kotlin-login \
  -H "Content-Type: application/json" \
  -d '{"authType":"email-password","includeValidation":true}'
```

---

## 🎓 Use Cases

### For AI Assistants (Claude, ChatGPT with MCP support)
- **Ask:** "Generate a login page for my Kotlin Android app with biometric authentication"
- **The AI will:** Use the MCP tools to generate the code
- **You get:** Production-ready Kotlin code with all necessary components

### For Development Teams
- **Scenario:** Need to add offline functionality to iOS app
- **Solution:** Call `generate-swift-offline` with your requirements
- **Benefit:** Save hours of boilerplate coding

### For Rapid Prototyping
- **Challenge:** Need login pages for all platforms
- **Approach:** Generate for MAUI, Kotlin, Swift, and React Native
- **Result:** Consistent authentication UX across all platforms

---

## 💡 Advanced Tips

1. **Combine Multiple Tasks:** Generate login + database + offline for complete feature
2. **Customize Output:** Use the options parameters to tailor generated code
3. **Integration:** Copy generated code directly into your projects
4. **Extend:** Use generated code as a starting point and customize further

---

## 📞 Need Help?

- **Documentation:** See `/docs` folder for detailed architecture
- **Health Check:** Visit `http://localhost:2205/health`
- **API Explorer:** Visit `http://localhost:2205/api`
- **Server Info:** Visit `http://localhost:2205/`

---

## 🎯 Summary

**This server can generate production-ready code for:**
- ✅ 4 mobile platforms (MAUI, Kotlin, Swift, React Native)
- ✅ 3 core features (Login, Database, Offline)
- ✅ 11 distinct code generation tasks
- ✅ Accessible via MCP protocol or REST API
- ✅ Customizable with multiple configuration options

**Perfect for:**
- Mobile development teams
- AI-assisted coding workflows
- Rapid prototyping
- Learning mobile development patterns
- Standardizing code across projects
