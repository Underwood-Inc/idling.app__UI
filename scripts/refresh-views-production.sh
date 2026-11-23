#!/bin/bash

# Legacy placeholder — social platform materialized views were removed in migration 0060.
# Kept so existing cron entries fail gracefully instead of calling missing DB objects.

echo "[$(date)] No materialized views to refresh (social platform sunset)."
exit 0