export const EMAIL_TEMPLATE_KEYS = [
  "marketing_campaign",
  "order_confirmation",
  "wire_transfer_invoice",
  "unpaid_order_reminder",
  "abandoned_cart",
  "review_request",
  "password_reset",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  marketing_campaign: "Marketing campaign",
  order_confirmation: "Order confirmation",
  wire_transfer_invoice: "Wire transfer invoice",
  unpaid_order_reminder: "Unpaid order reminder",
  abandoned_cart: "Abandoned cart reminder",
  review_request: "Review request",
  password_reset: "Password reset",
};
