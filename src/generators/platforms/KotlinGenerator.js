export class KotlinGenerator {
    generateLogin({ authType = 'email-password', includeValidation = true, designSystem = 'material', companyBranding = true }) {
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
    
    ${authType === 'biometric' ? `
    private fun performBiometricLogin() {
        val biometricPrompt = BiometricPrompt(this as FragmentActivity, 
            ContextCompat.getMainExecutor(this), object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                finish()
            }
            
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                showError("Biometric authentication failed")
            }
        })
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Authentication")
            .setSubtitle("Use your fingerprint or face to authenticate")
            .setNegativeButtonText("Cancel")
            .build()
            
        biometricPrompt.authenticate(promptInfo)
    }
    ` : ''}
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}`;
    }

    generateSQLiteSetup({ entities = [], includeRepository = true, includeMigrations = true, cacheStrategy = 'memory' }) {
        const entitiesCode = entities.map(entity => `
@Entity(tableName = "${entity.toLowerCase()}")
data class ${entity}(
    @PrimaryKey val id: String,
    val name: String,
    val createdAt: Long = System.currentTimeMillis()
)`).join('\n');

        return `
// Room Database Setup for Android/Kotlin
@Database(
    entities = [${entities.join(', ')}::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    ${entities.map(entity => `abstract fun ${entity.toLowerCase()}Dao(): ${entity}Dao`).join('\n    ')}
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                )${includeMigrations ? '.addMigrations(MIGRATION_1_2)' : '.fallbackToDestructiveMigration()'}
                ${cacheStrategy === 'memory' ? '.allowMainThreadQueries()' : ''}
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

${entitiesCode}

${entities.map(entity => `
@Dao
interface ${entity}Dao {
    @Query("SELECT * FROM ${entity.toLowerCase()}")
    fun getAll(): Flow<List<${entity}>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(${entity.toLowerCase()}: ${entity})
    
    @Delete
    suspend fun delete(${entity.toLowerCase()}: ${entity})
    
    @Update
    suspend fun update(${entity.toLowerCase()}: ${entity})
}
`).join('\n')}

${includeRepository ? entities.map(entity => `
class ${entity}Repository(private val ${entity.toLowerCase()}Dao: ${entity}Dao) {
    fun getAll${entity}s() = ${entity.toLowerCase()}Dao.getAll()
    
    suspend fun insert(${entity.toLowerCase()}: ${entity}) {
        ${entity.toLowerCase()}Dao.insert(${entity.toLowerCase()})
    }
    
    suspend fun delete(${entity.toLowerCase()}: ${entity}) {
        ${entity.toLowerCase()}Dao.delete(${entity.toLowerCase()})
    }
    
    suspend fun update(${entity.toLowerCase()}: ${entity}) {
        ${entity.toLowerCase()}Dao.update(${entity.toLowerCase()})
    }
}
`).join('\n') : ''}

// Cache Strategy: ${cacheStrategy}
// Migrations: ${includeMigrations}
// Repository Pattern: ${includeRepository}`;
    }

    generateOfflineSetup({ syncStrategy = 'periodic', conflictResolution = 'server-wins', includeNetworkDetection = true, includeQueueSystem = true }) {
        return `
// Offline Setup for Android/Kotlin
class OfflineManager(private val context: Context) {
    private val networkManager = NetworkManager(context)
    private val syncManager = SyncManager()
    private val requestQueue = if (includeQueueSystem) { RequestQueue() } else { null }
    
    ${includeNetworkDetection ? `
    fun isNetworkAvailable(): Boolean = networkManager.isConnected()
    
    fun observeNetworkState(): Flow<Boolean> = networkManager.networkState
    ` : ''}
    
    ${includeQueueSystem ? `
    fun queueRequest(request: OfflineRequest) {
        requestQueue?.add(request)
    }
    
    suspend fun processQueuedRequests() {
        requestQueue?.processAll { request ->
            syncManager.syncRequest(request)
        }
    }
    ` : ''}
    
    suspend fun syncData() {
        when ("${syncStrategy}") {
            "immediate" -> syncManager.syncImmediately()
            "periodic" -> syncManager.schedulePeriodicSync()
            "manual" -> syncManager.waitForManualTrigger()
        }
    }
    
    fun handleConflict(localData: Any, serverData: Any): Any {
        return when ("${conflictResolution}") {
            "client-wins" -> localData
            "server-wins" -> serverData
            "manual" -> promptUserForResolution(localData, serverData)
            else -> serverData
        }
    }
}

class NetworkManager(private val context: Context) {
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    
    fun isConnected(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
    
    val networkState: Flow<Boolean> = callbackFlow {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                trySend(true)
            }
            
            override fun onLost(network: Network) {
                trySend(false)
            }
        }
        
        connectivityManager.registerDefaultNetworkCallback(callback)
        awaitClose { connectivityManager.unregisterNetworkCallback(callback) }
    }
}

// Sync Strategy: ${syncStrategy}
// Conflict Resolution: ${conflictResolution}
// Network Detection: ${includeNetworkDetection}
// Queue System: ${includeQueueSystem}`;
    }
}
