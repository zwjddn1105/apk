import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import MyChallengeScreen from "../screens/challenge/MyChallengeScreen";
import ManageScreen from "../screens/ManageScreen";
import SearchScreen from "../screens/SearchScreen";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { View } from "react-native";

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        contentStyle: styles.contentStyle,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "홈") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "기록") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "챌린지") {
            iconName = focused ? "trophy" : "trophy-outline";
          } else if (route.name === "관리") {
            iconName = focused ? "build" : "build-outline";
          } else if (route.name === "검색") {
            iconName = focused ? "search" : "search-outline";
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        },

        tabBarActiveTintColor: "#0C508B",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: "#fff" }} />
        ),
      })}
    >
      <Tab.Screen name="홈" component={HomeScreen} />
      <Tab.Screen name="기록" component={CalendarScreen} />
      <Tab.Screen name="챌린지" component={MyChallengeScreen} />
      <Tab.Screen name="관리" component={ManageScreen} />
      <Tab.Screen name="검색" component={SearchScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 90,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  tabBarLabel: {
    fontSize: 10,
    paddingBottom: 10,
  },
  tabBarIcon: {
    marginTop: 5,
  },
  contentStyle: {
    backgroundColor: "#fff",
  },
});
