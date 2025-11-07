export class ReactNativeGenerator {
    generateLogin({ authType = 'email-password', includeValidation = true, designSystem = 'material', companyBranding = true }) {
        return `
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform
} from 'react-native';
${authType === 'biometric' ? "import TouchID from 'react-native-touch-id';" : ''}
${authType === 'oauth' ? "import { GoogleSignin } from '@react-native-google-signin/google-signin';" : ''}

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  ${includeValidation ? `
  const validateEmail = (email) => {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  useEffect(() => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  }, [email]);

  useEffect(() => {
    if (password && !validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  }, [password]);
  ` : ''}

  const handleLogin = async () => {
    ${includeValidation ? `
    if (!validateEmail(email) || !validatePassword(password)) {
      Alert.alert('Error', 'Please check your email and password');
      return;
    }
    ` : ''}

    setIsLoading(true);
    
    try {
      ${authType === 'email-password' ? 'await performEmailLogin();' : 
        authType === 'biometric' ? 'await performBiometricLogin();' : 
        authType === 'oauth' ? 'await performOAuthLogin();' : 'await performSSOLogin();'}
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const performEmailLogin = async () => {
    // Implement email/password login
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      // Navigate to main screen
      navigation.navigate('Main');
    } else {
      throw new Error('Login failed');
    }
  };

  ${authType === 'biometric' ? `
  const performBiometricLogin = async () => {
    try {
      const biometryType = await TouchID.isSupported();
      if (biometryType) {
        await TouchID.authenticate('Authenticate to access your account');
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', 'Biometric authentication not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };
  ` : ''}

  ${authType === 'oauth' ? `
  const performOAuthLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      // Process OAuth login
      navigation.navigate('Main');
    } catch (error) {
      Alert.alert('Error', 'OAuth login failed');
    }
  };
  ` : ''}

  return (
    <View style={styles.container}>
      ${companyBranding ? `
      <Image 
        source={{ uri: 'https://company.com/logo.png' }} 
        style={styles.logo}
      />
      ` : ''}
      
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        ${authType === 'biometric' ? `
        <TouchableOpacity 
          style={styles.biometricButton}
          onPress={performBiometricLogin}
        >
          <Text style={styles.biometricButtonText}>Use Biometric</Text>
        </TouchableOpacity>
        ` : ''}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  ${companyBranding ? `
  logo: {
    width: 120,
    height: 60,
    alignSelf: 'center',
    marginBottom: 30,
  },
  ` : ''}
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666666',
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '${companyBranding ? '#007BFF' : '#007BFF'}',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ${authType === 'biometric' ? `
  biometricButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007BFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  biometricButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ` : ''}
});

export default LoginScreen;`;
    }

    generateSQLiteSetup({ entities = [], includeRepository = true, includeMigrations = true, cacheStrategy = 'memory' }) {
        const entitiesCode = entities.map(entity => `
// ${entity} Model
export interface ${entity} {
  id: string;
  name: string;
  createdAt: number;
}

export const ${entity}Schema = {
  name: '${entity}',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    createdAt: 'int',
  },
};`).join('\n');

        return `
// SQLite Setup for React Native
import SQLite from 'react-native-sqlite-storage';
${includeRepository ? "import AsyncStorage from '@react-native-async-storage/async-storage';" : ''}

SQLite.DEBUG(true);
SQLite.enablePromise(true);

class DatabaseManager {
  private static instance: DatabaseManager;
  private database: SQLite.SQLiteDatabase | null = null;
  
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.database) {
      return this.database;
    }

    try {
      this.database = await SQLite.openDatabase({
        name: 'AppDatabase.db',
        location: 'default',
      });

      await this.createTables();
      ${includeMigrations ? 'await this.runMigrations();' : ''}
      
      return this.database;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    ${entities.map(entity => `
    await this.database.executeSql(\`
      CREATE TABLE IF NOT EXISTS ${entity.toLowerCase()} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt INTEGER DEFAULT (strftime('%s', 'now'))
      )
    \`);`).join('\n')}
  }

  ${includeMigrations ? `
  private async runMigrations(): Promise<void> {
    // Migration logic here
    const currentVersion = await this.getDatabaseVersion();
    
    if (currentVersion < 1) {
      // Run migration to version 1
      await this.migrateTo1();
    }
  }

  private async getDatabaseVersion(): Promise<number> {
    try {
      const result = await this.database!.executeSql('PRAGMA user_version');
      return result[0].rows.item(0).user_version;
    } catch {
      return 0;
    }
  }

  private async migrateTo1(): Promise<void> {
    await this.database!.executeSql('PRAGMA user_version = 1');
  }
  ` : ''}

  public async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }
}

${entitiesCode}

