import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video, ResizeMode } from "expo-av";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { EXPO_PUBLIC_BASE_URL } from "@env";

import { useAuth } from "../contexts/AuthContext";

type RootStackParamList = {
  홈: undefined;
  MyChallenge: undefined;
  LoginScreen: undefined;
  Main: { screen?: string };
  LoginNeedScreen: { returnScreen: string } | undefined;
};

type LoginNeedScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type LoginNeedScreenRouteParams = {
  returnScreen?: string;
};

const LoginNeedScreen: React.FC = () => {
  const route =
    useRoute<RouteProp<Record<string, LoginNeedScreenRouteParams>, string>>();

  const video = useRef<Video>(null);
  const navigation = useNavigation<LoginNeedScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const { login } = useAuth();

  const loginWithEmail = async () => {
    try {
      console.log(EXPO_PUBLIC_BASE_URL);
      const response = await axios.post(
        `${EXPO_PUBLIC_BASE_URL}/auth/sign-in`,
        {
          email,
        }
      );
      // console.log(response.data);
      const refreshToken = response.data.refreshToken;
      const role = response.data.role;
      const id = response.data.id;

      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("role", role);
      await AsyncStorage.setItem("memberId", String(id));
      console.log(refreshToken);
      console.log(role);
      console.log(id);
      console.log(EXPO_PUBLIC_BASE_URL);

      await login(refreshToken, String(id), role === 'TRAINER' ? 'TRAINER' : 'USER');
      
      console.log('Login successful:', {
        refreshToken: refreshToken.substring(0, 10) + '...',
        role,
        id
      });
      Alert.alert("로그인 성공", "환영합니다!");

      if (route.params?.returnScreen) {
        const screen = route.params.returnScreen as keyof RootStackParamList;
        if (screen === "Main") {
          navigation.replace("Main", { screen: "홈" });
        } else {
          navigation.replace(screen);
        }
      } else {
        navigation.replace("Main", { screen: "홈" });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data);
        Alert.alert(
          "로그인 실패",
          error.response?.data?.message || "이메일을 확인해주세요."
        );
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("로그인 실패", "알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    playVideo();
  }, []);

  const playVideo = async () => {
    if (video.current) {
      await video.current.playAsync();
      await video.current.setIsLoopingAsync(true);
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={require("../assets/mv.mp4")}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
      />
      <View style={styles.overlay}>
        <View style={styles.optContainer}>
          <Text style={styles.optText}>OPT</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="이메일을 입력하세요"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.loginButton} onPress={loginWithEmail}>
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <Ionicons
            name="chatbubble"
            size={20}
            color="black"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>카카오 로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.laterLoginContainer}
          onPress={() => navigation.navigate("Main", { screen: "홈" })}
        >
          <Text style={styles.laterLoginText}>나중에 로그인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 400,
  },
  optContainer: {
    position: "absolute",
    top: -220,
    alignSelf: "center",
  },
  optText: {
    fontSize: 64,
    color: "white",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  button: {
    backgroundColor: "#FEE500",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 22,
    color: "#000",
    fontWeight: "800",
  },
  icon: {
    marginRight: 24,
    fontSize: 30,
  },
  laterLoginContainer: {
    marginTop: 20,
  },
  laterLoginText: {
    color: "#888888",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    width: "80%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginBottom: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginNeedScreen;
