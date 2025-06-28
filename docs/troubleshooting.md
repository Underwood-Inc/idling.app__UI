---
layout: page
title: 'Troubleshooting'
permalink: /troubleshooting/
---

# Troubleshooting Rate Limit Issues

Having trouble with rate limiting? This guide will help you identify and solve the most common issues quickly and easily.

## 🚨 Common Error Messages

### "Too many requests. Please slow down."

**What it means**: You've made too many requests in a short time  
**How long to wait**: Usually 1-2 minutes  
**What to do**: Wait the full time, then try again at a slower pace

### "Suspicious activity detected. Access temporarily restricted."

**What it means**: The system detected unusual patterns  
**How long to wait**: 15-60 minutes  
**What to do**: Wait completely, then return to normal usage patterns

### "Rate limit exceeded. Retry after X seconds."

**What it means**: You've hit a specific endpoint limit  
**How long to wait**: Exactly X seconds as specified  
**What to do**: Wait the exact time shown, then continue

### "Upload limit exceeded. Please wait before uploading more files."

**What it means**: You've uploaded too many files too quickly  
**How long to wait**: 1-2 minutes  
**What to do**: Wait, then upload fewer files at once

### "Search temporarily limited. Please try again shortly."

**What it means**: Too many searches in a short period  
**How long to wait**: 1 minute  
**What to do**: Wait, then search with more specific terms

## 🔍 Diagnostic Questions

### Step 1: What Were You Doing?

Check which scenario matches your situation:

**🔄 Rapid Actions**

- Clicking buttons very quickly
- Refreshing pages repeatedly
- Submitting forms multiple times
- **Solution**: Slow down, allow actions to complete

**📤 Bulk Uploads**

- Uploading many files at once
- Large file transfers
- Multiple simultaneous uploads
- **Solution**: Upload in smaller batches

**🔍 Heavy Searching**

- Many searches in quick succession
- Broad search terms returning many results
- Automated search scripts
- **Solution**: Use specific search terms, take breaks

**🔐 Login Issues**

- Multiple failed login attempts
- Trying different passwords quickly
- Multiple devices logging in
- **Solution**: Use correct credentials, wait between attempts

### Step 2: How Often Does This Happen?

**First time**: Probably just normal rate limiting  
**Occasionally**: You might be a power user hitting normal limits  
**Frequently**: Something in your usage pattern needs adjustment  
**Constantly**: There might be a technical issue

### Step 3: What's Your Environment?

**Browser**: Old browsers might retry failed requests  
**Network**: Slow connections might cause duplicate requests  
**Extensions**: Some browser extensions make extra requests  
**Scripts**: Automated tools can trigger rate limits

## 🛠️ Quick Fixes

### Immediate Solutions (Try These First)

**1. Wait It Out**

- Don't try to work around the limit
- Wait the full suggested time
- Return to normal usage patterns

**2. Refresh Your Browser**

- Close unnecessary tabs
- Clear browser cache (Ctrl+Shift+Delete)
- Restart your browser

**3. Check Your Network**

- Ensure stable internet connection
- Disable VPN if using one
- Try from a different network

**4. Slow Down Your Actions**

- Wait for pages to load completely
- Don't click buttons multiple times
- Take breaks between intensive activities

### Browser-Specific Fixes

**Chrome**

1. Clear cache: Settings → Privacy → Clear browsing data
2. Disable extensions: Settings → Extensions → Disable all
3. Try incognito mode: Ctrl+Shift+N

**Firefox**

1. Clear cache: Settings → Privacy → Clear Data
2. Disable add-ons: Settings → Extensions → Disable all
3. Try private browsing: Ctrl+Shift+P

**Safari**

1. Clear cache: Safari → Preferences → Privacy → Manage Website Data
2. Disable extensions: Safari → Preferences → Extensions
3. Try private browsing: Cmd+Shift+N

**Edge**

1. Clear cache: Settings → Privacy → Clear browsing data
2. Disable extensions: Settings → Extensions → Disable all
3. Try InPrivate: Ctrl+Shift+N

## 🔧 Advanced Troubleshooting

### For Upload Issues

**Check File Sizes**

- Large files take longer to process
- Multiple large files can trigger limits
- **Solution**: Compress files or upload smaller batches

**Check File Types**

- Some file types require extra processing
- Unusual file types might trigger security checks
- **Solution**: Use common file formats (JPG, PNG, PDF)

**Check Upload Method**

