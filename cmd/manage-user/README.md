---
title: 'README'
description: 'Documentation for README'
---

# 🧙‍♂️ Modern User Management Tool

A beautiful, modern Terminal User Interface (TUI) for comprehensive user administration, built with [Bubble Tea](https://github.com/charmbracelet/bubbletea).

## ✨ Features

### 🚀 **Modern TUI Experience**

- **Beautiful Interface**: Clean, colorful design with proper styling
- **Intuitive Navigation**: Breadcrumb navigation with easy back functionality
- **Responsive Design**: Adapts to terminal size
- **Keyboard Shortcuts**: Vim-style navigation (hjkl) plus arrow keys

### 👤 **User Management**

- **Smart User Lookup**: Search by ID or name with auto-completion
- **Profile Management**: Update name, email, bio, location, visibility
- **Role & Permission Management**: Assign/remove roles, manage permissions
- **Timeout Management**: Issue, view, and revoke user timeouts
- **Subscription Management**: Handle user subscriptions and plans
- **Custom Emoji Management**: Approve/reject custom emojis
- **Quota Management**: Manage user quotas and limits

### 📊 **Data Visualization**

- **Comprehensive Tables**: Beautiful table rendering for data display
- **User Details View**: Complete user information overview
- **Activity Statistics**: User engagement metrics
- **Reference Data**: Browse available roles, permissions, and plans

### 🔧 **Advanced Features**

- **Command Line Arguments**: Direct user lookup via CLI
- **Error Handling**: Graceful error messages and recovery
- **Loading States**: Visual feedback for database operations
- **Help System**: Built-in help with keyboard shortcuts

## 🛠️ Installation

### Prerequisites

- Go 1.21 or higher
- PostgreSQL database
- Environment variables configured

### Build Instructions

#### Docker Environment (Recommended)

If you're using the Docker development environment, Go is already installed:

```bash
# Navigate to the manage-user directory
cd cmd/manage-user

# Build the application (Go is pre-installed in Docker)
./build.sh

# If Go is not in PATH, source the environment:
source /etc/profile.d/go.sh
./build.sh

# Test the Docker Go setup:
../../scripts/test-docker-go.sh
```

#### Local Development

```bash
# Install Go if not already installed
# Ubuntu/Debian: sudo apt install golang-go
# macOS: brew install go
# Windows: choco install golang

# Navigate to the manage-user directory
cd cmd/manage-user

# Make the build script executable
chmod +x build.sh

# Build the application
./build.sh
```

#### Production Deployment

For production servers, use the automated installation script:

```bash
# Run the production installation script
sudo scripts/install-manage-user-prod.sh

# This will:
# - Install Go 1.21.5
# - Create service user 'idling'
# - Build and install the tool system-wide
# - Set up configuration templates
# - Create systemd service
# - Install wrapper scripts
```

### Manual Build

```bash
go mod tidy
go build -o manage-user-tui .
```

## ⚙️ Configuration

Create a `.env.local` file in your project root with database credentials:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
```

## 🚀 Usage

### Interactive Mode

```bash
./manage-user-tui
```

### Direct User Lookup

```bash
# Load user by ID
./manage-user-tui 123

# Search for user by name
./manage-user-tui "john doe"
```

## ⌨️ Keyboard Shortcuts

| Key        | Action               |
| ---------- | -------------------- |
| `↑/k`      | Move up              |
| `↓/j`      | Move down            |
| `←/h`      | Move left            |
| `→/l`      | Move right           |
| `Enter`    | Select/Confirm       |
| `Esc/b`    | Go back              |
| `q/Ctrl+C` | Quit                 |
| `?`        | Toggle help          |
| `r`        | Refresh current view |

## 🧭 Navigation Structure

```
Main Menu
├── 🔍 User Lookup
│   ├── Search by ID or name
│   └── Select from results
├── 📖 Reference Data
│   ├── Available roles
│   ├── Permissions
│   └── Subscription plans
└── 🚪 Quit

User Profile (after selection)
├── 👤 Basic Profile
│   ├── Update name
│   ├── Update email
│   ├── Update bio
│   ├── Update location
│   └── Toggle visibility
├── 🔐 Roles & Permissions
│   ├── Assign role
│   ├── Remove role
│   ├── View current roles
│   └── View permissions
├── ⏰ User Timeouts
│   ├── Issue timeout
│   ├── View timeout history
│   └── Revoke active timeout
├── 💳 Subscriptions
│   ├── Assign subscription
│   ├── Modify subscription
│   ├── View subscriptions
│   └── Cancel subscription
├── 😀 Custom Emojis
│   ├── View custom emojis
│   ├── Approve emoji
│   ├── Reject emoji
│   └── Toggle global availability
├── 📊 Quota Management
│   ├── View current quotas
│   ├── Update quota limit
│   ├── Reset quota usage
│   └── Set unlimited
└── 📋 View Full Details
    └── Comprehensive user overview
```

## 🎨 Features Comparison

| Feature             | Old Script            | New Bubble Tea TUI                            |
| ------------------- | --------------------- | --------------------------------------------- |
| **Interface**       | Plain text prompts    | Beautiful TUI with colors                     |
| **Navigation**      | Linear prompts        | Breadcrumb navigation with back functionality |
| **User Experience** | Text-based Q&A        | Interactive menus and forms                   |
| **Error Handling**  | Basic error messages  | Graceful error display with recovery          |
| **Data Display**    | Console.table output  | Styled tables with proper formatting          |
| **Search**          | Simple ID/name lookup | Smart search with result selection            |
| **Help**            | No built-in help      | Integrated help system                        |
| **Responsiveness**  | Fixed layout          | Adapts to terminal size                       |

## 🔄 Migration from Old Script

The new TUI application provides **full feature parity** with the original Node.js script while offering a significantly improved user experience:

### ✅ **All Original Features Included:**

- User lookup by ID or name
- Basic profile management
- Role and permission management
- User timeout management
- Subscription management
- Custom emoji management
- Quota management
- Reference data viewing

### 🆕 **New Enhancements:**

- **Back Navigation**: Always available with Esc key
- **Breadcrumb Navigation**: Know where you are at all times
- **Visual Feedback**: Loading states and success/error messages
- **Keyboard Shortcuts**: Efficient navigation
- **Responsive Design**: Works on any terminal size
- **Command Line Arguments**: Direct user access

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Verify `.env.local` file exists and has correct credentials
   - Ensure PostgreSQL is running
   - Check network connectivity

2. **Build Failures**

   - Ensure Go 1.21+ is installed
   - Run `go mod tidy` to resolve dependencies
   - Check for syntax errors in the code

3. **Permission Errors**
   - Make sure the database user has necessary permissions
   - Verify table schemas match the expected structure

### Debug Mode

Set environment variable for verbose logging:

```bash
DEBUG=1 ./manage-user-tui
```

## 🤝 Contributing

This application replaces the original Node.js script with a modern, user-friendly interface while maintaining all functionality. Future enhancements could include:

- Form-based editing with validation
- Bulk operations
- Export functionality
- Configuration management
- Plugin system

## 📝 License

Same license as the parent project.

---

🧙‍♂️ **Enjoy the magical user management experience!** ✨
