import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { EXPO_PUBLIC_BASE_URL } from "@env";

// API 응답 타입
export interface Media {
  id: number;
  type: string;
  path: string;
  createdAt: string | null;
}

// 선택된 미디어 타입
export interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
}

// GET 응답에서 사용되는 타입
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

// POST 요청에서 사용되는 타입
export interface CreateExerciseRecordRequest {
  data: {
    exerciseId: number;
    set: number;
    rep: number;
    weight: number;
  };
  medias?: SelectedMedia[];
}

// PATCH 요청에서 사용되는 타입
export interface UpdateExerciseRecordRequest {
  data: {
    exerciseRecordId: number;
    set: number;
    rep: number;
    weight: number;
    mediaIdsToDelete?: number[];
  };
  medias?: SelectedMedia[];
}

// 운동 기록 조회
export const fetchExerciseRecords = async (date: string): Promise<ExerciseRecord[]> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const formattedDate = date.replace(/-/g, ''); // YYYY-MM-DD를 YYYYMMDD로 변환

    const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercise-records?date=${formattedDate}`, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) throw new Error('Failed to fetch exercise records');

    return await response.json();
  } catch (error) {
    console.error('Error fetching exercise records:', error);
    throw error;
  }
};

// 운동 기록 생성
export const createExerciseRecord = async (formData: FormData): Promise<ExerciseRecord> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const url = `${EXPO_PUBLIC_BASE_URL}/exercise-records`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      },
      body: formData,
    });

    console.log('Response headers:', response.headers);
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${responseText}`);
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
};

// 운동 기록 삭제
export const deleteExerciseRecord = async (id: number): Promise<void> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercise-records/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json'
      },
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Failed to delete exercise record: ${response.status} ${responseText}`);
    }
  } catch (error) {
    console.error('Error deleting exercise record:', error);
    throw error;
  }
};

// 운동 기록 수정
export const updateExerciseRecord = async (id: number, formData: FormData): Promise<void> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercise-records/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      },
      body: formData,
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Failed to update exercise record: ${response.status} ${responseText}`);
    }
  } catch (error) {
    console.error('Error updating exercise record:', error);
    throw error;
  }
};