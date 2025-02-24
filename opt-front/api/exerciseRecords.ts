import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_BASE_URL } from "@env";

export interface ExerciseRecord {
  id: number;
  exerciseId: number;
  exerciseName: string;
  exerciseImage: string | null;
  medias: Media[];
  sets: number;
  rep: number;
  weight: number;
  duration: number | null;
  distance: number | null;
}

export interface Media {
  id: number;
  type: string;
  path: string;
  createdAt: string | null;
}

export interface CreateExerciseRecordRequest {
  exerciseId: number;
  set: number;
  rep: number;
  weight: number;
  duration?: number | null;
  distance?: number | null;
}

export interface UpdateExerciseRecordRequest {
  exerciseRecordId: number;
  set: number;
  rep: number;
  weight: number;
  duration?: number | null;
  distance?: number | null;
  mediaIdsToDelete?: number[];
}

export const fetchExerciseRecords = async (date: string): Promise<ExerciseRecord[]> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token found');

  const formattedDate = date.replace(/-/g, '');
  const url = `${EXPO_PUBLIC_BASE_URL}/exercise-records?date=${formattedDate}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch exercise records`);
  }

  return await response.json();
};

export const createExerciseRecord = async (formData: FormData): Promise<ExerciseRecord> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token found');

  const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercise-records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Server error`);
  }

  return await response.json();
};

export const deleteExerciseRecord = async (id: number): Promise<void> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token found');

  const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercise-records/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete exercise record`);
  }
};

export const updateExerciseRecord = async (id: number, formData: FormData): Promise<ExerciseRecord> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token found');

  const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercise-records/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'multipart/form-data'
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to update exercise record`);
  }

  try {
    return await response.json();
  } catch {
    return {} as ExerciseRecord;
  }
};