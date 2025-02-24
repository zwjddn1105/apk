import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import PlusButton from "../components/PlusButton";
import ExerciseModal from "../components/ExerciseModal/index";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopHeader } from "../components/TopHeader";
import {
  fetchExerciseRecords,
  deleteExerciseRecord,
  type ExerciseRecord,
  type Media,
} from "../api/exerciseRecords";
import EditExerciseModal from "../components/EditExerciseModal";
import { MealRecords } from "../components/MealRecords";
import { MealRecord } from "../api/mealRecords";
import { EXPO_PUBLIC_BASE_URL } from "@env";
import { fetchAIReport } from "../api/aiReports";
import { AIReportModal } from "../components/AIReportModal";

interface MarkedDates {
  [date: string]: {
    dots?: Array<{
      key: string;
      color: string;
      selectedDotColor: string;
    }>;
    selected?: boolean;
    selectedColor?: string;
  };
}

interface FoodRecord {
  id: string;
  date: string;
  calories: string;
  imageUri: string | null;
}

type RootStackParamList = {
  Main: undefined;
  Food: {
    date: string;
    type: "아침" | "점심" | "저녁";
    existingRecord?: MealRecord;
  };
};

export const CalendarScreen = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExerciseRecord | null>(
    null
  );
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [aiReportVisible, setAiReportVisible] = useState(false);
  const [aiReportContent, setAiReportContent] = useState<string | null>(null);
  const [isAiReportLoading, setIsAiReportLoading] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState<{
    exerciseDates: string[];
    mealDates: string[];
  }>({
    exerciseDates: [],
    mealDates: [],
  });

  const isToday = (date: string) => {
    return date === today;
  };

  const isPassedWeek = (date: DateData) => {
    const currentDate = new Date();
    const targetDate = new Date(date.dateString);

    // 현재 날짜의 주의 시작을 구함 (일요일)
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    // 대상 날짜가 현재 주의 시작일보다 이전인지 확인
    return targetDate < currentWeekStart;
  };

  const renderCustomDay = ({
    date,
    state,
  }: {
    date: DateData;
    state: string;
  }) => {
    if (!date) return null;

    const marked = getMarkedDates()[date.dateString];
    const isLastDayOfWeek = new Date(date.dateString).getDay() === 6; // 토요일

    return (
      <View style={styles.dayRowContainer}>
        <TouchableOpacity
          style={[styles.day, marked?.selected && styles.selectedDay]}
          onPress={() => handleDateSelect(date)}
        >
          <Text
            style={[
              styles.dayText,
              state === "disabled" && styles.disabledDayText,
              marked?.selected && styles.selectedDayText,
            ]}
          >
            {date.day}
          </Text>
          {marked?.dots && (
            <View style={styles.dotsContainer}>
              {marked.dots.map((dot, index) => (
                <View
                  key={index}
                  style={[styles.dot, { backgroundColor: dot.color }]}
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
        {isLastDayOfWeek && isPassedWeek(date) && (
          <TouchableOpacity
            style={styles.aiReportButton}
            onPress={() => handleAIReport(date)}
          >
            <Ionicons name="analytics" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const loadMonthlyRecords = async (date: string) => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token found");

      const [year, month] = date.split("-");
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

  const loadExerciseRecords = async (date: string) => {
    try {
      setIsLoading(true);
      const records = await fetchExerciseRecords(date);
      setExerciseRecords(records);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadFoodRecords = async () => {
    try {
      const records = await AsyncStorage.getItem("foodRecords");
      if (records) {
        setFoodRecords(JSON.parse(records));
      }
    } catch (error) {}
  };

  useFocusEffect(
    useCallback(() => {
      loadExerciseRecords(selectedDate);
      loadFoodRecords();
    }, [selectedDate])
  );

  const handleAIReport = async (date: DateData) => {
    try {
      setIsAiReportLoading(true);
      setAiReportVisible(true);

      const targetDate = new Date(date.dateString);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      // 해당 날짜가 몇 번째 주인지 계산
      const firstDayOfMonth = new Date(year, month - 1, 1);
      const weekNumber = Math.ceil(
        (targetDate.getDate() + firstDayOfMonth.getDay()) / 7
      );

      const report = await fetchAIReport(year, month, weekNumber);
      setAiReportContent(report);
    } catch (error) {
    } finally {
      setIsAiReportLoading(false);
    }
  };

  const handleFoodButtonPress = (
    mealType: "아침" | "점심" | "저녁",
    record?: MealRecord
  ) => {
    navigation.navigate("Food", {
      date: selectedDate,
      type: mealType,
      existingRecord: record,
    });
  };

  const handleDeleteRecord = async (record: ExerciseRecord) => {
    Alert.alert("운동 기록 삭제", "이 운동 기록을 삭제하시겠습니까?", [
      { text: "취소" },
      {
        text: "삭제",
        onPress: async () => {
          try {
            await deleteExerciseRecord(record.id);
            await loadExerciseRecords(selectedDate);

            // 현재 월의 기록 다시 불러오기
            const [year, month] = selectedDate.split("-");
            const monthDate = `${year}-${month}-01`;
            await loadMonthlyRecords(monthDate);
          } catch (error) {
            Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  const handleEditRecord = (record: ExerciseRecord) => {
    if (record) {
      // null 체크 추가
      setSelectedRecord(record);
      setEditModalVisible(true);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // 화면이 포커스를 받을 때마다 현재 월의 기록 다시 불러오기
      const [year, month] = selectedDate.split("-");
      const monthDate = `${year}-${month}-01`;
      loadMonthlyRecords(monthDate);
    });

    return unsubscribe;
  }, [navigation, selectedDate]);

  // 데이터가 변경될 때마다 달력 업데이트를 위한 useEffect 추가
  useEffect(() => {
    const [year, month] = selectedDate.split("-");
    const monthDate = `${year}-${month}-01`;
    loadMonthlyRecords(monthDate);
  }, [editModalVisible]);

  useEffect(() => {
    if (!editModalVisible && selectedDate) {
      loadExerciseRecords(selectedDate);
    }
  }, [editModalVisible, selectedDate]);

  const handleExerciseModalSave = async () => {
    try {
      await loadExerciseRecords(selectedDate);

      // 현재 월의 기록 다시 불러오기
      const [year, month] = selectedDate.split("-");
      const monthDate = `${year}-${month}-01`;
      await loadMonthlyRecords(monthDate);

      setModalVisible(false);
    } catch (error) {
      Alert.alert("오류", "기록 업데이트 중 문제가 발생했습니다.");
    }
  };

  const renderExerciseRecords = () => {
    if (exerciseRecords.length === 0) {
      return (
        <View style={styles.spacer}>
          <Text style={styles.spacerText}>
            현재 기록된 운동 기록이 없습니다.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.recordsContainer}>
        {exerciseRecords.map((record) => (
          <View key={record.id} style={styles.recordItem}>
            <View style={styles.recordHeader}>
              <View style={styles.exerciseInfoContainer}>
                {record.exerciseImage && (
                  <Image
                    source={{ uri: record.exerciseImage }}
                    style={styles.exerciseImage}
                  />
                )}
                <Text style={styles.exerciseName}>{record.exerciseName}</Text>
              </View>
              {isToday(selectedDate) && (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={() => handleEditRecord(record)}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteRecord(record)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF0000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.recordDetails}>
              <Text style={styles.recordText}>
                {record.sets}세트 · {record.rep}회 · {record.weight}kg
                {record.duration ? ` · ${record.duration}분` : ""}
                {record.distance ? ` · ${record.distance}km` : ""}
              </Text>
            </View>
            {record.medias && record.medias.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                {record.medias.map((media) => (
                  <Image
                    key={media.id}
                    source={{ uri: media.path }}
                    style={styles.mediaImage}
                  />
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderFoodRecords = () => {
    const filteredFoodRecords = foodRecords.filter(
      (record) => record.date === selectedDate
    );

    if (filteredFoodRecords.length === 0) {
      return (
        <View style={styles.spacer}>
          <Text style={styles.spacerText}>
            현재 기록된 식단 기록이 없습니다.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.recordsContainer}>
        {filteredFoodRecords.map((record) => (
          <View key={record.id} style={styles.recordItem}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordText}>{record.calories} kcal</Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  // 삭제 기능 구현 필요
                }}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF0000" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const getMarkedDates = () => {
    const marked: MarkedDates = {};

    // 운동 기록 표시 (파란색)
    if (monthlyRecords?.exerciseDates) {
      monthlyRecords.exerciseDates.forEach((date) => {
        if (!marked[date]) {
          marked[date] = { dots: [] };
        }
        marked[date].dots?.push({
          key: "exercise",
          color: "#007AFF",
          selectedDotColor: "white",
        });
      });
    }

    // 식단 기록 표시 (보라색) - mealDates로 키 변경
    if (monthlyRecords?.mealDates) {
      monthlyRecords.mealDates.forEach((date) => {
        if (!marked[date]) {
          marked[date] = { dots: [] };
        }
        marked[date].dots?.push({
          key: "meal",
          color: "#8E44AD",
          selectedDotColor: "white",
        });
      });
    }

    // 선택된 날짜 표시
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#007AFF",
      };
    }

    return marked;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopHeader />
      <ScrollView style={styles.container} bounces={false}>
        <View style={styles.calendarContainer}>
          <Calendar
            horizontal={true}
            pagingEnabled={true}
            onDayPress={handleDateSelect}
            onMonthChange={(month: DateData) => {
              const monthDate = `${month.year}-${String(month.month).padStart(
                2,
                "0"
              )}-01`;
              loadMonthlyRecords(monthDate);
            }}
            markedDates={getMarkedDates()}
            markingType="multi-dot"
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              selectedDayBackgroundColor: "#007AFF",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#007AFF",
              dayTextColor: "#2d4150",
              textDisabledColor: "#d9e1e8",
              dotColor: "#007AFF",
              selectedDotColor: "#ffffff",
              monthTextColor: "#2d4150",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
              "stylesheet.calendar.header": {
                week: {
                  marginTop: 5,
                  flexDirection: "row",
                  justifyContent: "space-between", // 변경
                  paddingRight: 60,
                },
              },
              "stylesheet.calendar.main": {
                week: {
                  marginVertical: 4,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingRight: 40, // AI 버튼을 위한 공간
                },
                dayContainer: {
                  flex: 1,
                  alignItems: "center",
                },
              },
              "stylesheet.day.multiDot": {
                dots: {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 2,
                },
                dot: {
                  width: 4,
                  height: 4,
                  marginHorizontal: 1,
                  marginVertical: 1,
                  borderRadius: 2,
                },
              },
            }}
            dayComponent={renderCustomDay}
            initialDate={today}
          />
        </View>
        {selectedDate && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.dateText}>{selectedDate}</Text>
            {renderExerciseRecords()}
            {isToday(selectedDate) && (
              <View style={styles.buttonWrapper}>
                <PlusButton onPress={() => setModalVisible(true)} />
              </View>
            )}
            <View style={styles.secondDivider} />
            <MealRecords
              date={selectedDate}
              onAddPress={(type) =>
                isToday(selectedDate) ? handleFoodButtonPress(type) : null
              }
              onEditPress={(record) =>
                isToday(selectedDate)
                  ? handleFoodButtonPress(record.type, record)
                  : null
              }
              showControls={isToday(selectedDate)}
              onRecordChange={() => {
                const [year, month] = selectedDate.split("-");
                const monthDate = `${year}-${month}-01`;
                loadMonthlyRecords(monthDate);
              }}
            />
          </View>
        )}

        <ExerciseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleExerciseModalSave}
          selectedDate={selectedDate}
        />

        {selectedRecord && (
          <EditExerciseModal
            visible={editModalVisible}
            onClose={() => {
              setEditModalVisible(false);
              setSelectedRecord(null);
            }}
            onSave={() => {
              loadExerciseRecords(selectedDate);
              setEditModalVisible(false);
              setSelectedRecord(null);
            }}
            record={selectedRecord}
          />
        )}

        <AIReportModal
          visible={aiReportVisible}
          onClose={() => {
            setAiReportVisible(false);
            setAiReportContent(null);
          }}
          reportContent={aiReportContent}
          isLoading={isAiReportLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  calendarContainer: {
    flex: 0.85, // 달력이 차지하는 비율
  },
  calendarSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 10,
  },
  calendar: {
    width: "100%",
  },
  dateText: {
    fontSize: 18,
    textAlign: "left",
    marginTop: -15,
    marginLeft: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 30,
    marginHorizontal: 20,
  },
  spacer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  spacerText: {
    fontSize: 14,
    color: "#666",
  },
  secondDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 40,
  },
  buttonWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  recordsContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  recordItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordDetails: {
    marginTop: 4,
  },
  recordText: {
    marginLeft: 50,
    fontSize: 14,
    color: "#666",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 5,
  },
  setsContainer: {
    marginLeft: 10,
  },
  setText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  exerciseInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 5,
    marginRight: 10,
  },
  mediaContainer: {
    marginTop: 10,
    flexDirection: "row",
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  mediaPreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 10,
  },
  dayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
  },
  day: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  dayRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  selectedDay: {
    backgroundColor: "#0C508B",
  },
  dayText: {
    fontSize: 14,
    color: "#000",
  },
  disabledDayText: {
    color: "#ccc",
  },
  selectedDayText: {
    color: "#fff",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  weeklyButtonsContainer: {
    flex: 0.15, // 버튼이 차지하는 비율
    paddingLeft: 5,
    justifyContent: "space-around",
    alignItems: "center",
  },
  aiReportButton: {
    position: "absolute",
    right: -36,
    backgroundColor: "#F0F8FF",
    padding: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  aiReportButtonText: {
    fontSize: 10,
    color: "#007AFF",
    marginTop: 4,
  },
});
