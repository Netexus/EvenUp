-- ===========================================================
-- Database: EvenUp
-- PostgreSQL schema + triggers
-- ===========================================================

-- Create database
CREATE DATABASE evenup;
\c evenup;

-- ===========================================================
-- ENUM types
-- ===========================================================
CREATE TYPE group_category AS ENUM ('trip','relationship','other');
CREATE TYPE group_status AS ENUM ('active','inactive');
CREATE TYPE member_role AS ENUM ('member','admin');

-- ===========================================================
-- Tables
-- ===========================================================

-- Users
CREATE TABLE app_users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  birthdate DATE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Groups
CREATE TABLE expense_groups (
  group_id SERIAL PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL,
  created_by INT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  origin VARCHAR(150),
  destination VARCHAR(200),
  departure DATE,
  trip_return DATE,
  income_1 INT,
  income_2 INT,
  category group_category NOT NULL DEFAULT 'other',
  status group_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Group memberships
CREATE TABLE group_memberships (
  membership_id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES expense_groups(group_id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (group_id, user_id)
);

-- Expenses
CREATE TABLE expenses (
  expense_id SERIAL PRIMARY KEY,
  expense_name VARCHAR(150) NOT NULL,
  group_id INT REFERENCES expense_groups(group_id) ON DELETE CASCADE ON UPDATE CASCADE,
  paid_by INT NOT NULL REFERENCES app_users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  date DATE NOT NULL
);

-- Expense participants
CREATE TABLE expense_participants (
  participant_id SERIAL PRIMARY KEY,
  expense_id INT NOT NULL REFERENCES expenses(expense_id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  share_amount NUMERIC(12,2) NOT NULL,
  UNIQUE (expense_id, user_id)
);

-- User balances
CREATE TABLE user_balances (
  balance_id SERIAL PRIMARY KEY,
  group_id INT REFERENCES expense_groups(group_id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  net NUMERIC(12,2) NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (group_id, user_id)
);

-- Settlements
CREATE TABLE settlements (
  settlement_id SERIAL PRIMARY KEY,
  group_id INT REFERENCES expense_groups(group_id) ON DELETE CASCADE ON UPDATE CASCADE,
  from_user INT NOT NULL REFERENCES app_users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  to_user INT NOT NULL REFERENCES app_users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================
-- TRIGGER FUNCTIONS + TRIGGERS
-- ===========================================================

-- 1. Check shares
CREATE OR REPLACE FUNCTION check_expense_shares()
RETURNS TRIGGER AS $$
DECLARE
  total_shares NUMERIC(12,2);
  exp_amount NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(share_amount),0)
  INTO total_shares
  FROM expense_participants
  WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id);

  SELECT amount
  INTO exp_amount
  FROM expenses
  WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id);

  IF exp_amount IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF ROUND(total_shares,2) > ROUND(exp_amount,2) THEN
    RAISE EXCEPTION 'Sum of shares exceeds expense amount';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_participants_after_insert
AFTER INSERT ON expense_participants
FOR EACH ROW EXECUTE FUNCTION check_expense_shares();

CREATE TRIGGER trg_expense_participants_after_update
AFTER UPDATE ON expense_participants
FOR EACH ROW EXECUTE FUNCTION check_expense_shares();

CREATE TRIGGER trg_expense_participants_after_delete
AFTER DELETE ON expense_participants
FOR EACH ROW EXECUTE FUNCTION check_expense_shares();

-- 2. Initial balance when user joins group
CREATE OR REPLACE FUNCTION insert_initial_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.user_id, 0, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_memberships_after_insert
AFTER INSERT ON group_memberships
FOR EACH ROW EXECUTE FUNCTION insert_initial_balance();

-- 3. Expense triggers
-- Insert
CREATE OR REPLACE FUNCTION expense_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.paid_by, NEW.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + EXCLUDED.net,
                last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_after_insert
AFTER INSERT ON expenses
FOR EACH ROW EXECUTE FUNCTION expense_after_insert();

-- Update
CREATE OR REPLACE FUNCTION expense_after_update()
RETURNS TRIGGER AS $$
BEGIN
  -- revert old payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.paid_by, -OLD.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + EXCLUDED.net,
                last_updated = CURRENT_TIMESTAMP;

  -- apply new payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.paid_by, NEW.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + EXCLUDED.net,
                last_updated = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_after_update
AFTER UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION expense_after_update();

-- Delete
CREATE OR REPLACE FUNCTION expense_after_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.paid_by, -OLD.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + EXCLUDED.net,
                last_updated = CURRENT_TIMESTAMP;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_after_delete
AFTER DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION expense_after_delete();

-- 4. Participant triggers
-- Insert
CREATE OR REPLACE FUNCTION participant_after_insert()
RETURNS TRIGGER AS $$
DECLARE grp_id INT;
BEGIN
  SELECT group_id INTO grp_id FROM expenses WHERE expense_id = NEW.expense_id;
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, NEW.user_id, -NEW.share_amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net - NEW.share_amount,
                last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_participants_after_insert_balance
AFTER INSERT ON expense_participants
FOR EACH ROW EXECUTE FUNCTION participant_after_insert();

-- Update
CREATE OR REPLACE FUNCTION participant_after_update()
RETURNS TRIGGER AS $$
DECLARE grp_id INT;
BEGIN
  SELECT group_id INTO grp_id FROM expenses WHERE expense_id = NEW.expense_id;

  -- revert old
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, OLD.user_id, OLD.share_amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + OLD.share_amount,
                last_updated = CURRENT_TIMESTAMP;

  -- apply new
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, NEW.user_id, -NEW.share_amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net - NEW.share_amount,
                last_updated = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_participants_after_update_balance
AFTER UPDATE ON expense_participants
FOR EACH ROW EXECUTE FUNCTION participant_after_update();

-- Delete
CREATE OR REPLACE FUNCTION participant_after_delete()
RETURNS TRIGGER AS $$
DECLARE grp_id INT;
BEGIN
  SELECT group_id INTO grp_id FROM expenses WHERE expense_id = OLD.expense_id;

  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, OLD.user_id, OLD.share_amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + OLD.share_amount,
                last_updated = CURRENT_TIMESTAMP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_participants_after_delete_balance
AFTER DELETE ON expense_participants
FOR EACH ROW EXECUTE FUNCTION participant_after_delete();

-- 5. Settlement triggers
-- Insert
CREATE OR REPLACE FUNCTION settlement_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.from_user, NEW.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + NEW.amount,
                last_updated = CURRENT_TIMESTAMP;

  -- receiver
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.to_user, -NEW.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net - NEW.amount,
                last_updated = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settlements_after_insert
AFTER INSERT ON settlements
FOR EACH ROW EXECUTE FUNCTION settlement_after_insert();

-- Update
CREATE OR REPLACE FUNCTION settlement_after_update()
RETURNS TRIGGER AS $$
BEGIN
  -- revert old payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.from_user, -OLD.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net - OLD.amount,
                last_updated = CURRENT_TIMESTAMP;

  -- revert old receiver
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.to_user, OLD.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + OLD.amount,
                last_updated = CURRENT_TIMESTAMP;

  -- apply new payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.from_user, NEW.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + NEW.amount,
                last_updated = CURRENT_TIMESTAMP;

  -- apply new receiver
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.to_user, -NEW.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net - NEW.amount,
                last_updated = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settlements_after_update
AFTER UPDATE ON settlements
FOR EACH ROW EXECUTE FUNCTION settlement_after_update();

-- Delete
CREATE OR REPLACE FUNCTION settlement_after_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- revert payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.from_user, -OLD.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net - OLD.amount,
                last_updated = CURRENT_TIMESTAMP;

  -- revert receiver
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.to_user, OLD.amount, CURRENT_TIMESTAMP)
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET net = user_balances.net + OLD.amount,
                last_updated = CURRENT_TIMESTAMP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settlements_after_delete
AFTER DELETE ON settlements
FOR EACH ROW EXECUTE FUNCTION settlement_after_delete();

-- ===========================================================
-- END SCHEMA
-- ===========================================================
