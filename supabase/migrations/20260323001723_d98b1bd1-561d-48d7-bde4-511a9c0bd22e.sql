DELETE FROM public.lounge_bookings WHERE customer_email = 'test@test.de';

-- Also reset the lounges that were affected back to available
UPDATE public.lounges SET status = 'available' WHERE status IN ('reserved', 'booked');