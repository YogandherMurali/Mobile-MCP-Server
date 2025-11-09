# Mobile MCP Server

A comprehensive mobile development code generation platform supporting both MCP (Model Context Protocol) and REST API. Generate production-ready code for MAUI, Kotlin/Android, Swift/iOS, and React Native applications.

## 📖 What Can This Server Do?

**Looking for capabilities?** See **[CAPABILITIES.md](CAPABILITIES.md)** for a complete guide to all available code generation tasks!

**Quick Summary:**
- 🎯 **4 Mobile Platforms:** MAUI, Kotlin/Android, Swift/iOS, React Native
- 🔐 **Authentication Flows:** Email/password, biometric, OAuth, SSO
- 💾 **Database Setup:** SQLite, Room, Core Data with repositories
- 📴 **Offline Functionality:** Sync strategies and conflict resolution
- 🔌 **Dual Access:** MCP Protocol for AI assistants + REST API for direct use

## 🚀 Features

- **MCP Protocol Support**: Full implementation of the Model Context Protocol for AI assistants
- **REST API**: Simple HTTP endpoints for direct integration
- **Multi-Platform Code Generation**: Support for 4 major mobile platforms
- **Production-Ready Code**: Generate complete, working components
- **Docker Ready**: Complete containerization with Docker and Docker Compose
- **Health Monitoring**: Built-in health checks and monitoring endpoints
- **Comprehensive Documentation**: Detailed guides and examples

## 📋 Prerequisites

- **Docker**: Docker Desktop or Docker Engine
- **Docker Compose**: For orchestration (usually included with Docker Desktop)
- **Node.js 18+**: For local development (optional)

## 🛠️ Quick Start

### Using Docker (Recommended)

1. **Clone or download this repository**
2. **Run the batch file** (Windows):
   ```bash
   run.bat
   ```
   
   Or use Docker Compose directly (Windows/Mac/Linux):
   ```bash
   docker-compose up --build
   ```

3. **Access the server**:
   - Health Check: http://localhost:3000/health
   - Server Info: http://localhost:3000/mcp/info
   - MCP Endpoint: http://localhost:3000/mcp

### Using Node.js (Development)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## 🔧 API Endpoints

### Health Check
```
GET /health
```
Returns server health status and basic information.

### Server Information
```
GET /mcp/info
```
Returns detailed server capabilities and configuration.

### MCP Protocol Endpoint
```
POST /mcp
```
Main endpoint for MCP protocol communication.

### MCP Inspector Proxy Endpoint
```
POST /proxy/mcp
```
Proxy endpoint specifically designed for MCP Inspector compatibility.
Supports authentication tokens via `X-Proxy-Token` or `X-MCP-Token` headers.

### Proxy Information
```
GET /proxy/info
```
Returns proxy configuration and capabilities for MCP Inspector.

## 🔗 MCP Inspector Connection

### Connection URLs for MCP Inspector:

**Option 1: Direct HTTP (Recommended)**
- **URL**: `http://localhost:3000/mcp`
- **Transport**: HTTP POST with JSON-RPC 2.0

**Option 2: Proxy HTTP (For MCP Inspector compatibility)**
- **URL**: `http://localhost:3000/proxy/mcp`
- **Transport**: HTTP POST with JSON-RPC 2.0
- **Headers**: Optional `X-Proxy-Token` for authentication

**Option 3: WebSocket**
- **URL**: `ws://localhost:3000/mcp/ws`
- **Transport**: WebSocket with JSON-RPC 2.0

### MCP Inspector Setup Steps:

1. **Start your server**: Run `npm start` or `./run.sh`
2. **Open MCP Inspector** in your browser
3. **Choose connection method**:
   - For HTTP: Use `http://localhost:3000/proxy/mcp`
   - For WebSocket: Use `ws://localhost:3000/mcp/ws`
4. **Add authentication** (optional): Include proxy token if required
5. **Test connection**: The server should respond with available tools Supports full JSON-RPC 2.0 protocol.

### Server-Sent Events (SSE)
```
GET /mcp/sse
```
Streaming endpoint for real-time MCP communication.

## 🔍 MCP Inspector Integration

This server is compatible with MCP Inspector for testing and debugging. To connect:

1. **Start the server**: `npm start` or `./run.sh` (macOS/Linux) or `run.bat` (Windows)
2. **Open MCP Inspector** in your browser
3. **Connect using HTTP transport**:
   - **Server URL**: `http://localhost:3000/mcp`
   - **Transport**: HTTP
   - **Protocol**: JSON-RPC 2.0

### Example MCP Inspector Connection

The server supports all standard MCP methods:

- `initialize` - Initialize the MCP session
- `tools/list` - List available tools
- `tools/call` - Call a specific tool
- `initialized` - Notification after initialization

**Manual Testing Commands:**

```bash
# Initialize connection
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'

# Call echo tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "message": "Hello MCP!",
        "format": "uppercase",
        "timestamp": true
      }
    }
  }'
```

## 🛠️ Available Tools

### Echo Tool
A demonstration tool that echoes back input with optional formatting.

**Parameters:**
- `message` (required): The message to echo back
- `format` (optional): Format type - "plain", "uppercase", "lowercase", "reverse"
- `timestamp` (optional): Include timestamp (boolean)

**Example Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "message": "Hello World!",
      "format": "uppercase",
      "timestamp": true
    }
  }
}
```

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "[2025-11-07T10:30:00.000Z] HELLO WORLD!"
    }
  ]
}
```

## 🐳 Docker Configuration

### Building the Image
```bash
docker build -t mobile-mcp-server .
```

