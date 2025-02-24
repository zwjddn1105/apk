// CreateChallengeScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { TopHeader } from "../../components/TopHeader";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";
type RootStackParamList = {
  ManageChallenge: undefined;
};
type DropdownItem = {
  label: string;
  value: string;
};

interface ChallengeData {
  type: string;
  title: string;
  description: string;
  reward: string | null;
  startDate: string;
  endDate: string;
  max_participants: number;
  frequency: number;
  exercise_type: string;
  exercise_count?: number;
  exercise_duration?: number;
  exercise_distance?: number;
  imagePath?: string;
}
interface FormDataValue {
  name: string;
  type: string;
  uri: string;
}

declare global {
  interface FormData {
    append(name: string, value: FormDataValue): void;
  }
}
const placeholderTextColor = "#999";

const CreateChallengeScreen = () => {
  const BASE_URL = EXPO_PUBLIC_BASE_URL;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedType, setSelectedType] = useState<DropdownItem | null>(null); // 종류
  const [exerciseType, setExerciseType] = useState<DropdownItem | null>(null); // 운동종류
  const [title, setTitle] = useState(""); // 주제
  const [frequency, setFrequency] = useState(null); // 주기
  const [customPeriod, setCustomPeriod] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(""); // 상한인원
  const [exerciseValue, setExerciseValue] = useState(""); // count, duration, distance
  const [startDate, setStartDate] = useState(""); // 날짜
  const [endDate, setEndDate] = useState("");
  const [isRewardChecked, setIsRewardChecked] = useState(false); // 보상
  const [rewardText, setRewardText] = useState("");
  const [description, setDescription] = useState(""); // 설명

  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false); // 모달 표시 여부

  const [isImageChecked, setIsImageChecked] = useState(false); // 이미지관련련
  const [imageAttached, setImageAttached] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const types = [
    { label: "협동 챌린지", value: "TEAM" },
    { label: "매일 챌린지", value: "NORMAL" },
    { label: "서바이벌 챌린지", value: "SURVIVAL" },
  ];
  const exerciseTypes = [
    { label: "플랭크", value: "DURATION" },
    { label: "러닝", value: "DISTANCE" },
    { label: "스쿼트", value: "COUNT" },
    { label: "풀업", value: "COUNT" },
    { label: "푸쉬업", value: "COUNT" },
    { label: "벤치프레스", value: "COUNT" },
    { label: "데드리프트", value: "COUNT" },
    { label: "레그프레스", value: "COUNT" },
    { label: "레그익스텐션", value: "COUNT" },
    { label: "바벨로우", value: "COUNT" },
    { label: "딥스", value: "COUNT" },
  ];
  const periods = [
    { label: "1", value: "1" },
    { label: "7", value: "2" },
    { label: "14", value: "3" },
    { label: "21", value: "4" },
    { label: "30", value: "5" },
    { label: "직접입력", value: "custom" },
  ];

  const imageToBase64 = async (uri: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  };

  const handleConfirmStartDate = (date: Date) => {
    setStartDate(formatDate(date));
    setStartPickerVisible(false);
  };

  const handleConfirmEndDate = (date: Date) => {
    setEndDate(formatDate(date));
    setEndPickerVisible(false);
  };

  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  };
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageAttached(true);
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.error("Refresh token not found");
        return;
      }
      const formatDate2 = (date: Date) => {
        return date.toISOString().split("T")[0]; // '2025-02-16T00:00:00.000Z' → '2025-02-16'
      };

      console.log("a");
      const formData = new FormData();

      formData.append("type", selectedType?.value || "");
      formData.append("title", title);
      formData.append("description", description);
      formData.append("reward", isRewardChecked ? rewardText : "");
      formData.append("startDate", formatDate2(new Date(startDate)));
      formData.append("endDate", formatDate2(new Date(endDate)));
      formData.append("max_participants", maxParticipants.toString());
      formData.append(
        "frequency",
        (frequency === "custom" ? customPeriod : frequency || "0").toString()
      );
      formData.append("exercise_type", exerciseType?.value || "");

      if (exerciseType?.value === "COUNT") {
        formData.append("exercise_count", exerciseValue.toString());
      } else if (exerciseType?.value === "DURATION") {
        formData.append("exercise_duration", exerciseValue.toString());
      } else if (exerciseType?.value === "DISTANCE") {
        formData.append("exercise_distance", exerciseValue.toString());
      }

      if (isImageChecked && imageAttached && imageUri) {
        const fileName = imageUri.split("/").pop() || "challenge_image.jpg";
        const fileType = fileName.split(".").pop()?.toLowerCase();
        formData.append("image", {
          uri: imageUri,
          type: fileType === "png" ? "image/png" : "image/jpeg", // 간단한 타입 체크
          name: fileName,
        } as any);
      }
      console.log("c");
      const response = await axios.post(`${BASE_URL}/challenges`, formData, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      console.log("Challenge created:", response.data);
      setModalVisible(false);
      navigation.navigate("ManageChallenge");
    } catch (error) {
      console.error("Error creating challenge:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopHeader />
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>챌린지 생성</Text>
            </View>
            <Text style={styles.label}>종류</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={[
                styles.placeholderStyle,
                { color: placeholderTextColor },
              ]}
              selectedTextStyle={styles.selectedTextStyle}
              data={types}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="챌린지 종류를 선택해주세요."
              value={selectedType?.value}
              onChange={(item) => {
                setSelectedType(item);
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>운동 종류</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={[
                styles.placeholderStyle,
                { color: placeholderTextColor },
              ]}
              selectedTextStyle={styles.selectedTextStyle}
              data={exerciseTypes}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="운동 종류를 선택해주세요."
              value={exerciseType?.value}
              onChange={(item) => {
                setExerciseType(item);
              }}
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>주제</Text>
              <TextInput
                style={styles.input}
                placeholder="주제를 입력해주세요."
                placeholderTextColor={placeholderTextColor}
                value={title}
                onChangeText={(text) => setTitle(text)}
              />
            </View>
            <View style={styles.halfInputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>주기</Text>
                {frequency === "custom" && (
                  <TouchableOpacity onPress={() => setFrequency(null)}>
                    <Text style={styles.resetText}>다시 선택하기</Text>
                  </TouchableOpacity>
                )}
              </View>
              {frequency === "custom" ? (
                <TextInput
                  style={styles.input}
                  placeholder="숫자만 입력해주세요."
                  value={customPeriod}
                  onChangeText={setCustomPeriod}
                  keyboardType="numeric"
                  placeholderTextColor={placeholderTextColor}
                />
              ) : (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={[
                    styles.placeholderStyle,
                    { color: placeholderTextColor },
                  ]}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={periods}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="주기를 선택해주세요."
                  value={frequency}
                  onChange={(item) => {
                    setFrequency(item.value);
                  }}
                />
              )}
            </View>
          </View>
          <View style={styles.rowContainer}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>상한인원</Text>
              <TextInput
                style={styles.input}
                placeholder="상한인원을 입력해주세요."
                keyboardType="numeric"
                placeholderTextColor={placeholderTextColor}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
              />
            </View>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>
                {exerciseType?.value === "DURATION"
                  ? "시간"
                  : exerciseType?.value === "DISTANCE"
                  ? "거리"
                  : "횟수"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={
                  exerciseType?.value === "DURATION"
                    ? "몇 초를 버틸까요?."
                    : exerciseType?.value === "DISTANCE"
                    ? "얼마나 뛸까요?."
                    : "몇 회 할까요?."
                }
                keyboardType="numeric"
                placeholderTextColor={placeholderTextColor}
                value={exerciseValue}
                onChangeText={setExerciseValue}
              />
            </View>
          </View>

          <View style={styles.dateContainer}>
            {/* 시작 날짜 */}
            <View style={styles.dateInputWrapper}>
              <View style={styles.labelIconContainer}>
                <Text style={styles.label}>시작날짜</Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#0C508B"
                  style={styles.calendarIcon}
                />
              </View>
              <TouchableOpacity
                onPress={() => setStartPickerVisible(true)}
                style={styles.input}
              >
                <Text
                  style={{ color: startDate ? "#000" : placeholderTextColor }}
                >
                  {startDate || "시작 날짜를 선택하세요."}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 종료 날짜 */}
            <View style={styles.dateInputWrapper}>
              <View style={styles.labelIconContainer}>
                <Text style={styles.label}>종료날짜</Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#0C508B"
                  style={styles.calendarIcon}
                />
              </View>
              <TouchableOpacity
                onPress={() => setEndPickerVisible(true)}
                style={styles.input}
              >
                <Text
                  style={{ color: endDate ? "#000" : placeholderTextColor }}
                >
                  {endDate || "종료 날짜를 선택하세요."}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Picker Modals */}
          <DateTimePickerModal
            isVisible={isStartPickerVisible}
            mode="date"
            onConfirm={handleConfirmStartDate}
            onCancel={() => setStartPickerVisible(false)}
          />
          <DateTimePickerModal
            isVisible={isEndPickerVisible}
            mode="date"
            onConfirm={handleConfirmEndDate}
            onCancel={() => setEndPickerVisible(false)}
          />
          <View style={styles.rewardContainer}>
            <TouchableOpacity
              onPress={() => setIsRewardChecked(!isRewardChecked)}
              style={styles.checkboxContainer}
            >
              <Text style={styles.label}>보상유무</Text>
              <Text></Text>
              <Ionicons
                name={isRewardChecked ? "checkbox-outline" : "square-outline"}
                size={20}
                color="#0C508B"
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.input,
                !isRewardChecked && styles.disabledInput, // 비활성화 스타일 추가
              ]}
              placeholder="ex) 무료 PT횟수 1회 + 1Day Class 이용권 1회"
              placeholderTextColor={placeholderTextColor}
              editable={isRewardChecked} // 체크박스 상태에 따라 입력 가능 여부 설정
              value={rewardText}
              onChangeText={setRewardText}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>설명</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="응원의 메세지와 함께 챌린지에 대한 간단한 설명을 입력해주세요!"
              placeholderTextColor={placeholderTextColor}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
          <View style={styles.imageContainer}>
            <TouchableOpacity
              onPress={() => setIsImageChecked(!isImageChecked)}
              style={styles.checkboxContainer}
            >
              <Text style={styles.label}>이미지</Text>
              <Text></Text>
              <Ionicons
                name={isImageChecked ? "checkbox-outline" : "square-outline"}
                size={20}
                color="#0C508B"
              />
            </TouchableOpacity>
            {isImageChecked && ( // 체크박스가 체크되었을 때만 이미지 첨부 화면 표시
              <TouchableOpacity
                style={[styles.imageBox, imageAttached && styles.imageAttached]}
                onPress={pickImage}
              >
                <Text style={styles.imageBoxText}>
                  {imageAttached
                    ? "이미지가 첨부됨"
                    : "이미지를 첨부하려면 클릭하세요"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Submit Button */}
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  챌린지를 개설하시겠습니까?
                </Text>

                {/* 챌린지 요약 정보 */}
                <View style={styles.summaryContainer}>
                  <Text>
                    챌린지 종류: {selectedType?.label || "종류를 선택해주세요."}
                  </Text>
                  <Text>주제: {title || "주제를 입력해주세요."}</Text>
                  <Text>
                    기간: {startDate || "시작 날짜를 입력해주세요."} ~{" "}
                    {endDate || "종료 날짜를 입력해주세요."}
                  </Text>
                </View>

                {/* 안내 문구 */}
                <Text style={styles.modalDescription}>
                  챌린지 개설 후에는 수정이 불가능합니다.
                  {"\n"}챌린지 시작 전에는 삭제할 수 있습니다.
                </Text>

                {/* 버튼들 */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleCreateChallenge}
                  >
                    <Text style={styles.buttonText}>개설하기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>돌아가기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.submitButtonText}>개설하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  halfInputGroup: {
    width: "48%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#0C508B",
    borderRadius: 8,
    padding: 12,
    color: "#000",
  },
  dropdown: {
    height: 45,
    borderColor: "#0C508B",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  placeholderStyle: {
    fontSize: 14,
    color: placeholderTextColor,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#000",
  },
  dateContainer: {
    flexDirection: "column",
    marginBottom: 20,
  },
  dateInput: {
    width: "48%",
  },
  dateInputWrapper: {
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: "#0C508B",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 30,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resetText: {
    fontSize: 14,
    color: "#0C508B",
    fontWeight: "500",
    marginBottom: 8,
  },
  calendarIcon: {
    marginLeft: 10,
  },
  labelIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  disabledInput: {
    backgroundColor: "#f5f5f5", // 비활성화된 상태의 배경색
    borderColor: "#ccc", // 비활성화된 상태의 테두리 색
    color: "#999", // 비활성화된 상태의 텍스트 색상
  },
  rewardContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 반투명 배경
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    // height: 300,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    // paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  modalDescription: {
    height: 40,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    backgroundColor: "#0C508B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
  },
  descriptionInput: {
    height: 90, // 기존 input 높이의 2배
    textAlignVertical: "top",
    paddingTop: 12,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imageBox: {
    height: 100,
    borderWidth: 1,
    borderColor: "#0C508B",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageAttached: {
    backgroundColor: "#E6F3FF",
  },
  imageBoxText: {
    color: "#666",
  },
});

export default CreateChallengeScreen;
