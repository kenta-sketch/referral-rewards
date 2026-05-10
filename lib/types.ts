export type Member = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  parent_id: string | null;
  access_token: string;
  is_active: boolean;
  is_closer: boolean;
  default_receipt_type: "taxed" | "deferred";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: string;
  client_name: string;
  toss_up_member_id: string;
  closer_member_id: string | null;
  expected_headcount: number | null;
  actual_headcount: number | null;
  unit_price_taxed_yen: number;
  unit_price_deferred_yen: number;
  status: "tossed_up" | "confirmed" | "canceled";
  meeting_date: string | null;
  notes: string | null;
  tossed_up_at: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Payout = {
  id: string;
  deal_id: string;
  member_id: string;
  tier: number;
  share_ratio: string; // numeric arrives as string
  snapshot_parent_id: string | null;
  snapshot_grandparent_id: string | null;
  amount_taxed_yen: number;
  amount_deferred_yen: number;
  receipt_type: "taxed" | "deferred";
  payment_status: "unpaid" | "scheduled" | "paid";
  scheduled_payment_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PayoutWithDeal = Payout & {
  deal: Deal;
};
