-- Insert sample quarters for testing
-- This script adds some test quarters to the database

INSERT INTO ppt_quarter (quarter_id) VALUES ('2025Q1') ON CONFLICT (quarter_id) DO NOTHING;
INSERT INTO ppt_quarter (quarter_id) VALUES ('2024Q4') ON CONFLICT (quarter_id) DO NOTHING;
INSERT INTO ppt_quarter (quarter_id) VALUES ('2024Q3') ON CONFLICT (quarter_id) DO NOTHING;
INSERT INTO ppt_quarter (quarter_id) VALUES ('2024Q2') ON CONFLICT (quarter_id) DO NOTHING;
INSERT INTO ppt_quarter (quarter_id) VALUES ('2024Q1') ON CONFLICT (quarter_id) DO NOTHING;

-- Verify the quarters were inserted
SELECT * FROM ppt_quarter ORDER BY quarter_id DESC;
