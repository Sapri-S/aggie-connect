-- Removes every demo member created by demo_accounts.sql.
-- Their profiles and connections are deleted with them (on delete cascade).
-- Run before inviting real users.

delete from auth.users
 where email like '%@demo.aggieconnect.invalid';
