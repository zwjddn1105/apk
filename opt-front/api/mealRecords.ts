import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_BASE_URL } from '@env';
import { Platform } from 'react-native';

export interface MealRecord {
 createdDate: string;
 calorie: number;
 protein: number;
 carbs: number;
 fat: number;
 imagePath: string;
 type: "아침" | "점심" | "저녁";
}

export interface CreateMealRequest {
 createdDate: string;
 type: "아침" | "점심" | "저녁";
}

export interface UpdateMealRequest {
 saved: {
   createdDate: string;
   type: string;
 };
 update: {
   createdDate: string;
   type: string;
 };
}

const getAuthHeader = async () => {
 const refreshToken = await AsyncStorage.getItem('refreshToken');
 return {
   'Authorization': `Bearer ${refreshToken}`
 };
};

export const fetchMealRecords = async (date: string, type: string): Promise<MealRecord | null> => {
 const headers = await getAuthHeader();
 const response = await fetch(
   `${EXPO_PUBLIC_BASE_URL}/meal-records?createdDate=${date}&type=${type}`,
   { headers }
 );
 
 if (response.status === 404) {
   return null;
 }
 
 if (!response.ok) {
   throw new Error(`Failed to fetch meal records`);
 }
 
 return response.json();
};

export const createMealRecord = async (
 mealData: { createdDate: string; type: string },
 imageDetails: { uri: string; type?: string; name?: string }
): Promise<MealRecord> => {
 const refreshToken = await AsyncStorage.getItem('refreshToken');
 if (!refreshToken) throw new Error('No refresh token found');

 const formData = new FormData();
 
 formData.append('createdDate', mealData.createdDate);
 formData.append('type', mealData.type);
 
 const imageFile = {
   uri: Platform.OS === 'android' ? imageDetails.uri : imageDetails.uri.replace('file://', ''),
   type: imageDetails.type || 'image/jpeg',
   name: imageDetails.name || `meal_${Date.now()}.jpg`
 };
 formData.append('image', imageFile as any);

 const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/meal-records`, {
   method: 'POST',
   headers: {
     'Authorization': `Bearer ${refreshToken}`,
     'Content-Type': 'multipart/form-data',
   },
   body: formData
 });

 if (!response.ok) {
   throw new Error(`Server error`);
 }

 return response.json();
};

export const updateMealRecord = async (
 data: { createdDate: string; type: string },
 newImage: { uri: string; type?: string; name?: string }
): Promise<MealRecord> => {
 const refreshToken = await AsyncStorage.getItem('refreshToken');
 if (!refreshToken) throw new Error('No refresh token found');

 const formData = new FormData();
 
 formData.append('createdDate', data.createdDate);
 formData.append('type', data.type.trim());
 
 const imageFile = {
   uri: Platform.OS === 'android' ? newImage.uri : newImage.uri.replace('file://', ''),
   type: 'image/jpeg',
   name: newImage.name || `meal_${Date.now()}.jpg`
 };
 formData.append('image', imageFile as any);

 const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/meal-records`, {
   method: 'PATCH',
   headers: {
     'Authorization': `Bearer ${refreshToken}`,
     'Content-Type': 'multipart/form-data',
   },
   body: formData
 });

 if (!response.ok) {
   throw new Error(`Failed to update meal record`);
 }

 return response.json();
};

export const deleteMealRecord = async (data: { createdDate: string; type: string }): Promise<void> => {
 const headers = await getAuthHeader();
 
 const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/meal-records`, {
   method: 'DELETE',
   headers: {
     ...headers,
     'Content-Type': 'application/json',
   },
   body: JSON.stringify(data),
 });

 if (!response.ok) throw new Error('Failed to delete meal record');
};

export const analyzeMealNutrition = async (date: string, type: string): Promise<MealRecord> => {
 const headers = await getAuthHeader();
 
 const response = await fetch(
   `${EXPO_PUBLIC_BASE_URL}/meal-records/analyze-nutrition?createdDate=${date}&type=${type}`,
   {
     method: 'PATCH',
     headers,
   }
 );

 if (!response.ok) throw new Error('Failed to analyze nutrition');
 return response.json();
};