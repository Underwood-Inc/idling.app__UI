package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/joho/godotenv"
)

// Styles for the UI
var (
	titleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#7C3AED")).
		MarginLeft(2).
		MarginBottom(1)

	subtitleStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#6B7280")).
		MarginLeft(2).
		MarginBottom(1)

	menuStyle = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("#7C3AED")).
		Padding(1, 2).
		Margin(1, 2)

	selectedItemStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#7C3AED")).
		Background(lipgloss.Color("#F3F4F6")).
		Padding(0, 1)

	itemStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#374151")).
		Padding(0, 1)

	errorStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#DC2626")).
		MarginLeft(2).
		MarginBottom(1)

	successStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#059669")).
		MarginLeft(2).
		MarginBottom(1)

	infoStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#2563EB")).
		MarginLeft(2).
		MarginBottom(1)

	breadcrumbStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#6B7280")).
		MarginLeft(2).
		MarginBottom(1)

	helpStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#9CA3AF")).
		MarginTop(1).
		MarginLeft(2)

	tableStyle = lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("#D1D5DB")).
		Margin(1, 2)

	tableHeaderStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#374151")).
		Background(lipgloss.Color("#F9FAFB")).
		Padding(0, 1)

	tableCellStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#6B7280")).
		Padding(0, 1)
)

// Key bindings
type keyMap struct {
	Up       key.Binding
	Down     key.Binding
	Left     key.Binding
	Right    key.Binding
	Enter    key.Binding
	Back     key.Binding
	Quit     key.Binding
	Help     key.Binding
	Refresh  key.Binding
}

func (k keyMap) ShortHelp() []key.Binding {
	return []key.Binding{k.Enter, k.Back, k.Quit}
}

func (k keyMap) FullHelp() [][]key.Binding {
	return [][]key.Binding{
		{k.Up, k.Down, k.Left, k.Right},
		{k.Enter, k.Back, k.Refresh},
		{k.Help, k.Quit},
	}
}

var keys = keyMap{
	Up: key.NewBinding(
		key.WithKeys("up", "k"),
		key.WithHelp("↑/k", "move up"),
	),
	Down: key.NewBinding(
		key.WithKeys("down", "j"),
		key.WithHelp("↓/j", "move down"),
	),
	Left: key.NewBinding(
		key.WithKeys("left", "h"),
		key.WithHelp("←/h", "move left"),
	),
	Right: key.NewBinding(
		key.WithKeys("right", "l"),
		key.WithHelp("→/l", "move right"),
	),
	Enter: key.NewBinding(
		key.WithKeys("enter"),
		key.WithHelp("enter", "select"),
	),
	Back: key.NewBinding(
		key.WithKeys("esc", "b"),
		key.WithHelp("esc/b", "back"),
	),
	Quit: key.NewBinding(
		key.WithKeys("q", "ctrl+c"),
		key.WithHelp("q", "quit"),
	),
	Help: key.NewBinding(
		key.WithKeys("?"),
		key.WithHelp("?", "toggle help"),
	),
	Refresh: key.NewBinding(
		key.WithKeys("r"),
		key.WithHelp("r", "refresh"),
	),
}

// Model represents the main application model
type Model struct {
	db           *Database
	state        AppState
	menuList     list.Model
	textInput    textinput.Model
	cursor       int
	width        int
	height       int
	showHelp     bool
	menuItems    []MenuOption
	searchResults []UserSearchResult
}

// Messages
type userSelectedMsg struct {
	user *User
}

type errorMsg struct {
	err error
}

type loadedUserDataMsg struct {
	user        *User
	accounts    []Account
	sessions    []Session
	stats       *ActivityStats
	roles       []UserRoleAssignment
	permissions []UserPermission
	timeouts    []UserTimeout
	subscriptions []UserSubscription
	emojis      []CustomEmoji
}

type searchResultsMsg struct {
	results []UserSearchResult
}

