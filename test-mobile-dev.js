#!/usr/bin/env node

// Test the mobile development MCP server
import http from 'http';

function makeRequest(data, sessionId = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 2205,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    if (sessionId) {
      options.headers['Mcp-Session-Id'] = sessionId;
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const sessionIdHeader = res.headers['mcp-session-id'];
        resolve({ body, sessionId: sessionIdHeader });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testMobileDevelopmentServer() {
  console.log('🧪 Testing Mobile Development MCP Server...\n');
  
  try {
    // Initialize
    const initResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'mobile-dev-test-client',
          version: '1.0.0'
        }
      }
    });
    
    const sessionId = initResponse.sessionId;
    console.log('✅ Initialized mobile development server');
    
    // List tools
    const toolsResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    }, sessionId);
    
    console.log('📱 Available mobile development tools:');
    console.log(toolsResponse.body);
    
    // Test login flow generation for React Native
    const loginResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'generate-login-flow',
        arguments: {
          platform: 'react-native',
          authType: 'email-password',
          includeValidation: true,
          designSystem: 'material',
          companyBranding: true
        }
      }
    }, sessionId);
    
    console.log('\n🚀 Generated React Native Login Flow:');
    console.log(loginResponse.body);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMobileDevelopmentServer();
