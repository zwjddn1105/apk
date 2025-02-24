import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatService from '../../services/ChatService';
import { RootStackParamList } from '../../navigation/StackNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { ChatErrorView } from '../../components/ChatErrorView';
import { ChatLoadingIndicator } from '../../components/ChatLoadingIndicator';
import { ApiMessage, Message } from '../../types/chat';
import { chatApi } from '../../api/chatApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { roomId, otherUserName, otherUserType } = route.params;
  const { userId: currentUserId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const connectWebSocket = useCallback(async () => {
    try {
      setError(null);
      if (!ChatService.isConnected()) {
        await ChatService.connect();
      }
      setIsConnected(true);

      await ChatService.subscribeToRoom(roomId, (newMessage) => {
        setMessages(prevMessages => [...prevMessages, newMessage]);
        scrollToBottom();
      });
    } catch (error) {
      setError('채팅 서버 연결에 실패했습니다.');
      setIsConnected(false);
    }
  }, [roomId]);

  const loadPreviousMessages = useCallback(async () => {
    try {
      const response = await chatApi.getChatMessages(roomId);
      const messageArray = response.content;

      if (!Array.isArray(messageArray)) {
        throw new Error('잘못된 응답 형식입니다.');
      }

      const convertedMessages: Message[] = messageArray.map((msg: ApiMessage) => ({
        id: msg.id,
        roomId: msg.roomId,
        senderId: msg.senderId.toString(),
        receiverId: msg.receiverId.toString(),
        content: msg.content,
        timestamp: msg.createdAt,
        messageType: 'CHAT'
      }));

      const sortedMessages = convertedMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMessages(sortedMessages);
      scrollToBottom();
    } catch (error) {
      setError(error instanceof Error ? error.message : '메시지를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    let isSubscribed = true;

    const initialize = async () => {
      try {
        if (isSubscribed) {
          await connectWebSocket();
          await loadPreviousMessages();
        }
      } catch (error) {
        if (isSubscribed) {
          setError('연결에 실패했습니다.');
        }
      }
    };

    initialize();

    return () => {
      isSubscribed = false;
      ChatService.unsubscribeFromRoom(roomId);
    };
  }, [roomId, connectWebSocket, loadPreviousMessages]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !isConnected) {
      return;
    }

    try {
      const success = await ChatService.sendMessage(roomId, newMessage);
      if (success) {
        setNewMessage('');
      } else {
        setError('메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      setError('메시지 전송 중 오류가 발생했습니다.');
    }
  }, [newMessage, roomId, isConnected]);

  // renderMessage 함수와 관련 스타일을 다음과 같이 수정

// renderMessage 함수에 디버그 로그 추가 및 조건 수정
const renderMessage = ({ item }: { item: Message }) => {
  const isOwnMessage = item.senderId === currentUserId?.toString();
  const isSessionConfirmMessage = 
    item.content.includes('세션') && 
    item.content.includes('완료를 요청했습니다') &&
    item.content.match(/\|\d+\|/);

  const sessionNumberMatch = item.content.match(/(\d+)회차/);
  const sessionNumber = sessionNumberMatch ? sessionNumberMatch[1] : null;

  const handleConfirmSession = async () => {
    if (!sessionNumber) return;
  
    Alert.alert(
      '세션 완료 확인',
      '세션 완료를 확인하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            try {
              const refreshToken = await AsyncStorage.getItem('refreshToken');
              if (!refreshToken) {
                throw new Error('로그인이 필요합니다.');
              }
  
              // 메시지에서 세션 ID 추출
              const sessionIdMatch = item.content.match(/\|(\d+)\|/);
              const sessionId = sessionIdMatch ? parseInt(sessionIdMatch[1]) : null;
  
              if (!sessionId) {
                throw new Error('세션 정보를 찾을 수 없습니다.');
              }
  
              // membercheck API 호출
              const response = await fetch(`${BASE_URL}/sessions/membercheck`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${refreshToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionId: sessionId
                }),
              });
  
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '세션 확인 처리 중 오류가 발생했습니다.');
              }
  
              // 성공 메시지 전송
              const message = `${sessionNumber}회차 세션이 완료되었습니다.`;
              await ChatService.sendMessage(roomId, message);
              
              Alert.alert('성공', '세션이 완료되었습니다.');
  
              // 티켓 목록 새로고침 이벤트 발생
              DeviceEventEmitter.emit('refreshTickets');
              
            } catch (error) {
            }
          },
        },
      ]
    );
  };

  return (
      <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}>
          {!isOwnMessage && (
              <Image
                  source={{ uri: otherUserType === 'TRAINER' ? 'trainer-profile-image' : 'user-profile-image' }}
                  style={styles.profileImage}
              />
          )}
          <View style={[
              styles.messageContent,
              isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent,
          ]}>
              <Text style={[
                  styles.messageText,
                  isOwnMessage ? styles.ownMessageText : null,
              ]}>
                  {item.content}
              </Text>
              {/* 세션 확인 버튼 표시 조건 수정 */}
              {isSessionConfirmMessage && !isOwnMessage && otherUserType === 'USER' && (
                  <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={handleConfirmSession}
                  >
                      <Text style={styles.confirmButtonText}>확인하기</Text>
                  </TouchableOpacity>
              )}
              <Text style={[
                  styles.timestamp,
                  isOwnMessage ? styles.ownTimestamp : null
              ]}>
                  {new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                  })}
              </Text>
          </View>
      </View>
  );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
          {!isConnected && (
            <Text style={styles.connectionStatus}>연결 중...</Text>
          )}
        </View>

        {isLoading ? (
          <ChatLoadingIndicator />
        ) : error ? (
          <ChatErrorView onRetry={() => {
            connectWebSocket();
            loadPreviousMessages();
          }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            onContentSizeChange={() => scrollToBottom()}
            onLayout={() => scrollToBottom()}
          />
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="메시지를 입력하세요"
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={styles.sendButton}
            >
              <Ionicons 
                name="send" 
                size={24} 
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionStatus: {
    marginLeft: 'auto',
    color: '#999',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    width: '100%',  // 추가
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',  // 추가: 다른 사람 메시지는 왼쪽 정렬
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',    // 수정: 내 메시지는 오른쪽 정렬
  },
  otherMessageContent: {
    backgroundColor: '#f0f0f0',
    marginRight: 'auto',  // 추가: 왼쪽 정렬을 위해
  },
  ownMessageContent: {
    backgroundColor: '#007AFF',
    marginLeft: 'auto',   // 추가: 오른쪽 정렬을 위해
  },
  systemMessageContainer: {
    justifyContent: 'center',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '70%',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 12,
  },
  ownMessageText: {
    color: '#fff',
  },
  ownTimestamp: {
    color: '#rgba(255,255,255,0.7)',
  },
  systemMessageContent: {
    backgroundColor: '#eee',
    alignSelf: 'center',
    borderRadius: 12,
    padding: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'center',
},
confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
},
});

export default ChatScreen;