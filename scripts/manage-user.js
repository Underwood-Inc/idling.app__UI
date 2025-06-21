/* eslint-disable no-console */
// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const chalk = require('chalk');
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
  console.log(chalk.blue(`\n📋 User Information for ID: ${userId}`));
  console.log(chalk.blue('='.repeat(50)));

  try {
    // Basic user info
    const user = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (user.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(chalk.green('\n👤 Basic User Info:'));
    console.table(user[0]);

    // Account connections (OAuth providers)
    const accounts = await sql`
      SELECT 
        id,
        type,
        provider,
        "providerAccountId",
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
      console.log(chalk.green('\n🔗 Account Connections:'));
      console.table(accounts);
    }

    // Active sessions
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
      console.log(chalk.green('\n🔓 Active Sessions:'));
      console.table(sessions);
    }

    // User activity statistics
    const activityStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM posts WHERE author_id = ${userId}) as posts_count,
        (SELECT COUNT(*) FROM comments WHERE author_id = ${userId}) as comments_count,
        (SELECT COUNT(*) FROM votes WHERE user_id = ${userId}) as votes_count,
        (SELECT COUNT(*) FROM submissions WHERE user_id = ${userId}) as submissions_count,
        (SELECT COUNT(*) FROM custom_emojis WHERE user_id = ${userId}) as custom_emojis_count,
        (SELECT MAX(created_at) FROM posts WHERE author_id = ${userId}) as last_post_date,
        (SELECT MAX(created_at) FROM comments WHERE author_id = ${userId}) as last_comment_date
    `;

    if (activityStats.length > 0) {
      console.log(chalk.green('\n📊 Activity Statistics:'));
      console.table(activityStats[0]);
    }

    // User roles with detailed permissions
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
      console.log(chalk.green('\n🔐 User Roles:'));
      console.table(roles);

      // For each role, show what permissions it grants
      for (const role of roles) {
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
            chalk.yellow(
              `\n  📋 Permissions granted by "${role.display_name}" role:`
            )
          );
          console.table(rolePermissions);
        }
      }
    }

    // User permissions (direct overrides)
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
      console.log(chalk.green('\n⚡ Direct Permission Overrides:'));
      console.table(permissions);
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
      console.log(chalk.green('\n⏰ User Timeouts:'));
      console.table(timeouts);
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
      console.log(chalk.green('\n😀 Custom Emojis:'));
      console.table(emojis);
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
      console.log(chalk.green('\n📈 Top 10 Emoji Usage:'));
      console.table(emojiUsage);
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
      console.log(chalk.green('\n🔐 Encryption Keys:'));
      console.table(encryptionKeys);
    }

    // Recent posts (if any)
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
      console.log(chalk.green('\n📝 Recent Posts (Latest 5):'));
      console.table(recentPosts);
    }

    // Recent comments (if any)
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
      console.log(chalk.green('\n💬 Recent Comments (Latest 5):'));
      console.table(recentComments);
    }

    // Recent submissions (if any)
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
      console.log(chalk.green('\n📄 Recent Submissions (Latest 5):'));
      console.table(recentSubmissions);
    }

    return user[0];
  } catch (error) {
    console.error(chalk.red('❌ Error fetching user info:'), error.message);
    throw error;
  }
}

// Show available tables and columns
function showAvailableOptions() {
  console.log(chalk.blue('\n📚 Available Tables and Columns:'));
  console.log(chalk.blue('='.repeat(50)));

  Object.entries(TABLE_CONFIGS).forEach(([tableName, config]) => {
    console.log(chalk.yellow(`\n🗂️  ${config.name} (${tableName}):`));
    Object.entries(config.columns).forEach(([columnName, columnConfig]) => {
      const readonly = columnConfig.readonly ? chalk.red(' [READ-ONLY]') : '';
      const required = columnConfig.required ? chalk.red(' *') : '';
      const type = chalk.dim(`(${columnConfig.type})`);
      const validation = columnConfig.validation
        ? chalk.dim(` [${columnConfig.validation}]`)
        : '';
      const enumValues = columnConfig.enum_values
        ? chalk.dim(` {${columnConfig.enum_values.join('|')}}`)
        : '';

      console.log(
        `  • ${columnName}${required}${readonly} ${type}${validation}${enumValues}`
      );
    });
  });
}

// Show reference data (roles, permissions)
async function showReferenceData() {
  console.log(chalk.blue('\n📖 Reference Data:'));
  console.log(chalk.blue('='.repeat(30)));

  // Show roles
  const roles =
    await sql`SELECT id, name, display_name FROM user_roles ORDER BY name`;
  console.log(chalk.green('\n🔐 Available Roles:'));
  console.table(roles);

  // Show permissions
  const permissions =
    await sql`SELECT id, name, display_name, category FROM permissions ORDER BY category, name`;
  console.log(chalk.green('\n⚡ Available Permissions:'));
  console.table(permissions);
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
  console.log(chalk.blue('='.repeat(60)));

  users.forEach((user, index) => {
    const displayName = user.name || 'No name';
    const email = user.email || 'No email';
    const createdDate = new Date(user.created_at).toLocaleDateString();

    console.log(chalk.cyan(`${index + 1}. ID: ${user.id}`));
    console.log(`   Name: ${displayName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Created: ${createdDate}`);
    console.log('');
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const choice = await prompt(
      chalk.yellow(`Select user (1-${users.length}) or 'cancel': `)
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
    console.log(chalk.blue('👤 User Management Tool'));
    console.log(chalk.blue('='.repeat(30)));

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
    console.log(chalk.blue('\n🛠️  What would you like to update?'));
    console.log(chalk.blue('='.repeat(40)));

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
        name: 'View Reference Data',
        description: 'Show available roles, permissions, and categories',
        table: null,
        icon: '📖'
      }
    };

    Object.entries(updateOptions).forEach(([key, option]) => {
      console.log(chalk.cyan(`${key}. ${option.icon} ${option.name}`));
      console.log(chalk.dim(`   ${option.description}`));
    });

    const choice = await prompt(chalk.yellow('\nSelect option (1-5): '));

    if (!updateOptions[choice]) {
      console.error(chalk.red('❌ Invalid choice. Please select 1-5'));
      return;
    }

    const selectedOption = updateOptions[choice];

    // Handle special case for reference data
    if (choice === '5') {
      await showReferenceData();
      return;
    }

    console.log(
      chalk.green(
        `\n✅ Selected: ${selectedOption.icon} ${selectedOption.name}`
      )
    );

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
