import { SavedDiaryEntry, SavedPlanEntry, ArchivedReading } from '../types';
import { supabase } from './supabaseClient';

/**
 * Service to synchronize data with Supabase.
 * If the user is not logged in, it can optionally fall back to localStorage 
 * but for this multi-user version we prioritize Supabase.
 */

// --- Diary Entries ---
export const getDiaryEntries = async (storageKey: string): Promise<SavedDiaryEntry[]> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Fallback to localStorage if not logged in (for guest mode or until login)
    const data = window.localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Fetch from Supabase
  const { data, error } = await supabase
    .from('meditation_logs')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('storage_key', storageKey)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching diary entries:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    content: item.content
  }));
};

export const saveDiaryEntries = async (storageKey: string, entries: SavedDiaryEntry[]): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();

  // Always save to localStorage as a safety backup
  window.localStorage.setItem(storageKey, JSON.stringify(entries));

  if (!session) return;

  // In Supabase, we usually save individual items rather than the whole list
  // but for the sake of simplicity in migration, we can upsert the latest one
  // or just save the newest one.
  const latestEntry = entries[0];
  if (!latestEntry) return;

  const { error } = await supabase
    .from('meditation_logs')
    .upsert({
      user_id: session.user.id,
      storage_key: storageKey,
      content: latestEntry.content,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving diary entry to Supabase:', error);
  }
};

// --- Mission Plans ---
export const getMissionPlans = async (storageKey: string): Promise<SavedPlanEntry[]> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const data = window.localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  }

  const { data, error } = await supabase
    .from('mission_plans')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('storage_key', storageKey)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mission plans:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    content: item.content
  }));
};

export const saveMissionPlans = async (storageKey: string, plans: SavedPlanEntry[]): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();

  window.localStorage.setItem(storageKey, JSON.stringify(plans));

  if (!session) return;

  const latestPlan = plans[0];
  if (!latestPlan) return;

  const { error } = await supabase
    .from('mission_plans')
    .upsert({
      user_id: session.user.id,
      storage_key: storageKey,
      content: latestPlan.content,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving mission plan to Supabase:', error);
  }
};

// --- Meditation Status ---
export type MeditationStatus = 'good' | 'ok' | 'bad';
export type MeditationRecord = Record<number, MeditationStatus>;

export const getMeditationStatus = async (): Promise<MeditationRecord> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const data = window.localStorage.getItem('meditation-status');
    return data ? JSON.parse(data) : {};
  }

  const { data, error } = await supabase
    .from('meditation_status')
    .select('status_record')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    // If no record found, specific error code PGRST116 might be returned
    if (error.code !== 'PGRST116') {
      console.error('Error fetching meditation status:', error);
    }
    return {};
  }

  return data?.status_record || {};
};

export const saveMeditationStatus = async (status: MeditationRecord): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();

  window.localStorage.setItem('meditation-status', JSON.stringify(status));

  if (!session) return;

  const { error } = await supabase
    .from('meditation_status')
    .upsert({
      user_id: session.user.id,
      status_record: status,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving meditation status:', error);
  }
};

// --- Archived Readings ---
export const getArchivedReadings = async (): Promise<Record<number, ArchivedReading>> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const data = window.localStorage.getItem('archived-readings');
    return data ? JSON.parse(data) : {};
  }

  const { data, error } = await supabase
    .from('archived_readings')
    .select('*')
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error fetching archived readings:', error);
    return {};
  }

  // Convert array back to Record<number, ArchivedReading>
  const record: Record<number, ArchivedReading> = {};
  if (data) {
    data.forEach((item: any) => {
      if (item.content) {
        record[item.day] = item.content;
      }
    });
  }

  return record;
};

export const saveArchivedReading = async (day: number, readingData: ArchivedReading): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();

  // Local backup
  const allReadings = await getArchivedReadings();
  const updatedReadings = { ...allReadings, [day]: readingData };
  window.localStorage.setItem('archived-readings', JSON.stringify(updatedReadings));

  if (!session) return;

  const { error } = await supabase
    .from('archived_readings')
    .upsert({
      user_id: session.user.id,
      day: day,
      content: readingData,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id, day' });

  if (error) {
    console.error('Error saving archived reading:', error);
  }
};
