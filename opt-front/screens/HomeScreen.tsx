import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  ViewToken,
  ImageBackground,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopHeader } from "../components/TopHeader";
import {
  searchTrainers,
  getRecommendedTrainers,
  TrainerResponse,
} from "../api/searchTrainer";
import {
  LocationObject,
  requestForegroundPermissionsAsync,
  getForegroundPermissionsAsync,
  getLastKnownPositionAsync,
} from "expo-location";
import { EXPO_PUBLIC_BASE_URL } from "@env";
import axios from "axios";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = WINDOW_WIDTH;
const AUTO_SCROLL_INTERVAL = 5000; // 5초마다 자동 슬라이드

type RootStackParamList = {
  Home: undefined;
  KakaoLogin: undefined;
  DMScreen: undefined;
  Profile: undefined;
  LoginNeedScreen: undefined;
  ProfileScreen: { profileData: any };
  OnboardingScreen: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface TrainerCardProps {
  trainer: TrainerResponse;
  compact?: boolean;
}

const TrainerCard: React.FC<TrainerCardProps> = ({
  trainer,
  compact = true,
}) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  // console.log(trainer, "aaaaaaaaaaaaaaaaaaaaaaaaa");
  const lowestPriceMenu =
    trainer.menus.length > 0
      ? trainer.menus.reduce((prev, curr) =>
          prev.price < curr.price ? prev : curr
        )
      : null;

  const roundedRating = Math.round(trainer.averageRating * 10) / 10;

  const handlePress = () => {
    navigation.navigate("ProfileScreen", { profileData: trainer.trainerId });
  };

  return (
    // <TouchableOpacity
    //   style={[styles.trainerCard, compact && styles.trainerCardCompact]}
    //   onPress={handlePress}
    //   activeOpacity={0.7}
    // >
    <View style={[styles.trainerCard, compact && styles.trainerCardCompact]}>
      <Image
        source={{ uri: trainer.trainerProfileImage }}
        style={[styles.trainerImage, compact && styles.trainerImageCompact]}
        defaultSource={require("../assets/trainer-placeholder.png")}
      />

      <View style={styles.trainerContent}>
        <Text style={styles.trainerName} numberOfLines={1}>
          {trainer.trainerNickname}
        </Text>
        <Text style={styles.trainerDescription} numberOfLines={1}>
          {trainer.keywords.join(", ")}
        </Text>
        {lowestPriceMenu && (
          <Text style={styles.trainerPrice}>
            {lowestPriceMenu.totalSessions}회{" "}
            {lowestPriceMenu.price.toLocaleString()}원
          </Text>
        )}
      </View>
    </View>
    // </TouchableOpacity>
  );
};

interface SpecialtyButtonProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
}

