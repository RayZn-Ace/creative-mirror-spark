
-- Delete user roles for these users
DELETE FROM public.user_roles WHERE user_id IN ('d41a82b2-f83c-4ba1-b365-1298726c3bfe', '0459ec70-27d0-4c76-bd42-930411965ad6');

-- Delete pending invitations
DELETE FROM public.pending_invitations WHERE email IN ('kontakt@smea.info', 'kay@smea.info');

-- Delete profiles
DELETE FROM public.profiles WHERE user_id IN ('d41a82b2-f83c-4ba1-b365-1298726c3bfe', '0459ec70-27d0-4c76-bd42-930411965ad6');
