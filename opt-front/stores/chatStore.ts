// stores/chatStore.ts
import { create } from 'zustand';
import { ChatRoom, Message } from '../types/chat';

interface ChatStore {
  rooms: Record<string, ChatRoom>;
  messages: Record<string, Record<string, Message>>;
  roomIds: string[];
  currentRoomId: string | null;
  
  addRoom: (room: ChatRoom) => void;
  addMessage: (message: Message) => void;
  clearRooms: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: {},
  messages: {},
  roomIds: [],
  currentRoomId: null,

  addRoom: (room) => set(state => {
    // 이미 존재하는 방이면 방 정보만 업데이트
    if (state.rooms[room.id]) {
      return {
        ...state,
        rooms: { 
          ...state.rooms, 
          [room.id]: {
            ...state.rooms[room.id],
            ...room
          }
        }
      };
    }

    // 새로운 방이면 rooms와 roomIds 모두 업데이트
    return {
      ...state,
      rooms: { ...state.rooms, [room.id]: room },
      roomIds: [...state.roomIds, room.id],
    };
  }),

  addMessage: (message) => set(state => {
    const { roomId } = message;
    if (!state.messages[roomId]) state.messages[roomId] = {};

    return {
      messages: {
        ...state.messages,
        [roomId]: { ...state.messages[roomId], [message.id]: message },
      },
    };
  }),

  clearRooms: () => set({
    rooms: {},
    roomIds: [],
    currentRoomId: null
  }),
}));