CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT current_timestamp
);

CREATE TABLE account_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT current_timestamp,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