// Initialize the model
func initialModel() Model {
	// Create text input for search
	ti := textinput.New()
	ti.Placeholder = "Enter user ID or search by name..."
	ti.Focus()
	ti.CharLimit = 100
	ti.Width = 50

	// Create list for menu items
	items := []list.Item{}
	l := list.New(items, menuItemDelegate{}, 0, 0)
	l.Title = "User Management Options"
	l.SetShowStatusBar(false)
	l.SetFilteringEnabled(false)
	l.Styles.Title = titleStyle
	
	return Model{
		state: AppState{
			Navigation: NavigationState{
				CurrentMenu: MenuMain,
				Breadcrumbs: []string{"Main Menu"},
			},
			FormData: make(map[string]string),
		},
		textInput: ti,
		menuList:  l,
		showHelp:  false,
	}
}

// Initialize the application
func (m Model) Init() tea.Cmd {
	return tea.Batch(
		textinput.Blink,
		m.loadMainMenu(),
	)
}

// Update handles messages
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.menuList.SetWidth(msg.Width - 4)
		m.menuList.SetHeight(msg.Height - 10)

	case tea.KeyMsg:
		switch {
		case key.Matches(msg, keys.Quit):
			return m, tea.Quit

		case key.Matches(msg, keys.Help):
			m.showHelp = !m.showHelp

		case key.Matches(msg, keys.Back):
			return m, m.navigateBack()

		case key.Matches(msg, keys.Refresh):
			return m, m.refreshCurrentView()

		case key.Matches(msg, keys.Enter):
			return m, m.handleEnter()
		}

		// Handle input based on current view
		switch m.state.Navigation.CurrentMenu {
		case MenuUserLookup:
			if key.Matches(msg, keys.Enter) {
				input := strings.TrimSpace(m.textInput.Value())
				if input != "" {
					return m, m.handleUserLookup(input)
				}
			}
			m.textInput, cmd = m.textInput.Update(msg)
			cmds = append(cmds, cmd)

		default:
			m.menuList, cmd = m.menuList.Update(msg)
			cmds = append(cmds, cmd)
		}

	case userSelectedMsg:
		m.state.Navigation.User = msg.user
		m.state.Navigation.UserID = &msg.user.ID
		m.state.Navigation.CurrentMenu = MenuUserProfile
		m.updateBreadcrumbs()
		return m, m.loadUserData(msg.user.ID)

	case loadedUserDataMsg:
		// Store user data and show profile menu
		return m, m.loadUserProfileMenu()

	case searchResultsMsg:
		m.searchResults = msg.results
		if len(msg.results) == 1 {
			// Auto-select if only one result
			user, err := m.db.GetUserByID(msg.results[0].ID)
			if err != nil {
				m.state.Error = err.Error()
				return m, nil
			}
			return m, tea.Sequence(
				func() tea.Msg { return userSelectedMsg{user: user} },
			)
		}
		// Show search results for selection
		return m, m.loadSearchResultsMenu()

	case errorMsg:
		m.state.Error = msg.err.Error()
		m.state.Loading = false

	default:
		m.menuList, cmd = m.menuList.Update(msg)
		cmds = append(cmds, cmd)
	}

	return m, tea.Batch(cmds...)
}

