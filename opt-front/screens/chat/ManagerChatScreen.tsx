import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  date: string; // 2024년 1월 17일
  time: string; // 오후 5:36
  isManager: boolean;
}

export const ManagerChatScreen = () => {
  const navigation = useNavigation();

  const messages: Message[] = [
    {
      id: "1",
      text: "회원님의 1:1문의 답변이 등록되었습니다.",
      date: "2024년 1월 17일",
      time: "오후 5:36",
      isManager: true,
    },
    {
      id: "2",
      text: "회원님의 1:1문의 답변이 등록되었습니다.",
      date: "2024년 1월 17일",
      time: "오후 5:36",
      isManager: true,
    },
    {
      id: "3",
      text: "회원님의 1:1문의 답변이 등록되었습니다.",
      date: "2024년 1월 18일",
      time: "오후 5:36",
      isManager: true,
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
            source={require("../../assets/images/manager-profile.png")}
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
      <View style={styles.container}>
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
          <Text style={styles.headerTitle}>Manager</Text>
        </View>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
        />
      </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default ManagerChatScreen;
