package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

// Database represents the database connection
type Database struct {
	db *sql.DB
}

// NewDatabase creates a new database connection
func NewDatabase() (*Database, error) {
	host := os.Getenv("POSTGRES_HOST")
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")
	port := os.Getenv("POSTGRES_PORT")
	
	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "5432"
	}
	
	// Try to get SSL mode from environment, default to disable for local development
	sslmode := os.Getenv("POSTGRES_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}
	
	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)
	
	// Debug output for database connection
	log.Printf("Debug: Database connection info: host=%s port=%s user=%s dbname=%s sslmode=%s", 
		host, port, user, dbname, sslmode)
	
	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	
	// Set connection pool settings
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)
	
	return &Database{db: db}, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	return d.db.Close()
}

// GetUserByID retrieves a user by ID
func (d *Database) GetUserByID(id int) (*User, error) {
	query := `
		SELECT id, name, email, "emailVerified", image, profile_public, bio, location, 
			   created_at, provider_account_id, spacing_theme, pagination_mode, 
			   emoji_panel_behavior, font_preference, last_login, login_count, 
			   is_active, admin_notes
		FROM users 
		WHERE id = $1`
	
	var user User
	err := d.db.QueryRow(query, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.EmailVerified, &user.Image,
		&user.ProfilePublic, &user.Bio, &user.Location, &user.CreatedAt,
		&user.ProviderAccountID, &user.SpacingTheme, &user.PaginationMode,
		&user.EmojiPanelBehavior, &user.FontPreference, &user.LastLogin,
		&user.LoginCount, &user.IsActive, &user.AdminNotes,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	
	return &user, nil
}

// SearchUsersByName searches for users by name/email
func (d *Database) SearchUsersByName(search string) ([]UserSearchResult, error) {
	query := `
		SELECT id, name, email, created_at
		FROM users 
		WHERE name ILIKE $1 OR email ILIKE $1
		ORDER BY created_at DESC
		LIMIT 20`
	
	rows, err := d.db.Query(query, "%"+search+"%")
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}
	defer rows.Close()
	
	var results []UserSearchResult
	for rows.Next() {
		var result UserSearchResult
		err := rows.Scan(&result.ID, &result.Name, &result.Email, &result.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user result: %w", err)
		}
		results = append(results, result)
	}
	
	return results, nil
}

// GetUserAccounts retrieves user's OAuth accounts
func (d *Database) GetUserAccounts(userID int) ([]Account, error) {
	query := `
		SELECT id, "userId", type, provider, "providerAccountId", 
			   refresh_token IS NOT NULL as has_refresh_token,
			   access_token IS NOT NULL as has_access_token,
			   expires_at, token_type, scope, provider_name, provider_email,
			   provider_verified, last_used
		FROM accounts 
		WHERE "userId" = $1
		ORDER BY provider`
	
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user accounts: %w", err)
	}
	defer rows.Close()
	
	var accounts []Account
	for rows.Next() {
		var account Account
		var hasRefreshToken, hasAccessToken bool
		err := rows.Scan(
			&account.ID, &account.UserID, &account.Type, &account.Provider,
			&account.ProviderAccountID, &hasRefreshToken, &hasAccessToken,
			&account.ExpiresAt, &account.TokenType, &account.Scope,
			&account.ProviderName, &account.ProviderEmail, &account.ProviderVerified,
			&account.LastUsed,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan account: %w", err)
		}
		accounts = append(accounts, account)
	}
	
	return accounts, nil
}

// GetUserSessions retrieves user's active sessions
func (d *Database) GetUserSessions(userID int) ([]Session, error) {
	query := `
		SELECT id, "sessionToken", "userId", expires
		FROM sessions 
		WHERE "userId" = $1 AND expires > CURRENT_TIMESTAMP
		ORDER BY expires DESC`
	
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}
	defer rows.Close()
	
	var sessions []Session
	for rows.Next() {
		var session Session
		err := rows.Scan(&session.ID, &session.SessionToken, &session.UserID, &session.Expires)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session: %w", err)
		}
		sessions = append(sessions, session)
	}
	
	return sessions, nil
}

// GetUserActivityStats retrieves user's activity statistics
func (d *Database) GetUserActivityStats(userID int) (*ActivityStats, error) {
	query := `
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
		WHERE u.id = $1
		GROUP BY u.id`
	
	var stats ActivityStats
	err := d.db.QueryRow(query, userID).Scan(
		&stats.TotalSubmissions, &stats.TotalPosts, &stats.TotalComments,
		&stats.LatestSubmissionDate, &stats.LatestPostDate, &stats.LatestCommentDate,
	)
	
	if err != nil {
		// If tables don't exist, return empty stats
		if strings.Contains(err.Error(), "does not exist") {
			return &ActivityStats{}, nil
		}
		return nil, fmt.Errorf("failed to get activity stats: %w", err)
	}
	
	return &stats, nil
}

