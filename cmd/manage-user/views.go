package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
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
	return func() tea.Msg {
		items := []MenuOption{
			{Key: "roles", Label: "User Roles", Description: "View all available user roles", Icon: "🔐"},
			{Key: "permissions", Label: "Permissions", Description: "View all available permissions", Icon: "⚡"},
			{Key: "subscription_plans", Label: "Subscription Plans", Description: "View all subscription plans", Icon: "💳"},
		}
		
		var listItems []list.Item
		for _, item := range items {
			listItems = append(listItems, menuItem{option: item})
		}
		
		// Update navigation state
	m.state.Navigation.CurrentMenu = MenuReferenceData
	m.updateBreadcrumbs()
	
		return menuLoadedMsg{items: listItems}
	}
}

// Helper functions for reference data display
func (m Model) showAllRoles() tea.Cmd {
	return func() tea.Msg {
		roles, err := m.db.GetAllRoles()
		if err != nil {
			return errorMsg{err}
		}
		
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
		
		columns := []TableColumn{
			{Key: "id", Label: "ID", Width: 5, Align: "right"},
			{Key: "name", Label: "Name", Width: 20, Align: "left"},
			{Key: "display_name", Label: "Display Name", Width: 25, Align: "left"},
			{Key: "description", Label: "Description", Width: 40, Align: "left"},
			{Key: "active", Label: "Active", Width: 8, Align: "center"},
			{Key: "created", Label: "Created", Width: 12, Align: "center"},
		}
		
		return tableLoadedMsg{data: tableData, columns: columns}
	}
}

func (m Model) showAllPermissions() tea.Cmd {
	return func() tea.Msg {
		permissions, err := m.db.GetAllPermissions()
		if err != nil {
			return errorMsg{err}
		}
		
		var tableData []TableRow
		for _, perm := range permissions {
			desc := "No description"
			if perm.Description != nil {
				desc = *perm.Description
			}
			tableData = append(tableData, TableRow{
				"id":           perm.ID,
				"name":         perm.Name,
				"display_name": perm.DisplayName,
				"description":  desc,
				"category":     perm.Category,
				"inheritable":  perm.IsInheritable,
				"active":       perm.IsActive,
			})
		}
		
		columns := []TableColumn{
			{Key: "id", Label: "ID", Width: 5, Align: "right"},
			{Key: "name", Label: "Name", Width: 20, Align: "left"},
			{Key: "display_name", Label: "Display Name", Width: 25, Align: "left"},
			{Key: "category", Label: "Category", Width: 15, Align: "left"},
			{Key: "inheritable", Label: "Inherit", Width: 8, Align: "center"},
			{Key: "description", Label: "Description", Width: 35, Align: "left"},
		}
		
		return tableLoadedMsg{data: tableData, columns: columns}
	}
}

func (m Model) showAllSubscriptionPlans() tea.Cmd {
	return func() tea.Msg {
		plans, err := m.db.GetAllSubscriptionPlans()
		if err != nil {
			return errorMsg{err}
		}
		
		var tableData []TableRow
		for _, plan := range plans {
			desc := "No description"
			if plan.Description != nil {
				desc = *plan.Description
			}
			
			monthlyPrice := "Free"
			if plan.PriceMonthlycents != nil && *plan.PriceMonthlycents > 0 {
				monthlyPrice = fmt.Sprintf("$%.2f", float64(*plan.PriceMonthlycents)/100)
			}
			
			yearlyPrice := "Free"
			if plan.PriceYearlyCents != nil && *plan.PriceYearlyCents > 0 {
				yearlyPrice = fmt.Sprintf("$%.2f", float64(*plan.PriceYearlyCents)/100)
			}
			
			tableData = append(tableData, TableRow{
				"id":           plan.ID,
				"name":         plan.Name,
				"display_name": plan.DisplayName,
				"type":         plan.PlanType,
				"monthly":      monthlyPrice,
				"yearly":       yearlyPrice,
				"description":  desc,
				"active":       plan.IsActive,
			})
		}
		
		columns := []TableColumn{
			{Key: "id", Label: "ID", Width: 5, Align: "right"},
			{Key: "name", Label: "Name", Width: 20, Align: "left"},
			{Key: "display_name", Label: "Display Name", Width: 25, Align: "left"},
			{Key: "type", Label: "Type", Width: 10, Align: "left"},
			{Key: "monthly", Label: "Monthly", Width: 10, Align: "right"},
			{Key: "yearly", Label: "Yearly", Width: 10, Align: "right"},
			{Key: "description", Label: "Description", Width: 30, Align: "left"},
		}
		
		return tableLoadedMsg{data: tableData, columns: columns}
	}
}

