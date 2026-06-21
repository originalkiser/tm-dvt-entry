import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ────────────────────────────────────────────────────────────────

export interface DailyEntry {
  id?: string
  location_id: string
  entry_date: string
  data: Record<string, unknown>
  confidence: Record<string, 'certain' | 'uncertain' | 'manual'>
  created_at?: string
  updated_at?: string
}

export interface DVTLocation {
  id: string
  location_id: string
  name: string
  sheet_name: string
  is_active: boolean
}

export interface ColumnView {
  id: string
  name: string
  description: string | null
  section: 'md' | 'eod'
  column_keys: string[]
  is_global: boolean
  created_by: string | null
  created_at: string
}

export type DVTRole = 'admin' | 'user'

// ── Auth ─────────────────────────────────────────────────────────────────

export async function getCurrentUserRole(): Promise<DVTRole | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!data) return 'user'
  return data.role === 'admin' ? 'admin' : 'user'
}

// ── Locations ────────────────────────────────────────────────────────────

export async function fetchLocations(): Promise<DVTLocation[]> {
  const { data, error } = await supabase
    .from('dvt_locations')
    .select('*')
    .order('location_id')
  if (error) throw error
  return data ?? []
}

export async function updateLocationActive(locationId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('dvt_locations')
    .update({ is_active: isActive })
    .eq('location_id', locationId)
  if (error) throw error
}

// ── Entries ──────────────────────────────────────────────────────────────

export async function fetchEntries(
  locationId: string,
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('dvt_daily_entries')
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
    .from('dvt_daily_entries')
    .upsert(
      { location_id: locationId, entry_date: date, data, confidence, updated_at: new Date().toISOString() },
      { onConflict: 'location_id,entry_date' }
    )
  if (error) throw error
}

export async function fetchTodayStatus(locationIds: string[]): Promise<Set<string>> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('dvt_daily_entries')
    .select('location_id')
    .in('location_id', locationIds)
    .eq('entry_date', today)
  if (error) { console.error('fetchTodayStatus error:', error); return new Set() }
  return new Set((data ?? []).map((r) => r.location_id as string))
}

export async function purgeOldEntries(): Promise<void> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)
  const { error } = await supabase
    .from('dvt_daily_entries')
    .delete()
    .lt('entry_date', cutoff.toISOString().split('T')[0])
  if (error) console.error('purgeOldEntries (non-fatal):', error)
}

// ── User Preferences ─────────────────────────────────────────────────────

export interface UserPreferences {
  hidden_location_ids: string[]
}

export async function fetchUserPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('dvt_user_preferences')
    .select('hidden_location_ids')
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('dvt_user_preferences')
    .upsert(
      { user_id: user.id, hidden_location_ids: prefs.hidden_location_ids, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) throw error
}

// ── Column Views ─────────────────────────────────────────────────────────

export async function fetchColumnViews(): Promise<ColumnView[]> {
  const { data, error } = await supabase
    .from('dvt_column_views')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function saveColumnView(
  name: string,
  section: 'md' | 'eod',
  columnKeys: string[],
  description?: string
): Promise<ColumnView> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('dvt_column_views')
    .insert({ name, section, column_keys: columnKeys, description: description ?? null, created_by: user?.id ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateColumnViewGlobal(id: string, isGlobal: boolean): Promise<void> {
  const { error } = await supabase
    .from('dvt_column_views')
    .update({ is_global: isGlobal })
    .eq('id', id)
  if (error) throw error
}

export async function deleteColumnView(id: string): Promise<void> {
  const { error } = await supabase.from('dvt_column_views').delete().eq('id', id)
  if (error) throw error
}