// GetUserRoles retrieves user's role assignments
func (d *Database) GetUserRoles(userID int) ([]UserRoleAssignment, error) {
	query := `
		SELECT 
			ura.id, ura.user_id, ura.role_id, ura.assigned_by, ura.assigned_at,
			ura.expires_at, ura.is_active, ura.reason, ura.updated_at,
			ura.removed_by, ura.removed_at,
			ur.name as role_name, ur.display_name as role_display_name,
			u.name as assigned_by_name, u.email as assigned_by_email
		FROM user_role_assignments ura
		JOIN user_roles ur ON ura.role_id = ur.id
		LEFT JOIN users u ON ura.assigned_by = u.id
		WHERE ura.user_id = $1
		ORDER BY ura.assigned_at DESC`
	
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}
	defer rows.Close()
	
	var roles []UserRoleAssignment
	for rows.Next() {
		var role UserRoleAssignment
		err := rows.Scan(
			&role.ID, &role.UserID, &role.RoleID, &role.AssignedBy, &role.AssignedAt,
			&role.ExpiresAt, &role.IsActive, &role.Reason, &role.UpdatedAt,
			&role.RemovedBy, &role.RemovedAt, &role.RoleName, &role.RoleDisplayName,
			&role.AssignedByName, &role.AssignedByEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user role: %w", err)
		}
		roles = append(roles, role)
	}
	
	return roles, nil
}

// GetUserPermissions retrieves user's direct permission assignments
func (d *Database) GetUserPermissions(userID int) ([]UserPermission, error) {
	query := `
		SELECT 
			up.id, up.user_id, up.permission_id, up.granted, up.granted_by,
			up.granted_at, up.expires_at, up.reason,
			p.name as permission_name, p.display_name as permission_display_name,
			p.description as permission_description, p.category as permission_category,
			u.name as granted_by_name, u.email as granted_by_email
		FROM user_permissions up
		JOIN permissions p ON up.permission_id = p.id
		LEFT JOIN users u ON up.granted_by = u.id
		WHERE up.user_id = $1
		ORDER BY up.granted_at DESC`
	
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user permissions: %w", err)
	}
	defer rows.Close()
	
	var permissions []UserPermission
	for rows.Next() {
		var perm UserPermission
		err := rows.Scan(
			&perm.ID, &perm.UserID, &perm.PermissionID, &perm.Granted, &perm.GrantedBy,
			&perm.GrantedAt, &perm.ExpiresAt, &perm.Reason, &perm.PermissionName,
			&perm.PermissionDisplayName, &perm.PermissionDescription, &perm.PermissionCategory,
			&perm.GrantedByName, &perm.GrantedByEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user permission: %w", err)
		}
		permissions = append(permissions, perm)
	}
	
	return permissions, nil
}

// GetUserTimeouts retrieves user's timeout history
func (d *Database) GetUserTimeouts(userID int) ([]UserTimeout, error) {
	query := `
		SELECT 
			ut.id, ut.user_id, ut.timeout_type, ut.reason, ut.issued_by,
			ut.issued_at, ut.expires_at, ut.is_active, ut.revoked_by,
			ut.revoked_at, ut.revoke_reason,
			u1.name as issued_by_name, u1.email as issued_by_email,
			u2.name as revoked_by_name, u2.email as revoked_by_email
		FROM user_timeouts ut
		LEFT JOIN users u1 ON ut.issued_by = u1.id
		LEFT JOIN users u2 ON ut.revoked_by = u2.id
		WHERE ut.user_id = $1
		ORDER BY ut.issued_at DESC`
	
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user timeouts: %w", err)
	}
	defer rows.Close()
	
	var timeouts []UserTimeout
	for rows.Next() {
		var timeout UserTimeout
		err := rows.Scan(
			&timeout.ID, &timeout.UserID, &timeout.TimeoutType, &timeout.Reason, &timeout.IssuedBy,
			&timeout.IssuedAt, &timeout.ExpiresAt, &timeout.IsActive, &timeout.RevokedBy,
			&timeout.RevokedAt, &timeout.RevokeReason, &timeout.IssuedByName, &timeout.IssuedByEmail,
			&timeout.RevokedByName, &timeout.RevokedByEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user timeout: %w", err)
		}
		timeouts = append(timeouts, timeout)
	}
	
	return timeouts, nil
}

