import { SavedDiaryEntry, SavedPlanEntry, ArchivedReading } from '../types';

// This is a mock service to simulate a backend for data synchronization.
// It uses localStorage for persistence in this demo, but in a real app,
// it would make network requests to a server.

const MOCK_LATENCY = 500;

const simulateNetworkRequest = <T>(data?: T): Promise<T | void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, MOCK_LATENCY);
  });
};

// --- Diary Entries ---
export const getDiaryEntries = async (storageKey: string): Promise<SavedDiaryEntry[]> => {
  const data = window.localStorage.getItem(storageKey);
  const entries = data ? JSON.parse(data) : [];
  return simulateNetworkRequest(entries) as Promise<SavedDiaryEntry[]>;
};

export const saveDiaryEntries = async (storageKey: string, entries: SavedDiaryEntry[]): Promise<void> => {
  window.localStorage.setItem(storageKey, JSON.stringify(entries));
  return simulateNetworkRequest();
};

// --- Mission Plans ---
export const getMissionPlans = async (storageKey: string): Promise<SavedPlanEntry[]> => {
  const data = window.localStorage.getItem(storageKey);
  const plans = data ? JSON.parse(data) : [];
  return simulateNetworkRequest(plans) as Promise<SavedPlanEntry[]>;
};

export const saveMissionPlans = async (storageKey: string, plans: SavedPlanEntry[]): Promise<void> => {
  window.localStorage.setItem(storageKey, JSON.stringify(plans));
  return simulateNetworkRequest();
};

// --- Meditation Status ---
export type MeditationStatus = 'good' | 'ok' | 'bad';
export type MeditationRecord = Record<number, MeditationStatus>;

export const getMeditationStatus = async (): Promise<MeditationRecord> => {
  const data = window.localStorage.getItem('meditation-status');
  const status = data ? JSON.parse(data) : {};
  return simulateNetworkRequest(status) as Promise<MeditationRecord>;
};

export const saveMeditationStatus = async (status: MeditationRecord): Promise<void> => {
  window.localStorage.setItem('meditation-status', JSON.stringify(status));
  return simulateNetworkRequest();
};


// --- Archived Readings ---
export const getArchivedReadings = async (): Promise<Record<number, ArchivedReading>> => {
  const data = window.localStorage.getItem('archived-readings');
  const readings = data ? JSON.parse(data) : {};
  return simulateNetworkRequest(readings) as Promise<Record<number, ArchivedReading>>;
};

export const saveArchivedReading = async (day: number, readingData: ArchivedReading): Promise<void> => {
  const allReadings = await getArchivedReadings();
  const updatedReadings = {
    ...allReadings,
    [day]: readingData,
  };
  window.localStorage.setItem('archived-readings', JSON.stringify(updatedReadings));
  return simulateNetworkRequest();
};
