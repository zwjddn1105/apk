import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_BASE_URL } from "@env";

export const fetchAIReport = async (year: number, month: number, weekNumber: number): Promise<string> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  const response = await fetch(
    `${EXPO_PUBLIC_BASE_URL}/ai-reports?year=${year}&month=${month}&weekNumber=${weekNumber}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch AI report`);
  }

  const data = await response.text();
  if (!data) {
    throw new Error('Empty response received from server');
  }

  return data;
};