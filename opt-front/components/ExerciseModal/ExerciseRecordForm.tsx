import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { Exercise } from '../../types/exercise';
import { createExerciseRecord, CreateExerciseRecordRequest } from '../../api/exerciseRecords';
import * as ImagePicker from 'expo-image-picker';

interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
}

interface ExerciseRecordFormProps {
  exercise: Exercise;
  onBack: () => void;
  onClose: () => void;
  onSave?: () => void;
  selectedDate: string;
}

export const ExerciseRecordForm: React.FC<ExerciseRecordFormProps> = ({ 
  exercise, 
  onBack, 
  onClose, 
  onSave, 
  selectedDate 
}) => {
  const [duration, setDuration] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedMedias, setSelectedMedias] = useState<SelectedMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationRef = useRef<TextInput>(null);
  const setsRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    const numbersOnly = value.replace(/[^0-9]/g, '');
    setter(numbersOnly);
  };

  const handleSelectMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - selectedMedias.length,
      });

      if (!result.canceled && result.assets) {
        const newMedias: SelectedMedia[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          fileName: asset.fileName || `${Date.now()}.${asset.uri.split('.').pop()}`
        }));

        if (selectedMedias.length + newMedias.length > 6) {
          Alert.alert('알림', '미디어는 최대 6개까지만 선택할 수 있습니다.');
          return;
        }

        setSelectedMedias([...selectedMedias, ...newMedias]);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('오류', '미디어 선택 중 문제가 발생했습니다.');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedias(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
  
    if (!sets || !reps || !weight) {
      Alert.alert('입력 오류', '세트, 횟수, 무게를 모두 입력해주세요.');
      return;
    }
  
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      
      // 데이터를 단순 문자열로 추가
      const recordData = {
        exerciseId: exercise.id,
        set: parseInt(sets),
        rep: parseInt(reps),
        weight: parseInt(weight),
        duration: duration ? parseInt(duration) : null
      };
  
      formData.append('data', JSON.stringify(recordData));
  
      // 미디어 파일 추가
      if (selectedMedias.length > 0) {
        selectedMedias.forEach((media, index) => {
          // Android/iOS에서 작동하는 방식으로 파일 추가
          const fileNameMatch = media.uri.match(/[^/]+$/);
          const fileName = fileNameMatch ? fileNameMatch[0] : `image${index}.jpg`;
          
          formData.append('medias', {
            uri: Platform.OS === 'android' ? media.uri : media.uri.replace('file://', ''),
            type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
            name: fileName,
          } as any);
        });
      }
  
      console.log('Sending form data:', {
        data: recordData,
        mediaCount: selectedMedias.length
      });
  
      const response = await createExerciseRecord(formData);
      
      if (response) {
        onSave?.();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save exercise record:', error);
      
      let errorMessage = '운동 기록 저장에 실패했습니다.';
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = '서버 연결에 실패했습니다. 네트워크 연결을 확인해주세요.';
        }
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMediaItem = ({ item, index }: { item: SelectedMedia; index: number }) => (
    <View style={styles.mediaPreview}>
      <Image source={{ uri: item.uri }} style={styles.mediaPreviewImage} />
      <TouchableOpacity
        style={styles.removeMediaButton}
        onPress={() => handleRemoveMedia(index)}
      >
        <Ionicons name="close-circle" size={24} color="#FF0000" />
      </TouchableOpacity>
      {item.type === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="videocam" size={20} color="#fff" />
        </View>
      )}
    </View>
  );
  
  return (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
        <Text style={styles.headerDate}>{selectedDate}</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputsContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={setsRef}
                style={styles.input}
                placeholder="세트 수를 입력하세요"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={sets}
                onChangeText={(value) => handleNumberInput(value, setSets)}
                returnKeyType="next"
                onSubmitEditing={() => weightRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text style={styles.inputUnit}>세트</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                ref={weightRef}
                style={styles.input}
                placeholder="무게를 입력하세요"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={weight}
                onChangeText={(value) => handleNumberInput(value, setWeight)}
                returnKeyType="next"
                onSubmitEditing={() => repsRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                ref={repsRef}
                style={styles.input}
                placeholder="운동 횟수를 입력하세요"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={reps}
                onChangeText={(value) => handleNumberInput(value, setReps)}
                returnKeyType="next"
                onSubmitEditing={() => durationRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text style={styles.inputUnit}>횟수</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                ref={durationRef}
                style={styles.input}
                placeholder="운동 시간을 입력하세요"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={duration}
                onChangeText={(value) => handleNumberInput(value, setDuration)}
                returnKeyType="done"
              />
              <Text style={styles.inputUnit}>분</Text>
            </View>

            <View style={styles.mediaSection}>
              <View style={styles.mediaSectionHeader}>
                <Text style={styles.mediaSectionTitle}>미디어 추가</Text>
                <Text style={styles.mediaCount}>{selectedMedias.length}/6</Text>
              </View>

              <View style={styles.mediaPreviewContainer}>
                {selectedMedias.map((media, index) => (
                  <View key={index} style={styles.mediaPreview}>
                    <Image source={{ uri: media.uri }} style={styles.mediaPreviewImage} />
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => handleRemoveMedia(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF0000" />
                    </TouchableOpacity>
                    {media.type === 'video' && (
                      <View style={styles.videoIndicator}>
                        <Ionicons name="videocam" size={20} color="#fff" />
                      </View>
                    )}
                  </View>
                ))}
                
                {selectedMedias.length < 6 && (
                  <TouchableOpacity style={styles.addMediaButton} onPress={handleSelectMedia}>
                    <Ionicons name="add" size={40} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};