// api/searchTrainers.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrainerResponse {
  trainer_id: number;
  gymId: number;
  intro: string;
  experienceYears: number;
  availableHours: string;
  oneDayAvailable: boolean;
}

export interface SearchTrainerRequest {
  myLatitude?: number | null;
  myLongitude?: number | null;
  name?: string | null;
  address?: string | null;
  interests?: string[] | null;
  sortBy?: string | null;
}

const API_URL = 'http://70.12.246.176:8080';

export const searchTrainers = async (params: SearchTrainerRequest): Promise<TrainerResponse[]> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    console.log('Requesting to:', `${API_URL}/trainers/search`);
    console.log('With params:', params);

    const response = await fetch(`${API_URL}/trainers/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('API Error details:', error);
    throw error;
  }
};