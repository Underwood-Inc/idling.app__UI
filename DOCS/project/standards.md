---
layout: default
title: Project Standards & Best Practices
description: Code quality guidelines, development standards, and best practices for idling.app contributors
---

# 🛠️ Project Standards & Best Practices

This document outlines the coding standards, development practices, and quality guidelines for contributing to idling.app. Following these standards ensures consistency, maintainability, and high code quality across the project.

## 🎯 Overview

Our project standards are designed to:
- **Maintain consistency** across all code contributions
- **Ensure high quality** through proven best practices
- **Enable collaboration** with clear, readable code
- **Prevent bugs** through rigorous testing and review
- **Support scalability** with maintainable architecture

## 📏 Code Standards

### TypeScript Guidelines

**Interface and Type Definitions**
```typescript
// ✅ Good - Always define interfaces/types separately
interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export async function getUserProfile(id: string): Promise<UserProfile> {
  // Implementation
}

// ❌ Bad - Inline type definitions
export async function getUserProfile(id: string): Promise<{
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}> {
  // Implementation
}
```

**Error Handling**
```typescript
// ✅ Good - Proper error handling with types
interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export async function fetchUserData(id: string): Promise<UserProfile> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new ApiError({
        message: 'Failed to fetch user data',
        code: 'USER_FETCH_ERROR',
        statusCode: response.status
      });
    }
    
    return await response.json();
  } catch (error) {
    console.error('User fetch error:', error);
    throw error;
  }
}

// ❌ Bad - Generic error handling
export async function fetchUserData(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

**Function Documentation**
```typescript
// ✅ Good - Clear JSDoc comments
/**
 * Retrieves user profile information by ID
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to user profile data
 * @throws {ApiError} When user is not found or API request fails
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  // Implementation
}
```

### React Component Standards

**Component Structure**
```typescript
// ✅ Good - Consistent component structure
interface UserCardProps {
  user: UserProfile;
  showEmail?: boolean;
  onUserClick?: (userId: string) => void;
}

export default function UserCard({ 
  user, 
  showEmail = false, 
  onUserClick 
}: UserCardProps) {
  const handleClick = () => {
    onUserClick?.(user.id);
  };

  return (
    <div className="user-card" onClick={handleClick}>
      <h3>{user.username}</h3>
      {showEmail && <p>{user.email}</p>}
    </div>
  );
}
```

**Hooks Usage**
```typescript
// ✅ Good - Custom hooks for reusable logic
interface UseUserDataReturn {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserData(userId: string): UseUserDataReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserProfile(userId);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
}
```

### CSS and Styling Standards

**CSS Modules**
```css
/* ✅ Good - Descriptive class names with BEM-like structure */
.userCard {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: var(--bg-secondary);
}

.userCard__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.userCard__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.userCard--highlighted {
  border: 2px solid var(--accent-color);
}

/* ❌ Bad - Generic, unclear class names */
.card {
  padding: 10px;
}

.title {
  font-size: 20px;
}
```

**CSS Variables Usage**
```css
/* ✅ Good - Use CSS custom properties for consistency */
.button {
  background-color: var(--button-bg);
  color: var(--button-text);
  border: 1px solid var(--button-border);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all var(--transition-fast) ease;
}

.button:hover {
  background-color: var(--button-bg-hover);
  transform: translateY(-1px);
}

