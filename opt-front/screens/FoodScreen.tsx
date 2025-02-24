// screens/FoodScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createMealRecord, updateMealRecord, type MealRecord } from '../api/mealRecords';

type RootStackParamList = {
  Main: undefined;
  Food: { 
    date: string;
    type: "아침" | "점심" | "저녁";
    existingRecord?: MealRecord;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Food'>;

const FoodScreen = ({ route, navigation }: Props) => {
  const { date, type, existingRecord } = route.params;
  const [selectedImage, setSelectedImage] = useState<any>(
    existingRecord ? { uri: existingRecord.imagePath } : null
  );
  const [loading, setLoading] = useState(false);

  // 카메라와 갤러리 접근 권한 요청
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('권한이 필요합니다', '카메라와 갤러리 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  // 이미지 선택 옵션 표시
  const showImagePickerOptions = () => {
    Alert.alert(
      '사진 선택',
      '사진을 선택해주세요',
      [
        {
          text: '카메라로 촬영',
          onPress: () => pickImage('camera'),
        },
        {
          text: '갤러리에서 선택',
          onPress: () => pickImage('library'),
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]
    );
  };

  // 이미지 선택/촬영
  const pickImage = async (source: 'camera' | 'library') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
  
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };
  
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
  
      if (!result.canceled) {
        const image = result.assets[0];
        
        const imageInfo = {
          uri: image.uri,
          type: 'image/jpeg',  // 명시적으로 타입 지정
          name: `meal_${Date.now()}.jpg`  // 명시적으로 이름 지정
        };

        setSelectedImage(imageInfo);
      }
    } catch (error) {
      Alert.alert('오류', '사진을 선택하는 중 오류가 발생했습니다.');
    }
  };

  // 식단 기록 저장
  const handleSave = async () => {
    if (!selectedImage?.uri) {
      Alert.alert('오류', '사진을 선택해주세요.');
      return;
    }
  
    try {
      setLoading(true);
  
      // 날짜 형식을 YYYY-MM-DD로 맞춰줌
      const mealData = {
        createdDate: existingRecord?.createdDate ?? date,  // 이미 올바른 형식이면 그대로 사용
        type: type.trim() // 앞뒤 공백 제거
      };
  
      const imageDetails = {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: selectedImage.name || `meal_${Date.now()}.jpg`
      };
  
      if (existingRecord) {
        await updateMealRecord(
          {
            createdDate: existingRecord.createdDate,
            type: existingRecord.type.trim()
          },
          imageDetails
        );
      } else {
        await createMealRecord(mealData, imageDetails);
      }
  
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('오류', error.message || '저장 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.typeText}>{type}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.imageBox}
        onPress={showImagePickerOptions}
        disabled={loading}
      >
        {selectedImage ? (
          <Image 
            source={{ uri: selectedImage.uri }} 
            style={styles.selectedImage} 
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="camera-outline" size={40} color="#666" />
            <Text style={styles.placeholderText}>사진 추가하기</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading || !selectedImage}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {existingRecord ? '수정하기' : '저장하기'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  imageBox: {
    width: '90%',
    height: 300,
    backgroundColor: '#f5f5f5',
    alignSelf: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FoodScreen;