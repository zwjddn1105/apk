import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  FlatList,
  Dimensions,
  StyleSheet,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopHeader } from "../../components/TopHeader";
import axios from "axios";
import { EXPO_PUBLIC_BASE_URL } from "@env";
import { BottomTabNavigator } from "navigation/BottomTabNavigator";
type RootStackParamList = {
  AllOngoingChallenge: undefined;
  AllUpComingChallenge: undefined;
  AllEndedChallenge: undefined;
  PastChallenges: undefined;
  ManageChallenge: undefined;
  MyChallenge: undefined;
  AllChallenges: undefined;
  DetailChallenge: { challengeId: number };
};

type Challenge = {
  id: number;
  type: string;
  title: string;
  description: string;
  reward: string;
  templateId: number;
  winnerName: string | null;
  hostId: number;
  hostNickname: string;
  hostRealName: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  currentParticipants: number;
  maxParticipants: number;
  frequency: number;
  progress: number | null;
  imagePath: string;
  exerciseType: string;
  exerciseCount: number | null;
  exerciseDuration: number | null;
  exerciseDistance: number | null;
};

type SectionNavigationParams = Pick<
  RootStackParamList,
  "AllOngoingChallenge" | "AllUpComingChallenge" | "AllEndedChallenge"
>;

const BASE_URL = EXPO_PUBLIC_BASE_URL;

const fetchChallenges = async (
  status: string,
  page: number,
  setChallengeFn: React.Dispatch<React.SetStateAction<Challenge[]>>,
  setPage: React.Dispatch<React.SetStateAction<number>>,
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    const response = await axios.get<{ content: Challenge[]; last: boolean }>(
      `${BASE_URL}/challenges`,
      {
        params: {
          status,
          page,
          size: 20,
        },
      }
    );
    setChallengeFn((prev) => [...prev, ...response.data.content]);
    setPage(page + 1);
    setHasMore(!response.data.last);
  } catch (error) {
    throw error;
  }
};

const AllChallengeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [ongoingChallenges, setOngoingChallenges] = useState<Challenge[]>([]);
  const [upComingChallenges, setUpComingChallenges] = useState<Challenge[]>([]);
  const [endedChallenges, setEndedChallenges] = useState<Challenge[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [ongoingPage, setOngoingPage] = useState(0);
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [endedPage, setEndedPage] = useState(0);
  const [hasMoreOngoing, setHasMoreOngoing] = useState(true);
  const [hasMoreUpcoming, setHasMoreUpcoming] = useState(true);
  const [hasMoreEnded, setHasMoreEnded] = useState(true);

  const toggleSwitch = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate("MyChallenge");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    const fetchInitialChallenges = async () => {
      try {
        await Promise.all([
          fetchChallenges(
            "progress",
            ongoingPage,
            setOngoingChallenges,
            setOngoingPage,
            setHasMoreOngoing
          ),
          fetchChallenges(
            "open",
            upcomingPage,
            setUpComingChallenges,
            setUpcomingPage,
            setHasMoreUpcoming
          ),
          fetchChallenges(
            "end",
            endedPage,
            setEndedChallenges,
            setEndedPage,
            setHasMoreEnded
          ),
        ]);
      } catch (error) {}
    };

    fetchInitialChallenges();
  }, []);

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

  const handleLoadMore = async (type: "ongoing" | "upcoming" | "ended") => {
    switch (type) {
      case "ongoing":
        if (hasMoreOngoing)
          await fetchChallenges(
            "progress",
            ongoingPage,
            setOngoingChallenges,
            setOngoingPage,
            setHasMoreOngoing
          );
        break;
      case "upcoming":
        if (hasMoreUpcoming)
          await fetchChallenges(
            "open",
            upcomingPage,
            setUpComingChallenges,
            setUpcomingPage,
            setHasMoreUpcoming
          );
        break;
      case "ended":
        if (hasMoreEnded)
          await fetchChallenges(
            "end",
            endedPage,
            setEndedChallenges,
            setEndedPage,
            setHasMoreEnded
          );
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopHeader />
      <ScrollView style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={toggleSwitch}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleTrack]}>
                <Text style={[styles.toggleText]}>ALL</Text>
                <View style={[styles.toggleThumb]} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            {renderSectionHeader("진행 중인 챌린지", "AllOngoingChallenge")}
            <FlatList
              data={ongoingChallenges}
              renderItem={({ item }) => renderChallengeCard(item)}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              onEndReached={() => handleLoadMore("ongoing")}
              onEndReachedThreshold={0.1}
            />
          </View>
          <View style={styles.section}>
            {renderSectionHeader("개최 예정인 챌린지", "AllUpComingChallenge")}
            <FlatList
              data={upComingChallenges}
              renderItem={({ item }) => renderChallengeCard(item)}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              onEndReached={() => handleLoadMore("upcoming")}
              onEndReachedThreshold={0.1}
            />
          </View>
          <View style={styles.section}>
            {renderSectionHeader("종료된 챌린지", "AllEndedChallenge")}
            <FlatList
              data={endedChallenges}
              renderItem={({ item }) => renderChallengeCard(item)}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              onEndReached={() => handleLoadMore("ended")}
              onEndReachedThreshold={0.1}
            />
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
  },
  cardSpacer: {
    width: 12,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF", // 흰색 텍스트
    textAlign: "center",
    padding: 10,
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
    backgroundColor: "#ACACAD",
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
    left: 4,
  },
  toggleText: {
    color: "#f4f3f4",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 32,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 10,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // 반투명한 오버레이
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AllChallengeScreen;
