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
      console.error('WebSocket connection failed:', error);
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

  const renderMessage = ({ item }: { item: Message }) => {
    // currentUserId와 senderId를 모두 문자열로 변환하여 비교
    const isOwnMessage = item.senderId === currentUserId?.toString();
    const isSystemMessage = item.messageType === 'SYSTEM';

    console.log('Message comparison:', {
        messageSenderId: item.senderId,
        currentUserId: currentUserId,
        isOwnMessage: isOwnMessage
    });

    return (
        <View style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
            isSystemMessage ? styles.systemMessageContainer : null,
        ]}>
            {!isOwnMessage && !isSystemMessage && (
                <Image
                    source={{ uri: otherUserType === 'TRAINER' ? 'trainer-profile-image' : 'user-profile-image' }}
                    style={styles.profileImage}
                />
            )}
            <View style={[
                styles.messageContent,
                isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent,
                isSystemMessage ? styles.systemMessageContent : null,
            ]}>
                <Text style={[
                    styles.messageText,
                    isOwnMessage ? styles.ownMessageText : null,
                    isSystemMessage ? styles.systemMessageText : null,
                ]}>
                    {item.content}
                </Text>
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
});

export default ChatScreen;