// View renders the UI
func (m Model) View() string {
	var content strings.Builder

	// Header
	content.WriteString(titleStyle.Render("🧙‍♂️ User Management Tool"))
	content.WriteString("\n")
	content.WriteString(subtitleStyle.Render("Modern TUI for comprehensive user administration"))
	content.WriteString("\n")

	// Breadcrumbs
	if len(m.state.Navigation.Breadcrumbs) > 0 {
		breadcrumbs := strings.Join(m.state.Navigation.Breadcrumbs, " > ")
		content.WriteString(breadcrumbStyle.Render("📍 " + breadcrumbs))
		content.WriteString("\n")
	}

	// User info if selected
	if m.state.Navigation.User != nil {
		user := m.state.Navigation.User
		userName := "No name"
		if user.Name != nil {
			userName = *user.Name
		}
		userEmail := "No email"
		if user.Email != nil {
			userEmail = *user.Email
		}
		content.WriteString(infoStyle.Render(fmt.Sprintf("👤 Selected User: %s (%s) - ID: %d", userName, userEmail, user.ID)))
		content.WriteString("\n")
	}

	// Error display
	if m.state.Error != "" {
		content.WriteString(errorStyle.Render("❌ Error: " + m.state.Error))
		content.WriteString("\n")
	}

	// Success message display
	if m.state.Message != "" {
		content.WriteString(successStyle.Render("✅ " + m.state.Message))
		content.WriteString("\n")
	}

	// Loading indicator
	if m.state.Loading {
		content.WriteString(infoStyle.Render("⏳ Loading..."))
		content.WriteString("\n")
	}

	// Main content based on current view
	switch m.state.Navigation.CurrentMenu {
	case MenuUserLookup:
		content.WriteString(m.renderUserLookup())
	case MenuUserProfile:
		content.WriteString(m.renderUserProfile())
	case MenuTable:
		content.WriteString(m.renderTable())
	case MenuForm:
		content.WriteString(m.renderForm())
	default:
		content.WriteString(m.renderMenu())
	}

	// Help
	if m.showHelp {
		content.WriteString("\n")
		content.WriteString(helpStyle.Render("Help: ↑/↓ navigate • enter select • esc back • q quit • ? toggle help"))
	} else {
		content.WriteString("\n")
		content.WriteString(helpStyle.Render("Press ? for help"))
	}

	return content.String()
}

// Menu item for the list
type menuItem struct {
	option MenuOption
}

func (i menuItem) FilterValue() string { return i.option.Label }
func (i menuItem) Title() string       { return i.option.Icon + " " + i.option.Label }
func (i menuItem) Description() string { return i.option.Description }

// Menu item delegate
type menuItemDelegate struct{}

func (d menuItemDelegate) Height() int                               { return 2 }
func (d menuItemDelegate) Spacing() int                              { return 1 }
func (d menuItemDelegate) Update(msg tea.Msg, m *list.Model) tea.Cmd { return nil }
func (d menuItemDelegate) Render(w *list.Model, index int, listItem list.Item) string {
	i, ok := listItem.(menuItem)
	if !ok {
		return ""
	}

	str := fmt.Sprintf("%s %s", i.option.Icon, i.option.Label)
	desc := i.option.Description

	if index == w.Index() {
		return selectedItemStyle.Render(str) + "\n" + 
			lipgloss.NewStyle().Foreground(lipgloss.Color("#9CA3AF")).MarginLeft(2).Render(desc)
	}
	return itemStyle.Render(str) + "\n" + 
		lipgloss.NewStyle().Foreground(lipgloss.Color("#D1D5DB")).MarginLeft(2).Render(desc)
}

// Navigation and menu functions
func (m Model) loadMainMenu() tea.Cmd {
	items := []list.Item{
		menuItem{MenuOption{Key: "lookup", Label: "User Lookup", Description: "Find user by ID or search by name", Icon: "🔍", Enabled: true}},
		menuItem{MenuOption{Key: "reference", Label: "Reference Data", Description: "View roles, permissions, and plans", Icon: "📖", Enabled: true}},
		menuItem{MenuOption{Key: "quit", Label: "Quit", Description: "Exit the application", Icon: "🚪", Enabled: true}},
	}
	m.menuList.SetItems(items)
	return nil
}

func (m Model) loadUserProfileMenu() tea.Cmd {
	items := []list.Item{
		menuItem{MenuOption{Key: "basic_profile", Label: "Basic Profile", Description: "Update name, email, bio, location, visibility", Icon: "👤", Enabled: true}},
		menuItem{MenuOption{Key: "roles_permissions", Label: "Roles & Permissions", Description: "Assign/remove roles, manage permissions", Icon: "🔐", Enabled: true}},
		menuItem{MenuOption{Key: "timeouts", Label: "User Timeouts", Description: "Issue timeout, view timeout history", Icon: "⏰", Enabled: true}},
		menuItem{MenuOption{Key: "subscriptions", Label: "Subscriptions", Description: "Manage user subscriptions and plans", Icon: "💳", Enabled: true}},
		menuItem{MenuOption{Key: "custom_emojis", Label: "Custom Emojis", Description: "Approve/reject custom emojis", Icon: "😀", Enabled: true}},
		menuItem{MenuOption{Key: "quota_management", Label: "Quota Management", Description: "Manage user quotas", Icon: "📊", Enabled: true}},
		menuItem{MenuOption{Key: "view_details", Label: "View Full Details", Description: "Show comprehensive user information", Icon: "📋", Enabled: true}},
	}
	m.menuList.SetItems(items)
	return nil
}

