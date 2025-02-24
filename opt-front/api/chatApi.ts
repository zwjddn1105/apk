import { ApiChatRoom, ApiMessage, PaginatedResponse, CreateChatRoomResponse } from '../types/chat';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";

export const chatApi = {
  getChatRooms: async (): Promise<ApiChatRoom[]> => {
    try {
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data: PaginatedResponse<ApiChatRoom> = await response.json();
      return data.content;
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      throw error;
    }
  },

  getChatMessages: async (roomId: string) => {
    try {
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  },

  createChatRoom: async (otherMemberId: number): Promise<CreateChatRoomResponse> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      console.log('Creating chat room with otherMemberId:', otherMemberId);
      
      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/chat-rooms/create?otherMemberId=${otherMemberId}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      return result;
    } catch (error) {
      console.error('Failed to create chat room:', error);
      throw error;
    }
  },
};