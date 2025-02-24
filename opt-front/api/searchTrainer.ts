import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_BASE_URL } from '@env';

export interface TrainerResponse {
 keywords: string[];
 averageRating: number;
 reviewCount: number;
 menus: {
   id: number;
   name: string;
   trainerId: number;
   price: number;
   totalSessions: number;
 }[];
 trainerId: number;
 intro: string;
 trainerNickname: string;
 experienceYears: number;
 availableHours: string;
 trainerProfileImage: string;
 gymName: string;
 gymAddress: string;
 oneDayAvailable: boolean;
}

interface SearchTrainerRequest {
 myLatitude?: number | null;
 myLongitude?: number | null;
 name?: string | null;
 address?: string | null;
 interests?: string[] | null;
 sortBy?: string | null;
 page?: number;
 size?: number;
}

interface PageResponse<T> {
 content: T[];
 pageable: {
   pageNumber: number;
   pageSize: number;
   sort: {
     empty: boolean;
     sorted: boolean;
     unsorted: boolean;
   };
   offset: number;
   unpaged: boolean;
 };
 last: boolean;
 totalElements: number;
 totalPages: number;
 size: number;
 number: number;
 sort: {
   empty: boolean;
   sorted: boolean;
   unsorted: boolean;
 };
 first: boolean;
 numberOfElements: number;
 empty: boolean;
}

type RequestBodyType = {
 [K in keyof SearchTrainerRequest]: SearchTrainerRequest[K];
};

const handleApiResponse = async (response: Response) => {
 const responseText = await response.text();
 const data = JSON.parse(responseText);
 
 if (!response.ok) {
   if (response.status === 401) {
     throw new Error('인증이 만료되었습니다.');
   }
   throw new Error('요청 처리 실패');
 }
 
 return data;
};

export const getRecommendedTrainers = async (
 params: SearchTrainerRequest = { page: 0, size: 10 }
): Promise<PageResponse<TrainerResponse>> => {
 const refreshToken = await AsyncStorage.getItem('refreshToken');
 if (!refreshToken) {
   throw new Error('인증 정보가 없습니다.');
 }

 const response = await fetch(
   `${EXPO_PUBLIC_BASE_URL}/trainers/recommends?page=${params.page}&size=${params.size}&sort=descending`, 
   {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${refreshToken}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       myLatitude: params.myLatitude,
       myLongitude: params.myLongitude,
     }),
   }
 );

 return handleApiResponse(response);
};

export const searchTrainers = async (
 params: SearchTrainerRequest = { page: 0, size: 10 }
): Promise<PageResponse<TrainerResponse>> => {
 const refreshToken = await AsyncStorage.getItem('refreshToken');
 if (!refreshToken) {
   throw new Error('인증 정보가 없습니다.');
 }

 const requestBody = {
   myLatitude: params.myLatitude ?? null,
   myLongitude: params.myLongitude ?? null,
   name: params.name ?? null,
   address: params.address ?? null,
   interests: params.interests ?? null,
   sortBy: params.sortBy ?? 'recommendation',
   page: params.page ?? 0,
   size: params.size ?? 10
 };

 const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/trainers/search`, {
   method: 'POST',
   headers: {
     'Authorization': `Bearer ${refreshToken}`,
     'Content-Type': 'application/json',
   },
   body: JSON.stringify(requestBody),
 });

 return handleApiResponse(response);
};