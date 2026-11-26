-- The failed sign-ins per account (R307): 5 within 15 minutes make that account's sign-in wait 15 minutes.
-- Keyed by the typed email, not by the user, so an unknown account is counted and answered the same way.
CREATE TABLE IF NOT EXISTS sign_in_attempts (
  email TEXT PRIMARY KEY,
  failures INTEGER NOT NULL,
  first_failed_at TEXT NOT NULL,
  locked_until TEXT
);

CREATE INDEX IF NOT EXISTS idx_sign_in_attempts_first ON sign_in_attempts(first_failed_at);