func (m Model) showBasicProfileForm() tea.Cmd {
	return func() tea.Msg {
	// Create a menu for profile fields
	items := []list.Item{
		menuItem{MenuOption{Key: "name", Label: "Update Name", Description: getCurrentValue(m.state.Navigation.User.Name), Icon: "👤", Enabled: true}},
		menuItem{MenuOption{Key: "email", Label: "Update Email", Description: getCurrentValue(m.state.Navigation.User.Email), Icon: "📧", Enabled: true}},
		menuItem{MenuOption{Key: "bio", Label: "Update Bio", Description: getCurrentValue(m.state.Navigation.User.Bio), Icon: "📝", Enabled: true}},
		menuItem{MenuOption{Key: "location", Label: "Update Location", Description: getCurrentValue(m.state.Navigation.User.Location), Icon: "📍", Enabled: true}},
		menuItem{MenuOption{Key: "profile_public", Label: "Toggle Profile Visibility", Description: getProfileVisibility(m.state.Navigation.User.ProfilePublic), Icon: "👁️", Enabled: true}},
	}
		
		// Update navigation state
		m.state.Navigation.CurrentMenu = MenuBasicProfile
		m.updateBreadcrumbs()
		
		return menuLoadedMsg{items: items}
	}
}

// Helper functions for basic profile management
func (m Model) updateUserField(field, fieldLabel string) tea.Cmd {
	if m.state.Navigation.UserID == nil {
		return func() tea.Msg {
			return errorMsg{fmt.Errorf("no user selected")}
		}
	}
	
	// For now, just show the current value - would need text input for actual editing
	return func() tea.Msg {
		userID := *m.state.Navigation.UserID
		user := m.state.Navigation.User
		
		var currentValue string
		switch field {
		case "name":
			currentValue = getCurrentValue(user.Name)
		case "email":
			currentValue = getCurrentValue(user.Email)
		case "bio":
			currentValue = getCurrentValue(user.Bio)
		case "location":
			currentValue = getCurrentValue(user.Location)
		}
		
		// For demonstration, just show current value
		var tableData []TableRow
		tableData = append(tableData, TableRow{
			"field": fieldLabel,
			"current": currentValue,
			"userid": fmt.Sprintf("%d", userID),
		})
		
		columns := []TableColumn{
			{Key: "field", Label: "Field", Width: 20, Align: "left"},
			{Key: "current", Label: "Current Value", Width: 60, Align: "left"},
			{Key: "userid", Label: "User ID", Width: 10, Align: "center"},
		}
		
		return tableLoadedMsg{data: tableData, columns: columns}
	}
}

