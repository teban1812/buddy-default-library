-- Invented sample data for the local database only (npm run db:seed:local); never loaded anywhere else.
-- Two accounts, one per role, so the sign-in can be tried at once. Their passwords are written in
-- docs/base-application.md; they are sample values, and a project replaces them before any real use.
-- tests/test-data.test.ts proves this seed holds exactly the sample accounts of tests/helpers/test-data.ts.
INSERT OR IGNORE INTO users (id, email, name, role, password_hash, active) VALUES
  ('usr-admin', 'admin@example.com', 'Sample Administrator', 'admin', 'pbkdf2_sha256$100000$8a0da4d4e75c5539cde9d56e7074422d$91f01c071a714698fd71959eadd056d1fbd0f2777e9281b14af1749f89f097ff', 1),
  ('usr-reader', 'reader@example.com', 'Sample Reader', 'readonly', 'pbkdf2_sha256$100000$b55cb4f97eb8607d7b983dafc5c3f841$f85d625a3d25053e5a5e8e15c8c8aa8e8e00e9a23dbc9b0d1b2865b29d0f8d97', 1);
