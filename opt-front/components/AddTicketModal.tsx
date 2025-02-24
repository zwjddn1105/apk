import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface AddTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [studentEmail, setStudentEmail] = useState('');
  const [price, setPrice] = useState('');
  const [totalSessions, setTotalSessions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = () => {
    if (!studentEmail || !price || !totalSessions) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      Alert.alert('입력 오류', '유효한 이메일 주소를 입력해주세요.');
      return false;
    }

    if (isNaN(Number(price)) || isNaN(Number(totalSessions))) {
      Alert.alert('입력 오류', '가격과 세션 수는 숫자로 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;
  
    setIsLoading(true);
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('로그인이 필요합니다.');
      }
  
      const response = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentEmail: studentEmail.trim(),  // 공백 제거
          price: parseInt(price),
          totalSessions: parseInt(totalSessions),
        }),
      });
  
      const responseText = await response.text();
  
      if (!response.ok) {
        let errorMessage = '이용권 생성에 실패했습니다.';
        try {
          // 응답이 JSON 형식인 경우
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // 응답이 일반 텍스트인 경우
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
  
      let ticketData;
      try {
        ticketData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse ticket response:', e);
        throw new Error('서버 응답을 처리하는데 실패했습니다.');
      }
  
      Alert.alert('성공', '이용권이 성공적으로 생성되었습니다.');
      onSuccess();
      handleClose();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStudentEmail('');
    setPrice('');
    setTotalSessions('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>이용권 추가</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>회원 이메일</Text>
            <TextInput
              style={styles.input}
              value={studentEmail}
              onChangeText={setStudentEmail}
              placeholder="회원 이메일을 입력하세요"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>가격</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="가격을 입력하세요"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>총 세션 수</Text>
            <TextInput
              style={styles.input}
              value={totalSessions}
              onChangeText={setTotalSessions}
              placeholder="총 세션 수를 입력하세요"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {isLoading ? '처리중...' : '생성'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#0047FF',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  submitButtonText: {
    color: 'white',
  },
});