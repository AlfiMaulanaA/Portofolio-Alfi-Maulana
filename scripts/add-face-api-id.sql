-- Add face_api_id column to users table
ALTER TABLE users ADD COLUMN face_api_id INTEGER DEFAULT NULL;

-- Create index for face_api_id
CREATE INDEX IF NOT EXISTS idx_users_face_api_id ON users(face_api_id);

-- Update existing users to have NULL face_api_id (they weren't registered to Face API yet)
UPDATE users SET face_api_id = NULL WHERE face_api_id IS NULL;

-- Show updated table structure
PRAGMA table_info(users);

SELECT 'Face API ID column added successfully' as message;
