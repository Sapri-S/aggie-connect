-- Demo members can't sign in, so they can't accept connection requests.
-- Run this in the SQL Editor to accept every pending request sent to a demo
-- member, so you can test what a connection looks like. Safe to run anytime.

update public.connections c
   set status = 'accepted'
  from auth.users u
 where c.receiver_id = u.id
   and u.email like '%@demo.aggieconnect.invalid'
   and c.status = 'pending';
