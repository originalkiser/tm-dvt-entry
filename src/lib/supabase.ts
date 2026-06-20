import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DailyEntry {
  id?: string
  location_id: string
  entry_date: string
  data: Record<string, unknown>
  confidence: Record<string, 'certain' | 'uncertain' | 'manual'>
  created_at?: string
  updated_at?: string
}

export async function fetchEntries(
  locationId: string,
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('location_id', locationId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function upsertEntry(
  locationId: string,
  date: string,
  data: Record<string, unknown>,
  confidence: Record<string, string>
): Promise<void> {
  const { error } = await supabase
    .from('daily_entries')
    .upsert(
      {
        location_id: locationId,
        entry_date: date,
        data,
        confidence,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'location_id,entry_date' }
    )

  if (error) throw error
}

export async function fetchTodayStatus(locationIds: string[]): Promise<Set<string>> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_entries')
    .select('location_id')
    .in('location_id', locationIds)
    .eq('entry_date', today)

  if (error) {
    console.error('fetchTodayStatus error:', error)
    return new Set()
  }
  return new Set((data ?? []).map((r) => r.location_id as string))
}

export async function purgeOldEntries(): Promise<void> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { error } = await supabase
    .from('daily_entries')
    .delete()
    .lt('entry_date', cutoffStr)

  if (error) console.error('purgeOldEntries error (non-fatal):', error)
}