func (m Model) loadSearchResultsMenu() tea.Cmd {
	var items []list.Item
	for _, result := range m.searchResults {
		name := "No name"
		if result.Name != nil {
			name = *result.Name
		}
		email := "No email"
		if result.Email != nil {
			email = *result.Email
		}
		
		items = append(items, menuItem{MenuOption{
			Key:         fmt.Sprintf("user_%d", result.ID),
			Label:       fmt.Sprintf("%s (%s)", name, email),
			Description: fmt.Sprintf("ID: %d - Created: %s", result.ID, result.CreatedAt.Format("2006-01-02")),
			Icon:        "👤",
			Enabled:     true,
		}})
	}
	m.menuList.SetItems(items)
	return nil
}

func (m Model) handleEnter() tea.Cmd {
	switch m.state.Navigation.CurrentMenu {
	case MenuMain:
		selected := m.menuList.SelectedItem()
		if item, ok := selected.(menuItem); ok {
			switch item.option.Key {
			case "lookup":
				m.state.Navigation.CurrentMenu = MenuUserLookup
				m.updateBreadcrumbs()
				m.textInput.SetValue("")
				m.textInput.Focus()
				return textinput.Blink
			case "reference":
				return m.showReferenceData()
			case "quit":
				return tea.Quit
			}
		}

	case MenuUserProfile:
		selected := m.menuList.SelectedItem()
		if item, ok := selected.(menuItem); ok {
			switch item.option.Key {
			case "basic_profile":
				return m.showBasicProfileForm()
			case "roles_permissions":
				return m.showRolesPermissions()
			case "timeouts":
				return m.showTimeouts()
			case "subscriptions":
				return m.showSubscriptions()
			case "custom_emojis":
				return m.showCustomEmojis()
			case "quota_management":
				return m.showQuotaManagement()
			case "view_details":
				return m.showUserDetails()
			}
		}

	case MenuTable:
		// Handle table selection if needed
		return nil

	default:
		// Handle other menu selections
		selected := m.menuList.SelectedItem()
		if item, ok := selected.(menuItem); ok {
			if strings.HasPrefix(item.option.Key, "user_") {
				// Extract user ID and load user
				idStr := strings.TrimPrefix(item.option.Key, "user_")
				if userID, err := strconv.Atoi(idStr); err == nil {
					return m.loadUser(userID)
				}
			}
		}
	}

	return nil
}

func (m Model) handleUserLookup(input string) tea.Cmd {
	m.state.Loading = true
	m.state.Error = ""

	// Try to parse as user ID first
	if userID, err := strconv.Atoi(input); err == nil {
		return m.loadUser(userID)
	}

	// Search by name/email
	return m.searchUsers(input)
}

func (m Model) loadUser(userID int) tea.Cmd {
	return func() tea.Msg {
		user, err := m.db.GetUserByID(userID)
		if err != nil {
			return errorMsg{err}
		}
		return userSelectedMsg{user: user}
	}
}

func (m Model) searchUsers(query string) tea.Cmd {
	return func() tea.Msg {
		results, err := m.db.SearchUsersByName(query)
		if err != nil {
			return errorMsg{err}
		}
		if len(results) == 0 {
			return errorMsg{fmt.Errorf("no users found matching '%s'", query)}
		}
		return searchResultsMsg{results: results}
	}
}