- Drag-and-drop vs. file picker
- Multiple files vs. single files
- **Solution**: Try different upload methods

### For Search Issues

**Improve Search Terms**

- Use specific keywords instead of broad terms
- Use quotes for exact phrases
- Use filters to narrow results
- **Solution**: "specific term" instead of general words

**Check Search Frequency**

- Rapid searches trigger limits faster
- Automated searches are heavily limited
- **Solution**: Wait 5-10 seconds between searches

### For Login Issues

**Password Problems**

- Typos trigger failed attempt counters
- Caps lock or special characters
- **Solution**: Use password manager, check caps lock

**Multiple Sessions**

- Logging in from multiple devices
- Not logging out properly
- **Solution**: Log out from other devices first

**Browser Issues**

- Saved passwords might be outdated
- Browser auto-fill problems
- **Solution**: Clear saved passwords, type manually

## 📊 Understanding Your Situation

### Normal User Patterns

**What's typical**:

- Occasional brief limits during heavy use
- Quick recovery (1-2 minutes)
- Rare occurrence (few times per week)

**If this describes you**: You're experiencing normal rate limiting

### Power User Patterns

**What's typical**:

- More frequent limits during intensive work
- Slightly longer recovery times
- Predictable patterns based on your activities

**If this describes you**: Adjust your workflow to work within limits

### Problem Patterns

**What's concerning**:

- Rate limits during normal browsing
- Very long wait times (>30 minutes)
- Constant rate limiting messages
- Can't access basic features

**If this describes you**: Contact support for help

## 🆘 When to Contact Support

### Contact Support Immediately If:

- You can't access essential features after waiting
- Rate limits prevent normal browsing and posting
- Error messages mention "permanent" restrictions
- You're getting rate limited while doing nothing

### Contact Support Soon If:

- Rate limits happen during normal use
- Wait times are longer than 15 minutes for basic actions
- You can't upload any files or images
- Login is consistently blocked

### Information to Include:

1. **Exact error message** (screenshot if possible)
2. **What you were trying to do** when it happened
3. **How long you waited** before contacting support
4. **Your browser and operating system**
5. **Whether this happens on other devices/networks**

## 💡 Prevention Tips

### Daily Habits

- **Pace your actions**: Don't rush through tasks
- **Use bookmarks**: Instead of searching for the same content
- **Plan uploads**: Prepare files before starting upload sessions
- **Take breaks**: Natural pauses prevent most issues

### Technical Habits

- **Keep browsers updated**: Old browsers can cause extra requests
- **Stable internet**: Reliable connections prevent retry loops
- **Close unused tabs**: Reduces background requests
- **Regular cache clearing**: Prevents request conflicts

### Power User Habits

- **Off-peak timing**: Schedule heavy work for quieter times
- **Batch processing**: Group similar actions together
- **Monitor your usage**: Pay attention to early warning signs
- **Plan ahead**: Know the limits for your common activities

## 🔄 Recovery Strategies

### After a Rate Limit

1. **Wait completely**: Don't try to resume early
2. **Start slowly**: Begin with lighter activities
3. **Monitor yourself**: Watch for warning signs
4. **Adjust patterns**: Learn from what triggered the limit

### Building Good Standing

- **Consistent behavior**: Regular, predictable usage patterns
- **Respect limits**: Don't try to work around restrictions
- **Good citizenship**: Report bugs instead of trying workarounds
- **Patience**: Good behavior is rewarded over time

## 📱 Mobile-Specific Issues

### Common Mobile Problems

- **Slow networks**: Can cause request timeouts and retries
- **App switching**: Background requests might continue
- **Touch sensitivity**: Accidental multiple taps
- **Auto-refresh**: Some mobile browsers auto-refresh pages

### Mobile Solutions

- **Use WiFi**: More stable than cellular data
- **Close other apps**: Reduce network competition
- **Single taps**: Wait for responses before tapping again
- **Disable auto-refresh**: Check browser settings

---

## Quick Troubleshooting Checklist

- [ ] Wait the full suggested time
- [ ] Clear browser cache and cookies
- [ ] Try a different browser or incognito mode
- [ ] Check internet connection stability
- [ ] Disable browser extensions temporarily
- [ ] Try from a different device or network
- [ ] Contact support if issues persist

---

_Remember: Rate limiting is designed to protect you and the system. Working with it, rather than against it, will give you the best experience and fastest resolution to any issues._
