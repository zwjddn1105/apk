// components/ChatActionModal.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface ChatActionModalProps {
  visible: boolean;
  onClose: () => void;
}
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ChatActionModal = ({ visible, onClose }: ChatActionModalProps) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });
  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || libraryStatus !== "granted") {
      Alert.alert(
        "권한이 필요합니다",
        "카메라와 갤러리 접근 권한이 필요합니다."
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    Alert.alert("미디어 선택", "선택해주세요", [
      {
        text: "카메라로 촬영",
        onPress: () => pickImage("camera"),
      },
      {
        text: "갤러리에서 선택",
        onPress: () => pickImage("library"),
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  const pickImage = async (source: "camera" | "library") => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled) {
        console.log(result.assets[0].uri);
        // 여기서 선택된 이미지 처리
        onClose(); // 모달 닫기
      }
    } catch (error) {
      Alert.alert("오류", "미디어를 선택하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[styles.modalView, { transform: [{ translateY }] }]}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 모달 내용 */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={showImagePickerOptions}
              >
                <Ionicons name="images" size={32} color="#666" />
                <Text style={styles.actionText}>앨범</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="barbell-outline" size={32} color="#666" />
                <Text style={styles.actionText}>운동기록</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="restaurant-outline" size={32} color="#666" />
                <Text style={styles.actionText}>식단공유</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="restaurant-outline" size={32} color="#666" />
                <Text style={styles.actionText}>식단공유</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "30%",
    maxHeight: SCREEN_HEIGHT * 0.7, // 3. Dimensions 사용처
  },
  scrollContent: {
    flexGrow: 1,
  },
  actionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 30,
    gap: 25, // 아이템 간격 넓히기
  },
  actionButton: {
    alignItems: "center",
    padding: 15,
    width: "10%", // 3개씩 배치되도록 너비 조정
    minWidth: 80, // 최소 너비 설정으로 텍스트 잘림 방지
  },
  actionText: {
    marginTop: 8,
    fontSize: 11, // 글자 크기 약간 줄여서 한 줄에 표시되도록
    color: "#666",
    textAlign: "center",
  },
});

export default ChatActionModal;
