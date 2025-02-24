// contexts/ChatContext.tsx
import React, { createContext, useContext, ReactNode, useState } from 'react';

// Context에서 관리할 상태와 함수들의 타입 정의
interface ChatContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  // 필요한 다른 상태나 함수들 추가
}

// Context 생성
const ChatContext = createContext<ChatContextType | null>(null);

// Provider 컴포넌트 생성
export function ChatProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <ChatContext.Provider 
      value={{
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// Context를 사용하기 위한 커스텀 훅
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}