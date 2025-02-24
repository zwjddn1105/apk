import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, NativeModules, TouchableOpacity } from "react-native";
import { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopHeader } from "../../components/TopHeader";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  AuthChallengeScreen: { challengeId: number };
};
type AuthChallengeProps = {
  route: RouteProp<RootStackParamList, "AuthChallengeScreen">;
};
type Challenge = {};

const { PoseMatcherModule } = NativeModules;
console.log("NativeModules:", NativeModules);
console.log("PoseMatcherModule:", NativeModules.PoseMatcherModule);
const BASE_URL = EXPO_PUBLIC_BASE_URL;

const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem("refreshToken");
  } catch (error) {
    console.error("Error retrieving refresh token:", error);
    return null;
  }
};

const AuthChallengeScreen: React.FC<AuthChallengeProps> = ({ route }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { challengeId } = route.params; // 프롭에서 challengeId 가져오기

  useEffect(() => {
    startPoseDetection();
  }, []);

  const startPoseDetection = async () => {
    try {
      
      const result = await PoseMatcherModule.startCamera(); // ✅ 네이티브 모듈에서 카메라 실행
      console.log("Pose Detection 결과:", result);
    } catch (error) {
      console.error("Pose Detection 오류:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>포즈 인증 중...</Text>

      {/* 종료 버튼 */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()} // ✅ 인증 완료 후 화면 닫기
      >
        <Text style={styles.closeButtonText}>닫기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  title: {
    fontSize: 20,
    color: "white",
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#FF5A5F",
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AuthChallengeScreen;
