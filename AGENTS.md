
- Public pages read order/ticket data only via SECURITY DEFINER RPCs (get_order_confirmation, count_paid_orders, sold_tickets_by_category, recent_purchases_public); never add public SELECT on orders/tickets — they hold personal data.
- Privileged edge functions (send-push, send-tickets, validate-ticket without scanner link) require service-role bearer or an admin/scanner role; internal callers must send the service-role bearer.
- Keep ticket-protection terms in one shared presentation component for checkout, the AGB page, and the standalone public /ticketschutz-agb page to prevent conflicting conditions; this component does not implement refund processing.