func (m Model) loadUserData(userID int) tea.Cmd {
	return func() tea.Msg {
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

		return loadedUserDataMsg{
			user:          user,
			accounts:      accounts,
			sessions:      sessions,
			stats:         stats,
			roles:         roles,
			permissions:   permissions,
			timeouts:      timeouts,
			subscriptions: subscriptions,
			emojis:        emojis,
		}
	}
}

func (m Model) navigateBack() tea.Cmd {
	if len(m.state.Navigation.Breadcrumbs) > 1 {
		// Remove last breadcrumb
		m.state.Navigation.Breadcrumbs = m.state.Navigation.Breadcrumbs[:len(m.state.Navigation.Breadcrumbs)-1]
		
		// Determine previous menu
		switch len(m.state.Navigation.Breadcrumbs) {
		case 1: // Back to main menu
			m.state.Navigation.CurrentMenu = MenuMain
			m.state.Navigation.User = nil
			m.state.Navigation.UserID = nil
			return m.loadMainMenu()
		case 2: // Back to user profile
			if m.state.Navigation.User != nil {
				m.state.Navigation.CurrentMenu = MenuUserProfile
				return m.loadUserProfileMenu()
			}
		}
	}
	
	// Clear any errors or messages
	m.state.Error = ""
	m.state.Message = ""
	
	return nil
}

func (m Model) refreshCurrentView() tea.Cmd {
	switch m.state.Navigation.CurrentMenu {
	case MenuMain:
		return m.loadMainMenu()
	case MenuUserProfile:
		if m.state.Navigation.UserID != nil {
			return m.loadUserData(*m.state.Navigation.UserID)
		}
	}
	return nil
}

func (m *Model) updateBreadcrumbs() {
	switch m.state.Navigation.CurrentMenu {
	case MenuMain:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu"}
	case MenuUserLookup:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Lookup"}
	case MenuUserProfile:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Profile"}
	case MenuBasicProfile:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Profile", "Basic Profile"}
	case MenuRolesPermissions:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Profile", "Roles & Permissions"}
	case MenuTimeouts:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Profile", "Timeouts"}
	case MenuSubscriptions:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Profile", "Subscriptions"}
	case MenuCustomEmojis:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Profile", "Custom Emojis"}
	case MenuQuotaManagement:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "User Profile", "Quota Management"}
	case MenuReferenceData:
		m.state.Navigation.Breadcrumbs = []string{"Main Menu", "Reference Data"}
	}
}

// Main function
func main() {
	// Load environment variables
	if err := godotenv.Load(".env.local"); err != nil {
		log.Printf("Warning: Could not load .env.local file: %v", err)
	}

	// Connect to database
	db, err := NewDatabase()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create model
	m := initialModel()
	m.db = db

	// Handle command line arguments
	if len(os.Args) > 1 {
		arg := os.Args[1]
		// Auto-lookup user if provided
		if userID, err := strconv.Atoi(arg); err == nil {
			// Load user by ID
			user, err := db.GetUserByID(userID)
			if err != nil {
				log.Fatalf("Failed to load user %d: %v", userID, err)
			}
			m.state.Navigation.User = user
			m.state.Navigation.UserID = &user.ID
			m.state.Navigation.CurrentMenu = MenuUserProfile
			m.updateBreadcrumbs()
		} else {
			// Search by name
			results, err := db.SearchUsersByName(arg)
			if err != nil {
				log.Fatalf("Failed to search for user '%s': %v", arg, err)
			}
			if len(results) == 1 {
				user, err := db.GetUserByID(results[0].ID)
				if err != nil {
					log.Fatalf("Failed to load user: %v", err)
				}
				m.state.Navigation.User = user
				m.state.Navigation.UserID = &user.ID
				m.state.Navigation.CurrentMenu = MenuUserProfile
				m.updateBreadcrumbs()
			} else {
				m.searchResults = results
				m.state.Navigation.CurrentMenu = MenuUserLookup
				m.updateBreadcrumbs()
			}
		}
	}

	// Start the program
	p := tea.NewProgram(m, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		log.Fatalf("Error running program: %v", err)
	}
} 