### Running with Docker Compose
```bash
# Start the server
docker-compose up

# Start in background
docker-compose up -d

# Stop the server
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `NODE_ENV` | `development` | Environment mode |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |

## 📁 Project Structure

```
Mobile-MCP-Server/
├── src/
│   ├── index.js                    # Main hybrid server (MCP + REST)
│   └── generators/
│       ├── MAUILoginGenerator.js   # MAUI template-based generator
│       └── platforms/              # Platform-specific generators
│           ├── KotlinGenerator.js  # Android/Kotlin code generation
│           ├── SwiftGenerator.js   # iOS/Swift code generation
│           └── ReactNativeGenerator.js # React Native code generation
├── templates/
│   └── maui/                       # MAUI template files (.template files)
├── docs/
│   ├── ARCHITECTURE.md             # Complete architecture documentation
│   ├── DEVELOPER_GUIDE.md          # Step-by-step development guide
│   ├── CODE_TEMPLATES.md           # Copy-paste templates for new platforms
│   └── COMPREHENSIVE_API_TEST.md   # Full API testing results
├── logs/                           # Log files (created at runtime)
├── docker-compose.yml              # Docker Compose configuration
├── Dockerfile                      # Docker image configuration
├── package.json                    # Node.js dependencies and scripts
├── run.bat                         # Windows batch file to start Docker
├── .env.example                    # Environment variables example
├── .gitignore                      # Git ignore patterns
└── README.md                       # This file
```

## 🏗️ Architecture & Development

This server follows a **hybrid architecture** supporting both MCP protocol and REST API seamlessly. When adding new platforms or features, follow our established patterns:

### 📖 Essential Documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete architecture overview and design principles
- **[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** - Step-by-step guide with complete Flutter example
- **[docs/CODE_TEMPLATES.md](docs/CODE_TEMPLATES.md)** - Copy-paste templates for rapid development
- **[docs/COMPREHENSIVE_API_TEST.md](docs/COMPREHENSIVE_API_TEST.md)** - Full testing results and server status

### 🔧 Development Patterns
- **Generator Classes**: Platform-specific code generation following standard interface
- **Hybrid Protocol Support**: Single codebase serves both MCP and REST protocols  
- **Template-Based Generation**: Clean separation between logic and output
- **Consistent API Patterns**: Standardized options and response formats

### 🚀 Quick Platform Addition
Follow the step-by-step guide in [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) to add new platforms like Flutter, Xamarin, or others. The guide includes complete examples and copy-paste templates.

## 🔒 Security Features

- **Helmet.js**: Security headers and protection
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: JSON schema validation for requests
- **Non-root User**: Docker container runs as non-root user
- **Health Checks**: Built-in container health monitoring

## 🚀 Development

### Adding New Platforms

For detailed instructions on adding new mobile platforms, see our comprehensive documentation:

1. **[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** - Complete step-by-step walkthrough with Flutter example
2. **[docs/CODE_TEMPLATES.md](docs/CODE_TEMPLATES.md)** - Ready-to-use templates for rapid development
3. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Understanding the system architecture and patterns

### Quick Start for New Platform

1. Create generator class in `src/generators/platforms/`
2. Add platform imports to main server
3. Register MCP tools and handlers
4. Add REST API endpoints
5. Update documentation endpoints
6. Test all functionality

See [docs/CODE_TEMPLATES.md](docs/CODE_TEMPLATES.md) for copy-paste templates that speed up this process.

### Legacy Tool Addition (for reference)

The traditional MCP tool addition pattern (now superseded by our platform-based approach):

1. **Define the tool** in the `ListToolsRequestSchema` handler:
   ```javascript
   {
     name: 'your-tool-name',
     description: 'Tool description',
     inputSchema: {
       // JSON schema for input validation
     }
   }
   ```

2. **Implement the tool** in the `CallToolRequestSchema` handler:
   ```javascript
   if (name === 'your-tool-name') {
     // Tool implementation
     return {
       content: [
         {
           type: 'text',
           text: 'Tool response'
         }
       ]
     };
   }
   ```

### Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start development server with auto-reload
- `npm run docker:build`: Build Docker image
- `npm run docker:run`: Run with Docker Compose
- `npm run docker:stop`: Stop Docker containers

## 🔍 Testing

### Test the Echo Tool
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "message": "Hello MCP!",
        "format": "uppercase",
        "timestamp": true
      }
    }
  }'
```

### List Available Tools
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list"
  }'
```

## 🐛 Troubleshooting

### MCP Inspector Connection Issues
1. **Proxy Token Error**: 
   - Try without authentication first (development mode)
   - Use `X-Proxy-Token` header if authentication is required
   - Check browser console for CORS errors

2. **Connection Refused**:
   - Ensure server is running on port 3000
   - Check firewall settings
   - Verify URL format (http:// or ws://)

3. **CORS Errors**:
   - Server includes MCP Inspector domains in CORS whitelist
   - Try different connection methods (HTTP vs WebSocket)

### Docker Issues
1. **Ensure Docker is running**: Check Docker Desktop or `docker info`
2. **Port conflicts**: Change the port in `docker-compose.yml` if 3000 is taken
3. **Permission issues**: Ensure Docker has proper permissions

### Connection Issues
1. **Check firewall**: Ensure port 3000 is not blocked
2. **CORS errors**: Update `ALLOWED_ORIGINS` environment variable
3. **Health check**: Visit http://localhost:3000/health

### Logs
- **Docker logs**: `docker-compose logs mobile-mcp-server`
- **Container logs**: `docker logs mobile-mcp-server`

## 📝 License

MIT License - feel free to use this boilerplate for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Docker and Node.js documentation
3. Check the MCP protocol specification

---

**Happy coding!** 🎉
