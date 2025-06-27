# 🔍 Planned Filters for Idling.app

This document outlines planned filter enhancements for the Idling.app community platform. Each filter is designed to help users find exactly the content they're looking for, while providing developers with clear implementation requirements.

## 📅 Date & Time Filters

### Date Range Picker
**What it does:** Lets users select posts from a specific time period using a calendar picker.
**User benefit:** "Show me all posts from last week" or "Find posts from March 2024"
**Technical details:** 
- Filter type: `dateRange`
- Database fields: `submission_datetime`
- UI component: Date range picker with start/end dates
- SQL: `WHERE submission_datetime BETWEEN $1 AND $2`

### Specific Date
**What it does:** Find posts from an exact date.
**User benefit:** "Show me what was posted on my birthday" or "Find posts from Christmas Day"
**Technical details:**
- Filter type: `specificDate`
- Database fields: `submission_datetime`
- UI component: Single date picker
- SQL: `WHERE DATE(submission_datetime) = $1`

### Relative Dates
**What it does:** Quick filters for common time periods.
**User benefit:** One-click filters like "Last 7 days", "This month", "Last year"
**Technical details:**
- Filter type: `relativeDate`
- Values: `last7days`, `thisMonth`, `lastYear`, `today`, `yesterday`
- Database fields: `submission_datetime`
- UI component: Dropdown with preset options
- SQL: Dynamic based on selection (e.g., `WHERE submission_datetime >= NOW() - INTERVAL '7 days'`)

## 🎬 Rich Media Filters

### Has Media
**What it does:** Show only posts that contain any type of media (images, videos, etc.).
**User benefit:** "I want to browse posts with pictures and videos, not just text"
**Technical details:**
- Filter type: `hasMedia`
- Database fields: `submission_name`, `submission_url`
- Detection logic: Check for embed patterns `![behavior](url)` in content
- UI component: Toggle switch
- SQL: `WHERE submission_name ~ '!\[.*\]\(.*\)' OR submission_url IS NOT NULL`

### YouTube Embeds
**What it does:** Find posts containing YouTube videos.
**User benefit:** "Show me posts with YouTube videos I can watch"
**Technical details:**
- Filter type: `hasYouTube`
- Database fields: `submission_name`, `submission_url`
- Detection patterns: YouTube URL formats in content or URL field
- UI component: Toggle with YouTube icon
- SQL: `WHERE submission_name ~ 'youtube\.com|youtu\.be' OR submission_url ~ 'youtube\.com|youtu\.be'`

### Images
**What it does:** Show posts with image content.
**User benefit:** "Browse posts with pictures, screenshots, and graphics"
**Technical details:**
- Filter type: `hasImages`
- Database fields: `submission_name`, `submission_url`
- Detection patterns: Image file extensions and embed patterns
- UI component: Toggle with image icon
- SQL: `WHERE submission_name ~ '\.(jpg|jpeg|png|gif|webp|svg)' OR submission_url ~ '\.(jpg|jpeg|png|gif|webp|svg)'`

## 📏 Content Characteristics

### Content Length
**What it does:** Filter posts by how long they are.
**User benefit:** "Show me quick reads" or "Find detailed posts"
**Technical details:**
- Filter type: `contentLength`
- Values: `short` (<100 chars), `medium` (100-500), `long` (>500)
- Database fields: `submission_name`
- UI component: Radio buttons or dropdown
- SQL: 
  - Short: `WHERE LENGTH(submission_name) < 100`
  - Medium: `WHERE LENGTH(submission_name) BETWEEN 100 AND 500`
  - Long: `WHERE LENGTH(submission_name) > 500`

### Thread Type
**What it does:** Filter between main posts and replies.
**User benefit:** "Show me only original posts" or "Find replies to discussions"
**Technical details:**
- Filter type: `threadType`
- Values: `mainPosts`, `replies`
- Database fields: `thread_parent_id`
- UI component: Radio buttons
- SQL: 
  - Main posts: `WHERE thread_parent_id IS NULL`
  - Replies: `WHERE thread_parent_id IS NOT NULL`

## 🚀 Implementation Priority

### Phase 1: High Impact (Immediate Development)
1. **Date Range Picker** - Most requested feature
2. **Rich Media Filters** (YouTube, Images, Videos)
3. **Content Length Filter**
4. **Thread Type Filter** (Main posts vs replies)

### Phase 2: Medium Impact (Next Quarter)
1. **Relative Date Filters** ("Last week", "This month")
2. **Search Enhancements** (search in specific fields)
3. **Has Media Toggle**

---

*This document serves as both a user guide for understanding planned features and a technical specification for development teams.*
