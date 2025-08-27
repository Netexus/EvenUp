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