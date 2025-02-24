import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { fetchMealRecords, deleteMealRecord, analyzeMealNutrition, updateMealRecord, type MealRecord } from '../api/mealRecords';

type MealType = "아침" | "점심" | "저녁";

interface MealRecordsProps {
  date: string;
  onAddPress: (type: MealType) => void;
  onEditPress: (record: MealRecord) => void;
  showControls?: boolean;
  onRecordChange?: () => void;  // 추가
}

export const MealRecords = ({ 
  date, 
  onAddPress, 
  onEditPress, 
  showControls = false,
  onRecordChange  // 추가
}: MealRecordsProps) => {
  const [activeTab, setActiveTab] = useState<MealType>('아침');
  const [records, setRecords] = useState<Record<MealType, MealRecord | null>>({
    아침: null,
    점심: null,
    저녁: null
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const loadMealRecord = async (type: MealType) => {
    try {
      const data = await fetchMealRecords(date, type);
      return data;
    } catch (error: any) {
      // 404는 정상적인 "기록 없음" 상황으로 처리
      if (error.message && error.message.includes('404')) {
        return null;
      }
      return null;
    }
  };

  const loadMealRecords = async () => {
    try {
      setLoading(true);
      const morningData = await loadMealRecord('아침');
      const lunchData = await loadMealRecord('점심');
      const dinnerData = await loadMealRecord('저녁');
      
      setRecords({
        아침: morningData,
        점심: lunchData,
        저녁: dinnerData
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMealRecords();
    }, [date])
  );

  const handleDelete = async () => {
    const currentRecord = records[activeTab];
    if (!currentRecord) return;
  
    Alert.alert(
      '식단 기록 삭제',
      '이 식단 기록을 삭제하시겠습니까?',
      [
        { text: '취소' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMealRecord({
                createdDate: date,
                type: activeTab,
              });
              setRecords(prev => ({
                ...prev,
                [activeTab]: null
              }));
              if (onRecordChange) {
                onRecordChange();  // 옵셔널 체이닝 대신 if 문으로 체크
              }
            } catch (error) {
              Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleImageUpdate = async (currentRecord: MealRecord) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
  
      if (!result.canceled) {
        const newImage = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `meal_${Date.now()}.jpg`
        };
  
        const data = {
          createdDate: currentRecord.createdDate,
          type: currentRecord.type
        };
  
        // 업데이트 실행
        const updatedRecord = await updateMealRecord(data, newImage);
        
        // 상태 즉시 업데이트
        setRecords(prev => ({
          ...prev,
          [currentRecord.type]: updatedRecord
        }));
  
        // 부모 컴포넌트 갱신
        if (onRecordChange) {
          onRecordChange();
        }
      }
    } catch (error) {
      Alert.alert('오류', '이미지 업데이트 중 문제가 발생했습니다.');
    }
  };

  const handleAnalyze = async () => {
    const currentRecord = records[activeTab];
    if (!currentRecord) return;

    try {
      setAnalyzing(true);
      const analyzed = await analyzeMealNutrition(date, activeTab);
      setRecords(prev => ({
        ...prev,
        [activeTab]: analyzed
      }));
      Alert.alert('분석 완료', '영양소 분석이 완료되었습니다.');
    } catch (error) {
      Alert.alert('오류', '영양소 분석 중 문제가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const currentRecord = records[activeTab];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['아침', '점심', '저녁'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.tab, activeTab === type && styles.activeTab]}
            onPress={() => setActiveTab(type)}
          >
            <Text style={[styles.tabText, activeTab === type && styles.activeTabText]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : currentRecord ? (
        <View style={styles.recordContainer}>
          <Image
            source={{ uri: currentRecord.imagePath }}
            style={styles.mealImage}
          />
          <View style={styles.nutritionInfo}>
            <Text style={styles.nutritionText}>칼로리: {currentRecord.calorie}kcal</Text>
            <Text style={styles.nutritionText}>단백질: {currentRecord.protein}g</Text>
            <Text style={styles.nutritionText}>탄수화물: {currentRecord.carbs}g</Text>
            <Text style={styles.nutritionText}>지방: {currentRecord.fat}g</Text>
          </View>
          <View style={styles.buttonContainer}>
            {showControls && (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => currentRecord && handleImageUpdate(currentRecord)}
                >
                  <Ionicons name="image-outline" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF0000" />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.analyzeButton, analyzing && styles.analyzingButton]}
              onPress={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.analyzeButtonText}>영양소 분석</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>식단 기록이 없습니다</Text>
          {showControls && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAddPress(activeTab)}
            >
              <Text style={styles.addButtonText}>추가하기</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  activeTab: {
    borderBottomColor: '#0C508B',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#0C508B',
    fontWeight: '600',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 20,
    padding: 15,
  },
  mealImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  nutritionInfo: {
    marginBottom: 15,
  },
  nutritionText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
  },
  analyzeButton: {
    backgroundColor: '#0C508B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  analyzingButton: {
    backgroundColor: '#666',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#0C508B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});