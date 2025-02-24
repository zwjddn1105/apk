import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/StackNavigator";
import axios from "axios";
import { EXPO_PUBLIC_BASE_URL, EXPO_PUBLIC_API_KEY } from "@env";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const REST_API_KEY = EXPO_PUBLIC_API_KEY;
const REDIRECT_URI = `${EXPO_PUBLIC_BASE_URL}/auth/kakao`;
const INJECTED_JAVASCRIPT = `
  (function() {
    if (window.location.href.indexOf("code=") > -1) {
      window.ReactNativeWebView.postMessage(window.location.href);
    }
  })();
  true;
`;

const LoginScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleMessage = async (event: any) => {
    const navigation = useNavigation<NavigationProp>();

    const data: string = event.nativeEvent.data;

    const codeMatch = data.match(/[?&]code=([^&]+)/);

    if (codeMatch && codeMatch[1]) {
      const authorizeCode = codeMatch[1];

      try {
        const response = await axios.post(
          `${EXPO_PUBLIC_BASE_URL}/auth/kakao-front?code=${authorizeCode}`
        );
        const { refreshToken } = await response.data;
        const { role } = await response.data;
        const { email } = await response.data;
        const { id } = await response.data;
        await AsyncStorage.setItem("refreshToken", refreshToken);
        await AsyncStorage.setItem("role", role);
        await AsyncStorage.setItem("email", email);
        await AsyncStorage.setItem("memberId", String(id));
        console.log(refreshToken);
        console.log(role);
        console.log(email);
        console.log(id);

        console.log(EXPO_PUBLIC_BASE_URL);
        console.log(response.data);

        Alert.alert("로그인 성공", "환영합니다!", [
          {
            text: "확인",
            onPress: () => {
              // 홈 화면으로 네비게이트
              navigation.navigate("Main"); // 'Main'은 StackNavigator에서 정의된 BottomTabNavigator입니다.
            },
          },
        ]);
      } catch (error) {
        console.error("토큰 요청 중 에러 발생:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        style={{ flex: 1 }}
        originWhitelist={["*"]}
        scalesPageToFit={false}
        source={{
          uri: `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`,
        }}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        javaScriptEnabled
        onMessage={handleMessage}
      />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 24,
    backgroundColor: "#fff",
  },
});
