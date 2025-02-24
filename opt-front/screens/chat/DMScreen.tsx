import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useChatStore } from '../../stores/chatStore';
import { User, ApiChatRoom, ChatRoom } from '../../types/chat';
import ChatService from '../../services/ChatService';
import { chatApi } from '../../api/chatApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DMScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showUserList, setShowUserList] = useState(false);
  const { rooms, roomIds, addRoom, clearRooms } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const roomsArray = roomIds.map(id => rooms[id]);

  const users: User[] = [
    { id: 1, email: "a" },
    { id: 2, email: "b@b" },
    { id: 3, email: "c@c.com" },
    { id: 4, email: "d@d.com" },
    { id: 5, email: "e@example.com" },
    { id: 6, email: "frank06@example.com" },
    { id: 7, email: "grace07@example.com" },
    { id: 8, email: "hank08@example.com" },
    { id: 9, email: "ivy09@example.com" },
    { id: 10, email: "jack10@example.com" },
  ];

  const formatMessageTime = (dateString: string): string => {
    const messageDate = new Date(dateString);
    const now = new Date();
    
    // 날짜가 같은 경우 시간만 표시
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // 1주일 이내인 경우 요일 표시
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (messageDate > weekAgo) {
      return messageDate.toLocaleDateString('ko-KR', { weekday: 'short' });
    }
    
    // 그 외의 경우 날짜 표시
    return messageDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const loadChatRooms = useCallback(async () => {
    try {
      const apiRooms = await chatApi.getChatRooms();
      clearRooms();
      
      apiRooms.forEach((apiRoom: ApiChatRoom) => {
        let userType: 'USER' | 'TRAINER' | 'ADMIN' = 'USER';
        
        if (apiRoom.participants.includes(0)) {
          userType = 'ADMIN';
        }
        
        const chatRoom: ChatRoom = {
          id: apiRoom.id,
          name: apiRoom.otherMemberNickname || apiRoom.roomName || '알 수 없음',
          lastMessage: apiRoom.lastMessage || "새로운 채팅방이 생성되었습니다.",
          time: apiRoom.lastMessageTime 
            ? formatMessageTime(apiRoom.lastMessageTime)
            : formatMessageTime(new Date().toISOString()),
          userType: userType,
          unreadCount: 0
        };
  
        addRoom(chatRoom);
      });
    } catch (error) {
      console.error('채팅방 목록 로드 오류:', error);
      Alert.alert('오류', '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [clearRooms, addRoom]);

  const setupWebSocket = useCallback(async () => {
    try {
      if (!ChatService.isConnected()) {
        await ChatService.connect();
        
        roomsArray.forEach(room => {
          ChatService.subscribeToRoom(room.id, (message) => {
            console.log(`Received message in room ${room.id}:`, message);
          });
        });
      }
    } catch (error) {
      console.error('WebSocket setup error:', error);
    }
  }, [roomsArray]);

  const createChatRoom = async (user: User) => {
    try {
      const apiRoom = await chatApi.createChatRoom(user.id);
      const currentTime = new Date().toISOString();
      
      const chatRoomData: ChatRoom = {
        id: apiRoom.id,
        name: user.email,
        lastMessage: "새로운 채팅방이 생성되었습니다.",
        time: formatMessageTime(currentTime),
        userType: 'USER',
        unreadCount: 0
      };
  
      addRoom(chatRoomData);
      await loadChatRooms();
  
      if (!ChatService.isConnected()) {
        await ChatService.connect();
      }
      
      ChatService.subscribeToRoom(chatRoomData.id, (message) => {
        console.log('New message received:', message);
      });
  
      setShowUserList(false);
      
      navigation.navigate('Chat', {
        roomId: chatRoomData.id,
        otherUserName: chatRoomData.name,
        otherUserType: chatRoomData.userType
      });
  
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      if (error instanceof Error) {
        Alert.alert('오류', `채팅방 생성에 실패했습니다: ${error.message}`);
      } else {
        Alert.alert('오류', '채팅방 생성에 실패했습니다.');
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
      return () => {
        // 화면이 포커스를 잃을 때 정리할 작업이 있다면 여기에 추가
      };
    }, [loadChatRooms])
  );

  useEffect(() => {
    let isMounted = true;
    let wsCleanup = false;

    const initialize = async () => {
      if (!isMounted) return;

      if (!wsCleanup && roomsArray.length > 0) {
        if (!ChatService.isConnected()) {
          await ChatService.connect();
          
          roomsArray.forEach(room => {
            ChatService.subscribeToRoom(room.id, (message) => {
              console.log(`Received message in room ${room.id}:`, message);
            });
          });
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      wsCleanup = true;
      roomsArray.forEach(room => {
        ChatService.unsubscribeFromRoom(room.id);
      });
    };
  }, [roomsArray]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredChatRooms = roomsArray.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Chat', {
        roomId: item.id,
        otherUserName: item.name,
        otherUserType: item.userType
      })}
    >
      <View style={[
        styles.chatRoomContainer,
        item.userType === 'TRAINER' && styles.trainerChatRoom
      ]}>
        <Image
          source={{ 
            uri: item.userType === 'TRAINER' 
              ? "trainer-profile-image" 
              : "user-profile-image" 
          }}
          style={styles.profileImage}
        />
        <View style={styles.chatInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => createChatRoom(item)}
    >
      <View style={styles.userInfo}>
        <Image
          source={{ uri: "user-profile-image" }}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (showUserList) {
                setShowUserList(false);
              } else if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {showUserList ? '팔로우 목록' : '채팅'}
          </Text>
          <View style={styles.addButtonContainer}>
            {!showUserList && (
              <TouchableOpacity
                onPress={() => setShowUserList(true)}
                style={styles.addButton}
              >
                <Ionicons name="add" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showUserList ? (
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>사용자 목록</Text>
            <FlatList
              data={users}
              renderItem={renderUser}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#999"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="검색"
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            <FlatList
              data={filteredChatRooms}
              renderItem={renderChatRoom}
              keyExtractor={(item) => item.id}
              extraData={rooms}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text>채팅방이 없습니다.</Text>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'center',
  },
  addButtonContainer: {
    width: 32,
    alignItems: 'center',
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 8,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatRoomContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  trainerChatRoom: {
    backgroundColor: '#f8f8f8',
  },
  userItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  userType: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default DMScreen;