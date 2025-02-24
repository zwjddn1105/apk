// components/TopHeader.tsx
import React from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProfileButton from "./ProfileButton";
import SendButton from "./SendButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { EXPO_PUBLIC_BASE_URL } from "@env";

type RootStackParamList = {
  홈: undefined;
  LoginNeedScreen: { returnScreen: string } | undefined;
  DMScreen: undefined;
  ProfileScreen: { profileData: any };
  Main: {
    screen?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TopHeader = () => {
  const BASE_URL = EXPO_PUBLIC_BASE_URL;
  const navigation = useNavigation<NavigationProp>();

  const handleProfilePress = async () => {
    try {
      const id = await AsyncStorage.getItem("memberId");
      if (id) {
        const numericId = parseInt(id, 10); // 문자열을 숫자로 변환
        if (isNaN(numericId)) {
          throw new Error("Invalid id format");
        }
        const response = await axios.get(`${BASE_URL}/profile/${numericId}`);
        if (response.status === 200) {
          navigation.navigate("ProfileScreen", { profileData: response.data });
        } else {
        }
      } else {
        navigation.navigate("LoginNeedScreen", {
          returnScreen: "ProfileScreen",
        });
      }
    } catch (error) {
      navigation.navigate("LoginNeedScreen", { returnScreen: "ProfileScreen" });
    }
  };

  const handleLogout = async () => {
    try {
      AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: "Main", params: { screen: "홈" } }],
      });
    } catch (error) {}
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Main", { screen: "홈" })}
        >
          <Image
            source={require("../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity> */}
      </View>
      <View style={styles.topButtons}>
        <ProfileButton onPress={handleProfilePress} />
        <SendButton onPress={() => navigation.navigate("DMScreen")} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 80,
    height: 60,
  },
  topButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingRight: 5,
  },
  logoutButton: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  logoutButtonText: {
    color: "#333",
  },
});
