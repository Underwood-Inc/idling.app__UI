package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// renderMenu renders the main menu list
func (m Model) renderMenu() string {
	return menuStyle.Render(m.menuList.View())
}

// renderUserLookup renders the user lookup screen
func (m Model) renderUserLookup() string {
	var content strings.Builder
	
	content.WriteString(menuStyle.Render(
		fmt.Sprintf("🔍 User Lookup\n\n%s\n\nPress Enter to search, Esc to go back", m.textInput.View()),
	))
	
	// Show search results if any
	if len(m.searchResults) > 0 {
		content.WriteString("\n")
		content.WriteString(menuStyle.Render(
			fmt.Sprintf("Found %d users:", len(m.searchResults)),
		))
		content.WriteString("\n")
		content.WriteString(m.menuList.View())
	}
	
	return content.String()
}

// renderUserProfile renders the user profile menu
func (m Model) renderUserProfile() string {
	return menuStyle.Render(m.menuList.View())
}

// renderTable renders a data table
func (m Model) renderTable() string {
	if len(m.state.TableData) == 0 {
		return menuStyle.Render("No data to display")
	}
	
	var content strings.Builder
	
	// Table header
	var headerRow strings.Builder
	for i, col := range m.state.Columns {
		if i > 0 {
			headerRow.WriteString(" │ ")
		}
		headerRow.WriteString(tableHeaderStyle.Width(col.Width).Render(col.Label))
	}
	content.WriteString(headerRow.String())
	content.WriteString("\n")
	
	// Separator
	var separator strings.Builder
	for i, col := range m.state.Columns {
		if i > 0 {
			separator.WriteString("─┼─")
		}
		separator.WriteString(strings.Repeat("─", col.Width))
	}
	content.WriteString(separator.String())
	content.WriteString("\n")
	
	// Table rows
	for _, row := range m.state.TableData {
		var rowStr strings.Builder
		for i, col := range m.state.Columns {
			if i > 0 {
				rowStr.WriteString(" │ ")
			}
			value := ""
			if val, ok := row[col.Key]; ok {
				value = fmt.Sprintf("%v", val)
			}
			rowStr.WriteString(tableCellStyle.Width(col.Width).Render(value))
		}
		content.WriteString(rowStr.String())
		content.WriteString("\n")
	}
	
	return tableStyle.Render(content.String())
}

// renderForm renders a form
func (m Model) renderForm() string {
	var content strings.Builder
	
	content.WriteString("Form rendering not yet implemented")
	
	return menuStyle.Render(content.String())
}

// Placeholder functions for menu actions (to be implemented)
func (m Model) showReferenceData() tea.Cmd {
	m.state.Navigation.CurrentMenu = MenuReferenceData
	m.updateBreadcrumbs()
	
	// Load reference data and show as table
	return func() tea.Msg {
		// Get roles
		roles, err := m.db.GetAllRoles()
		if err != nil {
			return errorMsg{err}
		}
		
		// Convert to table data
		var tableData []TableRow
		for _, role := range roles {
			desc := "No description"
			if role.Description != nil {
				desc = *role.Description
			}
			tableData = append(tableData, TableRow{
				"id":           role.ID,
				"name":         role.Name,
				"display_name": role.DisplayName,
				"description":  desc,
				"active":       role.IsActive,
				"created":      role.CreatedAt.Format("2006-01-02"),
			})
		}
		
		m.state.TableData = tableData
		m.state.Columns = []TableColumn{
			{Key: "id", Label: "ID", Width: 5, Align: "right"},
			{Key: "name", Label: "Name", Width: 20, Align: "left"},
			{Key: "display_name", Label: "Display Name", Width: 25, Align: "left"},
			{Key: "description", Label: "Description", Width: 40, Align: "left"},
			{Key: "active", Label: "Active", Width: 8, Align: "center"},
			{Key: "created", Label: "Created", Width: 12, Align: "center"},
		}
		m.state.Navigation.CurrentMenu = MenuTable
		m.updateBreadcrumbs()
		
		return nil
	}
}

func (m Model) showBasicProfileForm() tea.Cmd {
	m.state.Navigation.CurrentMenu = MenuBasicProfile
	m.updateBreadcrumbs()
	
	// Create a menu for profile fields
	items := []list.Item{
		menuItem{MenuOption{Key: "name", Label: "Update Name", Description: getCurrentValue(m.state.Navigation.User.Name), Icon: "👤", Enabled: true}},
		menuItem{MenuOption{Key: "email", Label: "Update Email", Description: getCurrentValue(m.state.Navigation.User.Email), Icon: "📧", Enabled: true}},
		menuItem{MenuOption{Key: "bio", Label: "Update Bio", Description: getCurrentValue(m.state.Navigation.User.Bio), Icon: "📝", Enabled: true}},
		menuItem{MenuOption{Key: "location", Label: "Update Location", Description: getCurrentValue(m.state.Navigation.User.Location), Icon: "📍", Enabled: true}},
		menuItem{MenuOption{Key: "profile_public", Label: "Toggle Profile Visibility", Description: getProfileVisibility(m.state.Navigation.User.ProfilePublic), Icon: "👁️", Enabled: true}},
	}
	m.menuList.SetItems(items)
	
	return nil
}

