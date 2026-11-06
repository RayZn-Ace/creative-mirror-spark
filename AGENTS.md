
- Public pages read order/ticket data only via SECURITY DEFINER RPCs (get_order_confirmation, count_paid_orders, sold_tickets_by_category, recent_purchases_public); never add public SELECT on orders/tickets — they hold personal data.
- Privileged edge functions (send-push, send-tickets, validate-ticket without scanner link) require service-role bearer or an admin/scanner role; internal callers must send the service-role bearer.
- Keep ticket-protection terms in one shared presentation component for checkout, the AGB page, and the standalone public /ticketschutz-agb page to prevent conflicting conditions; this component does not implement refund processing.
- Keep event age in the existing is_16plus field with explicit selection and a shared badge/validator; this preserves historical limits without a competing source of truth.
- Missing-ticket intake uses a validated write-only edge function and service-only RPC into the existing support inbox; it must not reveal orders or send tickets automatically.
- Public photos open with published album cards and fetch media only for the selected album; pagination preserves access to large existing albums.
- Event-linked Muttizettel prompts use the shared event-age mapping; the existing wizard also offers a temporary browser-only print document so preparation does not depend on storage or email delivery.
