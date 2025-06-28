---
layout: page
title: 'How It Works'
permalink: /how-it-works/
---

# How Our Rate Limiting Works

This page explains the technical details of our rate limiting system in an accessible way. You don't need to be a programmer to understand these concepts, but this goes deeper than our basic overview.

## 🧠 The Core Concept

### Sliding Window Algorithm

Think of rate limiting like a moving time window. Imagine looking through a window that shows the last minute of activity:

- **Window size**: 1 minute (for most features)
- **What we count**: Your actions in that minute
- **The limit**: Maximum actions allowed in that window
- **The slide**: As time moves forward, old actions "fall out" of the window

**Example**: If you make 10 searches at 2:00 PM, by 2:01 PM those searches no longer count toward your limit.

### Smart Identification

We identify users in multiple ways to ensure fairness:

**IP Address Tracking**

- Your internet connection's address
- Shared by everyone on your network
- Primary identifier for anonymous users

**User Account Tracking**

- Your logged-in user ID
- More precise than IP tracking
- Allows for personalized limits

**Composite Tracking**

- Combination of IP + User ID
- Prevents limit circumvention
- Ensures fair resource sharing

## ⚙️ Different Protection Levels

### 🔐 Authentication Protection

**What it protects**: Login attempts  
**Time window**: 15 minutes  
**Limit**: 10 attempts  
**Why longer**: Security is more important than convenience

**How it works**:

1. Each failed login counts toward your limit
2. After 10 failures, you must wait 15 minutes
3. Successful logins don't count against the limit
4. The window resets after 15 minutes of no attempts

### 📤 Upload Protection

**What it protects**: File upload system  
**Time window**: 1 minute  
**Limit**: 5 uploads  
**Why limited**: Large files consume server resources

**How it works**:

1. Each file upload counts as one action
2. File size doesn't matter for the count
3. Failed uploads still count (to prevent retry abuse)
4. Limit resets every minute

### 🔍 Search Protection

**What it protects**: Database queries  
**Time window**: 1 minute  
**Limit**: 200 searches  
**Why higher**: Searching is a core feature

**How it works**:

1. Each search query counts as one action
2. Identical searches still count separately
3. Very high limit for normal use
4. Prevents automated scraping

### 🛠️ General API Protection

**What it protects**: All other actions  
**Time window**: 1 minute  
**Limit**: 100 requests  
**Why broad**: Covers everything else

**How it works**:

1. Page loads, form submissions, etc.
2. Most users never approach this limit
3. Catches unusual automated behavior
4. Balances usability with protection

## 🎯 Progressive Penalty System

### Penalty Levels (0-5)

Our system learns from your behavior and adjusts accordingly:

**Level 0: Clean Record**

- No recent violations
- Normal access to all features
- Quick recovery from any issues

**Level 1: First Warning**

- First-time rate limit violation
- Brief timeout (1-2 minutes)
- Gentle introduction to limits

**Level 2: Pattern Emerging**

- Second violation within reasonable time
- Slightly longer timeout (2-4 minutes)
- System starts paying attention

**Level 3: Concerning Pattern**

- Multiple violations detected
- Longer timeout (4-8 minutes)
- Flagged as potential problem user

**Level 4: Serious Issue**

- Repeated violations despite warnings
- Significant timeout (8-15 minutes)
- Strong indication of abuse or bugs

**Level 5: Maximum Penalty**

- Persistent problematic behavior
- Long timeout (15-60 minutes)
- Reserved for severe cases

### How Penalties Increase

**Exponential Backoff**: Each penalty level roughly doubles the wait time  
**With Jitter**: Random variation prevents coordinated attacks  
**Capped Maximum**: Never more than 1 hour wait time

### How Penalties Decrease

**Good Behavior**: Following rules gradually reduces penalty level  
**Time Decay**: Penalties naturally decrease over time  
**Clean Slate**: Long periods of good behavior reset to level 0

## 🔄 Memory and Cleanup

### What We Store

For each user/IP, we track:

- **Request timestamps**: When you made each request
- **Violation count**: How many times you've hit limits
- **Penalty level**: Your current standing (0-5)
- **Last violation**: When your most recent violation occurred
- **Backoff expiry**: When your current timeout ends

### Automatic Cleanup

**Every 5 minutes**: System removes old, unused entries  
**24-hour rule**: Entries unused for 24 hours are deleted  
**Memory efficiency**: Prevents unlimited memory growth  
**Performance**: Keeps lookups fast