func (m Model) showRolesPermissions() tea.Cmd {
	m.state.Navigation.CurrentMenu = MenuRolesPermissions
	m.updateBreadcrumbs()
	
	// Create menu for role/permission actions
	items := []list.Item{
		menuItem{MenuOption{Key: "assign_role", Label: "Assign Role", Description: "Assign a new role to this user", Icon: "➕", Enabled: true}},
		menuItem{MenuOption{Key: "remove_role", Label: "Remove Role", Description: "Remove an existing role from this user", Icon: "➖", Enabled: true}},
		menuItem{MenuOption{Key: "view_roles", Label: "View Current Roles", Description: "Show all roles assigned to this user", Icon: "📋", Enabled: true}},
		menuItem{MenuOption{Key: "view_permissions", Label: "View Permissions", Description: "Show all permissions for this user", Icon: "🔑", Enabled: true}},
	}
	m.menuList.SetItems(items)
	
	return nil
}

func (m Model) showTimeouts() tea.Cmd {
	m.state.Navigation.CurrentMenu = MenuTimeouts
	m.updateBreadcrumbs()
	
	// Create menu for timeout actions
	items := []list.Item{
		menuItem{MenuOption{Key: "issue_timeout", Label: "Issue Timeout", Description: "Issue a new timeout for this user", Icon: "⏰", Enabled: true}},
		menuItem{MenuOption{Key: "view_timeouts", Label: "View Timeout History", Description: "Show all timeouts for this user", Icon: "📜", Enabled: true}},
		menuItem{MenuOption{Key: "revoke_timeout", Label: "Revoke Active Timeout", Description: "Revoke an active timeout", Icon: "🔓", Enabled: true}},
	}
	m.menuList.SetItems(items)
	
	return nil
}

func (m Model) showSubscriptions() tea.Cmd {
	m.state.Navigation.CurrentMenu = MenuSubscriptions
	m.updateBreadcrumbs()
	
	// Create menu for subscription actions
	items := []list.Item{
		menuItem{MenuOption{Key: "assign_subscription", Label: "Assign Subscription", Description: "Assign a new subscription plan", Icon: "💳", Enabled: true}},
		menuItem{MenuOption{Key: "modify_subscription", Label: "Modify Subscription", Description: "Modify existing subscription", Icon: "✏️", Enabled: true}},
		menuItem{MenuOption{Key: "view_subscriptions", Label: "View Subscriptions", Description: "Show all subscriptions for this user", Icon: "📊", Enabled: true}},
		menuItem{MenuOption{Key: "cancel_subscription", Label: "Cancel Subscription", Description: "Cancel active subscription", Icon: "❌", Enabled: true}},
	}
	m.menuList.SetItems(items)
	
	return nil
}

func (m Model) showCustomEmojis() tea.Cmd {
	m.state.Navigation.CurrentMenu = MenuCustomEmojis
	m.updateBreadcrumbs()
	
	// Create menu for emoji actions
	items := []list.Item{
		menuItem{MenuOption{Key: "view_emojis", Label: "View Custom Emojis", Description: "Show all custom emojis for this user", Icon: "😀", Enabled: true}},
		menuItem{MenuOption{Key: "approve_emoji", Label: "Approve Emoji", Description: "Approve a pending custom emoji", Icon: "✅", Enabled: true}},
		menuItem{MenuOption{Key: "reject_emoji", Label: "Reject Emoji", Description: "Reject a pending custom emoji", Icon: "❌", Enabled: true}},
		menuItem{MenuOption{Key: "toggle_global", Label: "Toggle Global Availability", Description: "Make emoji globally available", Icon: "🌍", Enabled: true}},
	}
	m.menuList.SetItems(items)
	
	return nil
}

func (m Model) showQuotaManagement() tea.Cmd {
	m.state.Navigation.CurrentMenu = MenuQuotaManagement
	m.updateBreadcrumbs()
	
	// Create menu for quota actions
	items := []list.Item{
		menuItem{MenuOption{Key: "view_quotas", Label: "View Current Quotas", Description: "Show all quotas for this user", Icon: "📊", Enabled: true}},
		menuItem{MenuOption{Key: "update_quota", Label: "Update Quota Limit", Description: "Change quota limits", Icon: "⚙️", Enabled: true}},
		menuItem{MenuOption{Key: "reset_usage", Label: "Reset Quota Usage", Description: "Reset current usage to zero", Icon: "🔄", Enabled: true}},
		menuItem{MenuOption{Key: "set_unlimited", Label: "Set Unlimited", Description: "Remove quota limits", Icon: "♾️", Enabled: true}},
	}
	m.menuList.SetItems(items)
	
	return nil
}

