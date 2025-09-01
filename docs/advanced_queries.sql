-- Login
SELECT username,password_hash FROM app_users;

-- Profile
SELECT name,username,phone,email,password_hash FROM app_users;

-- Your Groups
SELECT 
    eg.group_id,
    eg.group_name,
    COUNT(DISTINCT gm.user_id) AS num_members,
    IFNULL(SUM(e.amount), 0) AS total_spent,
    IFNULL(ub.net, 0) AS user_balance
FROM expense_groups eg
LEFT JOIN group_memberships gm ON eg.group_id = gm.group_id
LEFT JOIN expenses e ON eg.group_id = e.group_id
LEFT JOIN user_balances ub 
    ON eg.group_id = ub.group_id AND ub.user_id = ?  -- Reemplazar el ? por el ID del usuario
GROUP BY eg.group_id, eg.group_name, ub.net
ORDER BY eg.group_name;

-- View Detailed Expenses by User
SELECT
  e.expense_name,
  u.name AS paid_by_user,
  e.date,
  e.amount,
  e.category,
  CASE
    WHEN e.paid_by = [ID_DEL_USUARIO] THEN e.amount - COALESCE(ep.share_amount, 0)
    ELSE COALESCE(ep.share_amount, 0)
  END AS user_contribution
FROM expenses AS e
JOIN app_users AS u
  ON e.paid_by = u.user_id
LEFT JOIN expense_participants AS ep
  ON e.expense_id = ep.expense_id AND ep.user_id = [ID_DEL_USUARIO]
WHERE
  e.group_id = [ID_DEL_GRUPO]
ORDER BY
  e.date DESC;

-- Query to display all details of an expense
SELECT
  e.expense_name,
  e.amount,
  e.date,
  e.description,
  e.category,
  u.name AS paid_by_user,
  GROUP_CONCAT(
    CONCAT(au.name, ': ', ep.share_amount)
    ORDER BY
      au.name
    SEPARATOR ', '
  ) AS participants_and_shares
FROM expenses AS e
JOIN app_users AS u
  ON e.paid_by = u.user_id
JOIN expense_participants AS ep
  ON e.expense_id = ep.expense_id
JOIN app_users AS au
  ON ep.user_id = au.user_id
WHERE
  e.expense_id = [ID_DEL_GASTO]
GROUP BY
  e.expense_id,
  e.expense_name,
  e.amount,
  e.date,
  e.description,
  e.category,
  u.name;

-- Query to display payment details (settlements)
SELECT
  s.created_at AS settlement_date,
  s.amount,
  u_from.name AS from_user,
  u_to.name AS to_user
FROM settlements AS s
JOIN app_users AS u_from
  ON s.from_user = u_from.user_id
JOIN app_users AS u_to
  ON s.to_user = u_to.user_id
ORDER BY
  s.created_at DESC;