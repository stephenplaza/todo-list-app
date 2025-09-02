# VSCode Development Setup

This project is configured with a comprehensive VSCode development environment optimized for Vim users and JavaScript/ES6 development.

## Quick Start

1. **Open Workspace**: Open `todo-list-app.code-workspace` in VSCode
2. **Install Extensions**: VSCode will prompt to install recommended extensions
3. **Start Development**: Press `Ctrl+Shift+P` → "Tasks: Run Task" → "Full Development Start"

## Vim Configuration

### Key Mappings

**Leader Key**: `Space`

#### Normal Mode Commands
- `<space>w` - Save file
- `<space>q` - Close editor
- `<space>e` - Toggle sidebar
- `<space>f` - Quick open file
- `<space>p` - Command palette
- `<space>t` - Toggle terminal
- `<space>g` - Open Git panel
- `<space>r` - Reload window
- `<space>n` - New file
- `<space>s` - Go to symbol
- `gd` - Go to definition
- `gr` - Find references
- `<space>d` - Show hover info

#### Development Shortcuts
- `<space>ds` - Start development servers
- `<space>do` - Open in browser
- `<space>dk` - Kill all servers
- `<space>l` - Run ESLint
- `<space><space>` - Format with Prettier

#### Git Operations
- `<space>gs` - Stage changes
- `<space>gc` - Commit
- `<space>gp` - Push

#### Split Navigation
- `Ctrl+h` - Focus left split
- `Ctrl+j` - Focus below split
- `Ctrl+k` - Focus above split
- `Ctrl+l` - Focus right split

#### Insert Mode
- `jj` or `Ctrl+c` - Exit to normal mode

### Vim Settings
- Relative line numbers enabled
- System clipboard integration
- Easy motion for quick navigation
- Incremental search with highlighting

## Development Tasks

Access via `Ctrl+Shift+P` → "Tasks: Run Task":

### Server Management
- **Start Development Servers** - Starts both HTTP server (8080) and Claude proxy (3001)
- **Start HTTP Server** - Python HTTP server for the app
- **Start Claude Proxy** - Proxy server for Claude API
- **Kill All Servers** - Stop all running servers
- **Open in Browser** - Open localhost:8080

### Code Quality
- **Run ESLint** - Check code for linting issues
- **Format with Prettier** - Auto-format all code files
- **Setup Development Environment** - Install ESLint and Prettier

### Combined Actions
- **Full Development Start** - Start servers and open browser

## Debug Configurations

Access via `F5` or Debug panel:

### Web Debugging
- **Launch Chrome with Local Server** - Debug in Chrome with dev tools
- **Launch Firefox with Local Server** - Debug in Firefox
- **Attach to Chrome** - Attach to running Chrome instance

### Python Debugging
- **Debug Claude Proxy** - Debug the Python proxy server

### Compound Configurations
- **Launch Full Development Environment** - Start servers and launch browser debugging

## Recommended Extensions

### Essential
- **Vim** - Vim keybindings and modal editing
- **Live Server** - Live reload development server
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting

### JavaScript Development
- **TypeScript and JavaScript Language Features** - Enhanced JS support
- **Path Intellisense** - Autocomplete file paths
- **Auto Rename Tag** - Rename HTML tags automatically

### Development Utilities
- **Error Lens** - Inline error display
- **Todo Tree** - Track TODO comments
- **GitLens** - Enhanced Git integration
- **Indent Rainbow** - Color-coded indentation

### Python Support
- **Python** - For debugging the Claude proxy server

## Project Structure Integration

The VSCode setup is configured to work seamlessly with the modular architecture:

```
├── services/           # Business logic modules
├── components/         # UI components
├── app.js             # Main application entry point
├── .vscode/           # VSCode configuration
│   ├── settings.json   # Project settings
│   ├── tasks.json      # Development tasks
│   ├── launch.json     # Debug configurations
│   └── keybindings.json # Custom key mappings
├── .eslintrc.json     # ESLint configuration
└── .prettierrc        # Prettier configuration
```

## Code Quality Configuration

### ESLint Rules
- ES2022 with modules support
- Browser environment globals
- 4-space indentation
- Single quotes preferred
- Semicolons required
- Modern JavaScript patterns enforced

### Prettier Formatting
- Single quotes
- 4-space tabs
- 100 character line width
- Trailing comma: none
- Arrow function parentheses: avoid when possible

## Terminal Integration

- **Toggle Terminal**: `<space>t`
- **Multiple Terminals**: Automatic task-specific terminals
- **Vim Navigation**: Escape key returns focus to editor

## Git Integration

- **GitLens**: Enhanced git blame, history, and diff views
- **Git Graph**: Visual git history
- **Stage/Commit/Push**: Via Vim keybindings or command palette

## File Management

### Auto-formatting
- Format on save enabled
- ESLint auto-fix on save
- Trailing whitespace removal

### File Exclusions
- `script.js.backup` excluded from search
- Standard exclusions: `node_modules`, `.git`, etc.
- Python cache files ignored

## Troubleshooting

### Vim Extension Issues
- If Vim keys aren't working, check that VSCodeVim is installed and enabled
- Leader key combinations require the Vim extension to be active

### Server Issues
- Use "Kill All Servers" task if ports are in use
- Check that Python 3 is available in PATH
- Ensure ports 8080 and 3001 are available

### Extension Conflicts
- Some extensions may conflict with Vim mode
- Check the settings.json for extension-specific configurations

## Tips for Vim Users

1. **Modal Editing**: Full Vim modal editing support with visual, insert, and command modes
2. **Splits**: Use Vim-style split navigation with Ctrl+hjkl
3. **Quick Actions**: Leader key combinations for common tasks
4. **Search**: Vim search with highlighting and incremental search
5. **Clipboard**: System clipboard integration enabled

## Customization

All configurations can be customized by editing the files in `.vscode/`:
- `settings.json` - General VSCode and extension settings
- `keybindings.json` - Custom keyboard shortcuts
- `tasks.json` - Development task definitions
- `launch.json` - Debug configurations

The workspace file `todo-list-app.code-workspace` contains the overall project configuration.