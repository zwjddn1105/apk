import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
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

const BASE_URL = EXPO_PUBLIC_BASE_URL;

const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem("refreshToken");
  } catch (error) {
    return null;
  }
};

const AuthChallengeScreen: React.FC<AuthChallengeProps> = ({ route }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { challengeId } = route.params; // 프롭에서 challengeId 가져오기
  return (
    <SafeAreaView style={styles.safeArea}>
      <TopHeader />
      <Text>뭐야된거냐</Text>
      <ScrollView></ScrollView>
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
  },
});

export default AuthChallengeScreen;
