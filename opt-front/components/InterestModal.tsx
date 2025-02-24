import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Interest {
  id: number;
  displayName: string;
}

interface InterestModalProps {
  visible: boolean;
  onClose: () => void;
  interests: Interest[];
  selectedInterests: number[];
  onSelectInterest: (id: number) => void;
  onSubmit: (selectedIds: number[]) => void; // 변경됨
}

const InterestModal: React.FC<InterestModalProps> = ({
  visible,
  onClose,
  interests,
  selectedInterests: initialSelectedInterests,
  onSelectInterest,
  onSubmit,
}) => {
  const [selectedInterests, setSelectedInterests] = useState<number[]>(
    initialSelectedInterests
  );

  useEffect(() => {
    setSelectedInterests(initialSelectedInterests);
  }, [initialSelectedInterests]);

  const toggleInterestSelection = (id: number) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(
        selectedInterests.filter((interestId) => interestId !== id)
      );
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleOnSubmit = () => {
    onSubmit(selectedInterests); // 변경: 선택된 관심사 ID를 onSubmit prop으로 전달
    onClose(); // 닫기 함수 호출
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>관심사 수정</Text>
          <View style={styles.interestsList}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestButton,
                  selectedInterests.includes(interest.id) &&
                    styles.selectedInterestButton,
                ]}
                onPress={() => toggleInterestSelection(interest.id)}
              >
                <Text
                  style={[
                    styles.interestText,
                    selectedInterests.includes(interest.id) &&
                      styles.selectedInterestText,
                  ]}
                >
                  {interest.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleOnSubmit}
          >
            <Text style={styles.submitButtonText}>저장</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  interestsList: {
    width: "100%",
    marginBottom: 20,
  },
  interestButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  interestText: {
    fontSize: 16,
    color: "#333",
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#0C508B",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  selectedInterestButton: {
    backgroundColor: "#0C508B", // 선택된 버튼 색상
  },
  selectedInterestText: {
    color: "#fff", // 선택된 텍스트 색상
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#F88379",
    borderRadius: 5,
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default InterestModal;
