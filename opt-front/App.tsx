import React from "react";
import { StyleSheet, View, Text, Button, Linking, Platform, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StackNavigator } from "./navigation/StackNavigator";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";

const openMLKit = () => {
  if (Platform.OS === "android") {
    Linking.openURL("intent://com.example.cameraxapptest.MLKIT#Intent;scheme=app;package=com.example.cameraxapptest;end;")
      .catch(err => console.log(err));
  } else {
    Alert.alert("알림", "Android에서만 지원됩니다.");
  }
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <NavigationContainer>
            <StackNavigator />
          </NavigationContainer>
        </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "blue",
  },
  mlKitContainer: {
    position: "absolute",
    bottom: 50, // 화면 하단에 배치
    alignSelf: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 5, // Android 그림자 효과
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  mlKitText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
});