${includeRepository ? entities.map(entity => `
// ${entity} Repository
export class ${entity}Repository {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    this.db = await DatabaseManager.getInstance().initDatabase();
  }

  async getAll(): Promise<${entity}[]> {
    if (!this.db) await this.initDatabase();
    
    const result = await this.db!.executeSql('SELECT * FROM ${entity.toLowerCase()}');
    const ${entity.toLowerCase()}s: ${entity}[] = [];
    
    for (let i = 0; i < result[0].rows.length; i++) {
      ${entity.toLowerCase()}s.push(result[0].rows.item(i));
    }
    
    return ${entity.toLowerCase()}s;
  }

  async create(${entity.toLowerCase()}: Omit<${entity}, 'id' | 'createdAt'>): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    const id = Date.now().toString();
    const createdAt = Date.now();
    
    await this.db!.executeSql(
      'INSERT INTO ${entity.toLowerCase()} (id, name, createdAt) VALUES (?, ?, ?)',
      [id, ${entity.toLowerCase()}.name, createdAt]
    );
  }

  async update(${entity.toLowerCase()}: ${entity}): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    await this.db!.executeSql(
      'UPDATE ${entity.toLowerCase()} SET name = ? WHERE id = ?',
      [${entity.toLowerCase()}.name, ${entity.toLowerCase()}.id]
    );
  }

  async delete(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    await this.db!.executeSql('DELETE FROM ${entity.toLowerCase()} WHERE id = ?', [id]);
  }
}
`).join('\n') : ''}

// Cache Strategy: ${cacheStrategy}
// Migrations: ${includeMigrations}
// Repository Pattern: ${includeRepository}

export default DatabaseManager;`;
    }

    generateOfflineSetup({ syncStrategy = 'periodic', conflictResolution = 'server-wins', includeNetworkDetection = true, includeQueueSystem = true }) {
        return `
// Offline Setup for React Native
import NetInfo from '@react-native-netinfo/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
${includeQueueSystem ? "import BackgroundJob from 'react-native-background-job';" : ''}

interface OfflineRequest {
  id: string;
  endpoint: string;
  method: string;
  data?: any;
  timestamp: number;
}

class OfflineManager {
  private static instance: OfflineManager;
  private isConnected: boolean = false;
  ${includeQueueSystem ? 'private requestQueue: OfflineRequest[] = [];' : ''}
  private syncInterval: NodeJS.Timeout | null = null;

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  constructor() {
    ${includeNetworkDetection ? 'this.initNetworkMonitoring();' : ''}
    this.initSyncStrategy();
    ${includeQueueSystem ? 'this.loadRequestQueue();' : ''}
  }

  ${includeNetworkDetection ? `
  private initNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;
      
      if (!wasConnected && this.isConnected) {
        // Connection restored
        this.processQueuedRequests();
      }
    });
  }

  public isNetworkAvailable(): boolean {
    return this.isConnected;
  }
  ` : ''}

  ${includeQueueSystem ? `
  public async queueRequest(request: Omit<OfflineRequest, 'id' | 'timestamp'>): Promise<void> {
    const queuedRequest: OfflineRequest = {
      ...request,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    this.requestQueue.push(queuedRequest);
    await this.saveRequestQueue();
  }

  private async loadRequestQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('offlineRequestQueue');
      if (queueData) {
        this.requestQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load request queue:', error);
    }
  }

  private async saveRequestQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offlineRequestQueue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('Failed to save request queue:', error);
    }
  }

  private async processQueuedRequests(): Promise<void> {
    if (!this.isConnected || this.requestQueue.length === 0) return;

    const requests = [...this.requestQueue];
    this.requestQueue = [];
    await this.saveRequestQueue();

    for (const request of requests) {
      try {
        await this.processRequest(request);
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Re-queue failed request
        this.requestQueue.push(request);
      }
    }

    if (this.requestQueue.length > 0) {
      await this.saveRequestQueue();
    }
  }

  private async processRequest(request: OfflineRequest): Promise<void> {
    const response = await fetch(request.endpoint, {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      body: request.data ? JSON.stringify(request.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(\`Request failed: \${response.status}\`);
    }
  }
  ` : ''}

  private initSyncStrategy(): void {
    switch ('${syncStrategy}') {
      case 'immediate':
        // Sync immediately when connection is available
        break;
      case 'periodic':
        this.schedulePeriodicSync();
        break;
      case 'manual':
        // Wait for manual trigger
        break;
    }
  }

  private schedulePeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isConnected) {
        this.syncData();
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes
  }

  public async syncData(): Promise<void> {
    if (!this.isConnected) return;

    try {
      ${includeQueueSystem ? 'await this.processQueuedRequests();' : ''}
      // Additional sync logic here
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  public handleConflict<T>(localData: T, serverData: T): T {
    switch ('${conflictResolution}') {
      case 'client-wins':
        return localData;
      case 'server-wins':
        return serverData;
      case 'manual':
        // Show conflict resolution UI
        return this.promptUserForResolution(localData, serverData);
      default:
        return serverData;
    }
  }

  private promptUserForResolution<T>(localData: T, serverData: T): T {
    // Implementation would show conflict resolution UI
    // For now, return server data as default
    return serverData;
  }

  ${includeQueueSystem ? `
  public startBackgroundSync(): void {
    BackgroundJob.start({
      jobKey: 'offlineSync',
      period: 15000, // 15 seconds
    });
  }

  public stopBackgroundSync(): void {
    BackgroundJob.stop();
  }
  ` : ''}
}

// Sync Strategy: ${syncStrategy}
// Conflict Resolution: ${conflictResolution}
// Network Detection: ${includeNetworkDetection}
// Queue System: ${includeQueueSystem}

export default OfflineManager;`;
    }
}
