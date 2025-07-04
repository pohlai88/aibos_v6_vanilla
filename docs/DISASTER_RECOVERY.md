# Disaster Recovery Plan

## Overview
This document outlines the disaster recovery (DR) procedures for the AIBOS accounting SaaS platform.

## Backup Strategy
- **Daily Backups:** All databases and critical files are backed up daily to secure cloud storage.
- **Retention Policy:** Backups are retained for 30 days.
- **Encryption:** All backups are encrypted at rest and in transit.

## Restore Procedure
1. Identify the most recent valid backup.
2. Use the `scripts/restore_backup.py` script to restore the database and files.
3. Validate system integrity and data consistency post-restore.

## Testing
- **Quarterly Drills:** Full restore drills are performed quarterly to ensure readiness.

## Contact
- For DR emergencies, contact: ops@example.com

---
*Keep this document updated as infrastructure or procedures change.*