func (m Model) toggleProfileVisibility() tea.Cmd {
	if m.state.Navigation.UserID == nil {
		return func() tea.Msg {
			return errorMsg{fmt.Errorf("no user selected")}
		}
	}
	
	return func() tea.Msg {
		userID := *m.state.Navigation.UserID
		user := m.state.Navigation.User
		
		// Toggle visibility
		newVisibility := true
		if user.ProfilePublic != nil {
			newVisibility = !(*user.ProfilePublic)
		}
		
		err := m.db.UpdateUserProfile(userID, "profile_public", newVisibility)
		if err != nil {
			return errorMsg{err}
		}
		
		// Update local state
		user.ProfilePublic = &newVisibility
		
		// Show result
		var tableData []TableRow
		tableData = append(tableData, TableRow{
			"field": "Profile Visibility",
			"old": getProfileVisibility(user.ProfilePublic),
			"new": fmt.Sprintf("%t", newVisibility),
			"status": "Updated Successfully",
		})
		
		columns := []TableColumn{
			{Key: "field", Label: "Field", Width: 20, Align: "left"},
			{Key: "old", Label: "Old Value", Width: 20, Align: "left"},
			{Key: "new", Label: "New Value", Width: 20, Align: "left"},
			{Key: "status", Label: "Status", Width: 30, Align: "left"},
		}
		
		return tableLoadedMsg{data: tableData, columns: columns}
	}
}

func (m Model) showRolesPermissions() tea.Cmd {
	return func() tea.Msg {
	// Create menu for role/permission actions
	items := []list.Item{
		menuItem{MenuOption{Key: "assign_role", Label: "Assign Role", Description: "Assign a new role to this user", Icon: "➕", Enabled: true}},
		menuItem{MenuOption{Key: "remove_role", Label: "Remove Role", Description: "Remove an existing role from this user", Icon: "➖", Enabled: true}},
		menuItem{MenuOption{Key: "view_roles", Label: "View Current Roles", Description: "Show all roles assigned to this user", Icon: "📋", Enabled: true}},
		menuItem{MenuOption{Key: "view_permissions", Label: "View Permissions", Description: "Show all permissions for this user", Icon: "🔑", Enabled: true}},
	}
		
		// Update navigation state
		m.state.Navigation.CurrentMenu = MenuRolesPermissions
		m.updateBreadcrumbs()
	
		return menuLoadedMsg{items: items}
	}
}

func (m Model) showTimeouts() tea.Cmd {
	return func() tea.Msg {
	// Create menu for timeout actions
	items := []list.Item{
		menuItem{MenuOption{Key: "issue_timeout", Label: "Issue Timeout", Description: "Issue a new timeout for this user", Icon: "⏰", Enabled: true}},
		menuItem{MenuOption{Key: "view_timeouts", Label: "View Timeout History", Description: "Show all timeouts for this user", Icon: "📜", Enabled: true}},
		menuItem{MenuOption{Key: "revoke_timeout", Label: "Revoke Active Timeout", Description: "Revoke an active timeout", Icon: "🔓", Enabled: true}},
	}
		
		// Update navigation state
		m.state.Navigation.CurrentMenu = MenuTimeouts
		m.updateBreadcrumbs()
	
		return menuLoadedMsg{items: items}
	}
}

func (m Model) showSubscriptions() tea.Cmd {
	return func() tea.Msg {
	// Create menu for subscription actions
	items := []list.Item{
		menuItem{MenuOption{Key: "assign_subscription", Label: "Assign Subscription", Description: "Assign a new subscription plan", Icon: "💳", Enabled: true}},
		menuItem{MenuOption{Key: "modify_subscription", Label: "Modify Subscription", Description: "Modify existing subscription", Icon: "✏️", Enabled: true}},
		menuItem{MenuOption{Key: "view_subscriptions", Label: "View Subscriptions", Description: "Show all subscriptions for this user", Icon: "📊", Enabled: true}},
		menuItem{MenuOption{Key: "cancel_subscription", Label: "Cancel Subscription", Description: "Cancel active subscription", Icon: "❌", Enabled: true}},
	}
		
		// Update navigation state
		m.state.Navigation.CurrentMenu = MenuSubscriptions
		m.updateBreadcrumbs()
	
		return menuLoadedMsg{items: items}
	}
}

