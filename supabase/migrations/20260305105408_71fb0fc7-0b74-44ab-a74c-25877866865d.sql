-- Delete all test data: tickets first (FK to orders), then orders
DELETE FROM public.tickets;
DELETE FROM public.orders;