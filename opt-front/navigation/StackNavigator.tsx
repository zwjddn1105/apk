// navigation/StackNavigator.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabNavigator } from "./BottomTabNavigator";
import LoginScreen from "../screens/LoginScreen";
import DMScreen from "../screens/chat/DMScreen";
import LoginNeedScreen from "../screens/LoginNeedScreen";
import FoodScreen from "../screens/FoodScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import OngoingChallengesScreen from "../screens/challenge/OngoingChallengesScreen";
import AppliedChallengesScreen from "../screens/challenge/AppliedChallengesScreen";
import PastChallengesScreen from "../screens/challenge/PastChallengesScreen";
import ManageChallengeScreen from "../screens/challenge/ManageChallengeScreen";
import CreateChallengeScreen from "../screens/challenge/CreateChallengeScreen";
import MyChallengeScreen from "../screens/challenge/MyChallengeScreen";
import ChatScreen from "../screens/chat/ChatScreen";
import BadgeScreen from "../screens/profile/BadgeScreen";
import SettingScreen from "../screens/profile/SettingScreen";
import AllChallengeScreen from "../screens/challenge/AllChallengeScreen";
import AllOngoingChallengesScreen from "../screens/challenge/AllOngoingChallengesScreen";
import AllUpComingChallengesScreen from "../screens/challenge/AllUpComingChallengesScreen";
import AllEndedChallengesScreen from "../screens/challenge/AllEndedChallengesScreen";
import DetailChallengeScreen from "../screens/challenge/DetailChallengesScreen";
import OtherProfileScreen from "screens/profile/OtherProfileScreen";
import AuthChallengeScreen from "screens/challenge/AuthChallengeScreen";
import { MealRecord } from '../api/mealRecords';
import OnboardingInterestsScreen from "screens/OnboardingInterestsScreen";

export type RootStackParamList = {
  Main: undefined;
  LoginScreen: undefined;
  DMScreen: undefined;
  LoginNeedScreen: undefined;
  Food: { 
    date: string;
    type: "아침" | "점심" | "저녁";
    existingRecord?: MealRecord;
  };
  ManagerChat: undefined;
  TrainerChat: undefined;
  UserChat: undefined;
  ProfileScreen: { profileData: any };
  OngoingChallenges: undefined;
  AppliedChallenges: undefined;
  PastChallenges: undefined;
  ManageChallenge: undefined;
  CreateChallenge: undefined;
  MyChallenge: undefined;
  AllChallenges: undefined;
  AllOngoingChallenge: undefined;
  AllUpComingChallenge: undefined;
  AllEndedChallenge: undefined;
  DetailChallenge: { challengeId: number };
  Badge: undefined;
  Chat: {
    roomId: string;
    otherUserName: string;
    otherUserType: "USER" | "TRAINER" | "ADMIN";
  };
  SettingScreen: undefined;
  OtherProfileScreen: { hostId: number };
  AuthChallengeScreen: { challengeId: number };
  OnBoardingInterest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const StackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="DMScreen" component={DMScreen} />
      <Stack.Screen name="LoginNeedScreen" component={LoginNeedScreen} />
      <Stack.Screen name="Food" component={FoodScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="OtherProfileScreen" component={OtherProfileScreen} />
      <Stack.Screen
        name="OngoingChallenges"
        component={OngoingChallengesScreen}
      />
      <Stack.Screen
        name="AppliedChallenges"
        component={AppliedChallengesScreen}
      />
      <Stack.Screen name="AllChallenges" component={AllChallengeScreen} />
      <Stack.Screen name="PastChallenges" component={PastChallengesScreen} />
      <Stack.Screen name="ManageChallenge" component={ManageChallengeScreen} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} />
      <Stack.Screen name="MyChallenge" component={MyChallengeScreen} />
      <Stack.Screen
        name="AllOngoingChallenge"
        component={AllOngoingChallengesScreen}
      />
      <Stack.Screen
        name="AllUpComingChallenge"
        component={AllUpComingChallengesScreen}
      />
      <Stack.Screen
        name="AllEndedChallenge"
        component={AllEndedChallengesScreen}
      />
      <Stack.Screen name="DetailChallenge" component={DetailChallengeScreen} />
      <Stack.Screen
        name="AuthChallengeScreen"
        component={AuthChallengeScreen}
      />
      <Stack.Screen name="Badge" component={BadgeScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="SettingScreen" component={SettingScreen} />
      <Stack.Screen name="OnBoardingInterest" component={OnboardingInterestsScreen} />
    </Stack.Navigator>
  );
};
