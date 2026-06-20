export type ColumnType = 'number' | 'text' | 'percent' | 'currency'
export type ColumnSection = 'md' | 'eod'

export interface ColumnDef {
  key: string
  label: string
  type: ColumnType
  defaultOrder: number
  includeInTotals: boolean
  section: ColumnSection
}

export const COLUMNS: ColumnDef[] = [
  // ── Mid-Day (MD) ─────────────────────────────────────────────────────
  { key: 'starting_members_md',          label: 'Starting Members - MD',          type: 'number',   defaultOrder: 0,  includeInTotals: false, section: 'md' },
  { key: 'current_members_md',           label: 'Current Members - MD',           type: 'number',   defaultOrder: 1,  includeInTotals: false, section: 'md' },
  { key: 'memberships_sold_md',          label: 'Memberships Sold - MD',          type: 'number',   defaultOrder: 2,  includeInTotals: true,  section: 'md' },
  { key: 'conversion_rate_md',           label: 'Conversion Rate - MD',           type: 'percent',  defaultOrder: 3,  includeInTotals: false, section: 'md' },
  { key: 'recurring_revenue_md',         label: 'Recurring Revenue - MD',         type: 'currency', defaultOrder: 4,  includeInTotals: true,  section: 'md' },
  { key: 'retail_revenue_md',            label: 'Retail Revenue - MD',            type: 'currency', defaultOrder: 5,  includeInTotals: true,  section: 'md' },
  { key: 'total_revenue_md',             label: 'Total Revenue - MD',             type: 'currency', defaultOrder: 6,  includeInTotals: true,  section: 'md' },
  { key: 'express_retail_washes_md',     label: 'Express Retail Washes - MD',     type: 'number',   defaultOrder: 7,  includeInTotals: true,  section: 'md' },
  { key: 'full_serve_retail_washes_md',  label: 'Full Serve Retail Washes - MD',  type: 'number',   defaultOrder: 8,  includeInTotals: true,  section: 'md' },
  { key: 'full_serve_upgrades_md',       label: 'Full Serve Upgrades - MD',       type: 'number',   defaultOrder: 9,  includeInTotals: true,  section: 'md' },
  { key: 'member_washes_md',             label: 'Member Washes - MD',             type: 'number',   defaultOrder: 10, includeInTotals: true,  section: 'md' },
  { key: 'total_washes_md',              label: 'Total Washes - MD',              type: 'number',   defaultOrder: 11, includeInTotals: true,  section: 'md' },

  // ── End of Day (EOD) ─────────────────────────────────────────────────
  { key: 'govt_washes',                  label: "Gov't Washes",                   type: 'number',   defaultOrder: 12, includeInTotals: true,  section: 'eod' },
  { key: 'lube_washes',                  label: 'Lube Washes',                    type: 'number',   defaultOrder: 13, includeInTotals: true,  section: 'eod' },
  { key: 'rewashes',                     label: 'Rewashes',                       type: 'number',   defaultOrder: 14, includeInTotals: true,  section: 'eod' },
  { key: 'express_retail_washes',        label: 'Express Retail Washes',          type: 'number',   defaultOrder: 15, includeInTotals: true,  section: 'eod' },
  { key: 'full_serve_retail_washes',     label: 'Full Serve Retail Washes',       type: 'number',   defaultOrder: 16, includeInTotals: true,  section: 'eod' },
  { key: 'full_serve_upgrades',          label: 'Full Serve Upgrades',            type: 'number',   defaultOrder: 17, includeInTotals: true,  section: 'eod' },
  { key: 'retail_washes_base',           label: 'Retail Washes -Base',            type: 'number',   defaultOrder: 18, includeInTotals: true,  section: 'eod' },
  { key: 'retail_washes_basic',          label: 'Retail Washes -Basic',           type: 'number',   defaultOrder: 19, includeInTotals: true,  section: 'eod' },
  { key: 'retail_washes_good',           label: 'Retail Washes -Good',            type: 'number',   defaultOrder: 20, includeInTotals: true,  section: 'eod' },
  { key: 'retail_washes_better',         label: 'Retail Washes -Better',          type: 'number',   defaultOrder: 21, includeInTotals: true,  section: 'eod' },
  { key: 'retail_washes_best',           label: 'Retail Washes -Best',            type: 'number',   defaultOrder: 22, includeInTotals: true,  section: 'eod' },
  { key: 'retail_washes',               label: 'Retail Washes',                  type: 'number',   defaultOrder: 23, includeInTotals: true,  section: 'eod' },
  { key: 'member_washes',               label: 'Member Washes',                  type: 'number',   defaultOrder: 24, includeInTotals: true,  section: 'eod' },
  { key: 'total_washes',                label: 'Total Washes',                   type: 'number',   defaultOrder: 25, includeInTotals: true,  section: 'eod' },
  { key: 'cc_transactions',             label: 'CC Transactions',                type: 'number',   defaultOrder: 26, includeInTotals: true,  section: 'eod' },
  { key: 'cash_sales',                  label: 'Cash Sales',                     type: 'currency', defaultOrder: 27, includeInTotals: true,  section: 'eod' },
  { key: 'fleet',                        label: 'Fleet',                          type: 'number',   defaultOrder: 28, includeInTotals: true,  section: 'eod' },
  { key: 'recurring_revenue',            label: 'Recurring Revenue',              type: 'currency', defaultOrder: 29, includeInTotals: true,  section: 'eod' },
  { key: 'retail_revenue',               label: 'Retail Revenue',                 type: 'currency', defaultOrder: 30, includeInTotals: true,  section: 'eod' },
  { key: 'total_revenue',               label: 'Total Revenue',                  type: 'currency', defaultOrder: 31, includeInTotals: true,  section: 'eod' },
  { key: 'average_ticket',              label: 'Average Ticket',                 type: 'currency', defaultOrder: 32, includeInTotals: false, section: 'eod' },
  { key: 'memberships_sold_basic',      label: 'Memberships Sold -Basic',        type: 'number',   defaultOrder: 33, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_sold_good',       label: 'Memberships Sold -Good',         type: 'number',   defaultOrder: 34, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_sold_better',     label: 'Memberships Sold -Better',       type: 'number',   defaultOrder: 35, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_sold_best',       label: 'Memberships Sold -Best',         type: 'number',   defaultOrder: 36, includeInTotals: true,  section: 'eod' },
  { key: 'new_membership_revenue',      label: 'New Membership Revenue',         type: 'currency', defaultOrder: 37, includeInTotals: true,  section: 'eod' },
  { key: 'total_memberships_sold',      label: 'Total Memberships Sold',         type: 'number',   defaultOrder: 38, includeInTotals: true,  section: 'eod' },
  { key: 'reactivation',                label: 'Reactivation',                   type: 'number',   defaultOrder: 39, includeInTotals: true,  section: 'eod' },
  { key: 'cancelled',                   label: 'Cancelled',                      type: 'number',   defaultOrder: 40, includeInTotals: true,  section: 'eod' },
  { key: 'declined',                    label: 'Declined',                       type: 'number',   defaultOrder: 41, includeInTotals: true,  section: 'eod' },
  { key: 'conversion_pct',              label: 'Conversion %',                   type: 'percent',  defaultOrder: 42, includeInTotals: false, section: 'eod' },
  { key: 'churn_pct',                   label: 'Churn %',                        type: 'percent',  defaultOrder: 43, includeInTotals: false, section: 'eod' },
  { key: 'total_active_members',        label: 'Total Active Members',           type: 'number',   defaultOrder: 44, includeInTotals: false, section: 'eod' },
  { key: 'retail_revenue_per_car',      label: 'Retail Revenue per Car',         type: 'currency', defaultOrder: 45, includeInTotals: false, section: 'eod' },
  { key: 'gift_cards_sold',             label: 'Gift Cards Sold',                type: 'number',   defaultOrder: 46, includeInTotals: true,  section: 'eod' },
  { key: 'gift_card_sales_amt',         label: 'Gift Card Sales $ Amt',          type: 'currency', defaultOrder: 47, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_redeemed_base',   label: 'Memberships Redeemed - Base',    type: 'number',   defaultOrder: 48, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_redeemed_basic',  label: 'Memberships Redeemed - Basic',   type: 'number',   defaultOrder: 49, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_redeemed_good',   label: 'Memberships Redeemed - Good',    type: 'number',   defaultOrder: 50, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_redeemed_better', label: 'Memberships Redeemed - Better',  type: 'number',   defaultOrder: 51, includeInTotals: true,  section: 'eod' },
  { key: 'memberships_redeemed_best',   label: 'Memberships Redeemed - Best',    type: 'number',   defaultOrder: 52, includeInTotals: true,  section: 'eod' },
  { key: 'total_washes_base',           label: 'Total Washes - Base',            type: 'number',   defaultOrder: 53, includeInTotals: true,  section: 'eod' },
  { key: 'total_washes_basic',          label: 'Total Washes - Basic',           type: 'number',   defaultOrder: 54, includeInTotals: true,  section: 'eod' },
  { key: 'total_washes_good',           label: 'Total Washes - Good',            type: 'number',   defaultOrder: 55, includeInTotals: true,  section: 'eod' },
  { key: 'total_washes_better',         label: 'Total Washes - Better',          type: 'number',   defaultOrder: 56, includeInTotals: true,  section: 'eod' },
  { key: 'total_washes_best',           label: 'Total Washes - Best',            type: 'number',   defaultOrder: 57, includeInTotals: true,  section: 'eod' },
  { key: 'refund_amt',                  label: 'Refund $',                       type: 'currency', defaultOrder: 58, includeInTotals: true,  section: 'eod' },
  { key: 'refund_count',                label: 'Refund Count',                   type: 'number',   defaultOrder: 59, includeInTotals: true,  section: 'eod' },
  { key: 'paidouts_amt',                label: 'Paidouts $',                     type: 'currency', defaultOrder: 60, includeInTotals: true,  section: 'eod' },
  { key: 'paidouts_count',              label: 'Paidouts Count',                 type: 'number',   defaultOrder: 61, includeInTotals: true,  section: 'eod' },
  { key: 'air_freshener',               label: 'Air Freshener',                  type: 'number',   defaultOrder: 62, includeInTotals: true,  section: 'eod' },
]

export const MD_COLUMNS  = COLUMNS.filter(c => c.section === 'md')
export const EOD_COLUMNS = COLUMNS.filter(c => c.section === 'eod')
