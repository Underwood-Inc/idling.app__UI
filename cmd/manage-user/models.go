package main

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// User represents a user in the system
type User struct {
	ID                  int       `json:"id"`
	Name                *string   `json:"name"`
	Email               *string   `json:"email"`
	EmailVerified       *time.Time `json:"email_verified"`
	Image               *string   `json:"image"`
	ProfilePublic       *bool     `json:"profile_public"`
	Bio                 *string   `json:"bio"`
	Location            *string   `json:"location"`
	CreatedAt           time.Time `json:"created_at"`
	ProviderAccountID   *string   `json:"provider_account_id"`
	SpacingTheme        *string   `json:"spacing_theme"`
	PaginationMode      *string   `json:"pagination_mode"`
	EmojiPanelBehavior  *string   `json:"emoji_panel_behavior"`
	FontPreference      *string   `json:"font_preference"`
	LastLogin           *time.Time `json:"last_login"`
	LoginCount          *int      `json:"login_count"`
	IsActive            *bool     `json:"is_active"`
	AdminNotes          *string   `json:"admin_notes"`
}

// Account represents an OAuth account connection
type Account struct {
	ID                 int     `json:"id"`
	UserID             int     `json:"user_id"`
	Type               string  `json:"type"`
	Provider           string  `json:"provider"`
	ProviderAccountID  string  `json:"provider_account_id"`
	RefreshToken       *string `json:"refresh_token"`
	AccessToken        *string `json:"access_token"`
	ExpiresAt          *int    `json:"expires_at"`
	TokenType          *string `json:"token_type"`
	Scope              *string `json:"scope"`
	IDToken            *string `json:"id_token"`
	SessionState       *string `json:"session_state"`
	ProviderName       *string `json:"provider_name"`
	ProviderEmail      *string `json:"provider_email"`
	ProviderVerified   *bool   `json:"provider_verified"`
	LastUsed           *time.Time `json:"last_used"`
}

// Session represents a user session
type Session struct {
	ID           int       `json:"id"`
	SessionToken string    `json:"session_token"`
	UserID       int       `json:"user_id"`
	Expires      time.Time `json:"expires"`
}

// UserRole represents a role in the system
type UserRole struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	DisplayName string  `json:"display_name"`
	Description *string `json:"description"`
	IsActive    bool    `json:"is_active"`
	SortOrder   int     `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}

// UserRoleAssignment represents a role assignment to a user
type UserRoleAssignment struct {
	ID          int        `json:"id"`
	UserID      int        `json:"user_id"`
	RoleID      int        `json:"role_id"`
	AssignedBy  *int       `json:"assigned_by"`
	AssignedAt  time.Time  `json:"assigned_at"`
	ExpiresAt   *time.Time `json:"expires_at"`
	IsActive    bool       `json:"is_active"`
	Reason      *string    `json:"reason"`
	UpdatedAt   *time.Time `json:"updated_at"`
	RemovedBy   *int       `json:"removed_by"`
	RemovedAt   *time.Time `json:"removed_at"`
	
	// Joined fields
	RoleName        string  `json:"role_name"`
	RoleDisplayName string  `json:"role_display_name"`
	AssignedByName  *string `json:"assigned_by_name"`
	AssignedByEmail *string `json:"assigned_by_email"`
}

// Permission represents a permission in the system
type Permission struct {
	ID           int     `json:"id"`
	Name         string  `json:"name"`
	DisplayName  string  `json:"display_name"`
	Description  *string `json:"description"`
	Category     string  `json:"category"`
	IsInheritable bool   `json:"is_inheritable"`
	IsActive     bool    `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

// UserPermission represents a direct permission assignment to a user
type UserPermission struct {
	ID           int        `json:"id"`
	UserID       int        `json:"user_id"`
	PermissionID int        `json:"permission_id"`
	Granted      bool       `json:"granted"`
	GrantedBy    *int       `json:"granted_by"`
	GrantedAt    time.Time  `json:"granted_at"`
	ExpiresAt    *time.Time `json:"expires_at"`
	Reason       *string    `json:"reason"`
	
	// Joined fields
	PermissionName        string  `json:"permission_name"`
	PermissionDisplayName string  `json:"permission_display_name"`
	PermissionDescription *string `json:"permission_description"`
	PermissionCategory    string  `json:"permission_category"`
	GrantedByName         *string `json:"granted_by_name"`
	GrantedByEmail        *string `json:"granted_by_email"`
}

// UserTimeout represents a user timeout/suspension
type UserTimeout struct {
	ID           int        `json:"id"`
	UserID       int        `json:"user_id"`
	TimeoutType  string     `json:"timeout_type"`
	Reason       string     `json:"reason"`
	IssuedBy     int        `json:"issued_by"`
	IssuedAt     time.Time  `json:"issued_at"`
	ExpiresAt    time.Time  `json:"expires_at"`
	IsActive     bool       `json:"is_active"`
	RevokedBy    *int       `json:"revoked_by"`
	RevokedAt    *time.Time `json:"revoked_at"`
	RevokeReason *string    `json:"revoke_reason"`
	
	// Joined fields
	IssuedByName    string  `json:"issued_by_name"`
	IssuedByEmail   string  `json:"issued_by_email"`
	RevokedByName   *string `json:"revoked_by_name"`
	RevokedByEmail  *string `json:"revoked_by_email"`
}

