-- Migration: Add is_admin column to messages table

ALTER TABLE messages ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
