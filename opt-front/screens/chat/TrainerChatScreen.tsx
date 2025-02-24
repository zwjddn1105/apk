import React, { useState } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ChatActionModal from "../../components/ChatActionModal";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  MainTabs: undefined;
  ManagerChat: undefined;
  TrainerChat: undefined;
};

type TrainerChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TrainerChat"
>;

interface Message {
  id: string;
  text: string;
  date: string;
  time: string;
  isTrainer: boolean;
}

export const TrainerChatScreen = () => {
  const navigation = useNavigation<TrainerChatScreenNavigationProp>();
  const [message, setMessage] = useState("");
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const messages: Message[] = [
    {
      id: "1",
      text: "오늘 운동하느라 수고 많으셨습니다!",
      date: "2024년 1월 17일",
      time: "오후 5:36",
      isTrainer: true,
    },
  ];

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showDate = index === 0 || messages[index - 1].date !== item.date;

    return (
      <View style={styles.messageContainer}>
        {showDate && (
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}> {item.date}</Text>
          </View>
        )}
        <View style={styles.messageContent}>
          <Image
            source={require("../../assets/images/trainer-profile.png")}
            style={styles.profileImage}
          />
          <View style={styles.textWrapper}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trainer</Text>
        </View>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
        />

        <View style={styles.inputContainer}>
          <View style={styles.messageInputWrapper}>
            <TouchableOpacity
              style={
                Platform.OS === "android"
                  ? [styles.plusButton, styles.androidPlusButton]
                  : styles.plusButton
              }
              onPress={() => setIsActionModalVisible(true)}
            >
              <Ionicons name="add" size={24} color="#666" />
            </TouchableOpacity>
            <TextInput
              style={styles.messageInput}
              placeholder="메시지 입력하기"
              value={message}
              onChangeText={setMessage}
              multiline
              autoCorrect={false}
              keyboardType="default"
            />
            {message.trim().length > 0 && (
              <TouchableOpacity style={styles.sendButton}>
                <Ionicons name="send" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ChatActionModal
          visible={isActionModalVisible}
          onClose={() => setIsActionModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  textWrapper: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: "#000",
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 10,
  },
  plusButton: {
    padding: 8,
    marginRight: 4,
  },
  androidPlusButton: {
    padding: 8,
    marginRight: 4,
    elevation: 1,
    backgroundColor: "#f5f5f5",
  },
  messageInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 8,
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
  },
  sendButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },
  messageInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalView: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default TrainerChatScreen;
