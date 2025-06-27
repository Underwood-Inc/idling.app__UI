---
layout: default
title: Troubleshooting
nav_order: 6
has_children: true
---

# Troubleshooting

This section contains guides and solutions for common issues encountered during development and deployment.

## Available Guides

### [Application Issues & Fixes](application-issues-fixes.html)

Comprehensive analysis and solutions for specific application issues including pagination, tag filtering, and display inconsistencies.

## Quick Reference

### Common Issues

- **Pagination stuck on PageSize 100**: Check default values in state atoms
- **Tag filtering not working**: Verify tag normalization consistency
- **UI components not displaying**: Check CSS z-index and positioning
- **Database query failures**: Validate tag format and case sensitivity

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify network requests in Developer Tools
3. Review server logs for backend errors
4. Test with different data sets
5. Validate CSS and styling issues

## Related Documentation

- [Development Troubleshooting](../development/troubleshooting.html)
- [Testing Guide](../testing/ci-tests.html)
- [Database Issues](../database/troubleshooting.html)
