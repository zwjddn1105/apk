// types/chat.ts
export interface PaginatedResponse<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
  };
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: number;
  email: string;
}

export interface ApiChatRoom {
  id: string;                     
  roomName: string | null;        
  participants: number[];         
  otherMemberNickname: string;    
  lastMessage: string;            
  lastMessageTime: string;
}

export interface ChatRoom {
  id: string;                        // UUID 형식으로 변경된 ID
  name: string;                      // 표시될 이름 (otherMemberNickname)
  lastMessage: string;               // 마지막 메시지
  time: string;                      // 시간 표시
  userType: 'USER' | 'TRAINER' | 'ADMIN';  // 사용자 타입 (ADMIN 추가)
  unreadCount: number;               // 읽지 않은 메시지 수
}

export interface ApiMessage {
  id: string;
  senderId: number;
  receiverId: number;
  roomId: string;
  content: string;
  createdAt: string;
  messageType: 'CHAT' | 'SYSTEM';  // 이 부분 추가
  isRead: boolean;
  readByMembers: any[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  messageType: 'CHAT' | 'SYSTEM';
}

export interface CreateChatRoomResponse {
  id: string;           // 채팅방 ID (예: "123_456")
  participants: number[]; // 참여자 ID 리스트
}