func (m Model) showCustomEmojis() tea.Cmd {
	return func() tea.Msg {
	// Create menu for emoji actions
	items := []list.Item{
		menuItem{MenuOption{Key: "view_emojis", Label: "View Custom Emojis", Description: "Show all custom emojis for this user", Icon: "😀", Enabled: true}},
		menuItem{MenuOption{Key: "approve_emoji", Label: "Approve Emoji", Description: "Approve a pending custom emoji", Icon: "✅", Enabled: true}},
		menuItem{MenuOption{Key: "reject_emoji", Label: "Reject Emoji", Description: "Reject a pending custom emoji", Icon: "❌", Enabled: true}},
		menuItem{MenuOption{Key: "toggle_global", Label: "Toggle Global Availability", Description: "Make emoji globally available", Icon: "🌍", Enabled: true}},
	}
		
		// Update navigation state
		m.state.Navigation.CurrentMenu = MenuCustomEmojis
		m.updateBreadcrumbs()
	
		return menuLoadedMsg{items: items}
	}
}

func (m Model) showQuotaManagement() tea.Cmd {
	return func() tea.Msg {
	// Create menu for quota actions
	items := []list.Item{
		menuItem{MenuOption{Key: "view_quotas", Label: "View Current Quotas", Description: "Show all quotas for this user", Icon: "📊", Enabled: true}},
		menuItem{MenuOption{Key: "update_quota", Label: "Update Quota Limit", Description: "Change quota limits", Icon: "⚙️", Enabled: true}},
		menuItem{MenuOption{Key: "reset_usage", Label: "Reset Quota Usage", Description: "Reset current usage to zero", Icon: "🔄", Enabled: true}},
		menuItem{MenuOption{Key: "set_unlimited", Label: "Set Unlimited", Description: "Remove quota limits", Icon: "♾️", Enabled: true}},
	}
		
		// Update navigation state
		m.state.Navigation.CurrentMenu = MenuQuotaManagement
		m.updateBreadcrumbs()
	
		return menuLoadedMsg{items: items}
	}
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
			"section": "👤 Basic Info",
			"field":   "ID",
			"value":   fmt.Sprintf("%d", user.ID),
		})
		tableData = append(tableData, TableRow{
			"section": "👤 Basic Info",
			"field":   "Name",
			"value":   getCurrentValue(user.Name),
		})
		tableData = append(tableData, TableRow{
			"section": "👤 Basic Info",
			"field":   "Email",
			"value":   getCurrentValue(user.Email),
		})
		tableData = append(tableData, TableRow{
			"section": "👤 Basic Info",
			"field":   "Bio",
			"value":   getCurrentValue(user.Bio),
		})
		tableData = append(tableData, TableRow{
			"section": "👤 Basic Info",
			"field":   "Location",
			"value":   getCurrentValue(user.Location),
		})
		tableData = append(tableData, TableRow{
			"section": "👤 Basic Info",
			"field":   "Profile Public",
			"value":   getProfileVisibility(user.ProfilePublic),
		})
		tableData = append(tableData, TableRow{
			"section": "👤 Basic Info",
			"field":   "Created",
			"value":   user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
		
		// Account connections
		if len(accounts) > 0 {
			for _, account := range accounts {
				tableData = append(tableData, TableRow{
					"section": "🔗 Accounts",
					"field":   fmt.Sprintf("%s Provider", account.Provider),
					"value":   account.ProviderAccountID,
				})
				if account.Type != "" {
					tableData = append(tableData, TableRow{
						"section": "🔗 Accounts",
						"field":   fmt.Sprintf("%s Type", account.Provider),
						"value":   account.Type,
					})
				}
			}
		} else {
			tableData = append(tableData, TableRow{
				"section": "🔗 Accounts",
				"field":   "Status",
				"value":   "No connected accounts",
			})
		}
		
		// Active sessions
		if len(sessions) > 0 {
			tableData = append(tableData, TableRow{
				"section": "🔓 Sessions",
				"field":   "Active Sessions",
				"value":   fmt.Sprintf("%d", len(sessions)),
			})
			for i, session := range sessions {
				tableData = append(tableData, TableRow{
					"section": "🔓 Sessions",
					"field":   fmt.Sprintf("Session %d Expires", i+1),
					"value":   session.Expires.Format("2006-01-02 15:04:05"),
				})
			}
		} else {
			tableData = append(tableData, TableRow{
				"section": "🔓 Sessions",
				"field":   "Status",
				"value":   "No active sessions",
			})
		}
		
		// Activity stats
		if stats != nil {
			tableData = append(tableData, TableRow{
				"section": "📊 Activity",
				"field":   "Total Submissions",
				"value":   fmt.Sprintf("%d", stats.TotalSubmissions),
			})
			tableData = append(tableData, TableRow{
				"section": "📊 Activity",
				"field":   "Total Posts",
				"value":   fmt.Sprintf("%d", stats.TotalPosts),
			})
			tableData = append(tableData, TableRow{
				"section": "📊 Activity",
				"field":   "Total Comments",
				"value":   fmt.Sprintf("%d", stats.TotalComments),
			})
			tableData = append(tableData, TableRow{
				"section": "📊 Activity",
				"field":   "Latest Submission",
				"value":   formatTimePtr(stats.LatestSubmissionDate),
			})
		} else {
			tableData = append(tableData, TableRow{
				"section": "📊 Activity",
				"field":   "Status",
				"value":   "No activity data available",
			})
		}
		
		// Roles
		if len(roles) > 0 {
		for _, role := range roles {
				tableData = append(tableData, TableRow{
					"section": "🔐 Roles",
					"field":   role.RoleName,
					"value":   fmt.Sprintf("Active: %s, Assigned: %s", formatBoolPtr(&role.IsActive), formatTimePtr(&role.AssignedAt)),
				})
			}
		} else {
			tableData = append(tableData, TableRow{
				"section": "🔐 Roles",
				"field":   "Status",
				"value":   "No roles assigned",
			})
		}
		
		// Permissions  
		if len(permissions) > 0 {
			for _, perm := range permissions {
				status := "Denied"
				if perm.Granted {
					status = "Granted"
				}
				tableData = append(tableData, TableRow{
					"section": "⚡ Permissions",
					"field":   perm.PermissionName,
					"value":   fmt.Sprintf("%s (%s)", status, perm.PermissionCategory),
				})
			}
		} else {
			tableData = append(tableData, TableRow{
				"section": "⚡ Permissions",
				"field":   "Status",
				"value":   "No explicit permissions set",
			})
		}
		
		// Timeouts
		if len(timeouts) > 0 {
		for _, timeout := range timeouts {
				status := "Expired"
				if timeout.IsActive {
					status = "Active"
				}
				tableData = append(tableData, TableRow{
					"section": "⏰ Timeouts",
					"field":   timeout.TimeoutType,
					"value":   fmt.Sprintf("%s - %s (Expires: %s)", status, timeout.Reason, formatTimePtr(&timeout.ExpiresAt)),
				})
			}
		} else {
			tableData = append(tableData, TableRow{
				"section": "⏰ Timeouts",
				"field":   "Status",
				"value":   "No timeouts",
				})
		}
		
		// Subscriptions
		if len(subscriptions) > 0 {
		for _, sub := range subscriptions {
				tableData = append(tableData, TableRow{
					"section": "💳 Subscriptions",
					"field":   sub.PlanName,
					"value":   fmt.Sprintf("Status: %s", sub.Status),
				})
			}
		} else {
			tableData = append(tableData, TableRow{
				"section": "💳 Subscriptions",
				"field":   "Status",
				"value":   "No subscriptions",
			})
		}
		
		// Custom emojis
		if len(emojis) > 0 {
			approved := 0
			pending := 0
			rejected := 0
			for _, emoji := range emojis {
				switch emoji.ApprovalStatus {
				case "approved":
					approved++
				case "pending":
					pending++
				case "rejected":
					rejected++
				}
			}
			tableData = append(tableData, TableRow{
				"section": "😀 Custom Emojis",
				"field":   "Total",
				"value":   fmt.Sprintf("%d", len(emojis)),
				})
			tableData = append(tableData, TableRow{
				"section": "😀 Custom Emojis",
				"field":   "Approved",
				"value":   fmt.Sprintf("%d", approved),
			})
			tableData = append(tableData, TableRow{
				"section": "😀 Custom Emojis",
				"field":   "Pending",
				"value":   fmt.Sprintf("%d", pending),
			})
			tableData = append(tableData, TableRow{
				"section": "😀 Custom Emojis",
				"field":   "Rejected",
				"value":   fmt.Sprintf("%d", rejected),
			})
		} else {
			tableData = append(tableData, TableRow{
				"section": "😀 Custom Emojis",
				"field":   "Status",
				"value":   "No custom emojis",
			})
		}
		
		// Set table data and display
		columns := []TableColumn{
			{Key: "section", Label: "Section", Width: 20, Align: "left"},
			{Key: "field", Label: "Field", Width: 25, Align: "left"},
			{Key: "value", Label: "Value", Width: 60, Align: "left"},
		}
		
		return tableLoadedMsg{data: tableData, columns: columns}
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

// showUserRoles displays the user's current role assignments
func (m Model) showUserRoles() tea.Cmd {
	if m.state.Navigation.UserID == nil {
		return func() tea.Msg {
			return errorMsg{fmt.Errorf("no user selected")}
		}
	}
	
	userID := *m.state.Navigation.UserID
	
	return func() tea.Msg {
		roles, err := m.db.GetUserRoles(userID)
		if err != nil {
			return errorMsg{err}
		}
		
		var tableData []TableRow
		if len(roles) == 0 {
			tableData = append(tableData, TableRow{
				"status": "No roles assigned to this user",
				"info":   "User has no explicit role assignments",
			})
			
					columns := []TableColumn{
			{Key: "status", Label: "Status", Width: 50, Align: "left"},
			{Key: "info", Label: "Information", Width: 50, Align: "left"},
		}
		return tableLoadedMsg{data: tableData, columns: columns}
	} else {
		for _, role := range roles {
			status := "Inactive"
			if role.IsActive {
				status = "Active"
			}
			
			assignedBy := "System"
			if role.AssignedByName != nil {
				assignedBy = *role.AssignedByName
			}
			
			tableData = append(tableData, TableRow{
				"role_name":     role.RoleName,
				"display_name":  role.RoleDisplayName,
				"status":        status,
				"assigned_by":   assignedBy,
				"assigned_at":   role.AssignedAt.Format("2006-01-02 15:04"),
				"expires_at":    formatTimePtr(role.ExpiresAt),
				"reason":        getCurrentValue(role.Reason),
			})
		}
		
		columns := []TableColumn{
			{Key: "role_name", Label: "Role", Width: 20, Align: "left"},
			{Key: "display_name", Label: "Display Name", Width: 25, Align: "left"},
			{Key: "status", Label: "Status", Width: 10, Align: "center"},
			{Key: "assigned_by", Label: "Assigned By", Width: 20, Align: "left"},
			{Key: "assigned_at", Label: "Assigned", Width: 15, Align: "center"},
			{Key: "expires_at", Label: "Expires", Width: 15, Align: "center"},
			{Key: "reason", Label: "Reason", Width: 25, Align: "left"},
		}
		return tableLoadedMsg{data: tableData, columns: columns}
	}
	}
}

// showUserPermissions displays the user's current permissions
func (m Model) showUserPermissions() tea.Cmd {
	if m.state.Navigation.UserID == nil {
		return func() tea.Msg {
			return errorMsg{fmt.Errorf("no user selected")}
		}
	}
	
	userID := *m.state.Navigation.UserID
	
	return func() tea.Msg {
		permissions, err := m.db.GetUserPermissions(userID)
		if err != nil {
			return errorMsg{err}
		}
		
		var tableData []TableRow
		if len(permissions) == 0 {
			tableData = append(tableData, TableRow{
				"status": "No explicit permissions set",
				"info":   "User permissions are inherited from roles",
			})
			
					columns := []TableColumn{
			{Key: "status", Label: "Status", Width: 50, Align: "left"},
			{Key: "info", Label: "Information", Width: 50, Align: "left"},
		}
		return tableLoadedMsg{data: tableData, columns: columns}
	} else {
		for _, perm := range permissions {
			status := "Denied"
			if perm.Granted {
				status = "Granted"
			}
			
			grantedBy := "System"
			if perm.GrantedByName != nil {
				grantedBy = *perm.GrantedByName
			}
			
			tableData = append(tableData, TableRow{
				"permission_name": perm.PermissionName,
				"display_name":    perm.PermissionDisplayName,
				"category":        perm.PermissionCategory,
				"status":          status,
				"granted_by":      grantedBy,
				"granted_at":      perm.GrantedAt.Format("2006-01-02 15:04"),
				"expires_at":      formatTimePtr(perm.ExpiresAt),
				"reason":          getCurrentValue(perm.Reason),
			})
		}
		
		columns := []TableColumn{
			{Key: "permission_name", Label: "Permission", Width: 25, Align: "left"},
			{Key: "display_name", Label: "Display Name", Width: 25, Align: "left"},
			{Key: "category", Label: "Category", Width: 15, Align: "left"},
			{Key: "status", Label: "Status", Width: 10, Align: "center"},
			{Key: "granted_by", Label: "Granted By", Width: 20, Align: "left"},
			{Key: "granted_at", Label: "Granted", Width: 15, Align: "center"},
			{Key: "expires_at", Label: "Expires", Width: 15, Align: "center"},
			{Key: "reason", Label: "Reason", Width: 25, Align: "left"},
		}
		return tableLoadedMsg{data: tableData, columns: columns}
	}
	}
}

// showUserTimeouts displays the user's timeout history
func (m Model) showUserTimeouts() tea.Cmd {
	if m.state.Navigation.UserID == nil {
		return func() tea.Msg {
			return errorMsg{fmt.Errorf("no user selected")}
		}
	}
	
	userID := *m.state.Navigation.UserID
	
	return func() tea.Msg {
		timeouts, err := m.db.GetUserTimeouts(userID)
		if err != nil {
			return errorMsg{err}
		}
		
		var tableData []TableRow
		if len(timeouts) == 0 {
			tableData = append(tableData, TableRow{
				"status": "No timeouts issued",
				"info":   "This user has never been timed out",
			})
			
					columns := []TableColumn{
			{Key: "status", Label: "Status", Width: 50, Align: "left"},
			{Key: "info", Label: "Information", Width: 50, Align: "left"},
		}
		return tableLoadedMsg{data: tableData, columns: columns}
	} else {
		for _, timeout := range timeouts {
			status := "Expired"
			if timeout.IsActive {
				status = "Active"
			}
			
			revokedInfo := "Not revoked"
			if timeout.RevokedByName != nil {
				revokedInfo = fmt.Sprintf("Revoked by %s", *timeout.RevokedByName)
			}
			
			tableData = append(tableData, TableRow{
				"timeout_type": timeout.TimeoutType,
				"reason":       timeout.Reason,
				"status":       status,
				"issued_by":    timeout.IssuedByName,
				"issued_at":    timeout.IssuedAt.Format("2006-01-02 15:04"),
				"expires_at":   timeout.ExpiresAt.Format("2006-01-02 15:04"),
				"revoked_info": revokedInfo,
			})
		}
		
		columns := []TableColumn{
			{Key: "timeout_type", Label: "Type", Width: 20, Align: "left"},
			{Key: "reason", Label: "Reason", Width: 30, Align: "left"},
			{Key: "status", Label: "Status", Width: 10, Align: "center"},
			{Key: "issued_by", Label: "Issued By", Width: 20, Align: "left"},
			{Key: "issued_at", Label: "Issued", Width: 15, Align: "center"},
			{Key: "expires_at", Label: "Expires", Width: 15, Align: "center"},
			{Key: "revoked_info", Label: "Revoked", Width: 20, Align: "left"},
		}
		return tableLoadedMsg{data: tableData, columns: columns}
	}
	}
}