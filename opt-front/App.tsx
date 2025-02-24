// App.tsx
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StackNavigator } from "./navigation/StackNavigator";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";

export default function App() {
  return (
    // Provider들을 바깥쪽부터 안쪽으로 중첩해서 배치
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
});