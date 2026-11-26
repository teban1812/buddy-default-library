-- The failed sign-ins per email and network address (R310), replacing 0002's count per email alone, which let
-- anyone lock a real user out. A row per (address, email) holds 5 failures within 15 minutes before that email
-- waits at that address; the row with an empty email is the address's own count, 20 failures within 15 minutes
-- for any email before the whole address waits. Only these counts are kept; old rows are deleted as new ones come.
DROP INDEX IF EXISTS idx_sign_in_attempts_first;
DROP TABLE IF EXISTS sign_in_attempts;

CREATE TABLE IF NOT EXISTS sign_in_attempts (
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  failures INTEGER NOT NULL,
  first_failed_at TEXT NOT NULL,
  locked_until TEXT,
  PRIMARY KEY (address, email)
);

CREATE INDEX IF NOT EXISTS idx_sign_in_attempts_first ON sign_in_attempts(first_failed_at);