const SpecialtyButton: React.FC<SpecialtyButtonProps> = ({
  title,
  isSelected,
  onPress,
}) => (
  <TouchableOpacity
    style={[
      styles.specialtyButton,
      isSelected && styles.specialtyButtonSelected,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.specialtyButtonText,
        isSelected && styles.specialtyButtonTextSelected,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

interface TabButtonProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  title,
  isSelected,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.tabButton, isSelected && styles.tabButtonSelected]}
    onPress={onPress}
  >
    <Text
      style={[styles.tabButtonText, isSelected && styles.tabButtonTextSelected]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

interface Schedule {
  id: number;
  nickname: string;
  startTime: Date;
  endTime: Date;
}

const TodaySchedule: React.FC<{ schedule: Schedule }> = ({ schedule }) => {
  const formatTime = (date: Date) => {
    return new Date(date)
      .toLocaleTimeString("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/\s+/g, " ");
  };

  return (
    <View style={styles.todayScheduleContainer}>
      <View style={styles.scheduleIconContainer}>
        <View style={styles.scheduleIcon} />
      </View>
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>{schedule.nickname}</Text>
        <Text style={styles.scheduleTime}>
          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
        </Text>
      </View>
    </View>
  );
};

interface ChallengeItem {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imagePath: string;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [selectedTab, setSelectedTab] = useState("nearby");
  const [nearbyTrainers, setNearbyTrainers] = useState<TrainerResponse[]>([]);
  const [popularTrainers, setPopularTrainers] = useState<TrainerResponse[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [streak, setStreak] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<string[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [CHALLENGE_DATA, setChallenges] = useState<ChallengeItem[]>([]);
  const fetchChallenges = async () => {
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BASE_URL}/challenges?status=progress&page=0&size=5`
      );
      setChallenges(response.data.content);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const [monthlyRecords, setMonthlyRecords] = useState<{
    exerciseDates: string[];
    mealDates: string[];
  }>({
    exerciseDates: [],
    mealDates: [],
  });
  useEffect(() => {
    fetchChallenges();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const loadMonthlyRecords = async () => {
        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("No refresh token found");

          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth() + 1;

          const url = `${EXPO_PUBLIC_BASE_URL}/exercise-records/monthly?year=${year}&month=${month}`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch monthly records");
          }

          const data = await response.json();
          setMonthlyRecords(data);
        } catch (error) {}
      };

      loadMonthlyRecords();
      calculateWorkoutStats();
    }, [])
  );

  const fetchLocation = async () => {
    try {
      const { status } = await getForegroundPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await requestForegroundPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert("위치 권한이 필요합니다");
          return;
        }
      }

      const locationResult = await getLastKnownPositionAsync({});
      if (!locationResult) {
        return;
      }

      setLocation({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      });
    } catch (error) {}
  };

  const fetchTrainers = async () => {
    try {
      // Fetch nearby trainers
      if (location) {
        const nearbyResponse = await searchTrainers({
          myLatitude: location.latitude,
          myLongitude: location.longitude,
          sortBy: "distance",
          size: 7,
        });
        setNearbyTrainers(nearbyResponse.content);
      }

      // Fetch popular trainers
      const popularResponse = await getRecommendedTrainers({
        size: 7,
      });
      setPopularTrainers(popularResponse.content);

      // 월별 운동 기록 가져오기 (달력 컴포넌트와 비슷한 방식)
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token found");

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        const url = `${EXPO_PUBLIC_BASE_URL}/exercise-records/monthly?year=${year}&month=${month}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch monthly records");
        }

        const data = await response.json();
        setMonthlyRecords(data);
      } catch (error) {}
    } catch (error) {}
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchTrainers();
    }
  }, [location]);

  const flatListRef = useRef<FlatList<ChallengeItem>>(null);
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
    minimumViewTime: 0,
  }).current;

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewToken>;
      changed: Array<ViewToken>;
    }) => {
      if (viewableItems[0]) {
        setCurrentChallengeIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const specialties = ["다이어트", "빌크업", "필라테스", "체형교정"];

  // 자동 스크롤 설정
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (!isScrolling && CHALLENGE_DATA.length > 0) {
      // 조건 추가
      intervalId = setInterval(() => {
        const nextIndex = (currentChallengeIndex + 1) % CHALLENGE_DATA.length; // 수정
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }, AUTO_SCROLL_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentChallengeIndex, isScrolling, CHALLENGE_DATA]); // 의존성 배열에 challenges 추가

  const calculateWorkoutStats = async () => {
    try {
      const today = new Date();
      const exerciseDates = monthlyRecords.exerciseDates || [];

      // 연속 운동일수 계산
      let currentStreak = 0;

      // 날짜를 내림차순으로 정렬하고 Date 객체로 변환
      const sortedDates = exerciseDates
        .map((dateStr) => new Date(dateStr))
        .sort((a, b) => b.getTime() - a.getTime());

      // 마지막 운동 날짜부터 시작
      if (sortedDates.length > 0) {
        let currentDate = sortedDates[0];

        // 오늘 또는 어제도 운동했는지 확인
        const todayStr = today.toISOString().split("T")[0];
        const yesterdayStr = new Date(today.getTime() - 86400000)
          .toISOString()
          .split("T")[0];

        if (
          exerciseDates.includes(todayStr) ||
          exerciseDates.includes(yesterdayStr)
        ) {
          currentStreak = 1;
        }

        // 마지막 운동 날짜부터 연속 운동일 계산
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = sortedDates[i - 1];
          const currentCheckedDate = sortedDates[i];

          // 날짜 차이 계산 (86400000 = 하루의 밀리초)
          const dateDiff =
            (prevDate.getTime() - currentCheckedDate.getTime()) / 86400000;

          // 연속된 날짜인 경우 streak 증가
          if (dateDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // 주간 운동 현황 계산
      const weeklyDates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000)
          .toISOString()
          .split("T")[0];
        weeklyDates.push(date);
      }

      setStreak(currentStreak);
      setWeeklyWorkouts(
        weeklyDates.filter((date) => exerciseDates.includes(date))
      );
    } catch (error) {}
  };

  useEffect(() => {
    if (monthlyRecords?.exerciseDates) {
      calculateWorkoutStats();
    }
  }, [monthlyRecords]);

  const loadTodaySchedules = async () => {
    try {
      const schedulesStr = await AsyncStorage.getItem("schedules");
      if (schedulesStr) {
        const allSchedules: Schedule[] = JSON.parse(schedulesStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySchedules = allSchedules
          .filter((schedule: Schedule) => {
            const scheduleDate = new Date(schedule.startTime);
            scheduleDate.setHours(0, 0, 0, 0);
            return scheduleDate.getTime() === today.getTime();
          })
          .sort((a: Schedule, b: Schedule) => {
            const timeA = new Date(a.startTime).getTime();
            const timeB = new Date(b.startTime).getTime();
            return timeA - timeB;
          });

        setTodaySchedules(todaySchedules);
      }
    } catch (error) {}
  };

  useFocusEffect(
    useCallback(() => {
      calculateWorkoutStats();
      loadTodaySchedules();
    }, [])
  );

  const renderChallengeSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>진행중인 챌린지</Text>
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={CHALLENGE_DATA} // 여기를 수정
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => setIsScrolling(false)}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH,
            offset: CARD_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={styles.challengeCard}>
              <ImageBackground
                source={
                  item.imagePath
                    ? { uri: item.imagePath } // 네트워크 이미지
                    : require("../assets/challenge-placeholder.png") // 기본 이미지
                }
                style={styles.challengeCardImage}
                // defaultSource={require("../assets/challenge-placeholder.png")}
              >
                <View style={styles.challengeOverlay}>
                  <View style={styles.challengeCardContent}>
                    <Text style={styles.challengeCardTitle}>{item.title}</Text>
                    <Text style={styles.challengeCardDescription}>
                      {item.description}
                    </Text>
                    <Text style={styles.challengeCardPeriod}>
                      {item.startDate} ~ {item.endDate}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
        <View style={styles.dotContainer}>
          {CHALLENGE_DATA.map(
            (
              _,
              index // 여기도 수정
            ) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentChallengeIndex && styles.activeDot,
                ]}
              />
            )
          )}
        </View>
      </View>
    </View>
  );

  const renderTrainerSection = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {(selectedTab === "nearby" ? nearbyTrainers : popularTrainers).map(
        (trainer) => (
          <TrainerCard
            key={trainer.trainerId}
            trainer={trainer}
            compact={true}
          />
        )
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TopHeader />
        <ScrollView style={styles.mainContent}>
          <View style={styles.workoutStatsSection}>
            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakText}>일 연속 운동 중</Text>
            </View>
            <View style={styles.weeklyContainer}>
              {Array.from({ length: 7 }).map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dateString = date.toISOString().split("T")[0];
                const isWorkoutDay = weeklyWorkouts.includes(dateString);
                const isToday = index === 6;

                return (
                  <View key={dateString} style={styles.dayContainer}>
                    <Text style={styles.dayText}>
                      {
                        ["일", "월", "화", "수", "목", "금", "토"][
                          date.getDay()
                        ]
                      }
                    </Text>
                    <View
                      style={[
                        styles.dayDot,
                        isWorkoutDay && styles.workoutDot,
                        isToday && styles.todayDot,
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {renderChallengeSection()}

          <View style={styles.section}>
            <View style={styles.trainerHeader}>
              <View style={styles.tabContainer}>
                <TabButton
                  title="내 주변 트레이너"
                  isSelected={selectedTab === "nearby"}
                  onPress={() => setSelectedTab("nearby")}
                />
                <TabButton
                  title="많이 찾는 트레이너"
                  isSelected={selectedTab === "popular"}
                  onPress={() => setSelectedTab("popular")}
                />
              </View>
            </View>
            {renderTrainerSection()}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    marginBottom: 10,
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  section: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 15,
  },
  specialtyButtonsContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  specialtyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  specialtyButtonSelected: {
    backgroundColor: "#000",
  },
  specialtyButtonText: {
    fontSize: 14,
    color: "#666",
  },
  specialtyButtonTextSelected: {
    color: "#fff",
  },
  // 챌린지 캐러셀 스타일
  carouselContainer: {
    marginTop: 15,
  },
  challengeScrollContent: {
    paddingHorizontal: 0,
  },
  challengeCard: {
    width: CARD_WIDTH,
    height: 250, // 카드 높이 조정
    backgroundColor: "#fff",
  },
  challengeCardImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end", // 텍스트를 이미지 하단에 배치
  },
  challengeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)", // 반투명한 오버레이
  },
  challengeCardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  challengeCardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  challengeCardDescription: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  challengeCardPeriod: {
    fontSize: 14,
    color: "#fff",
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#000",
    width: 24,
  },
  trainerCard: {
    width: 300,
    marginHorizontal: 5,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2.84,
    elevation: 3,
  },
  trainerCardCompact: {
    width: 200,
  },
  trainerImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  trainerImageCompact: {
    height: 150,
  },
  trainerContent: {
    padding: 15,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  trainerDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  trainerPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  trainerHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 15,
  },
  tabButton: {
    paddingBottom: 8,
  },
  tabButtonSelected: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#999",
  },
  tabButtonTextSelected: {
    color: "#000",
  },
  workoutStatsSection: {
    backgroundColor: "#f8f8f8",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakContainer: {
    alignItems: "center",
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "bold",
  },
  streakText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  weeklyContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dayContainer: {
    alignItems: "center",
    gap: 8,
  },
  dayText: {
    fontSize: 12,
    color: "#666",
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  workoutDot: {
    backgroundColor: "#007AFF",
  },
  todayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#000",
  },
  userName: {
    fontWeight: "bold",
  },
  scheduleCount: {
    color: "#0047FF",
    fontWeight: "bold",
  },
  todaySchedulesSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  todaySchedulesTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: "#333",
  },
  todayScheduleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  scheduleIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  scheduleIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0047FF",
  },
  scheduleTextContainer: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: "#666",
  },
});

export default HomeScreen;
