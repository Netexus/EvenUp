CREATE DATABASE IF NOT EXISTS `EvenUp`
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
USE `EvenUp`;

-- Users table (app_users)
CREATE TABLE `app_users` (
  `user_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,	
  `birthdate` DATE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- Groups table (expense_groups)
CREATE TABLE `expense_groups` (
  `group_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_name` VARCHAR(100) NOT NULL,
  `created_by` INT UNSIGNED NOT NULL,
  `origin` VARCHAR(150),
  `destination` VARCHAR(200),
  `departure` DATE,
  `trip_return` DATE,
  `income_1` INT,
  `income_2` INT,
  `category` ENUM('trip','relationship', 'other') NOT NULL DEFAULT 'other',
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_groups_created_by FOREIGN KEY (`created_by`)
    REFERENCES `app_users`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Group members (group_memberships)
CREATE TABLE `group_memberships` (
  `membership_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('member','admin') NOT NULL DEFAULT 'member',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gm_group FOREIGN KEY (`group_id`)
    REFERENCES `expense_groups`(`group_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_gm_user FOREIGN KEY (`user_id`)
    REFERENCES `app_users`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses (expenses)
CREATE TABLE `expenses` (
  `expense_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `expense_name` VARCHAR (150) NOT NULL,
  `group_id` INT UNSIGNED NULL,
  `paid_by` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100),
  `date` DATE NOT NULL,
  CONSTRAINT fk_expense_group FOREIGN KEY (`group_id`)
    REFERENCES `expense_groups`(`group_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_expense_paid_by FOREIGN KEY (`paid_by`)
    REFERENCES `app_users`(`user_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense participants (expense_participants)
CREATE TABLE `expense_participants` (
  `participant_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `expense_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `share_amount` DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_ep_expense FOREIGN KEY (`expense_id`)
    REFERENCES `expenses`(`expense_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ep_user FOREIGN KEY (`user_id`)
    REFERENCES `app_users`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uq_expense_user` (`expense_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Balances (user_balances)
CREATE TABLE `user_balances` (
  `balance_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `net` DECIMAL(12,2) NOT NULL, -- positive = credit, negative = debt
  `last_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ub_group FOREIGN KEY (`group_id`)
    REFERENCES `expense_groups`(`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ub_user FOREIGN KEY (`user_id`)
    REFERENCES `app_users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_group_user (group_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settlements (settlements)
CREATE TABLE `settlements` (
  `settlement_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_id` INT UNSIGNED NULL,
  `from_user` INT UNSIGNED NOT NULL,
  `to_user` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_set_group FOREIGN KEY (`group_id`)
    REFERENCES `expense_groups`(`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_set_from FOREIGN KEY (`from_user`)
    REFERENCES `app_users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_set_to FOREIGN KEY (`to_user`)
    REFERENCES `app_users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TRIGGERS

-- Validate that sum(shares) does not exceed expense.amount
DELIMITER $$

CREATE TRIGGER trg_expense_participants_after_insert
AFTER INSERT ON `expense_participants`
FOR EACH ROW
BEGIN
  DECLARE total_shares DECIMAL(12,2);
  DECLARE exp_amount DECIMAL(12,2);

  SELECT IFNULL(SUM(share_amount),0) INTO total_shares
    FROM expense_participants
   WHERE expense_id = NEW.expense_id;

  SELECT amount INTO exp_amount
    FROM expenses
   WHERE expense_id = NEW.expense_id
   LIMIT 1;

  IF exp_amount IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Expense not found when inserting participant';
  END IF;

  -- Only error if the sum exceeds the amount
  IF ROUND(total_shares,2) > ROUND(exp_amount,2) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sum of shares exceeds expense amount (after insert)';
  END IF;
END$$

CREATE TRIGGER trg_expense_participants_after_update
AFTER UPDATE ON `expense_participants`
FOR EACH ROW
BEGIN
  DECLARE total_shares DECIMAL(12,2);
  DECLARE exp_amount DECIMAL(12,2);

  SELECT IFNULL(SUM(share_amount),0) INTO total_shares
    FROM expense_participants
   WHERE expense_id = NEW.expense_id;

  SELECT amount INTO exp_amount
    FROM expenses
   WHERE expense_id = NEW.expense_id
   LIMIT 1;

  IF exp_amount IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Expense not found when updating participant';
  END IF;

  IF ROUND(total_shares,2) > ROUND(exp_amount,2) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sum of shares exceeds expense amount (after update)';
  END IF;
END$$

CREATE TRIGGER trg_expense_participants_after_delete
AFTER DELETE ON `expense_participants`
FOR EACH ROW
BEGIN
  DECLARE total_shares DECIMAL(12,2);
  DECLARE exp_amount DECIMAL(12,2);

  SELECT IFNULL(SUM(share_amount),0) INTO total_shares
    FROM expense_participants
   WHERE expense_id = OLD.expense_id;

  SELECT amount INTO exp_amount
    FROM expenses
   WHERE expense_id = OLD.expense_id
   LIMIT 1;

  -- Only error if the sum exceeds the amount (it can be 0 if all are deleted)
  IF ROUND(total_shares,2) > ROUND(exp_amount,2) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sum of shares exceeds expense amount (after delete)';
  END IF;
END$$

-- Triggers for settlements updating user_balances

CREATE TRIGGER trg_settlements_after_insert
AFTER INSERT ON `settlements`
FOR EACH ROW
BEGIN
  -- Update payer (from_user): their debt decreases
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.from_user, NEW.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + NEW.amount,
    last_updated = CURRENT_TIMESTAMP;

  -- Update receiver (to_user): their credit decreases
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.to_user, -NEW.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - NEW.amount,
    last_updated = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_settlements_after_update
AFTER UPDATE ON `settlements`
FOR EACH ROW
BEGIN
  -- Revert old payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.from_user, -OLD.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - OLD.amount,
    last_updated = CURRENT_TIMESTAMP;

  -- Revert old receiver
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.to_user, OLD.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + OLD.amount,
    last_updated = CURRENT_TIMESTAMP;

  -- Apply new payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.from_user, NEW.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + NEW.amount,
    last_updated = CURRENT_TIMESTAMP;

  -- Apply new receiver
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.to_user, -NEW.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - NEW.amount,
    last_updated = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_settlements_after_delete
AFTER DELETE ON `settlements`
FOR EACH ROW
BEGIN
  -- Revert payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.from_user, -OLD.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - OLD.amount,
    last_updated = CURRENT_TIMESTAMP;

  -- Revert receiver
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.to_user, OLD.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + OLD.amount,
    last_updated = CURRENT_TIMESTAMP;
END$$

DELIMITER $$

-- Insert initial balance record when a user joins a group
CREATE TRIGGER trg_group_memberships_after_insert
AFTER INSERT ON `group_memberships`
FOR EACH ROW
BEGIN
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.user_id, 0, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE last_updated = CURRENT_TIMESTAMP;
END$$

-- When a new expense is created: credit the payer
CREATE TRIGGER trg_expenses_after_insert
AFTER INSERT ON `expenses`
FOR EACH ROW
BEGIN
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.paid_by, NEW.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + NEW.amount,
    last_updated = CURRENT_TIMESTAMP;
END$$


-- When an expense is updated: revert old payer and apply new payer
CREATE TRIGGER trg_expenses_after_update
AFTER UPDATE ON `expenses`
FOR EACH ROW
BEGIN
  -- Revert old payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.paid_by, -OLD.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - OLD.amount,
    last_updated = CURRENT_TIMESTAMP;

  -- Apply new payer
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (NEW.group_id, NEW.paid_by, NEW.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + NEW.amount,
    last_updated = CURRENT_TIMESTAMP;
END$$


-- When an expense is deleted: revert the payer’s credit
CREATE TRIGGER trg_expenses_after_delete
AFTER DELETE ON `expenses`
FOR EACH ROW
BEGIN
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (OLD.group_id, OLD.paid_by, -OLD.amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - OLD.amount,
    last_updated = CURRENT_TIMESTAMP;
END$$

-- When a participant is added: debit their share
CREATE TRIGGER trg_expense_participants_after_insert_balance
AFTER INSERT ON `expense_participants`
FOR EACH ROW
BEGIN
  DECLARE grp_id INT UNSIGNED;

  SELECT group_id INTO grp_id
    FROM expenses
   WHERE expense_id = NEW.expense_id
   LIMIT 1;

  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, NEW.user_id, -NEW.share_amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - NEW.share_amount,
    last_updated = CURRENT_TIMESTAMP;
END$$


-- When a participant’s share is updated: revert old and apply new
CREATE TRIGGER trg_expense_participants_after_update_balance
AFTER UPDATE ON `expense_participants`
FOR EACH ROW
BEGIN
  DECLARE grp_id INT UNSIGNED;

  SELECT group_id INTO grp_id
    FROM expenses
   WHERE expense_id = NEW.expense_id
   LIMIT 1;

  -- Revert old share
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, OLD.user_id, OLD.share_amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + OLD.share_amount,
    last_updated = CURRENT_TIMESTAMP;

  -- Apply new share
  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, NEW.user_id, -NEW.share_amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net - NEW.share_amount,
    last_updated = CURRENT_TIMESTAMP;
END$$


-- When a participant is removed: revert their share
CREATE TRIGGER trg_expense_participants_after_delete_balance
AFTER DELETE ON `expense_participants`
FOR EACH ROW
BEGIN
  DECLARE grp_id INT UNSIGNED;

  SELECT group_id INTO grp_id
    FROM expenses
   WHERE expense_id = OLD.expense_id
   LIMIT 1;

  INSERT INTO user_balances (group_id, user_id, net, last_updated)
  VALUES (grp_id, OLD.user_id, OLD.share_amount, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    net = net + OLD.share_amount,
    last_updated = CURRENT_TIMESTAMP;
END$$

DELIMITER ;