### Data Privacy

- **No personal data**: Only timestamps and counters
- **No content**: We don't store what you searched for
- **Temporary**: All data expires automatically
- **Anonymous**: IP addresses are just identifiers

## 🛡️ Attack Detection

### Suspicious Patterns

The system automatically detects:

**Volume Attacks**

- Hundreds of requests per minute
- Coordinated activity from multiple IPs
- Identical request patterns

**Credential Attacks**

- Rapid login attempts with different passwords
- Dictionary attacks on user accounts
- Brute force patterns

**Resource Abuse**

- Excessive file uploads
- Database scraping attempts
- Automated content harvesting

### Response Escalation

1. **Detection**: Unusual patterns identified
2. **Verification**: Confirm it's not legitimate heavy use
3. **Mitigation**: Apply appropriate rate limits
4. **Monitoring**: Watch for pattern changes
5. **Recovery**: Allow normal access when patterns normalize

## 📊 Technical Implementation

### Architecture Overview

```
Request → Middleware → Rate Limiter → Application
    ↓         ↓            ↓             ↓
  Log IP   Check Auth   Apply Limits   Process Request
```

### Key Components

**Middleware Layer**

- Intercepts all requests before they reach the application
- Extracts user identification (IP, user ID)
- Applies appropriate rate limiting rules
- Returns errors or allows requests to continue

**Rate Limiter Engine**

- In-memory storage for speed
- Sliding window algorithm implementation
- Penalty calculation and backoff logic
- Automatic cleanup and memory management

**Request Identifier**

- Handles various proxy configurations
- Combines IP and user information
- Determines appropriate rate limit type
- Ensures accurate user identification

### Performance Characteristics

**Speed**: Sub-millisecond request processing  
**Memory**: ~200 bytes per tracked user  
**Scalability**: Handles thousands of concurrent users  
**Reliability**: Graceful degradation under load

## 🔧 Configuration and Tuning

### Adjustable Parameters

Each rate limit type can be configured for:

- **Window size**: How long to track requests
- **Request limit**: Maximum requests per window
- **Penalty behavior**: How violations are handled
- **Cleanup frequency**: How often to remove old data

### Balancing Factors

**Security vs. Usability**

- Stricter limits = better security, worse user experience
- Looser limits = better usability, potential abuse
- We aim for the sweet spot that protects without hindering

**Performance vs. Accuracy**

- More precise tracking = higher CPU usage
- Simpler algorithms = faster but less accurate
- Our sliding window balances both needs

**Memory vs. Features**

- More tracking = better protection, more memory usage
- Less tracking = lower memory, potential gaps
- Automatic cleanup maintains balance

## 🎯 Why This Approach?

### Advantages of Our System

**Fair and Predictable**

- Same rules apply to everyone
- Clear limits and consequences
- Consistent behavior across the application

**Adaptive and Learning**

- Responds to user behavior patterns
- Distinguishes between mistakes and abuse
- Improves protection over time

**Efficient and Fast**

- Minimal impact on request processing
- Memory-efficient implementation
- Scales with user growth

**Transparent and Debuggable**

- Clear error messages for users
- Detailed logging for administrators
- Monitoring and management tools

### Comparison to Alternatives

**vs. Simple Rate Limiting**

- Our system: Learns and adapts to user behavior
- Simple: Same response regardless of history

**vs. CAPTCHA Systems**

- Our system: Invisible during normal use
- CAPTCHA: Interrupts all users when triggered

**vs. IP Blocking**

- Our system: Temporary, graduated responses
- IP Blocking: Permanent, all-or-nothing

**vs. No Protection**

- Our system: Prevents abuse while allowing normal use
- No protection: Vulnerable to attacks and performance issues

---

## 🔮 Future Enhancements

### Planned Improvements

- **Machine learning**: Better pattern detection
- **Distributed caching**: Support for multiple servers
- **Advanced analytics**: Detailed usage insights
- **Custom user limits**: Personalized rate limits based on account type

### Continuous Monitoring

We constantly monitor the system's effectiveness and adjust as needed:

- User feedback and support tickets
- System performance metrics
- Attack pattern analysis
- Usage trend evaluation

---

_This system is designed to be both powerful and invisible. The best rate limiting is the kind you never notice because it's working perfectly in the background._
