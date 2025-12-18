-- Migration: 002_cleanup_groups.sql
-- 1) Delete all rows in tugas_group
-- 2) Remove participant_group rows where role is not admin/superadmin
-- 3) Ensure groups from config are present (id and default name)

BEGIN;

-- 1) delete tasks for all groups
DELETE FROM tugas_group;

-- 2) remove non-admin participants
DELETE FROM participant_group WHERE role IS NULL OR LOWER(role) NOT IN ('admin', 'superadmin', 'group_admin');

-- 3) Ensure groups listed in config exist
-- NOTE: Replace the VALUES below with the actual GroupIds used by the worker configuration
-- If you have more GroupIds, add them to the list

INSERT INTO "group" (id, name)
VALUES
  ('120363399604541928@g.us', 'Imported group 120363399604541928'),
  ('120363183408730771@g.us', 'Imported group 120363183408730771')
ON CONFLICT (id) DO NOTHING;

COMMIT;
