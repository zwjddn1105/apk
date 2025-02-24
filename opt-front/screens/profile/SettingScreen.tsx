import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { EXPO_PUBLIC_BASE_URL } from "@env";

type RootStackParamList = {
  Main: undefined;
  TrainerProfile: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const BASE_URL = EXPO_PUBLIC_BASE_URL;
  const renderSettingItem = (title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <Text style={styles.settingText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const handleDeleteAccount = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) {
          Alert.alert("오류", "로그인 정보가 없습니다.");
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
          return;
        }
      const email = await AsyncStorage.getItem("email");
      const response = await axios.delete(
        `${BASE_URL}/auth/withdraw?email=${email}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("회원탈퇴", "회원탈퇴가 완료되었습니다.");
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        Alert.alert("오류", "회원탈퇴 중 오류가 발생했습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    }
  };

  // 로그아웃 API 호출 함수 (axios 사용)
  const handleLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const email = await AsyncStorage.getItem("email");
      const response = await axios.post(
        `${BASE_URL}/auth/sign-out?email=${email}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("로그아웃", "로그아웃 되었습니다.");
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        Alert.alert("오류", "로그아웃 중 오류가 발생했습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.statusBarPlaceholder} />
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>환경설정</Text>
            <View style={styles.headerRight} />
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>공지사항</Text>
            {renderSettingItem("공지사항", () => {})}
            {renderSettingItem("도움말", () => {})}
            {renderSettingItem("개인정보 수정하기", () => {})}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>약관 및 정책</Text>
            {renderSettingItem("서비스 이용약관", () => {})}
            {renderSettingItem("위치정보이용약관", () => {})}
            {renderSettingItem("개인정보처리방침", () => {})}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기타</Text>
            {renderSettingItem("회원탈퇴", handleDeleteAccount)}
            {renderSettingItem("로그아웃", handleLogout)}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statusBarPlaceholder: {
    height: StatusBar.currentHeight || 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 50,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#666",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  settingText: {
    fontSize: 16,
  },
});

export default SettingScreen;
