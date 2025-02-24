import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerResponse, Exercise, FetchExercisesResult } from '../types/exercise';
import { EXPO_PUBLIC_BASE_URL } from "@env";

const FAVORITES_STORAGE_KEY = 'exercise_favorites';

interface FetchExercisesParams {
   page?: number;
   size?: number;
   name?: string;
   bodyPart?: string;
}

export const fetchExercises = async ({ 
   page = 0, 
   size = 20, 
   name = '',
   bodyPart = ''
}: FetchExercisesParams = {}): Promise<FetchExercisesResult> => {
   const refreshToken = await AsyncStorage.getItem('refreshToken');
   if (!refreshToken) throw new Error('No refresh token found');

   const params = new URLSearchParams();
   params.append('page', page.toString());
   params.append('size', size.toString());
   
   if (name) params.append('name', name);
   if (bodyPart) params.append('bodyPart', bodyPart);

   const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercises?${params}`, {
       headers: {
           'Authorization': `Bearer ${refreshToken}`,
           'Content-Type': 'application/json',
       },
   });

   if (!response.ok) throw new Error('Failed to fetch exercises');

   const data: ServerResponse = await response.json();
   
   if (!data.content || data.content.length === 0) {
       return {
           exercises: [],
           hasMore: false,
           totalElements: data.totalElements || 0
       };
   }

   const exercises = data.content.map(exercise => ({
       id: exercise.id,
       name: exercise.name,
       bodyPart: exercise.bodyPart,
       isFavorite: exercise.favorited,
       imageSource: exercise.gifPath,
   }));

   return {
       exercises,
       hasMore: exercises.length === size,
       totalElements: data.totalElements
   };
};

export const toggleFavorite = async (exerciseId: number, isFavorite: boolean): Promise<boolean> => {
   const refreshToken = await AsyncStorage.getItem('refreshToken');
   if (!refreshToken) throw new Error('No refresh token found');

   const method = isFavorite ? 'DELETE' : 'POST';
   const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercises/favorites`, {
       method,
       headers: {
           'Authorization': `Bearer ${refreshToken}`,
           'Content-Type': 'application/json',
       },
       body: JSON.stringify({ exerciseId })
   });

   if (!response.ok) {
       throw new Error('Failed to update favorite status');
   }

   return !isFavorite;
};

export const fetchFavoriteExercises = async (): Promise<Exercise[]> => {
   const refreshToken = await AsyncStorage.getItem('refreshToken');
   if (!refreshToken) throw new Error('No refresh token found');

   const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercises/favorites`, {
       headers: {
           'Authorization': `Bearer ${refreshToken}`,
           'Content-Type': 'application/json',
       },
   });

   if (!response.ok) throw new Error('Failed to fetch favorites');

   const data = await response.json();
   return data.map((exercise: Exercise) => ({
       ...exercise,
       isFavorite: true
   }));
};

const updateLocalFavorite = async (exerciseId: number, isFavorite: boolean) => {
   const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
   let favorites: number[] = storedFavorites ? JSON.parse(storedFavorites) : [];
   
   if (isFavorite) {
       favorites = [...new Set([...favorites, exerciseId])];
   } else {
       favorites = favorites.filter(id => id !== exerciseId);
   }
   
   await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
};

export const syncFavorites = async (): Promise<void> => {
   const refreshToken = await AsyncStorage.getItem('refreshToken');
   if (!refreshToken) throw new Error('No refresh token found');

   const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/exercises/favorites`, {
       headers: {
           'Authorization': `Bearer ${refreshToken}`,
           'Content-Type': 'application/json',
       },
   });

   if (!response.ok) throw new Error('Failed to fetch favorites');

   const serverFavorites = await response.json();
   const favoriteIds = serverFavorites.map((fav: any) => fav.exerciseId);
   
   await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
};