// SubscriptionPlan represents a subscription plan
type SubscriptionPlan struct {
	ID                 int     `json:"id"`
	Name               string  `json:"name"`
	DisplayName        string  `json:"display_name"`
	Description        *string `json:"description"`
	PlanType           string  `json:"plan_type"`
	PriceMonthlycents  *int    `json:"price_monthly_cents"`
	PriceYearlyCents   *int    `json:"price_yearly_cents"`
	IsActive           bool    `json:"is_active"`
	SortOrder          int     `json:"sort_order"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// UserSubscription represents a user's subscription
type UserSubscription struct {
	ID                     int        `json:"id"`
	UserID                 int        `json:"user_id"`
	PlanID                 int        `json:"plan_id"`
	Status                 string     `json:"status"`
	BillingCycle           *string    `json:"billing_cycle"`
	ExpiresAt              *time.Time `json:"expires_at"`
	TrialEndsAt            *time.Time `json:"trial_ends_at"`
	AssignedBy             *int       `json:"assigned_by"`
	AssignmentReason       *string    `json:"assignment_reason"`
	ExternalSubscriptionID *string    `json:"external_subscription_id"`
	PricePaidCents         *int       `json:"price_paid_cents"`
	Notes                  *string    `json:"notes"`
	AdminNotes             *string    `json:"admin_notes"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
	
	// Joined fields
	PlanName         string  `json:"plan_name"`
	PlanDisplayName  string  `json:"plan_display_name"`
	AssignedByName   *string `json:"assigned_by_name"`
	AssignedByEmail  *string `json:"assigned_by_email"`
}

// CustomEmoji represents a custom emoji
type CustomEmoji struct {
	ID                   int        `json:"id"`
	UserID               int        `json:"user_id"`
	Name                 string     `json:"name"`
	DisplayName          string     `json:"display_name"`
	Category             string     `json:"category"`
	ApprovalStatus       string     `json:"approval_status"`
	ReviewedBy           *int       `json:"reviewed_by"`
	ReviewedAt           *time.Time `json:"reviewed_at"`
	ReviewNotes          *string    `json:"review_notes"`
	IsGloballyAvailable  bool       `json:"is_globally_available"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
	
	// Joined fields
	ReviewedByName  *string `json:"reviewed_by_name"`
	ReviewedByEmail *string `json:"reviewed_by_email"`
}

// ActivityStats represents user activity statistics
type ActivityStats struct {
	TotalSubmissions      int        `json:"total_submissions"`
	TotalPosts            int        `json:"total_posts"`
	TotalComments         int        `json:"total_comments"`
	LatestSubmissionDate  *time.Time `json:"latest_submission_date"`
	LatestPostDate        *time.Time `json:"latest_post_date"`
	LatestCommentDate     *time.Time `json:"latest_comment_date"`
}

// StringArray is a custom type to handle PostgreSQL arrays
type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = StringArray{}
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, a)
	case string:
		return json.Unmarshal([]byte(v), a)
	default:
		return fmt.Errorf("cannot scan %T into StringArray", value)
	}
}

func (a StringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return nil, nil
	}
	return json.Marshal(a)
}

// UserSearchResult represents a user search result
type UserSearchResult struct {
	ID        int     `json:"id"`
	Name      *string `json:"name"`
	Email     *string `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// MenuOption represents a menu option
type MenuOption struct {
	Key         string
	Label       string
	Description string
	Icon        string
	Enabled     bool
}

// NavigationState represents the current navigation state
type NavigationState struct {
	CurrentMenu string
	Breadcrumbs []string
	UserID      *int
	User        *User
}

// FormField represents a form field
type FormField struct {
	Key         string
	Label       string
	Value       string
	Required    bool
	Multiline   bool
	Options     []string // For select fields
	Validation  func(string) error
}

// TableColumn represents a table column
type TableColumn struct {
	Key    string
	Label  string
	Width  int
	Align  string // "left", "center", "right"
}

// TableRow represents a table row
type TableRow map[string]interface{}

// AppState represents the overall application state
type AppState struct {
	Navigation  NavigationState
	Loading     bool
	Error       string
	Message     string
	CurrentView string
	FormData    map[string]string
	TableData   []TableRow
	Columns     []TableColumn
}

// Constants for menu states
const (
	MenuMain                = "main"
	MenuUserLookup          = "user_lookup"
	MenuUserProfile         = "user_profile"
	MenuBasicProfile        = "basic_profile"
	MenuRolesPermissions    = "roles_permissions"
	MenuTimeouts            = "timeouts"
	MenuSubscriptions       = "subscriptions"
	MenuCustomEmojis        = "custom_emojis"
	MenuQuotaManagement     = "quota_management"
	MenuReferenceData       = "reference_data"
	MenuForm                = "form"
	MenuTable               = "table"
	MenuConfirm             = "confirm"
)

// Constants for timeout types
const (
	TimeoutPostCreation    = "post_creation"
	TimeoutCommentCreation = "comment_creation"
	TimeoutFullAccess      = "full_access"
)

// Constants for subscription statuses
const (
	SubscriptionActive     = "active"
	SubscriptionCancelled  = "cancelled"
	SubscriptionExpired    = "expired"
	SubscriptionSuspended  = "suspended"
	SubscriptionPending    = "pending"
	SubscriptionTrialing   = "trialing"
)

// Constants for approval statuses
const (
	ApprovalPending   = "pending"
	ApprovalApproved  = "approved"
	ApprovalRejected  = "rejected"
) 