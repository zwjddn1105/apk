import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_BASE_URL } from '@env';

const INTEREST_DATA = [
  { id: 1, name: '근력 향상' },
  { id: 2, name: '체지방 감량' },
  { id: 3, name: '체형 교정' },
  { id: 4, name: '유연성 증가' },
  { id: 5, name: '코어 강화' },
  { id: 6, name: '심폐지구력 향상' },
  { id: 7, name: '운동 습관 형성' },
  { id: 8, name: '부상 예방 및 재활' },
  { id: 9, name: '스포츠 경기력 향상' },
  { id: 10, name: '다이어트 및 체중 관리' }
];

type RootStackParamList = {
  Main: undefined;
  KakaoLogin: undefined;
};

const OnboardingInterestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [nickname, setNickname] = useState('');

  const toggleInterest = (id: number) => {
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(interest => interest !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    // 닉네임과 관심사 선택 검증
    if (!nickname.trim()) {
      Alert.alert('닉네임을 입력해주세요');
      return;
    }

    if (selectedInterests.length === 0) {
      Alert.alert('최소 한 개의 관심사를 선택해주세요');
      return;
    }

    try {
      // AsyncStorage에서 리프레시 토큰 가져오기
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        Alert.alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
        navigation.navigate('KakaoLogin');
        return;
      }

      // 온보딩 API 호출
      const response = await fetch(`${EXPO_PUBLIC_BASE_URL}/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: nickname,
          interestIds: selectedInterests
        })
      });

      const result = await response.json();

      if (response.ok) {
        // 온보딩 성공 시 AsyncStorage에 온보딩 완료 상태 저장
        await AsyncStorage.setItem('isOnboarded', 'true');
        
        Alert.alert('온보딩 알림', result.message, [
          {
            text: '시작하기',
            onPress: () => navigation.navigate('Main')
          }
        ]);
      } else {
        // 서버에서 오류 응답 받은 경우
        Alert.alert('온보딩 실패', result.message || '다시 시도해주세요.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 연결을 확인해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>닉네임 설정</Text>
        <TextInput 
          style={styles.nicknameInput}
          placeholder="닉네임을 입력해주세요"
          value={nickname}
          onChangeText={setNickname}
          maxLength={10}
        />

        <Text style={styles.title}>관심사를 선택해주세요</Text>
        <Text style={styles.subtitle}>최대 3개까지 선택 가능합니다</Text>
        
        <View style={styles.interestGrid}>
          {INTEREST_DATA.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestButton,
                selectedInterests.includes(interest.id) && styles.selectedInterestButton
              ]}
              onPress={() => {
                if (selectedInterests.length < 3 || selectedInterests.includes(interest.id)) {
                  toggleInterest(interest.id);
                } else {
                  Alert.alert('알림', '관심사는 최대 3개까지 선택할 수 있습니다.');
                }
              }}
            >
              <Text 
                style={[
                  styles.interestButtonText,
                  selectedInterests.includes(interest.id) && styles.selectedInterestButtonText
                ]}
              >
                {interest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>시작하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    alignSelf: 'flex-start',
    width: '100%',
  },
  nicknameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  interestButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 5,
  },
  selectedInterestButton: {
    backgroundColor: '#000',
  },
  interestButtonText: {
    color: '#333',
    fontSize: 14,
  },
  selectedInterestButtonText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginTop: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingInterestsScreen;