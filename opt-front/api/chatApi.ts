import { ApiChatRoom, ApiMessage, PaginatedResponse, CreateChatRoomResponse } from '../types/chat';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";

export const chatApi = {
 getChatRooms: async (): Promise<ApiChatRoom[]> => {
   const refreshToken = await AsyncStorage.getItem('refreshToken');
   if (!refreshToken) {
     throw new Error('No refresh token found');
   }

   const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/chat-rooms/list`, {
     headers: {
       Authorization: `Bearer ${refreshToken}`
     },
   });
   
   if (!response.ok) {
     throw new Error(`HTTP error!`);
   }
   
   const data: PaginatedResponse<ApiChatRoom> = await response.json();
   return data.content;
 },

 getChatMessages: async (roomId: string) => {
   const refreshToken = await AsyncStorage.getItem('refreshToken');
   if (!refreshToken) {
     throw new Error('No refresh token found');
   }

   const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/chat-rooms/message?roomId=${roomId}`, {
     headers: { 
       Authorization: `Bearer ${refreshToken}`
     },
   });
   
   if (!response.ok) {
     throw new Error(`HTTP error!`);
   }
   
   return await response.json();
 },

 createChatRoom: async (otherMemberId: number): Promise<CreateChatRoomResponse> => {
   const refreshToken = await AsyncStorage.getItem('refreshToken');
   if (!refreshToken) {
     throw new Error('No refresh token found');
   }
   
   const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/chat-rooms/create?otherMemberId=${otherMemberId}`, {
     method: 'POST',
     headers: { 
       Authorization: `Bearer ${refreshToken}`,
       'Content-Type': 'application/json'
     }
   });

   if (!response.ok) {
     throw new Error(`HTTP error!`);
   }

   return await response.json();
 },
};