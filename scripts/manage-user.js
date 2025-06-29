/* eslint-disable no-console */
// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const chalk = require('chalk').default;
const postgres = require('postgres');
const readline = require('readline');

// Create database connection AFTER environment variables are loaded
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: 'prefer',
  onnotice: () => {}, // Ignore NOTICE statements - they're not errors
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt user for input
function prompt(question) {
  // eslint-disable-next-line no-undef
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Table configurations with their columns and validation rules
const TABLE_CONFIGS = {
  users: {
    name: 'Users',
    columns: {
      email: { type: 'string', required: true, validation: 'email' },
      name: { type: 'string', required: false },
      image: { type: 'string', required: false, validation: 'url' },
      email_verified: { type: 'timestamp', required: false },
      created_at: { type: 'timestamp', required: false, readonly: true },
      updated_at: { type: 'timestamp', required: false, readonly: true }
    }
  },
  user_role_assignments: {
    name: 'User Role Assignments',
    columns: {
      role_id: { type: 'integer', required: true, validation: 'role_exists' },
      assigned_by: {
        type: 'integer',
        required: false,
        validation: 'user_exists'
      },
      assigned_at: { type: 'timestamp', required: false, readonly: true },
      expires_at: { type: 'timestamp', required: false },
      is_active: { type: 'boolean', required: true, default: true }
    }
  },
  user_permissions: {
    name: 'User Permissions',
    columns: {
      permission_id: {
        type: 'integer',
        required: true,
        validation: 'permission_exists'
      },
      granted: { type: 'boolean', required: true },
      granted_by: {
        type: 'integer',
        required: false,
        validation: 'user_exists'
      },
      granted_at: { type: 'timestamp', required: false, readonly: true },
      expires_at: { type: 'timestamp', required: false },
      reason: { type: 'string', required: false }
    }
  },
  user_timeouts: {
    name: 'User Timeouts',
    columns: {
      timeout_type: {
        type: 'string',
        required: true,
        validation: 'enum',
        enum_values: ['post_creation', 'comment_creation', 'full_access']
      },
      reason: { type: 'string', required: true },
      issued_by: { type: 'integer', required: true, validation: 'user_exists' },
      issued_at: { type: 'timestamp', required: false, readonly: true },
      expires_at: { type: 'timestamp', required: true },
      is_active: { type: 'boolean', required: true, default: true },
      revoked_by: {
        type: 'integer',
        required: false,
        validation: 'user_exists'
      },
      revoked_at: { type: 'timestamp', required: false },
      revoke_reason: { type: 'string', required: false }
    }
  },
  custom_emojis: {
    name: 'Custom Emojis',
    columns: {
      name: { type: 'string', required: true },
      display_name: { type: 'string', required: true },
      category: { type: 'string', required: true },
      approval_status: {
        type: 'string',
        required: true,
        validation: 'enum',
        enum_values: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      reviewed_by: {
        type: 'integer',
        required: false,
        validation: 'user_exists'
      },
      reviewed_at: { type: 'timestamp', required: false },
      review_notes: { type: 'string', required: false },
      is_globally_available: {
        type: 'boolean',
        required: false,
        default: false
      }
    }
  },
  user_subscriptions: {
    name: 'User Subscriptions',
    columns: {
      plan_id: { type: 'integer', required: true, validation: 'plan_exists' },
      status: {
        type: 'string',
        required: true,
        validation: 'enum',
        enum_values: ['active', 'cancelled', 'expired', 'suspended', 'pending', 'trialing'],
        default: 'active'
      },
      billing_cycle: {
        type: 'string',
        required: false,
        validation: 'enum',
        enum_values: ['monthly', 'yearly', 'lifetime', 'trial']
      },
      expires_at: { type: 'timestamp', required: false },
      trial_ends_at: { type: 'timestamp', required: false },
      assigned_by: {
        type: 'integer',
        required: false,
        validation: 'user_exists'
      },
      assignment_reason: { type: 'string', required: false },
      external_subscription_id: { type: 'string', required: false },
      price_paid_cents: { type: 'integer', required: false }
    }
  }
};

// Validation functions
async function validateValue(value, column, tableName) {
  if (!value && column.required) {
    throw new Error(`${column.name || 'Field'} is required`);
  }

  if (!value) return true; // Optional field with no value

  switch (column.type) {
    case 'integer': {
      const intValue = parseInt(value);
      if (isNaN(intValue)) {
        throw new Error('Value must be a valid integer');
      }
      break;
    }

    case 'boolean':
      if (
        !['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())
      ) {
        throw new Error('Value must be true/false, 1/0, or yes/no');
      }
      break;

    case 'timestamp':
      if (value !== 'null' && value !== 'now' && isNaN(Date.parse(value))) {
        throw new Error('Value must be a valid date/time, "now", or "null"');
      }
      break;

    case 'string':
      // Additional string validations
      if (column.validation === 'email' && !value.includes('@')) {
        throw new Error('Value must be a valid email address');
      }
      if (column.validation === 'url' && !value.startsWith('http')) {
        throw new Error('Value must be a valid URL starting with http/https');
      }
      break;
  }

  // Enum validation
  if (column.validation === 'enum' && !column.enum_values.includes(value)) {
    throw new Error(`Value must be one of: ${column.enum_values.join(', ')}`);
  }

  // Reference validations
  if (column.validation === 'user_exists') {
    const userExists =
      await sql`SELECT id FROM users WHERE id = ${parseInt(value)}`;
    if (userExists.length === 0) {
      throw new Error(`User with ID ${value} does not exist`);
    }
  }

  if (column.validation === 'role_exists') {
    const roleExists =
      await sql`SELECT id FROM user_roles WHERE id = ${parseInt(value)}`;
    if (roleExists.length === 0) {
      throw new Error(`Role with ID ${value} does not exist`);
    }
  }

  if (column.validation === 'permission_exists') {
    const permExists =
      await sql`SELECT id FROM permissions WHERE id = ${parseInt(value)}`;
    if (permExists.length === 0) {
      throw new Error(`Permission with ID ${value} does not exist`);
    }
  }

  if (column.validation === 'plan_exists') {
    const planExists =
      await sql`SELECT id FROM subscription_plans WHERE id = ${parseInt(value)}`;
    if (planExists.length === 0) {
      throw new Error(`Subscription plan with ID ${value} does not exist`);
    }
  }

  return true;
}

// Convert value to appropriate type for database
function convertValue(value, column) {
  if (!value || value === 'null') return null;

  switch (column.type) {
    case 'integer':
      return parseInt(value);
    case 'boolean':
      return ['true', '1', 'yes'].includes(value.toLowerCase());
    case 'timestamp':
      if (value === 'now') return new Date();
      return new Date(value);
    default:
      return value;
  }
}

// Display user information from all relevant tables
async function displayUserInfo(userId) {
  console.log(chalk.blue(`👤 USER INFORMATION - ID: ${userId}`));
  console.log(chalk.gray('Fetching comprehensive user data...\n'));

  try {
    // Basic user info
    const user = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (user.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(chalk.green('👤 BASIC USER INFO'));
    console.table(user[0]);

    // Account connections (OAuth providers)
    try {
      const accounts = await sql`
        SELECT 
          id,
          type,
          provider,
          "providerAccountId", -- OAuth provider ID (for reference only)
          refresh_token IS NOT NULL as has_refresh_token,
          access_token IS NOT NULL as has_access_token,
          expires_at,
          token_type,
          scope
        FROM accounts 
        WHERE "userId" = ${userId}
        ORDER BY provider
      `;

      if (accounts.length > 0) {
        console.log(chalk.green('\n🔗 ACCOUNT CONNECTIONS'));
        console.table(accounts);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error fetching accounts:'), error.message);
    }

    // Active sessions
    try {
      const sessions = await sql`
        SELECT 
          id,
          "sessionToken",
          expires
        FROM sessions 
        WHERE "userId" = ${userId}
        AND expires > CURRENT_TIMESTAMP
        ORDER BY expires DESC
      `;

      if (sessions.length > 0) {
        console.log(chalk.green('\n🔓 ACTIVE SESSIONS'));
        console.table(sessions);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error fetching sessions:'), error.message);
    }

    // Activity statistics (handle permission errors gracefully)
    try {
      const activityStats = await sql`
        SELECT 
          COALESCE(COUNT(DISTINCT s.submission_id), 0) as total_submissions,
          COALESCE(COUNT(DISTINCT p.id), 0) as total_posts,
          COALESCE(COUNT(DISTINCT c.id), 0) as total_comments,
          COALESCE(MAX(s.submission_datetime), NULL) as latest_submission_date,
          COALESCE(MAX(p.created_at), NULL) as latest_post_date,
          COALESCE(MAX(c.created_at), NULL) as latest_comment_date
        FROM users u
        LEFT JOIN submissions s ON u.id = s.user_id
        LEFT JOIN posts p ON u.id = p.author_id  
        LEFT JOIN comments c ON u.id = c.author_id
        WHERE u.id = ${userId}
        GROUP BY u.id
      `;

      if (activityStats.length > 0) {
        console.log(chalk.green('\n📊 ACTIVITY STATISTICS'));
        console.table(activityStats);
      }
    } catch (error) {
      console.log(
        chalk.yellow('⚠️ Activity stats unavailable (insufficient permissions)')
      );
    }

    // User roles with detailed permissions
    try {
      const roles = await sql`
        SELECT 
          ura.id, 
          ur.name as role_name, 
          ur.display_name,
          ur.description,
          ura.assigned_at,
          ura.expires_at,
          ura.is_active,
          u.name as assigned_by_name,
          u.email as assigned_by_email
        FROM user_role_assignments ura
        JOIN user_roles ur ON ura.role_id = ur.id
        LEFT JOIN users u ON ura.assigned_by = u.id
        WHERE ura.user_id = ${userId}
        ORDER BY ura.assigned_at DESC
      `;

      if (roles.length > 0) {
        console.log(chalk.green('\n🔐 USER ROLES'));
        console.table(roles);

        // For each role, show what permissions it grants
        for (const role of roles) {
          try {
            // Get the role ID dynamically
            const roleRecord =
              await sql`SELECT id FROM user_roles WHERE name = ${role.role_name}`;
            if (roleRecord.length === 0) continue;

            const rolePermissions = await sql`
              SELECT 
                p.name as permission_name,
                p.display_name,
                p.description,
                p.category,
                p.is_inheritable
              FROM role_permissions rp
              JOIN permissions p ON rp.permission_id = p.id
              WHERE rp.role_id = ${roleRecord[0].id}
              ORDER BY p.category, p.name
            `;

            if (rolePermissions.length > 0) {
              console.log(
                chalk.yellow(`\n📋 PERMISSIONS - "${role.display_name}" ROLE`)
              );
              console.table(rolePermissions);
            }
          } catch (error) {
            console.error(
              chalk.red(
                `❌ Error fetching permissions for role ${role.role_name}:`
              ),
              error.message
            );
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error fetching user roles:'), error.message);
    }

    // User permissions (direct overrides)
    try {
      const permissions = await sql`
        SELECT 
          up.id,
          p.name as permission_name,
          p.display_name,
          p.description,
          p.category,
          up.granted,
          up.granted_at,
          up.expires_at,
          up.reason,
          u.name as granted_by_name,
          u.email as granted_by_email
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        LEFT JOIN users u ON up.granted_by = u.id
        WHERE up.user_id = ${userId}
        ORDER BY up.granted_at DESC
      `;

      if (permissions.length > 0) {
        console.log(chalk.green('\n⚡ DIRECT PERMISSION OVERRIDES'));
        console.table(permissions);
      }
    } catch (error) {
      console.error(
        chalk.red('❌ Error fetching user permissions:'),
        error.message
      );
    }

    // User timeouts
    const timeouts = await sql`
      SELECT 
        ut.id,
        ut.timeout_type,
        ut.reason,
        ut.issued_at,
        ut.expires_at,
        ut.is_active,
        u1.name as issued_by_name,
        u1.email as issued_by_email,
        u2.name as revoked_by_name,
        u2.email as revoked_by_email,
        ut.revoke_reason
      FROM user_timeouts ut
      LEFT JOIN users u1 ON ut.issued_by = u1.id
      LEFT JOIN users u2 ON ut.revoked_by = u2.id
      WHERE ut.user_id = ${userId}
      ORDER BY ut.issued_at DESC
    `;

    if (timeouts.length > 0) {
      console.groupCollapsed(chalk.green('⏰ USER TIMEOUTS'));
      console.table(timeouts);
      console.groupEnd();
    }

    // Custom emojis with detailed information
    const emojis = await sql`
      SELECT 
        ce.id,
        ce.emoji_id,
        ce.name,
        ce.description,
        ec.display_name as category_name,
        ce.tags,
        ce.aliases,
        ce.image_format,
        ce.image_size_bytes,
        ce.image_width,
        ce.image_height,
        ce.is_public,
        ce.is_approved,
        ce.encryption_type,
        ce.created_at,
        ce.approved_at,
        u.name as approved_by_name,
        u.email as approved_by_email
      FROM custom_emojis ce
      LEFT JOIN emoji_categories ec ON ce.category_id = ec.id
      LEFT JOIN users u ON ce.approved_by = u.id
      WHERE ce.user_id = ${userId}
      ORDER BY ce.created_at DESC
    `;

    if (emojis.length > 0) {
      console.groupCollapsed(chalk.green('😀 CUSTOM EMOJIS'));
      console.table(emojis);
      console.groupEnd();
    }

    // Emoji usage statistics
    const emojiUsage = await sql`
      SELECT 
        emoji_type,
        emoji_id,
        usage_count,
        last_used_at
      FROM emoji_usage 
      WHERE user_id = ${userId}
      ORDER BY usage_count DESC, last_used_at DESC
      LIMIT 10
    `;

    if (emojiUsage.length > 0) {
      console.groupCollapsed(chalk.green('📈 TOP 10 EMOJI USAGE'));
      console.table(emojiUsage);
      console.groupEnd();
    }

    // User encryption keys
    const encryptionKeys = await sql`
      SELECT 
        id,
        created_at,
        updated_at
      FROM user_encryption_keys 
      WHERE user_id = ${userId}
    `;

    if (encryptionKeys.length > 0) {
      console.groupCollapsed(chalk.green('🔐 ENCRYPTION KEYS'));
      console.table(encryptionKeys);
      console.groupEnd();
    }

    // Recent posts (if any) - use correct column name (subthread)
    try {
      const recentPosts = await sql`
        SELECT 
          id,
          title,
          subthread,
          score,
          comment_count,
          created_at
        FROM posts 
        WHERE author_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 5
      `;

      if (recentPosts.length > 0) {
        console.groupCollapsed(chalk.green('📝 RECENT POSTS (LATEST 5)'));
        console.table(recentPosts);
        console.groupEnd();
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          '⚠️ Recent posts unavailable (table may not exist or insufficient permissions)'
        )
      );
    }

    // Recent comments (if any)
    try {
      const recentComments = await sql`
        SELECT 
          c.id,
          LEFT(c.content, 100) as content_preview,
          p.title as post_title,
          c.score,
          c.created_at
        FROM comments c
        LEFT JOIN posts p ON c.post_id = p.id
        WHERE c.author_id = ${userId}
        ORDER BY c.created_at DESC
        LIMIT 5
      `;

      if (recentComments.length > 0) {
        console.groupCollapsed(chalk.green('💬 RECENT COMMENTS (LATEST 5)'));
        console.table(recentComments);
        console.groupEnd();
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          '⚠️ Recent comments unavailable (table may not exist or insufficient permissions)'
        )
      );
    }

    // Recent submissions (if any)
    try {
      const recentSubmissions = await sql`
        SELECT 
          submission_id,
          submission_name,
          submission_title,
          submission_url,
          tags,
          submission_datetime
        FROM submissions 
        WHERE user_id = ${userId}
        ORDER BY submission_datetime DESC
        LIMIT 5
      `;

      if (recentSubmissions.length > 0) {
        console.groupCollapsed(chalk.green('📄 RECENT SUBMISSIONS (LATEST 5)'));
        console.table(recentSubmissions);
        console.groupEnd();
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          '⚠️ Recent submissions unavailable (insufficient permissions)'
        )
      );
    }

    // User subscriptions
    try {
      const subscriptions = await sql`
        SELECT us.*, sp.name as plan_name, sp.display_name as plan_display_name,
               sp.plan_type, sp.price_monthly_cents, sp.price_yearly_cents,
               u.name as assigned_by_name
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        LEFT JOIN users u ON us.assigned_by = u.id
        WHERE us.user_id = ${userId}
        AND us.status IN ('active', 'trialing')
        ORDER BY us.created_at DESC
      `;

      console.groupCollapsed(chalk.blue('💳 SUBSCRIPTION INFORMATION'));
      if (subscriptions.length > 0) {
        subscriptions.forEach((sub) => {
          const status = sub.status === 'active' ? chalk.green(sub.status.toUpperCase()) : chalk.yellow(sub.status.toUpperCase());
          const planType = sub.plan_type === 'tier' ? '🎯' : sub.plan_type === 'addon' ? '🔧' : '📦';
          const expiresAt = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'Never';
          const trialEnds = sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString() : null;
          const assignedBy = sub.assigned_by_name ? ` (assigned by: ${sub.assigned_by_name})` : '';
          
          console.log(chalk.cyan(`${planType} ${sub.plan_display_name} (${sub.plan_name})`));
          console.log(`   Status: ${status} | Expires: ${expiresAt}${assignedBy}`);
          if (trialEnds) {
            console.log(chalk.yellow(`   Trial ends: ${trialEnds}`));
          }
          if (sub.assignment_reason) {
            console.log(chalk.gray(`   Reason: ${sub.assignment_reason}`));
          }
        });
      } else {
        console.log(chalk.yellow('⚠️ No active subscriptions found'));
      }
      console.groupEnd();

      // Subscription usage summary
      const usageData = await sql`
        SELECT ss.name as service_name, ss.display_name as service_display,
               su.usage_date, su.usage_count, sf.name as feature_name
        FROM subscription_usage su
        JOIN subscription_services ss ON su.service_id = ss.id
        LEFT JOIN subscription_features sf ON su.feature_id = sf.id
        WHERE su.user_id = ${userId}
        AND su.usage_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY su.usage_date DESC, ss.name
      `;

      if (usageData.length > 0) {
        console.groupCollapsed(chalk.blue('📊 RECENT USAGE (Last 7 days)'));
        const usageByService = {};
        usageData.forEach((usage) => {
          const service = usage.service_name;
          if (!usageByService[service]) {
            usageByService[service] = { display: usage.service_display, total: 0, features: {} };
          }
          usageByService[service].total += usage.usage_count;
          if (usage.feature_name) {
            usageByService[service].features[usage.feature_name] = 
              (usageByService[service].features[usage.feature_name] || 0) + usage.usage_count;
          }
        });

        Object.entries(usageByService).forEach(([service, data]) => {
          console.log(chalk.cyan(`🔧 ${data.display}: ${data.total} total uses`));
          Object.entries(data.features).forEach(([feature, count]) => {
            console.log(chalk.gray(`   • ${feature}: ${count}`));
          });
        });
        console.groupEnd();
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          '⚠️ Subscription information unavailable (tables may not exist yet)'
        )
      );
    }

    return user[0];
  } catch (error) {
    console.error(chalk.red('❌ Error fetching user info:'), error.message);
    throw error;
  }
}

// Show available tables and columns
function showAvailableOptions() {
  console.groupCollapsed(chalk.blue('📚 AVAILABLE TABLES AND COLUMNS'));
  console.log(chalk.gray('Database schema reference for manual operations'));
  console.groupEnd();
  console.log('');

  Object.entries(TABLE_CONFIGS).forEach(([tableName, config]) => {
    console.groupCollapsed(
      chalk.yellow(`🗂️  ${config.name.toUpperCase()} (${tableName})`)
    );

    const columnData = Object.entries(config.columns).map(
      ([columnName, columnConfig]) => {
        return {
          Column: columnName,
          Type: columnConfig.type,
          Required: columnConfig.required ? '✅ Yes' : '❌ No',
          'Read-Only': columnConfig.readonly ? '🔒 Yes' : '✏️ No',
          Validation: columnConfig.validation || 'None',
          'Enum Values': columnConfig.enum_values
            ? columnConfig.enum_values.join('|')
            : 'N/A'
        };
      }
    );

    console.table(columnData);
    console.groupEnd();
  });
}

// Show reference data (roles, permissions)
async function showReferenceData() {
  console.groupCollapsed(chalk.blue('📖 REFERENCE DATA'));
  console.log(chalk.gray('Available roles and permissions in the system'));
  console.groupEnd();
  console.log('');

  // Show roles
  const roles =
    await sql`SELECT id, name, display_name FROM user_roles ORDER BY name`;
  console.groupCollapsed(chalk.green('🔐 AVAILABLE ROLES'));
  console.table(roles);

  // Show permissions
  const permissions =
    await sql`SELECT id, name, display_name, category FROM permissions ORDER BY category, name`;
  console.groupCollapsed(chalk.green('⚡ AVAILABLE PERMISSIONS'));
  console.table(permissions);
  console.groupEnd();

  // Show subscription plans
  try {
    const plans =
      await sql`SELECT id, name, display_name, plan_type, price_monthly_cents, price_yearly_cents, is_active FROM subscription_plans ORDER BY sort_order, name`;
    console.groupCollapsed(chalk.green('💳 AVAILABLE SUBSCRIPTION PLANS'));
    console.table(plans);
    console.groupEnd();

    // Show subscription services
    const services =
      await sql`SELECT id, name, display_name, category, is_active FROM subscription_services ORDER BY category, name`;
    console.groupCollapsed(chalk.green('🔧 AVAILABLE SUBSCRIPTION SERVICES'));
    console.table(services);
    console.groupEnd();
  } catch (error) {
    console.log(
      chalk.yellow(
        '⚠️ Subscription data unavailable (tables may not exist yet)'
      )
    );
  }
}

// Function to lookup user by username
async function lookupUserByUsername(username) {
  const users = await sql`
    SELECT id, email, name, image, created_at
    FROM users 
    WHERE name ILIKE ${`%${username}%`}
    ORDER BY created_at DESC
  `;

  if (users.length === 0) {
    throw new Error(`No users found with username containing "${username}"`);
  }

  if (users.length === 1) {
    console.log(chalk.green(`✅ Found 1 user matching "${username}"`));
    return users[0].id;
  }

  // Multiple users found - show selection
  console.log(
    chalk.yellow(`\n🔍 Found ${users.length} users matching "${username}":`)
  );

  users.forEach((user, index) => {
    const displayName = user.name || 'No name';
    const email = user.email || 'No email';
    const createdDate = new Date(user.created_at).toLocaleDateString();

    console.log(
      chalk.cyan(
        `${index + 1}. ID: ${user.id} - ${displayName} (${email}) - Created: ${createdDate}`
      )
    );
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const choice = await prompt(
      chalk.yellow(`\nSelect user (1-${users.length}) or 'cancel': `)
    );

    if (choice.toLowerCase() === 'cancel') {
      throw new Error('User selection cancelled');
    }

    const choiceNum = parseInt(choice);
    if (choiceNum >= 1 && choiceNum <= users.length) {
      const selectedUser = users[choiceNum - 1];
      console.log(
        chalk.green(
          `✅ Selected user: ${selectedUser.name || 'No name'} (ID: ${selectedUser.id})`
        )
      );
      return selectedUser.id;
    }

    console.error(
      chalk.red(
        `❌ Please enter a number between 1 and ${users.length}, or 'cancel'`
      )
    );
  }
}

// Smart handler for basic profile updates
async function handleBasicProfileUpdate(userId, user) {
  console.log(chalk.blue('\n👤 Basic Profile Update Options:'));

  const profileOptions = {
    1: { field: 'name', label: 'Username', current: user.name },
    2: { field: 'email', label: 'Email Address', current: user.email },
    3: { field: 'bio', label: 'Bio/Description', current: user.bio },
    4: { field: 'location', label: 'Location', current: user.location },
    5: {
      field: 'profile_public',
      label: 'Profile Visibility',
      current: user.profile_public ? 'Public' : 'Private'
    }
  };

  Object.entries(profileOptions).forEach(([key, option]) => {
    const current = option.current || 'Not set';
    console.log(chalk.cyan(`${key}. ${option.label}: ${chalk.dim(current)}`));
  });

  const choice = await prompt(chalk.yellow('\nSelect field to update (1-5): '));
  const selectedOption = profileOptions[choice];

  if (!selectedOption) {
    console.error(chalk.red('❌ Invalid choice'));
    return;
  }

  console.log(
    chalk.blue(
      `\nCurrent ${selectedOption.label}: ${selectedOption.current || 'Not set'}`
    )
  );

  let newValue;
  if (selectedOption.field === 'profile_public') {
    const visibilityChoice = await prompt(
      chalk.yellow('Make profile public? (yes/no): ')
    );
    newValue = visibilityChoice.toLowerCase() === 'yes';
  } else {
    newValue = await prompt(
      chalk.yellow(`Enter new ${selectedOption.label}: `)
    );
    if (newValue.trim() === '') newValue = null;
  }

  const confirm = await prompt(
    chalk.red(`\nConfirm update ${selectedOption.label}? (yes/no): `)
  );
  if (confirm.toLowerCase() !== 'yes') {
    console.log(chalk.yellow('❌ Update cancelled'));
    return;
  }

  await sql`UPDATE users SET ${sql(selectedOption.field)} = ${newValue} WHERE id = ${userId}`;
  console.log(chalk.green('✅ Profile updated successfully!'));

  await displayUserInfo(userId);
}

// Smart handler for roles and permissions
async function handleRolesAndPermissions(userId, user) {
  console.log(chalk.blue('\n🔐 Role & Permission Management:'));

  const roleOptions = {
    1: { action: 'assign', label: 'Assign New Role' },
    2: { action: 'remove', label: 'Remove Existing Role' },
    3: { action: 'view', label: 'View Current Roles & Permissions' }
  };

  Object.entries(roleOptions).forEach(([key, option]) => {
    console.log(chalk.cyan(`${key}. ${option.label}`));
  });

  const choice = await prompt(chalk.yellow('\nSelect action (1-3): '));
  const selectedAction = roleOptions[choice];

  if (!selectedAction) {
    console.error(chalk.red('❌ Invalid choice'));
    return;
  }

  switch (selectedAction.action) {
    case 'assign':
      await assignRole(userId);
      break;
    case 'remove':
      await removeRole(userId);
      break;
    case 'view':
      await displayUserInfo(userId);
      break;
  }
}

// Smart handler for user timeouts
async function handleUserTimeouts(userId, user) {
  console.log(chalk.blue('\n⏰ User Timeout Management:'));

  const timeoutOptions = {
    1: { action: 'issue', label: 'Issue New Timeout' },
    2: { action: 'view', label: 'View Timeout History' },
    3: { action: 'remove', label: 'Remove Active Timeout' }
  };

  Object.entries(timeoutOptions).forEach(([key, option]) => {
    console.log(chalk.cyan(`${key}. ${option.label}`));
  });

  const choice = await prompt(chalk.yellow('\nSelect action (1-3): '));
  const selectedAction = timeoutOptions[choice];

  if (!selectedAction) {
    console.error(chalk.red('❌ Invalid choice'));
    return;
  }

  switch (selectedAction.action) {
    case 'issue':
      await issueTimeout(userId);
      break;
    case 'view':
      await viewTimeoutHistory(userId);
      break;
    case 'remove':
      await removeTimeout(userId);
      break;
  }
}

// Smart handler for custom emojis
async function handleCustomEmojis(userId, user) {
  console.log(chalk.blue('\n😀 Custom Emoji Management:'));

  const emojiOptions = {
    1: { action: 'approve', label: 'Approve Pending Emojis' },
    2: { action: 'reject', label: 'Reject Pending Emojis' },
    3: { action: 'view', label: 'View All User Emojis' },
    4: { action: 'delete', label: 'Delete Custom Emoji' }
  };

  Object.entries(emojiOptions).forEach(([key, option]) => {
    console.log(chalk.cyan(`${key}. ${option.label}`));
  });

  const choice = await prompt(chalk.yellow('\nSelect action (1-4): '));
  const selectedAction = emojiOptions[choice];

  if (!selectedAction) {
    console.error(chalk.red('❌ Invalid choice'));
    return;
  }

  switch (selectedAction.action) {
    case 'approve':
      await approveEmojis(userId);
      break;
    case 'reject':
      await rejectEmojis(userId);
      break;
    case 'view':
      await displayUserInfo(userId);
      break;
    case 'delete':
      await deleteEmoji(userId);
      break;
  }
}

// Helper functions for role management
async function assignRole(userId) {
  const roles =
    await sql`SELECT id, name, display_name FROM user_roles ORDER BY name`;

  console.log(chalk.green('\n📋 Available Roles:'));
  roles.forEach((role, index) => {
    console.log(
      chalk.cyan(`${index + 1}. ${role.display_name} (${role.name})`)
    );
  });

  const choice = await prompt(
    chalk.yellow(`\nSelect role to assign (1-${roles.length}): `)
  );
  const roleIndex = parseInt(choice) - 1;

  if (roleIndex < 0 || roleIndex >= roles.length) {
    console.error(chalk.red('❌ Invalid role selection'));
    return;
  }

  const selectedRole = roles[roleIndex];
  const confirm = await prompt(
    chalk.red(`\nAssign "${selectedRole.display_name}" role? (yes/no): `)
  );

  if (confirm.toLowerCase() !== 'yes') {
    console.log(chalk.yellow('❌ Role assignment cancelled'));
    return;
  }

  try {
    await sql`
      INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
      VALUES (${userId}, ${selectedRole.id}, CURRENT_TIMESTAMP, true)
      ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = true
    `;
    console.log(
      chalk.green(
        `✅ Role "${selectedRole.display_name}" assigned successfully!`
      )
    );
  } catch (error) {
    console.error(chalk.red('❌ Error assigning role:'), error.message);
  }
}

async function removeRole(userId) {
  const userRoles = await sql`
    SELECT ur.id, ur.name, ur.display_name, ura.id as assignment_id
    FROM user_role_assignments ura
    JOIN user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = ${userId} AND ura.is_active = true
  `;

  if (userRoles.length === 0) {
    console.log(chalk.yellow('👤 User has no active roles to remove'));
    return;
  }

  console.log(chalk.green('\n📋 Current User Roles:'));
  userRoles.forEach((role, index) => {
    console.log(
      chalk.cyan(`${index + 1}. ${role.display_name} (${role.name})`)
    );
  });

  const choice = await prompt(
    chalk.yellow(`\nSelect role to remove (1-${userRoles.length}): `)
  );
  const roleIndex = parseInt(choice) - 1;

  if (roleIndex < 0 || roleIndex >= userRoles.length) {
    console.error(chalk.red('❌ Invalid role selection'));
    return;
  }

  const selectedRole = userRoles[roleIndex];
  const confirm = await prompt(
    chalk.red(`\nRemove "${selectedRole.display_name}" role? (yes/no): `)
  );

  if (confirm.toLowerCase() !== 'yes') {
    console.log(chalk.yellow('❌ Role removal cancelled'));
    return;
  }

  await sql`UPDATE user_role_assignments SET is_active = false WHERE id = ${selectedRole.assignment_id}`;
  console.log(
    chalk.green(`✅ Role "${selectedRole.display_name}" removed successfully!`)
  );
}

// Helper functions for timeout management
async function issueTimeout(userId) {
  console.log(chalk.blue('\n⏰ Issue User Timeout:'));

  const durationOptions = {
    1: { hours: 1, label: '1 hour' },
    2: { hours: 24, label: '24 hours (1 day)' },
    3: { hours: 168, label: '1 week' },
    4: { hours: 720, label: '30 days' },
    5: { hours: 0, label: 'Custom duration' }
  };

  Object.entries(durationOptions).forEach(([key, option]) => {
    console.log(chalk.cyan(`${key}. ${option.label}`));
  });

  const choice = await prompt(
    chalk.yellow('\nSelect timeout duration (1-5): ')
  );
  const selectedOption = durationOptions[choice];

  if (!selectedOption) {
    console.error(chalk.red('❌ Invalid choice'));
    return;
  }

  let hours = selectedOption.hours;
  if (hours === 0) {
    const customHours = await prompt(
      chalk.yellow('Enter timeout duration in hours: ')
    );
    hours = parseInt(customHours);
    if (isNaN(hours) || hours <= 0) {
      console.error(chalk.red('❌ Invalid duration'));
      return;
    }
  }

  const reason = await prompt(chalk.yellow('Enter timeout reason: '));
  if (!reason.trim()) {
    console.error(chalk.red('❌ Reason is required'));
    return;
  }

  const confirm = await prompt(
    chalk.red(`\nIssue ${hours} hour timeout? (yes/no): `)
  );
  if (confirm.toLowerCase() !== 'yes') {
    console.log(chalk.yellow('❌ Timeout cancelled'));
    return;
  }

  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await sql`
    INSERT INTO user_timeouts (user_id, reason, expires_at, issued_at, is_active)
    VALUES (${userId}, ${reason}, ${expiresAt}, CURRENT_TIMESTAMP, true)
  `;

  console.log(
    chalk.green(
      `✅ Timeout issued successfully! Expires: ${expiresAt.toLocaleString()}`
    )
  );
}

async function viewTimeoutHistory(userId) {
  const timeouts = await sql`
    SELECT reason, issued_at, expires_at, is_active
    FROM user_timeouts
    WHERE user_id = ${userId}
    ORDER BY issued_at DESC
  `;

  if (timeouts.length === 0) {
    console.log(chalk.green('✅ User has no timeout history'));
    return;
  }

  console.log(chalk.blue('\n📋 Timeout History:'));
  console.table(timeouts);
}

async function removeTimeout(userId) {
  const activeTimeouts = await sql`
    SELECT id, reason, expires_at
    FROM user_timeouts
    WHERE user_id = ${userId} AND is_active = true AND expires_at > CURRENT_TIMESTAMP
  `;

  if (activeTimeouts.length === 0) {
    console.log(chalk.green('✅ User has no active timeouts'));
    return;
  }

  console.log(chalk.blue('\n📋 Active Timeouts:'));
  activeTimeouts.forEach((timeout, index) => {
    console.log(
      chalk.cyan(
        `${index + 1}. ${timeout.reason} (expires: ${new Date(timeout.expires_at).toLocaleString()})`
      )
    );
  });

  const choice = await prompt(
    chalk.yellow(`\nSelect timeout to remove (1-${activeTimeouts.length}): `)
  );
  const timeoutIndex = parseInt(choice) - 1;

  if (timeoutIndex < 0 || timeoutIndex >= activeTimeouts.length) {
    console.error(chalk.red('❌ Invalid selection'));
    return;
  }

  const selectedTimeout = activeTimeouts[timeoutIndex];
  const confirm = await prompt(chalk.red('\nRemove this timeout? (yes/no): '));

  if (confirm.toLowerCase() !== 'yes') {
    console.log(chalk.yellow('❌ Timeout removal cancelled'));
    return;
  }

  await sql`UPDATE user_timeouts SET is_active = false WHERE id = ${selectedTimeout.id}`;
  console.log(chalk.green('✅ Timeout removed successfully!'));
}

// Helper functions for emoji management
async function approveEmojis(userId) {
  const pendingEmojis = await sql`
    SELECT id, name, description
    FROM custom_emojis
    WHERE user_id = ${userId} AND is_approved = false AND is_active = true
  `;

  if (pendingEmojis.length === 0) {
    console.log(chalk.green('✅ No pending emojis to approve'));
    return;
  }

  console.log(chalk.blue('\n📋 Pending Emojis:'));
  pendingEmojis.forEach((emoji, index) => {
    console.log(
      chalk.cyan(
        `${index + 1}. ${emoji.name} - ${emoji.description || 'No description'}`
      )
    );
  });

  const choice = await prompt(
    chalk.yellow(
      `\nSelect emoji to approve (1-${pendingEmojis.length}) or 'all': `
    )
  );

  if (choice.toLowerCase() === 'all') {
    const confirm = await prompt(
      chalk.red('Approve all pending emojis? (yes/no): ')
    );
    if (confirm.toLowerCase() === 'yes') {
      await sql`UPDATE custom_emojis SET is_approved = true, approved_at = CURRENT_TIMESTAMP WHERE user_id = ${userId} AND is_approved = false`;
      console.log(chalk.green('✅ All emojis approved successfully!'));
    }
    return;
  }

  const emojiIndex = parseInt(choice) - 1;
  if (emojiIndex < 0 || emojiIndex >= pendingEmojis.length) {
    console.error(chalk.red('❌ Invalid selection'));
    return;
  }

  const selectedEmoji = pendingEmojis[emojiIndex];
  const confirm = await prompt(
    chalk.red(`Approve "${selectedEmoji.name}" emoji? (yes/no): `)
  );

  if (confirm.toLowerCase() === 'yes') {
    await sql`UPDATE custom_emojis SET is_approved = true, approved_at = CURRENT_TIMESTAMP WHERE id = ${selectedEmoji.id}`;
    console.log(chalk.green('✅ Emoji approved successfully!'));
  }
}

async function rejectEmojis(userId) {
  const pendingEmojis = await sql`
    SELECT id, name, description
    FROM custom_emojis
    WHERE user_id = ${userId} AND is_approved = false AND is_active = true
  `;

  if (pendingEmojis.length === 0) {
    console.log(chalk.green('✅ No pending emojis to reject'));
    return;
  }

  console.log(chalk.blue('\n📋 Pending Emojis:'));
  pendingEmojis.forEach((emoji, index) => {
    console.log(
      chalk.cyan(
        `${index + 1}. ${emoji.name} - ${emoji.description || 'No description'}`
      )
    );
  });

  const choice = await prompt(
    chalk.yellow(`\nSelect emoji to reject (1-${pendingEmojis.length}): `)
  );
  const emojiIndex = parseInt(choice) - 1;

  if (emojiIndex < 0 || emojiIndex >= pendingEmojis.length) {
    console.error(chalk.red('❌ Invalid selection'));
    return;
  }

  const selectedEmoji = pendingEmojis[emojiIndex];
  const confirm = await prompt(
    chalk.red(`Reject "${selectedEmoji.name}" emoji? (yes/no): `)
  );

  if (confirm.toLowerCase() === 'yes') {
    await sql`UPDATE custom_emojis SET is_active = false WHERE id = ${selectedEmoji.id}`;
    console.log(chalk.green('✅ Emoji rejected successfully!'));
  }
}

async function deleteEmoji(userId) {
  const userEmojis = await sql`
    SELECT id, name, description, is_approved
    FROM custom_emojis
    WHERE user_id = ${userId} AND is_active = true
  `;

  if (userEmojis.length === 0) {
    console.log(chalk.green('✅ User has no custom emojis'));
    return;
  }

  console.log(chalk.blue('\n📋 User Custom Emojis:'));
  userEmojis.forEach((emoji, index) => {
    const status = emoji.is_approved
      ? chalk.green('[APPROVED]')
      : chalk.yellow('[PENDING]');
    console.log(
      chalk.cyan(
        `${index + 1}. ${emoji.name} ${status} - ${emoji.description || 'No description'}`
      )
    );
  });

  const choice = await prompt(
    chalk.yellow(`\nSelect emoji to delete (1-${userEmojis.length}): `)
  );
  const emojiIndex = parseInt(choice) - 1;

  if (emojiIndex < 0 || emojiIndex >= userEmojis.length) {
    console.error(chalk.red('❌ Invalid selection'));
    return;
  }

  const selectedEmoji = userEmojis[emojiIndex];
  const confirm = await prompt(
    chalk.red(`Delete "${selectedEmoji.name}" emoji permanently? (yes/no): `)
  );

  if (confirm.toLowerCase() === 'yes') {
    await sql`DELETE FROM custom_emojis WHERE id = ${selectedEmoji.id}`;
    console.log(chalk.green('✅ Emoji deleted successfully!'));
  }
}

// Smart handler for subscription management
async function handleSubscriptionManagement(userId, user) {
  console.log(chalk.blue('\n💳 Subscription Management:'));

  const subscriptionOptions = {
    1: { action: 'assign', label: 'Assign New Subscription Plan' },
    2: { action: 'modify', label: 'Modify Existing Subscription' },
    3: { action: 'view', label: 'View Subscription Details & Usage' },
    4: { action: 'cancel', label: 'Cancel Subscription' }
  };

  Object.entries(subscriptionOptions).forEach(([key, option]) => {
    console.log(chalk.cyan(`${key}. ${option.label}`));
  });

  const choice = await prompt(chalk.yellow('\nSelect action (1-4): '));
  const selectedAction = subscriptionOptions[choice];

  if (!selectedAction) {
    console.error(chalk.red('❌ Invalid choice'));
    return;
  }

  switch (selectedAction.action) {
    case 'assign':
      await assignSubscriptionPlan(userId);
      break;
    case 'modify':
      await modifySubscription(userId);
      break;
    case 'view':
      await viewSubscriptionDetails(userId);
      break;
    case 'cancel':
      await cancelSubscription(userId);
      break;
  }
}

// Function to assign a subscription plan
async function assignSubscriptionPlan(userId) {
  console.log(chalk.blue('\n📋 Available Subscription Plans:'));

  // Show available plans
  const plans = await sql`
    SELECT id, name, display_name, plan_type, price_monthly_cents, price_yearly_cents, is_active
    FROM subscription_plans 
    WHERE is_active = true
    ORDER BY sort_order, name
  `;

  if (plans.length === 0) {
    console.log(chalk.yellow('⚠️ No subscription plans available'));
    return;
  }

  plans.forEach((plan, index) => {
    const monthlyPrice = plan.price_monthly_cents ? `$${(plan.price_monthly_cents / 100).toFixed(2)}/mo` : 'Free';
    const yearlyPrice = plan.price_yearly_cents ? `$${(plan.price_yearly_cents / 100).toFixed(2)}/yr` : '';
    const pricing = yearlyPrice ? `${monthlyPrice} (${yearlyPrice})` : monthlyPrice;
    
    console.log(chalk.cyan(`${index + 1}. ${plan.display_name} (${plan.name}) - ${pricing} [${plan.plan_type}]`));
  });

  const planChoice = await prompt(chalk.yellow(`\nSelect plan (1-${plans.length}): `));
  const planIndex = parseInt(planChoice) - 1;

  if (planIndex < 0 || planIndex >= plans.length) {
    console.error(chalk.red('❌ Invalid plan selection'));
    return;
  }

  const selectedPlan = plans[planIndex];

  // Get billing cycle
  let billingCycle = null;
  if (selectedPlan.price_monthly_cents || selectedPlan.price_yearly_cents) {
    console.log(chalk.blue('\n💰 Billing Options:'));
    const billingOptions = [];
    
    if (selectedPlan.price_monthly_cents) billingOptions.push('monthly');
    if (selectedPlan.price_yearly_cents) billingOptions.push('yearly');
    billingOptions.push('lifetime', 'trial');

    billingOptions.forEach((option, index) => {
      console.log(chalk.cyan(`${index + 1}. ${option}`));
    });

    const billingChoice = await prompt(chalk.yellow(`\nSelect billing cycle (1-${billingOptions.length}): `));
    const billingIndex = parseInt(billingChoice) - 1;

    if (billingIndex >= 0 && billingIndex < billingOptions.length) {
      billingCycle = billingOptions[billingIndex];
    }
  }

  // Get assignment reason
  const reason = await prompt(chalk.yellow('Assignment reason: '));

  // Get expiration date if needed
  let expiresAt = null;
  if (billingCycle && billingCycle !== 'lifetime') {
    const expirationInput = await prompt(chalk.yellow('Expiration date (YYYY-MM-DD or "never"): '));
    if (expirationInput && expirationInput !== 'never') {
      expiresAt = new Date(expirationInput);
    }
  }

  // Confirm assignment
  console.log(chalk.blue('\n📋 Assignment Summary:'));
  console.log(`Plan: ${selectedPlan.display_name}`);
  console.log(`Billing: ${billingCycle || 'N/A'}`);
  console.log(`Expires: ${expiresAt ? expiresAt.toLocaleDateString() : 'Never'}`);
  console.log(`Reason: ${reason}`);

  const confirm = await prompt(chalk.red('\nConfirm assignment? (yes/no): '));
  if (confirm.toLowerCase() !== 'yes') {
    console.log(chalk.yellow('❌ Assignment cancelled'));
    return;
  }

  // Get current session user ID for assigned_by
  const sessionUser = await sql`SELECT id FROM users LIMIT 1`; // In real app, this would be the current admin user
  const assignedBy = sessionUser[0]?.id;

  // Insert subscription
  await sql`
    INSERT INTO user_subscriptions (
      user_id, plan_id, status, billing_cycle, expires_at, 
      assigned_by, assignment_reason
    ) VALUES (
      ${userId}, ${selectedPlan.id}, 'active', ${billingCycle}, 
      ${expiresAt}, ${assignedBy}, ${reason}
    )
  `;

  console.log(chalk.green('✅ Subscription assigned successfully!'));
  await displayUserInfo(userId);
}

// Function to view detailed subscription information
async function viewSubscriptionDetails(userId) {
  console.log(chalk.blue('\n📊 Detailed Subscription Information:'));

  // Get all subscriptions (active and inactive)
  const subscriptions = await sql`
    SELECT us.*, sp.name as plan_name, sp.display_name as plan_display_name,
           sp.plan_type, sp.price_monthly_cents, sp.price_yearly_cents,
           u.name as assigned_by_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN users u ON us.assigned_by = u.id
    WHERE us.user_id = ${userId}
    ORDER BY us.created_at DESC
  `;

  if (subscriptions.length === 0) {
    console.log(chalk.yellow('⚠️ No subscriptions found'));
    return;
  }

  console.table(subscriptions);

  // Get detailed usage for active subscriptions
  const activeSubscriptions = subscriptions.filter(s => ['active', 'trialing'].includes(s.status));
  
  if (activeSubscriptions.length > 0) {
    console.log(chalk.blue('\n📈 Usage Details for Active Subscriptions:'));
    
    for (const sub of activeSubscriptions) {
      console.log(chalk.cyan(`\n🎯 ${sub.plan_display_name}:`));
      
      // Get usage data
      const usage = await sql`
        SELECT ss.display_name as service, sf.display_name as feature,
               su.usage_date, su.usage_count, su.usage_value
        FROM subscription_usage su
        JOIN subscription_services ss ON su.service_id = ss.id
        LEFT JOIN subscription_features sf ON su.feature_id = sf.id
        WHERE su.subscription_id = ${sub.id}
        ORDER BY su.usage_date DESC, ss.name
        LIMIT 20
      `;

      if (usage.length > 0) {
        console.table(usage);
      } else {
        console.log(chalk.gray('   No usage data found'));
      }
    }
  }
}

// Function to modify existing subscription
async function modifySubscription(userId) {
  // Get active subscriptions
  const subscriptions = await sql`
    SELECT us.*, sp.name as plan_name, sp.display_name as plan_display_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = ${userId}
    AND us.status IN ('active', 'trialing')
    ORDER BY us.created_at DESC
  `;

  if (subscriptions.length === 0) {
    console.log(chalk.yellow('⚠️ No active subscriptions to modify'));
    return;
  }

  console.log(chalk.blue('\n📋 Active Subscriptions:'));
  subscriptions.forEach((sub, index) => {
    console.log(chalk.cyan(`${index + 1}. ${sub.plan_display_name} (${sub.status})`));
  });

  const choice = await prompt(chalk.yellow(`\nSelect subscription to modify (1-${subscriptions.length}): `));
  const subIndex = parseInt(choice) - 1;

  if (subIndex < 0 || subIndex >= subscriptions.length) {
    console.error(chalk.red('❌ Invalid subscription selection'));
    return;
  }

  const selectedSub = subscriptions[subIndex];

  console.log(chalk.blue('\n🔧 Modification Options:'));
  console.log('1. Change status');
  console.log('2. Extend expiration date');
  console.log('3. Add assignment reason/note');

  const modChoice = await prompt(chalk.yellow('\nSelect modification (1-3): '));

  switch (modChoice) {
    case '1': {
      const newStatus = await prompt(chalk.yellow('New status (active/cancelled/expired/suspended/trialing): '));
      if (['active', 'cancelled', 'expired', 'suspended', 'trialing'].includes(newStatus)) {
        await sql`UPDATE user_subscriptions SET status = ${newStatus} WHERE id = ${selectedSub.id}`;
        console.log(chalk.green('✅ Status updated successfully!'));
      } else {
        console.error(chalk.red('❌ Invalid status'));
      }
      break;
    }
    
    case '2': {
      const newExpiration = await prompt(chalk.yellow('New expiration date (YYYY-MM-DD or "never"): '));
      const expiresAt = newExpiration === 'never' ? null : new Date(newExpiration);
      await sql`UPDATE user_subscriptions SET expires_at = ${expiresAt} WHERE id = ${selectedSub.id}`;
      console.log(chalk.green('✅ Expiration updated successfully!'));
      break;
    }
    
    case '3': {
      const newReason = await prompt(chalk.yellow('Additional reason/note: '));
      const currentReason = selectedSub.assignment_reason || '';
      const updatedReason = currentReason ? `${currentReason}\n[Update] ${newReason}` : newReason;
      await sql`UPDATE user_subscriptions SET assignment_reason = ${updatedReason} WHERE id = ${selectedSub.id}`;
      console.log(chalk.green('✅ Reason updated successfully!'));
      break;
    }
    
    default:
      console.error(chalk.red('❌ Invalid choice'));
  }
}

// Function to cancel subscription
async function cancelSubscription(userId) {
  // Get active subscriptions
  const subscriptions = await sql`
    SELECT us.*, sp.name as plan_name, sp.display_name as plan_display_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = ${userId}
    AND us.status = 'active'
    ORDER BY us.created_at DESC
  `;

  if (subscriptions.length === 0) {
    console.log(chalk.yellow('⚠️ No active subscriptions to cancel'));
    return;
  }

  console.log(chalk.blue('\n📋 Active Subscriptions:'));
  subscriptions.forEach((sub, index) => {
    console.log(chalk.cyan(`${index + 1}. ${sub.plan_display_name}`));
  });

  const choice = await prompt(chalk.yellow(`\nSelect subscription to cancel (1-${subscriptions.length}): `));
  const subIndex = parseInt(choice) - 1;

  if (subIndex < 0 || subIndex >= subscriptions.length) {
    console.error(chalk.red('❌ Invalid subscription selection'));
    return;
  }

  const selectedSub = subscriptions[subIndex];
  const reason = await prompt(chalk.yellow('Cancellation reason: '));

  const confirm = await prompt(chalk.red(`\nConfirm cancellation of "${selectedSub.plan_display_name}"? (yes/no): `));
  
  if (confirm.toLowerCase() === 'yes') {
    const currentReason = selectedSub.assignment_reason || '';
    const updatedReason = currentReason ? `${currentReason}\n[Cancelled] ${reason}` : `[Cancelled] ${reason}`;
    
    await sql`
      UPDATE user_subscriptions 
      SET status = 'cancelled', 
          cancelled_at = NOW(),
          assignment_reason = ${updatedReason}
      WHERE id = ${selectedSub.id}
    `;
    
    console.log(chalk.green('✅ Subscription cancelled successfully!'));
  } else {
    console.log(chalk.yellow('❌ Cancellation aborted'));
  }
}

// Function to get user ID (either by ID or username lookup)
async function getUserId(cmdLineArg = null) {
  // If command line argument provided, auto-determine lookup method
  if (cmdLineArg) {
    console.log(
      chalk.blue(`\n🔍 Auto-detecting lookup method for: "${cmdLineArg}"`)
    );

    // Check if it's a valid number (user ID)
    const numericValue = Number(cmdLineArg);
    if (
      !isNaN(numericValue) &&
      Number.isInteger(numericValue) &&
      numericValue > 0
    ) {
      console.log(chalk.green(`✅ Detected as User ID: ${numericValue}`));
      return numericValue;
    } else {
      console.log(
        chalk.green(`✅ Detected as username search: "${cmdLineArg}"`)
      );
      return await lookupUserByUsername(cmdLineArg.trim());
    }
  }

  // Interactive mode - prompt user for choice
  console.log(chalk.blue('\n🔍 User Lookup Options:'));
  console.log('1. Enter User ID directly');
  console.log('2. Search by username/name');

  const lookupChoice = await prompt(
    chalk.yellow('\nChoose lookup method (1 or 2): ')
  );

  if (lookupChoice === '1') {
    const userId = await prompt(chalk.yellow('Enter User ID: '));
    if (!userId || isNaN(parseInt(userId))) {
      throw new Error('Invalid user ID');
    }
    return parseInt(userId);
  } else if (lookupChoice === '2') {
    const username = await prompt(
      chalk.yellow('Enter username/name to search for: ')
    );
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    return await lookupUserByUsername(username.trim());
  } else {
    throw new Error('Invalid choice. Please enter 1 or 2');
  }
}

// Main user management function
async function manageUser() {
  try {
    console.log(chalk.blue('👤 USER MANAGEMENT TOOL'));
    console.log(chalk.gray('Comprehensive user administration interface\n'));

    // Get command line argument if provided
    const cmdLineArg = process.argv[2];

    if (cmdLineArg) {
      console.log(chalk.dim(`Command line argument provided: "${cmdLineArg}"`));
    }

    // Step 1: Get user ID (either directly or via username lookup)
    const userId = await getUserId(cmdLineArg);

    // Step 2: Display user information
    const user = await displayUserInfo(parseInt(userId));

    // Step 3: Show user management options
    console.log(chalk.blue('\n🛠️  USER MANAGEMENT OPTIONS'));
    console.log(chalk.gray('Select what you would like to update or manage\n'));

    const updateOptions = {
      1: {
        name: 'Basic Profile Information',
        description: 'Update name, email, bio, location, profile visibility',
        table: 'users',
        icon: '👤'
      },
      2: {
        name: 'User Roles & Permissions',
        description: 'Assign/remove roles, manage permissions',
        table: 'user_role_assignments',
        icon: '🔐'
      },
      3: {
        name: 'User Timeouts',
        description: 'Issue timeout, view timeout history',
        table: 'user_timeouts',
        icon: '⏰'
      },
      4: {
        name: 'Custom Emojis',
        description: 'Approve/reject custom emojis, manage emoji permissions',
        table: 'custom_emojis',
        icon: '😀'
      },
      5: {
        name: 'Subscription Management',
        description: 'Manage user subscriptions, plans, and usage',
        table: 'user_subscriptions',
        icon: '💳'
      },
      6: {
        name: 'View Reference Data',
        description: 'Show available roles, permissions, plans, and categories',
        table: null,
        icon: '📖'
      }
    };

    // Display options as simple colored text
    Object.entries(updateOptions).forEach(([key, option]) => {
      console.log(chalk.cyan(`${key}. ${option.icon} ${option.name}`));
      console.log(chalk.gray(`   ${option.description}`));
    });

    const choice = await prompt(chalk.yellow('\nSelect option (1-6): '));

    if (!updateOptions[choice]) {
      console.error(chalk.red('❌ Invalid choice. Please select 1-6'));
      return;
    }

    const selectedOption = updateOptions[choice];

    // Handle special case for reference data
    if (choice === '6') {
      await showReferenceData();
      return;
    }

    console.log(
      chalk.green(
        `\n✅ SELECTED: ${selectedOption.icon} ${selectedOption.name.toUpperCase()}`
      )
    );
    console.log(chalk.gray(selectedOption.description + '\n'));

    // Handle each update type with smart workflows
    switch (choice) {
      case '1':
        await handleBasicProfileUpdate(userId, user);
        break;
      case '2':
        await handleRolesAndPermissions(userId, user);
        break;
      case '3':
        await handleUserTimeouts(userId, user);
        break;
      case '4':
        await handleCustomEmojis(userId, user);
        break;
      case '5':
        await handleSubscriptionManagement(userId, user);
        break;
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  } finally {
    rl.close();
    await sql.end();
  }
}

// Run the script
manageUser();
