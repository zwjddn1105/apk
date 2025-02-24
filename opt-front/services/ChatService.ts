// services/ChatService.ts
import { Client } from '@stomp/stompjs';
import { Message, ApiMessage } from '../types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { EXPO_PUBLIC_BASE_URL } from '@env';

class ChatService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private messageQueue: Map<string, { content: string; retries: number }> = new Map();
  private reconnectAttempts: number = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RECONNECT_INTERVAL = 5000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageCache: Map<string, Message[]> = new Map();
  private readTimestamps: Map<string, string> = new Map();

  public getCachedMessages(roomId: string): Message[] {
    return this.messageCache.get(roomId) || [];
  }
  
  public setCachedMessages(roomId: string, messages: Message[]) {
    this.messageCache.set(roomId, messages);
  }

  constructor() {
    if (Platform.OS !== 'web') {
      this.initializeNotifications();
    }
  }

  private async initializeNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return;
    }

    // 알림 핸들러 설정
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  async connect(): Promise<boolean> {
    if (this.client?.connected) {
      console.log('Already connected');
      return true;
    }

    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
  
    this.client = new Client({
      brokerURL: `${EXPO_PUBLIC_BASE_URL.replace('https', 'wss')}/ws-chat`,
      connectHeaders: {
        Authorization: `Bearer ${refreshToken}`,
        'accept-version': '1.1',
        'heart-beat': '0,0'
      },
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
      }
    });
  
    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        console.log('Connection timeout');
        reject(new Error('Connection timeout'));
      }, 5000);
  
      this.client!.onConnect = (frame) => {
        clearTimeout(connectionTimeout);
        console.log('Connected, frame:', frame);
        resolve(true);
      };
  
      this.client!.onStompError = (frame) => {
        clearTimeout(connectionTimeout);
        console.error('STOMP Error:', frame);
        reject(new Error(`STOMP error: ${frame.headers.message}`));
      };
  
      try {
        console.log('Activating client with headers:', this.client!.connectHeaders);
        this.client!.activate();
      } catch (error) {
        clearTimeout(connectionTimeout);
        console.error('Activation error:', error);
        reject(error);
      }
    });
  }

  private async handleConnectionError() {
    if (this.reconnectAttempts < 5) {
      this.reconnectAttempts++;
      console.log(`재연결 시도 ${this.reconnectAttempts}/5...`);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(async () => {
        await this.connect();
      }, this.RECONNECT_INTERVAL);
    } else {
      console.error('최대 재연결 시도 횟수 초과');
    }
  }

  private handleDisconnection() {
    this.handleConnectionError();
  }

  disconnect(): void {
    if (this.client?.connected) {
      this.subscriptions.forEach(subscription => subscription.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  async subscribeToRoom(roomId: string, callback: (message: Message) => void) {
    if (!this.client?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }
  
    const existingSubscription = this.subscriptions.get(roomId);
    if (existingSubscription) {
      try {
        existingSubscription.send("");
        console.log(`Existing subscription for room ${roomId} is active`);
        return;
      } catch (e) {
        console.log(`Removing inactive subscription for room ${roomId}`);
        this.subscriptions.delete(roomId);
      }
    }
  
    console.log(`Creating new subscription for room: ${roomId}`);
    return new Promise<void>(async (resolve) => {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const client = this.client!;
      const subscription = client.subscribe(
        `/topic/chat-room/${roomId}`,
        message => {
          try {
            console.log('Received WebSocket message:', message.body);
            const apiMessage = JSON.parse(message.body) as ApiMessage;
            const convertedMessage = this.convertApiMessage(apiMessage);
            console.log('Converted message:', convertedMessage);
            callback(convertedMessage);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        },
        {
          id: `room-${roomId}`,
          Authorization: `Bearer ${refreshToken}`
        }
      );
    
      this.subscriptions.set(roomId, subscription);
      console.log(`Successfully subscribed to room: ${roomId}`);
      resolve();
    });
  }

  private convertApiMessage(apiMessage: ApiMessage): Message {
    return {
      id: apiMessage.id,
      roomId: apiMessage.roomId,
      senderId: apiMessage.senderId.toString(),
      receiverId: apiMessage.receiverId.toString(),
      content: apiMessage.content,
      timestamp: apiMessage.createdAt,
      messageType: apiMessage.senderId === 0 ? 'SYSTEM' : 'CHAT'
    };
  }

  private async showNotificationIfNeeded(message: ApiMessage) {
    const isBackground = await AsyncStorage.getItem('isBackground') === 'true';
    const currentUserId = await AsyncStorage.getItem('userId');
    
    if (isBackground && message.senderId.toString() !== currentUserId) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '새 메시지',
          body: message.content,
          data: { roomId: message.roomId },
        },
        trigger: null,
      });
    }
  }

  unsubscribeFromRoom(roomId: string): void {
    const subscription = this.subscriptions.get(roomId);
    if (subscription) {
      console.log(`Unsubscribing from room: ${roomId}`);
      subscription.unsubscribe();
      this.subscriptions.delete(roomId);
    }
  }

  async sendMessage(roomId: string, content: string): Promise<boolean> {
    if (!this.client?.connected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
  
      this.client.publish({
        destination: `/app/chat-room/${roomId}`,
        headers: { Authorization: `Bearer ${refreshToken}` },
        body: JSON.stringify({ roomId, content })
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  private async processMessageQueue() {
    if (!this.client?.connected) return;

    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) return;

    for (const [messageId, { content, retries }] of this.messageQueue.entries()) {
      if (retries >= this.MAX_RETRIES) {
        this.messageQueue.delete(messageId);
        continue;
      }

      try {
        this.client.publish({
          destination: `/app/chat/message`,
          body: content,
          headers: { Authorization: `Bearer ${refreshToken}` }
        });
        
        this.messageQueue.delete(messageId);
      } catch (error) {
        this.messageQueue.set(messageId, { content, retries: retries + 1 });
      }
    }
  }

  // 읽음 처리 관련 메서드
  async markMessageAsRead(roomId: string) {
    const timestamp = new Date().toISOString();
    this.readTimestamps.set(roomId, timestamp);
    
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return;

      await fetch(`${EXPO_PUBLIC_BASE_URL}/chat-rooms/read/${roomId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timestamp })
      });
    } catch (error) {
      console.error('읽음 처리 에러:', error);
    }
  }

  async getUnreadCount(roomId: string): Promise<number> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return 0;

      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/chat-rooms/unread/${roomId}`, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });

      const data = await response.json();
      return data.unreadCount || 0;
    } catch (error) {
      console.error('읽지 않은 메시지 수 조회 에러:', error);
      return 0;
    }
  }
}

export default new ChatService();