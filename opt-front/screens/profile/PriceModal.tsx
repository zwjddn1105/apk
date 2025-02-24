import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";

interface Price {
  id: number;
  name: string;
  trainerId: number;
  price: number;
  totalSessions: number;
}

interface PriceModalProps {
  isVisible: boolean;
  onClose: () => void;
  trainerId: number;
}

const PriceModal: React.FC<PriceModalProps> = ({
  isVisible,
  onClose,
  trainerId,
}) => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [newPrice, setNewPrice] = useState<{
    name: string;
    price: number;
    totalSessions: number;
  }>({ name: "", price: 0, totalSessions: 0 });
  const [editPrice, setEditPrice] = useState<Price | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const BASE_URL = EXPO_PUBLIC_BASE_URL;

  useEffect(() => {
    if (isVisible) {
      fetchPrices();
    }
  }, [isVisible]);

  const fetchPrices = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const response = await axios.get<Price[]>(
        `${BASE_URL}/menus/trainer/${trainerId}`,
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      setPrices(response.data);
    } catch (error) {
    }
  };

  const handleCreatePrice = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const response = await axios.post<Price>(
        `${BASE_URL}/menus`,
        { ...newPrice, trainerId },
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      setPrices([...prices, response.data]);
      setNewPrice({ name: "", price: 0, totalSessions: 0 });
      fetchPrices();
      setShowAddForm(false);
    } catch (error) {
      Alert.alert("Error", "Failed to create price.");
    }
  };

  const handleUpdatePrice = async () => {
    if (!editPrice) return;

    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      await axios.patch(`${BASE_URL}/menus/${editPrice.id}`, editPrice, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      fetchPrices();
      setEditPrice(null);
    } catch (error) {
      Alert.alert("Error", "Failed to update price.");
    }
  };

  const handleDeletePrice = async (id: number) => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      await axios.delete(`${BASE_URL}/menus/${id}`, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      setPrices(prices.filter((price) => price.id !== id));
      fetchPrices();
    } catch (error) {
      Alert.alert("Error", "Failed to delete price.");
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>가격 정보</Text>
          <ScrollView>
            {prices.map((price) => (
              <View key={price.id} style={styles.priceItem}>
                <Text style={styles.priceName}>{price.name}</Text>
                <Text>가격: {price.price}원</Text>
                <Text>총 횟수: {price.totalSessions}회</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      setEditPrice(editPrice?.id === price.id ? null : price)
                    }
                  >
                    <Text style={styles.buttonText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePrice(price.id)}
                  >
                    <Text style={styles.buttonText}>삭제</Text>
                  </TouchableOpacity>
                </View>

                {/* 수정 폼 */}
                {editPrice?.id === price.id && (
                  <View style={styles.createPriceContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="이용권 이름"
                      value={editPrice.name}
                      onChangeText={(text) =>
                        setEditPrice({ ...editPrice, name: text })
                      }
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="가격"
                      keyboardType="numeric"
                      value={editPrice.price.toString()}
                      onChangeText={(text) =>
                        setEditPrice({
                          ...editPrice,
                          price: Number(text),
                        })
                      }
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="총 횟수"
                      keyboardType="numeric"
                      value={editPrice.totalSessions.toString()}
                      onChangeText={(text) =>
                        setEditPrice({
                          ...editPrice,
                          totalSessions: Number(text),
                        })
                      }
                    />
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={handleUpdatePrice}
                    >
                      <Text style={styles.buttonText}>저장</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            {/* 이용권 추가 */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Text style={styles.buttonText}>이용권 추가하기</Text>
            </TouchableOpacity>
            {showAddForm && (
              <View style={styles.createPriceContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="이용권 이름"
                  value={newPrice.name}
                  onChangeText={(text) =>
                    setNewPrice({ ...newPrice, name: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="가격"
                  keyboardType="numeric"
                  value={newPrice.price === 0 ? "" : newPrice.price.toString()}
                  onChangeText={(text) =>
                    setNewPrice({ ...newPrice, price: Number(text) })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="총 횟수"
                  keyboardType="numeric"
                  value={
                    newPrice.totalSessions === 0
                      ? ""
                      : newPrice.totalSessions.toString()
                  }
                  onChangeText={(text) =>
                    setNewPrice({ ...newPrice, totalSessions: Number(text) })
                  }
                />
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreatePrice}
                >
                  <Text style={styles.buttonText}>추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.buttonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    width: "90%",
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 25,
    color: "#1E3A8A",
  },
  priceItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  priceName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  priceDetails: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  editButton: {
    backgroundColor: "#0C508B",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginRight: 12,
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  createPriceContainer: {
    width: "100%",
    marginTop: 25,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    backgroundColor: "white",
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#0C508B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  closeButton: {
    marginTop: 25,
    backgroundColor: "gray",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#0C508B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18,
  },
});

export default PriceModal;