/* ❌ Bad - Hardcoded values */
.button {
  background-color: #3b82f6;
  color: white;
  border: 1px solid #2563eb;
  padding: 12px 24px;
  border-radius: 8px;
}
```

## 🧪 Testing Standards

### Test Structure
```typescript
// ✅ Good - Descriptive test structure
describe('UserProfile Component', () => {
  const mockUser: UserProfile = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    // Setup code
  });

  describe('when user data is provided', () => {
    it('should display username correctly', () => {
      render(<UserProfile user={mockUser} />);
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('should hide email by default', () => {
      render(<UserProfile user={mockUser} />);
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });

    it('should show email when showEmail prop is true', () => {
      render(<UserProfile user={mockUser} showEmail />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('when user clicks profile', () => {
    it('should call onUserClick with correct user ID', () => {
      const mockOnClick = jest.fn();
      render(<UserProfile user={mockUser} onUserClick={mockOnClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledWith('user-123');
    });
  });
});
```

### E2E Testing Standards
```typescript
// ✅ Good - Page Object Model pattern
class UserProfilePage {
  constructor(private page: Page) {}

  async navigateToProfile(userId: string) {
    await this.page.goto(`/profile/${userId}`);
  }

  async getUsernameText() {
    return await this.page.locator('[data-testid="username"]').textContent();
  }

  async clickEditButton() {
    await this.page.locator('[data-testid="edit-button"]').click();
  }

  async isEmailVisible() {
    return await this.page.locator('[data-testid="user-email"]').isVisible();
  }
}

test.describe('User Profile Page', () => {
  let userProfilePage: UserProfilePage;

  test.beforeEach(async ({ page }) => {
    userProfilePage = new UserProfilePage(page);
  });

  test('should display user information correctly', async () => {
    await userProfilePage.navigateToProfile('test-user-id');
    
    const username = await userProfilePage.getUsernameText();
    expect(username).toBe('testuser');
  });
});
```

## 🔍 Code Review Standards

### Review Checklist
**Functionality**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

**Code Quality**
- [ ] Follows TypeScript/React best practices
- [ ] Consistent naming conventions
- [ ] Appropriate comments and documentation
- [ ] No code duplication

**Testing**
- [ ] Unit tests cover new functionality
- [ ] E2E tests for user-facing features
- [ ] Tests are meaningful and maintainable
- [ ] Test coverage is adequate

**Security**
- [ ] Input validation is present
- [ ] No sensitive data exposed
- [ ] Authentication/authorization handled
- [ ] SQL injection prevention

### Review Process
1. **Self-Review** - Review your own code before requesting review
2. **Automated Checks** - Ensure CI/CD passes (tests, linting, type checking)
3. **Peer Review** - At least one team member reviews the code
4. **Address Feedback** - Respond to all review comments
5. **Final Approval** - Maintainer approves and merges

## 📝 Documentation Standards

### Code Documentation
```typescript
// ✅ Good - Comprehensive function documentation
/**
 * Processes user upload and validates file constraints
 * 
 * @param file - The file to be uploaded
 * @param options - Upload configuration options
 * @param options.maxSize - Maximum file size in bytes (default: 5MB)
 * @param options.allowedTypes - Array of allowed MIME types
 * @returns Promise resolving to upload result with file URL and metadata
 * 
 * @throws {ValidationError} When file doesn't meet size or type constraints
 * @throws {UploadError} When upload to storage service fails
 * 
 * @example
 * ```typescript
 * const result = await processUpload(file, {
 *   maxSize: 1024 * 1024 * 10, // 10MB
 *   allowedTypes: ['image/jpeg', 'image/png']
 * });
 * console.log('File uploaded:', result.url);
 * ```
 */
export async function processUpload(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Implementation
}
```

### README Standards
Each major component/feature should have clear documentation:
- **Purpose** - What the component/feature does
- **Usage** - How to use it with examples
- **Configuration** - Available options and settings
- **API** - Public methods and interfaces
- **Examples** - Real-world usage examples

## 🔐 Security Standards

### Input Validation
```typescript
// ✅ Good - Comprehensive input validation
import { z } from 'zod';

const CreateUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
});

export async function createUser(data: unknown) {
  // Validate input
  const validatedData = CreateUserSchema.parse(data);
  
  // Process with validated data
  return await userService.create(validatedData);
}
```

### Authentication & Authorization
```typescript
// ✅ Good - Proper auth checking
export async function getProtectedData(request: Request) {
  const session = await getSession(request);
  
  if (!session?.user) {
    throw new AuthenticationError('User not authenticated');
  }
  
  if (!hasPermission(session.user, 'READ_PROTECTED_DATA')) {
    throw new AuthorizationError('Insufficient permissions');
  }
  
  return await fetchProtectedData(session.user.id);
}
```

## ♿ Accessibility Standards

### Semantic HTML
```tsx
// ✅ Good - Semantic, accessible markup
export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <article className="user-card" role="article" aria-labelledby={`user-${user.id}-name`}>
      <header>
        <h3 id={`user-${user.id}-name`}>{user.username}</h3>
        <p className="user-card__meta">
          Member since {formatDate(user.createdAt)}
        </p>
      </header>
      
      <div className="user-card__actions">
        <button
          type="button"
          onClick={() => onEdit(user.id)}
          aria-label={`Edit profile for ${user.username}`}
        >
          Edit Profile
        </button>
      </div>
    </article>
  );
}

// ❌ Bad - Non-semantic, inaccessible markup
export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div className="user-card" onClick={() => onEdit(user.id)}>
      <div>{user.username}</div>
      <div>Member since {formatDate(user.createdAt)}</div>
      <div>Edit Profile</div>
    </div>
  );
}
```

### ARIA Labels and Roles
```tsx
// ✅ Good - Proper ARIA usage
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li>
      <a href="/dashboard" aria-current={currentPage === 'dashboard' ? 'page' : undefined}>
        Dashboard
      </a>
    </li>
  </ul>
</nav>

<form role="form" aria-labelledby="login-heading">
  <h2 id="login-heading">Sign In</h2>
  <div>
    <label htmlFor="email">Email Address</label>
    <input
      id="email"
      type="email"
      required
      aria-describedby="email-error"
      aria-invalid={emailError ? 'true' : 'false'}
    />
    {emailError && (
      <div id="email-error" role="alert" className="error">
        {emailError}
      </div>
    )}
  </div>
</form>
```

## 📊 Performance Standards

### Code Splitting
```typescript
// ✅ Good - Lazy loading for large components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const UserProfile = lazy(() => import('./UserProfile'));

export function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

### Database Queries
```typescript
// ✅ Good - Optimized database queries
export async function getUsersWithPosts(limit: number = 10) {
  return await prisma.user.findMany({
    take: limit,
    select: {
      id: true,
      username: true,
      email: true,
      posts: {
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5, // Limit posts per user
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// ❌ Bad - Inefficient query
export async function getUsersWithPosts() {
  const users = await prisma.user.findMany({
    include: {
      posts: true, // Includes all fields and all posts
    },
  });
  return users;
}
```

## 🚀 Deployment Standards

### Environment Configuration
```bash
# ✅ Good - Clear environment variable documentation
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/idling_app"
DATABASE_POOL_SIZE=20

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"

# File Upload
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif"

# Cache Configuration
REDIS_URL="redis://localhost:6379"
CACHE_TTL=3600  # 1 hour in seconds
```

### Build Optimization
```javascript
// next.config.js - ✅ Good production configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['cdn.idling.app'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
};

module.exports = nextConfig;
```

## 📋 Commit Standards

### Commit Message Format
```bash
# ✅ Good - Conventional commit format
feat(auth): add OAuth2 integration with Google
fix(upload): resolve file size validation error
docs(api): update endpoint documentation
test(user): add unit tests for user service
refactor(db): optimize query performance
style(ui): improve button hover states
chore(deps): update dependencies to latest versions

# ❌ Bad - Unclear commit messages
fixed bug
updated stuff
changes
wip
```

### Commit Guidelines
- **Use conventional commits** for clear history
- **Keep commits atomic** - one logical change per commit
- **Write descriptive messages** explaining what and why
- **Reference issues** when applicable (`fixes #123`)
- **Keep commits small** for easier review and debugging

## 🎯 Quality Metrics

### Code Quality Targets
- **Test Coverage**: > 80% for critical components
- **TypeScript Coverage**: > 95% of codebase
- **ESLint Compliance**: 100% (no warnings or errors)
- **Performance**: Lighthouse scores > 90
- **Accessibility**: WCAG 2.1 AA compliance

### Monitoring Standards
- **Error Rate**: < 1% of requests
- **Response Time**: < 200ms for API endpoints
- **Uptime**: > 99.9% monthly
- **Security**: Regular vulnerability scans
- **Dependencies**: Keep dependencies up to date

## 📞 Getting Help

### When You Need Support
- **Code Standards Questions**: Ask in Discord #development channel
- **Review Process**: Tag maintainers for complex reviews
- **Best Practices**: Check existing code for patterns
- **Performance Issues**: Consult performance optimization guides
- **Security Concerns**: Contact maintainers privately

### Resources
- **ESLint Configuration**: Automated code style checking
- **Prettier Configuration**: Automated code formatting
- **TypeScript Config**: Strict type checking enabled
- **Testing Setup**: Jest and Playwright configured
- **CI/CD Pipeline**: Automated quality checks

---

## 🔗 Related Documentation

- **[Development Setup](../development/getting-started)** - Set up your development environment
- **[Testing Guide](../development/testing)** - Comprehensive testing strategies
- **[Commit Guidelines](./commits)** - Git commit standards and practices
- **[Discord Community](./discord)** - Join our development community

---

*These standards ensure that idling.app maintains high quality, consistency, and maintainability as it grows. Every contribution following these guidelines makes the project better for everyone.* 