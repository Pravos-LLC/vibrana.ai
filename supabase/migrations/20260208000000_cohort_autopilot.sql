-- Migration: Cohort Autopilot System (first attempt, superseded)
-- Date: 2026-02-08
--
-- Intentionally a no-op. The original body altered cohorts.start_date while
-- the course_statistics view (created in 20260107) still depended on it, so it
-- fails on any database that has that view — production included. The
-- corrected version is 20260208000001_cohort_autopilot_run.sql, which drops
-- and recreates the view around the type change and does everything this
-- file set out to do. Production records this version as applied (VIB-392
-- repair), so emptying it changes nothing there and lets a from-scratch
-- replay (CI `database` job) reach the same schema.

SELECT 1;