func (m Model) showUserDetails() tea.Cmd {
	if m.state.Navigation.UserID == nil {
		return func() tea.Msg {
			return errorMsg{fmt.Errorf("no user selected")}
		}
	}
	
	userID := *m.state.Navigation.UserID
	
	return func() tea.Msg {
		// Get comprehensive user data
		user, err := m.db.GetUserByID(userID)
		if err != nil {
			return errorMsg{err}
		}
		
		accounts, _ := m.db.GetUserAccounts(userID)
		sessions, _ := m.db.GetUserSessions(userID)
		stats, _ := m.db.GetUserActivityStats(userID)
		roles, _ := m.db.GetUserRoles(userID)
		permissions, _ := m.db.GetUserPermissions(userID)
		timeouts, _ := m.db.GetUserTimeouts(userID)
		subscriptions, _ := m.db.GetUserSubscriptions(userID)
		emojis, _ := m.db.GetUserCustomEmojis(userID)
		
		// Format as table data
		var tableData []TableRow
		
		// Basic info
		tableData = append(tableData, TableRow{
			"section": "Basic Info",
			"field":   "ID",
			"value":   fmt.Sprintf("%d", user.ID),
		})
		tableData = append(tableData, TableRow{
			"section": "Basic Info",
			"field":   "Name",
			"value":   getCurrentValue(user.Name),
		})
		tableData = append(tableData, TableRow{
			"section": "Basic Info",
			"field":   "Email",
			"value":   getCurrentValue(user.Email),
		})
		tableData = append(tableData, TableRow{
			"section": "Basic Info",
			"field":   "Created",
			"value":   user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
		
		// Activity stats
		if stats != nil {
			tableData = append(tableData, TableRow{
				"section": "Activity",
				"field":   "Submissions",
				"value":   fmt.Sprintf("%d", stats.TotalSubmissions),
			})
			tableData = append(tableData, TableRow{
				"section": "Activity",
				"field":   "Posts",
				"value":   fmt.Sprintf("%d", stats.TotalPosts),
			})
			tableData = append(tableData, TableRow{
				"section": "Activity",
				"field":   "Comments",
				"value":   fmt.Sprintf("%d", stats.TotalComments),
			})
		}
		
		// Roles
		for _, role := range roles {
			status := "Inactive"
			if role.IsActive {
				status = "Active"
			}
			tableData = append(tableData, TableRow{
				"section": "Roles",
				"field":   role.RoleDisplayName,
				"value":   fmt.Sprintf("%s (assigned: %s)", status, role.AssignedAt.Format("2006-01-02")),
			})
		}
		
		// Active timeouts
		for _, timeout := range timeouts {
			if timeout.IsActive && timeout.ExpiresAt.After(time.Now()) {
				tableData = append(tableData, TableRow{
					"section": "Active Timeouts",
					"field":   timeout.TimeoutType,
					"value":   fmt.Sprintf("Expires: %s - %s", timeout.ExpiresAt.Format("2006-01-02 15:04"), timeout.Reason),
				})
			}
		}
		
		// Active subscriptions
		for _, sub := range subscriptions {
			if sub.Status == "active" || sub.Status == "trialing" {
				expires := "Never"
				if sub.ExpiresAt != nil {
					expires = sub.ExpiresAt.Format("2006-01-02")
				}
				tableData = append(tableData, TableRow{
					"section": "Subscriptions",
					"field":   sub.PlanDisplayName,
					"value":   fmt.Sprintf("%s - Expires: %s", sub.Status, expires),
				})
			}
		}
		
		m.state.TableData = tableData
		m.state.Columns = []TableColumn{
			{Key: "section", Label: "Section", Width: 20, Align: "left"},
			{Key: "field", Label: "Field", Width: 25, Align: "left"},
			{Key: "value", Label: "Value", Width: 50, Align: "left"},
		}
		m.state.Navigation.CurrentMenu = MenuTable
		m.updateBreadcrumbs()
		
		return nil
	}
}

// Helper functions
func getCurrentValue(ptr *string) string {
	if ptr == nil {
		return "Not set"
	}
	if *ptr == "" {
		return "Empty"
	}
	return *ptr
}

func getProfileVisibility(ptr *bool) string {
	if ptr == nil {
		return "Not set"
	}
	if *ptr {
		return "Public"
	}
	return "Private"
}

// formatTimePtr formats a time pointer for display
func formatTimePtr(t *time.Time) string {
	if t == nil {
		return "Never"
	}
	return t.Format("2006-01-02 15:04:05")
}

// formatBoolPtr formats a boolean pointer for display
func formatBoolPtr(b *bool) string {
	if b == nil {
		return "Not set"
	}
	if *b {
		return "Yes"
	}
	return "No"
}

// formatIntPtr formats an integer pointer for display
func formatIntPtr(i *int) string {
	if i == nil {
		return "Not set"
	}
	return fmt.Sprintf("%d", *i)
} 