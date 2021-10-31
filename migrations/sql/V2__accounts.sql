CREATE TABLE accounts (
    id UUID NOT NULL PRIMARY KEY,
    email CITEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT current_timestamp
);

CREATE TABLE account_tokens (
  id UUID NOT NULL PRIMARY KEY,
  account_id UUID NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT current_timestamp,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
