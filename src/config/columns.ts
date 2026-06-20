export type ColumnType = 'number' | 'text' | 'percent' | 'currency'

export interface ColumnDef {
  key: string
  label: string
  type: ColumnType
  defaultOrder: number
  includeInTotals: boolean
}

// ⚠️ Replace these with the actual column names from your Excel file.
// key = snake_case identifier (used as JSON key in Supabase)
// label = exact display name shown in the grid header
export const COLUMNS: ColumnDef[] = [
  { key: 'cars_serviced',         label: 'Cars Serviced',         type: 'number',   defaultOrder: 0,  includeInTotals: true },
  { key: 'gross_revenue',         label: 'Gross Revenue',         type: 'currency', defaultOrder: 1,  includeInTotals: true },
  { key: 'full_service',          label: 'Full Service',          type: 'number',   defaultOrder: 2,  includeInTotals: true },
  { key: 'signature_service',     label: 'Signature Service',     type: 'number',   defaultOrder: 3,  includeInTotals: true },
  { key: 'express_service',       label: 'Express Service',       type: 'number',   defaultOrder: 4,  includeInTotals: true },
  { key: 'oil_changes',           label: 'Oil Changes',           type: 'number',   defaultOrder: 5,  includeInTotals: true },
  { key: 'air_filters',           label: 'Air Filters',           type: 'number',   defaultOrder: 6,  includeInTotals: true },
  { key: 'cabin_filters',         label: 'Cabin Filters',         type: 'number',   defaultOrder: 7,  includeInTotals: true },
  { key: 'wipers',                label: 'Wipers',                type: 'number',   defaultOrder: 8,  includeInTotals: true },
  { key: 'coolant',               label: 'Coolant',               type: 'number',   defaultOrder: 9,  includeInTotals: true },
  { key: 'transmission',          label: 'Transmission',          type: 'number',   defaultOrder: 10, includeInTotals: true },
  { key: 'fuel_system',           label: 'Fuel System',           type: 'number',   defaultOrder: 11, includeInTotals: true },
  { key: 'labor_revenue',         label: 'Labor Revenue',         type: 'currency', defaultOrder: 12, includeInTotals: true },
  { key: 'parts_revenue',         label: 'Parts Revenue',         type: 'currency', defaultOrder: 13, includeInTotals: true },
  { key: 'average_ticket',        label: 'Avg Ticket',            type: 'currency', defaultOrder: 14, includeInTotals: false },
  { key: 'cars_per_hour',         label: 'Cars/Hour',             type: 'number',   defaultOrder: 15, includeInTotals: false },
  { key: 'labor_hours',           label: 'Labor Hours',           type: 'number',   defaultOrder: 16, includeInTotals: true },
  { key: 'employees_on_duty',     label: 'Employees on Duty',     type: 'number',   defaultOrder: 17, includeInTotals: false },
  { key: 'upsell_rate',           label: 'Upsell Rate',           type: 'percent',  defaultOrder: 18, includeInTotals: false },
  { key: 'coupon_count',          label: 'Coupon Count',          type: 'number',   defaultOrder: 19, includeInTotals: true },
  { key: 'coupon_discount',       label: 'Coupon Discount',       type: 'currency', defaultOrder: 20, includeInTotals: true },
  { key: 'net_revenue',           label: 'Net Revenue',           type: 'currency', defaultOrder: 21, includeInTotals: true },
  { key: 'cash_sales',            label: 'Cash Sales',            type: 'currency', defaultOrder: 22, includeInTotals: true },
  { key: 'card_sales',            label: 'Card Sales',            type: 'currency', defaultOrder: 23, includeInTotals: true },
  { key: 'notes',                 label: 'Notes',                 type: 'text',     defaultOrder: 24, includeInTotals: false },
]
