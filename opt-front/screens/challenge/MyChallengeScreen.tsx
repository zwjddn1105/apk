import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopHeader } from "../../components/TopHeader";
import axios from "axios";
import { EXPO_PUBLIC_BASE_URL } from "@env";
type RootStackParamList = {
  LoginNeedScreen: { returnScreen: string } | undefined;
  OngoingChallenges: undefined;
  AppliedChallenges: undefined;
  PastChallenges: undefined;
  ManageChallenge: undefined;
  MyChallengeScreen: undefined;
  AllChallenges: undefined;
  DetailChallenge: { challengeId: number }; // 수정: 파라미터 타입 지정
};

type Challenge = {
  id: number;
  type: string;
  title: string;
  description: string;
  reward: string;
  startDate: string;
  endDate: string;
  status: string;
  imagePath: string;
};
type SectionNavigationParams = Pick<
  RootStackParamList,
  "OngoingChallenges" | "AppliedChallenges" | "PastChallenges"
>;
const BASE_URL = EXPO_PUBLIC_BASE_URL;

const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem("refreshToken");
  } catch (error) {}
};

const fetchOngoingChallenges = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error("Refresh token not found");
    const response = await axios.get<Challenge[]>(
      `${BASE_URL}/challenges/participating`,
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const fetchAppliedChallenges = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error("Refresh token not found");
    const response = await axios.get<Challenge[]>(
      `${BASE_URL}/challenges/applied`,
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const fetchPastChallenges = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error("Refresh token not found");
    const response = await axios.get<Challenge[]>(
      `${BASE_URL}/challenges/past`,
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const MyChallengeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [ongoingChallenges, setOngoingChallenges] = useState<Challenge[]>([]);
  const [appliedChallenges, setAppliedChallenges] = useState<Challenge[]>([]);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleSwitch = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate("AllChallenges");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const role = await AsyncStorage.getItem("role");
        setIsLoggedIn(refreshToken !== null);
        setUserRole(role);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn === false) {
      navigation.replace("LoginNeedScreen", {
        returnScreen: "MyChallenge",
      });
    }
  }, [isLoggedIn, navigation]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const ongoing = await fetchOngoingChallenges();
        setOngoingChallenges(ongoing);

        const applied = await fetchAppliedChallenges();
        setAppliedChallenges(applied);

        const past = await fetchPastChallenges();
        setPastChallenges(past);
      } catch (error) {}
    };

    fetchChallenges();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderSectionHeader = (
    title: string,
    navigateTo: keyof SectionNavigationParams
  ) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate(navigateTo)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const renderChallengeCard = (challenge: Challenge) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("DetailChallenge", {
          challengeId: challenge.id,
        })
      }
      activeOpacity={0.8}
    >
      <ImageBackground
        source={{ uri: challenge.imagePath }}
        style={styles.challengeCard}
        imageStyle={{ borderRadius: 15 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.cardTitle}>{challenge.title}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopHeader />
      <ScrollView style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.headerContainer}>
            {userRole === "ROLE_TRAINER" && (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => navigation.navigate("ManageChallenge")}
                activeOpacity={0.8}
              >
                <Text style={styles.manageButtonText}>챌린지 관리</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={toggleSwitch}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleTrack]}>
                <Text style={[styles.toggleText]}>MY</Text>
                <View style={[styles.toggleThumb]} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            {renderSectionHeader("내가 참여중인 챌린지", "OngoingChallenges")}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {ongoingChallenges.map((challenge, index) => (
                <React.Fragment key={challenge.id}>
                  {renderChallengeCard(challenge)}
                  {index % 2 === 0 && index < ongoingChallenges.length - 1 && (
                    <View style={styles.cardSpacer} />
                  )}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            {renderSectionHeader("내가 신청한 챌린지", "AppliedChallenges")}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {appliedChallenges.map((challenge, index) => (
                <React.Fragment key={challenge.id}>
                  {renderChallengeCard(challenge)}
                  {index % 2 === 0 && index < appliedChallenges.length - 1 && (
                    <View style={styles.cardSpacer} />
                  )}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            {renderSectionHeader("내가 참여했던 챌린지", "PastChallenges")}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {pastChallenges.map((challenge, index) => (
                <React.Fragment key={challenge.id}>
                  {renderChallengeCard(challenge)}
                  {index % 2 === 0 && index < pastChallenges.length - 1 && (
                    <View style={styles.cardSpacer} />
                  )}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    marginBottom: 10,
    flex: 1,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 30,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  addButtonText: {
    fontSize: 18,
    color: "#666",
    lineHeight: 24,
  },
  challengeCard: {
    width: cardWidth,
    height: 220,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // 반투명한 오버레이
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF", // 흰색 텍스트
    textAlign: "center",
    padding: 10,
  },
  cardSpacer: {
    width: 12,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    width: 70,
    fontSize: 12,
    color: "#666",
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  toggleContainer: {
    width: 75,
    height: 30,
    alignSelf: "flex-end",
    marginRight: 20,
  },
  toggleTrack: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "#0C508B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f4f3f4",
    position: "absolute",
    right: 4,
  },
  toggleText: {
    color: "#f4f3f4",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 8,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 10,
    // paddingRight: 20,
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#0C508B",
    borderRadius: 15,
    marginRight: 12,
  },
  manageButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  switchButton: {
    width: 75, // 버튼 너비
    height: 30, // 버튼 높이
    borderRadius: 15, // 둥근 모서리
    backgroundColor: "#0C508B", // 비활성화 상태의 배경색
    flexDirection: "row", // 텍스트와 썸을 가로로 배치
    alignItems: "center", // 수직 가운데 정렬
    paddingHorizontal: 4, // 내부 여백
  },

  switchButtonText: {
    color: "#fff", // 텍스트 색상
    fontSize: 13, // 텍스트 크기
    fontWeight: "bold", // 텍스트 굵기
    marginLeft: 8, // 텍스트와 썸 사이 간격
  },
  switchThumb: {
    width: 24, // 썸의 너비
    height: 24, // 썸의 높이
    borderRadius: 12, // 썸의 둥근 모서리
    backgroundColor: "#f4f3f4", // 썸의 색상
    position: "absolute", // 위치를 절대값으로 설정
  },
  switchThumbActive: {
    right: 4, // 활성화 상태에서 오른쪽으로 이동
  },
});

export default MyChallengeScreen;