// GetUserSubscriptions retrieves user's subscription history
func (d *Database) GetUserSubscriptions(userID int) ([]UserSubscription, error) {
	query := `
		SELECT 
			us.id, us.user_id, us.plan_id, us.status, us.billing_cycle,
			us.expires_at, us.trial_ends_at, us.assigned_by, us.assignment_reason,
			us.external_subscription_id, us.price_paid_cents, us.notes, us.admin_notes,
			us.created_at, us.updated_at,
			sp.name as plan_name, sp.display_name as plan_display_name,
			u.name as assigned_by_name, u.email as assigned_by_email
		FROM user_subscriptions us
		JOIN subscription_plans sp ON us.plan_id = sp.id
		LEFT JOIN users u ON us.assigned_by = u.id
		WHERE us.user_id = $1
		ORDER BY us.created_at DESC`
	
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user subscriptions: %w", err)
	}
	defer rows.Close()
	
	var subscriptions []UserSubscription
	for rows.Next() {
		var sub UserSubscription
		err := rows.Scan(
			&sub.ID, &sub.UserID, &sub.PlanID, &sub.Status, &sub.BillingCycle,
			&sub.ExpiresAt, &sub.TrialEndsAt, &sub.AssignedBy, &sub.AssignmentReason,
			&sub.ExternalSubscriptionID, &sub.PricePaidCents, &sub.Notes, &sub.AdminNotes,
			&sub.CreatedAt, &sub.UpdatedAt, &sub.PlanName, &sub.PlanDisplayName,
			&sub.AssignedByName, &sub.AssignedByEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user subscription: %w", err)
		}
		subscriptions = append(subscriptions, sub)
	}
	
	return subscriptions, nil
}

// GetUserCustomEmojis retrieves user's custom emoji submissions
func (d *Database) GetUserCustomEmojis(userID int) ([]CustomEmoji, error) {
	query := `
		SELECT 
			ce.id, ce.user_id, ce.name, ce.display_name, ce.category,
			ce.approval_status, ce.reviewed_by, ce.reviewed_at, ce.review_notes,
			ce.is_globally_available, ce.created_at, ce.updated_at,
			u.name as reviewed_by_name, u.email as reviewed_by_email
		FROM custom_emojis ce
		LEFT JOIN users u ON ce.reviewed_by = u.id
		WHERE ce.user_id = $1
		ORDER BY ce.created_at DESC`
	
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user custom emojis: %w", err)
	}
	defer rows.Close()
	
	var emojis []CustomEmoji
	for rows.Next() {
		var emoji CustomEmoji
		err := rows.Scan(
			&emoji.ID, &emoji.UserID, &emoji.Name, &emoji.DisplayName, &emoji.Category,
			&emoji.ApprovalStatus, &emoji.ReviewedBy, &emoji.ReviewedAt, &emoji.ReviewNotes,
			&emoji.IsGloballyAvailable, &emoji.CreatedAt, &emoji.UpdatedAt,
			&emoji.ReviewedByName, &emoji.ReviewedByEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan custom emoji: %w", err)
		}
		emojis = append(emojis, emoji)
	}
	
	return emojis, nil
}

// GetAllRoles retrieves all available roles
func (d *Database) GetAllRoles() ([]UserRole, error) {
	query := `
		SELECT id, name, display_name, description, is_active, created_at
		FROM user_roles 
		WHERE is_active = true
		ORDER BY name`
	
	rows, err := d.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get roles: %w", err)
	}
	defer rows.Close()
	
	var roles []UserRole
	for rows.Next() {
		var role UserRole
		err := rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description,
			&role.IsActive, &role.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		// Set default SortOrder since column doesn't exist in database
		role.SortOrder = 0
		roles = append(roles, role)
	}
	
	return roles, nil
}

// GetAllPermissions retrieves all available permissions
func (d *Database) GetAllPermissions() ([]Permission, error) {
	query := `
		SELECT id, name, display_name, description, category, is_inheritable, is_active, created_at
		FROM permissions 
		WHERE is_active = true
		ORDER BY category, name`
	
	rows, err := d.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get permissions: %w", err)
	}
	defer rows.Close()
	
	var permissions []Permission
	for rows.Next() {
		var perm Permission
		err := rows.Scan(&perm.ID, &perm.Name, &perm.DisplayName, &perm.Description,
			&perm.Category, &perm.IsInheritable, &perm.IsActive, &perm.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, perm)
	}
	
	return permissions, nil
}

// GetAllSubscriptionPlans retrieves all available subscription plans
func (d *Database) GetAllSubscriptionPlans() ([]SubscriptionPlan, error) {
	query := `
		SELECT id, name, display_name, description, plan_type, price_monthly_cents,
			   price_yearly_cents, is_active, sort_order, created_at, updated_at
		FROM subscription_plans 
		WHERE is_active = true
		ORDER BY sort_order, name`
	
	rows, err := d.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription plans: %w", err)
	}
	defer rows.Close()
	
	var plans []SubscriptionPlan
	for rows.Next() {
		var plan SubscriptionPlan
		err := rows.Scan(&plan.ID, &plan.Name, &plan.DisplayName, &plan.Description,
			&plan.PlanType, &plan.PriceMonthlycents, &plan.PriceYearlyCents,
			&plan.IsActive, &plan.SortOrder, &plan.CreatedAt, &plan.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan subscription plan: %w", err)
		}
		plans = append(plans, plan)
	}
	
	return plans, nil
}

// UpdateUserProfile updates a user's basic profile information
func (d *Database) UpdateUserProfile(userID int, field string, value interface{}) error {
	// Validate field name to prevent SQL injection
	allowedFields := map[string]bool{
		"name": true, "email": true, "bio": true, "location": true,
		"profile_public": true, "spacing_theme": true, "pagination_mode": true,
		"emoji_panel_behavior": true, "font_preference": true, "admin_notes": true,
	}
	
	if !allowedFields[field] {
		return fmt.Errorf("invalid field name: %s", field)
	}
	
	query := fmt.Sprintf(`UPDATE users SET %s = $1 WHERE id = $2`, field)
	_, err := d.db.Exec(query, value, userID)
	if err != nil {
		return fmt.Errorf("failed to update user profile: %w", err)
	}
	
	return nil
}

// AssignRoleToUser assigns a role to a user
func (d *Database) AssignRoleToUser(userID, roleID int, assignedBy *int, reason *string) error {
	query := `
		INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, is_active, reason)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true, $4)
		ON CONFLICT (user_id, role_id) DO UPDATE SET 
			is_active = true, 
			assigned_by = $3, 
			assigned_at = CURRENT_TIMESTAMP,
			reason = $4`
	
	_, err := d.db.Exec(query, userID, roleID, assignedBy, reason)
	if err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}
	
	return nil
}

// RemoveRoleFromUser removes a role from a user
func (d *Database) RemoveRoleFromUser(userID, roleID int, removedBy *int, reason *string) error {
	query := `
		UPDATE user_role_assignments 
		SET is_active = false, removed_by = $3, removed_at = CURRENT_TIMESTAMP,
			reason = COALESCE($4, reason)
		WHERE user_id = $1 AND role_id = $2`
	
	_, err := d.db.Exec(query, userID, roleID, removedBy, reason)
	if err != nil {
		return fmt.Errorf("failed to remove role: %w", err)
	}
	
	return nil
}

// IssueUserTimeout issues a timeout for a user
func (d *Database) IssueUserTimeout(userID int, timeoutType, reason string, issuedBy int, expiresAt time.Time) error {
	query := `
		INSERT INTO user_timeouts (user_id, timeout_type, reason, issued_by, issued_at, expires_at, is_active)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, true)`
	
	_, err := d.db.Exec(query, userID, timeoutType, reason, issuedBy, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to issue timeout: %w", err)
	}
	
	return nil
}

// RevokeUserTimeout revokes an active timeout
func (d *Database) RevokeUserTimeout(timeoutID int, revokedBy int, reason string) error {
	query := `
		UPDATE user_timeouts 
		SET is_active = false, revoked_by = $2, revoked_at = CURRENT_TIMESTAMP, revoke_reason = $3
		WHERE id = $1 AND is_active = true`
	
	_, err := d.db.Exec(query, timeoutID, revokedBy, reason)
	if err != nil {
		return fmt.Errorf("failed to revoke timeout: %w", err)
	}
	
	return nil
}

// Helper function to safely convert string to int
func safeStringToInt(s string) int {
	if s == "" {
		return 0
	}
	i, err := strconv.Atoi(s)
	if err != nil {
		log.Printf("Warning: failed to convert string to int: %s", s)
		return 0
	}
	return i
}

// Helper function to safely convert string to bool
func safeStringToBool(s string) bool {
	if s == "" {
		return false
	}
	b, err := strconv.ParseBool(s)
	if err != nil {
		log.Printf("Warning: failed to convert string to bool: %s", s)
		return false
	}
	return b
} 