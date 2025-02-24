import React, { useState, useCallback } from "react";
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
import { fetchExercises } from "../api/exercises";
import { fetchExerciseRecords, deleteExerciseRecord, type ExerciseRecord, type Media } from "../api/exerciseRecords";
import EditExerciseModal from "../components/EditExerciseModal";

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
  Food: { date: string };
};

export const CalendarScreen = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExerciseRecord | null>(null);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadExerciseRecords = async (date: string) => {
    try {
      setIsLoading(true);
      const records = await fetchExerciseRecords(date);
      setExerciseRecords(records);
    } catch (error) {
      console.error("Failed to load exercise records:", error);
      Alert.alert(
        "오류",
        "운동 기록을 불러오는데 실패했습니다.",
        [{ text: "확인" }]
      );
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
    } catch (error) {
      console.error("Failed to load food records:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExerciseRecords(selectedDate);
      loadFoodRecords();
    }, [selectedDate])
  );

  const handleFoodButtonPress = () => {
    navigation.navigate("Food", { date: selectedDate });
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
          } catch (error) {
            console.error("Failed to delete exercise record:", error);
            Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  const handleEditRecord = (record: ExerciseRecord) => {
    setSelectedRecord(record);
    setEditModalVisible(true);
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
            </View>
            <View style={styles.recordDetails}>
              <Text style={styles.recordText}>
                {record.sets}세트 · {record.rep}회 · {record.weight}kg
                {record.duration ? ` · ${record.duration}분` : ''}
                {record.distance ? ` · ${record.distance}km` : ''}
              </Text>
            </View>
            {record.medias && record.medias.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
                {record.medias.map((media) => (
                  <Image
                    key={media.id}
                    source={{ uri: media.path }}
                    style={styles.mediaImage}
                  />
                ))}
              </ScrollView>
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
  
    // 현재 선택된 날짜의 운동 기록들이므로, selectedDate를 사용
    if (exerciseRecords.length > 0) {
      if (!marked[selectedDate]) {
        marked[selectedDate] = { dots: [] };
      }
      marked[selectedDate].dots?.push({
        key: "exercise",
        color: "#007AFF",
        selectedDotColor: "white",
      });
    }

    // 식단 기록이 있는 날짜에 보라색 점 추가
    foodRecords.forEach((record) => {
      const date = record.date;
      if (!marked[date]) {
        marked[date] = { dots: [] };
      }

      if (marked[date].dots && !marked[date].dots.some(dot => dot.key === "meal")) {
        marked[date].dots.push({
          key: "meal",
          color: "#8E44AD",
          selectedDotColor: "white",
        });
      }
    });

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
            onDayPress={handleDateSelect}
            markedDates={getMarkedDates()}
            markingType="multi-dot"
            theme={{
              selectedDayBackgroundColor: "#007AFF",
              selectedDayTextColor: "white",
              todayTextColor: "#007AFF",
              textDayFontWeight: "400",
              dotStyle: {
                width: 6,
                height: 6,
                marginTop: 2,
                marginBottom: 2,
                borderRadius: 3,
              },
              "stylesheet.calendar.main": {
                container: {
                  paddingRight: 40,
                },
                week: {
                  marginTop: 10,
                  marginBottom: 7,
                  flexDirection: "row",
                  justifyContent: "space-around",
                },
              },
            }}
            initialDate={today}
          />
        </View>
        {selectedDate && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.dateText}>{selectedDate}</Text>
            {renderExerciseRecords()}
            <View style={styles.buttonWrapper}>
              <PlusButton onPress={() => setModalVisible(true)} />
            </View>
            <View style={styles.secondDivider} />
            {renderFoodRecords()}
            <View style={styles.buttonWrapper}>
              <PlusButton onPress={handleFoodButtonPress} />
            </View>
          </View>
        )}

        <ExerciseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={() => loadExerciseRecords(selectedDate)}
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  calendarContainer: {},
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 5,
    marginRight: 10,
  },
  mediaContainer: {
    marginTop: 10,
    flexDirection: 'row',
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
});