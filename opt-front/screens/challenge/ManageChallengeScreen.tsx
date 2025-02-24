import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { TopHeader } from "../../components/TopHeader";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";
type RootStackParamList = {
  CreateChallenge: undefined;
  DetailChallenge: { challengeId: number };
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
  currentParticipants: number;
  maxParticipants: number;
  progress: number;
  exerciseType: string;
  exerciseCount: number;
};
const BASE_URL = EXPO_PUBLIC_BASE_URL;

const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem("refreshToken");
  } catch (error) {
    console.error("Error retrieving refresh token:", error);
    return null;
  }
};

const ManageChallengesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false); // 확인 모달 상태
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("Refresh token not found");

        const response = await axios.get<Challenge[]>(
          `${BASE_URL}/challenges/created`,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );
        setChallenges(response.data);
      } catch (error) {
        console.error("챌린지 불러오기 실패:", error);
      }
    };

    fetchChallenges();
  }, []);

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const openModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setModalVisible(true);
  };

  const deleteChallenge = async () => {
    if (selectedChallenge) {
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Refresh token not found");
        await axios.delete(`${BASE_URL}/challenges/${selectedChallenge.id}`, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        // 삭제 성공 후 로컬 상태 업데이트
        setChallenges((prevChallenges) =>
          prevChallenges.filter(
            (challenge) => challenge.id !== selectedChallenge.id
          )
        );

        setConfirmModalVisible(false);
        setModalVisible(false);
        Alert.alert("삭제 완료", "챌린지가 성공적으로 삭제되었습니다.");
      } catch (error) {
        console.error("챌린지 삭제 실패:", error);
        Alert.alert("삭제 실패", "챌린지 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const renderChallengeCard = (challenge: Challenge) => (
    <TouchableOpacity
      key={challenge.id}
      style={styles.challengeCard}
      onPress={() => openModal(challenge)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{challenge.title}</Text>
        <Text style={styles.cardSubtitle}>{challenge.type}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>기간</Text>
          <Text
            style={styles.infoValue}
          >{`${challenge.startDate} ~ ${challenge.endDate}`}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>상태</Text>
          <Text style={styles.infoValue}>{challenge.status}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>설명</Text>
          <Text style={styles.infoValue}>{challenge.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMainModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              if (selectedChallenge) {
                navigation.navigate("DetailChallenge", {
                  challengeId: selectedChallenge.id,
                });
              }
              setModalVisible(false);
            }}
          >
            <Text style={styles.modalButtonText}>챌린지 상세화면보기</Text>
          </TouchableOpacity>
          {selectedChallenge && selectedChallenge.status === "OPEN" && (
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={() => {
                setConfirmModalVisible(true); // 확인 모달 열기
              }}
            >
              <Text style={styles.modalButtonText}>챌린지 삭제하기</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderConfirmModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={confirmModalVisible}
      onRequestClose={() => setConfirmModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.confirmContent]}>
          <Text style={styles.confirmMessage}>챌린지를 삭제하시겠습니까?</Text>

          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.deleteButton]}
              onPress={() => deleteChallenge()}
            >
              <Text style={styles.confirmButtonText}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelButton]}
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={styles.confirmButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  const renderChallengeSection = (
    title: string,
    status: "OPEN" | "PROGRESS" | "END"
  ) => (
    <View style={styles.section}>
      {renderSectionHeader(title)}
      <View style={styles.cardContainer}>
        {challenges
          .filter((challenge) => challenge.status === status)
          .map(renderChallengeCard)}
      </View>
    </View>
  );
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
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateChallenge")}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>챌린지 만들기</Text>
          </TouchableOpacity>
        </View>

        {renderChallengeSection("내가 운영중인 챌린지", "PROGRESS")}
        {renderChallengeSection("내가 오픈 예정인 챌린지", "OPEN")}
        {renderChallengeSection("내가 열었던 챌린지", "END")}
      </ScrollView>

      {renderMainModal()}
      {renderConfirmModal()}
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
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  challengeCard: {
    width: "48%",
    height: 220,
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
    marginBottom: 14,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
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
  backButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#0C508B",
    borderRadius: 15,
    marginRight: 20,
  },
  createButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: 300,
  },
  modalButton: {
    backgroundColor: "#0C508B",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginBottom: 15,
    minWidth: 200,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#FF0000",
  },
  closeButton: {
    borderWidth: 1,
    borderColor: "#0C508B",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    width: 200,
  },
  closeButtonText: {
    color: "#0C508B",
    fontWeight: "bold",
  },
  confirmContent: {
    alignItems: "center",
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#999",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
export default ManageChallengesScreen;
