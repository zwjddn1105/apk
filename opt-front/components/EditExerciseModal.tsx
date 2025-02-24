import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateExerciseRecord, ExerciseRecord, UpdateExerciseRecordRequest } from '../api/exerciseRecords';
import * as ImagePicker from 'expo-image-picker';

interface EditExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  record: ExerciseRecord;
}

interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
}

const EditExerciseModal = ({ visible, onClose, onSave, record }: EditExerciseModalProps) => {
  const [sets, setSets] = useState(record.sets.toString());
  const [reps, setReps] = useState(record.rep.toString());
  const [weight, setWeight] = useState(record.weight.toString());
  const [mediaIdsToDelete, setMediaIdsToDelete] = useState<number[]>([]);
  const [selectedMedias, setSelectedMedias] = useState<SelectedMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    const numbersOnly = value.replace(/[^0-9]/g, '');
    setter(numbersOnly);
  };

  const handleMediaDelete = (mediaId: number) => {
    setMediaIdsToDelete([...mediaIdsToDelete, mediaId]);
  };

  const handleUndoMediaDelete = (mediaId: number) => {
    setMediaIdsToDelete(mediaIdsToDelete.filter(id => id !== mediaId));
  };

  const isMediaMarkedForDeletion = (mediaId: number) => {
    return mediaIdsToDelete.includes(mediaId);
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
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - (record.medias.length - mediaIdsToDelete.length) - selectedMedias.length,
      });

      if (!result.canceled && result.assets) {
        const newMedias: SelectedMedia[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          fileName: asset.fileName || `${Date.now()}.${asset.uri.split('.').pop()}`
        }));

        const totalMedias = record.medias.length - mediaIdsToDelete.length + selectedMedias.length + newMedias.length;
        if (totalMedias > 5) {
          Alert.alert('알림', '미디어는 최대 5개까지만 선택할 수 있습니다.');
          return;
        }

        setSelectedMedias([...selectedMedias, ...newMedias]);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('오류', '미디어 선택 중 문제가 발생했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
  
    if (!sets || !reps || !weight) {
      Alert.alert('입력 오류', '세트, 횟수, 무게를 모두 입력해주세요.');
      return;
    }
  
    try {
      setIsSubmitting(true);
  
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        exerciseRecordId: record.id,
        set: parseInt(sets),
        rep: parseInt(reps),
        weight: parseInt(weight),
        mediaIdsToDelete: mediaIdsToDelete.length > 0 ? mediaIdsToDelete : undefined
      }));
  
      if (selectedMedias.length > 0) {
        selectedMedias.forEach((media) => {
          formData.append('medias', {
            uri: media.uri,
            type: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
            name: media.fileName || `${Date.now()}.${media.type === 'image' ? 'jpg' : 'mp4'}`
          } as any);
        });
      }
  
      await updateExerciseRecord(record.id, formData);  // 두 개의 인자를 전달해야 함
      onSave();
      onClose();
      Alert.alert('성공', '운동 기록이 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update exercise record:', error);
      Alert.alert('오류', '운동 기록 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>운동 기록 수정</Text>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              disabled={isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.exerciseInfo}>
              {record.exerciseImage && (
                <Image
                  source={{ uri: record.exerciseImage }}
                  style={styles.exerciseImage}
                />
              )}
              <Text style={styles.exerciseName}>{record.exerciseName}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>세트</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={(value) => handleNumberInput(value, setSets)}
                keyboardType="numeric"
                placeholder="세트 수 입력"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>횟수</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={(value) => handleNumberInput(value, setReps)}
                keyboardType="numeric"
                placeholder="운동 횟수 입력"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>무게 (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={(value) => handleNumberInput(value, setWeight)}
                keyboardType="numeric"
                placeholder="무게 입력"
              />
            </View>

            <View style={styles.mediaSection}>
              <View style={styles.mediaSectionHeader}>
                <Text style={styles.mediaSectionTitle}>업로드된 미디어</Text>
                <Text style={styles.mediaCount}>
                  {record.medias.length - mediaIdsToDelete.length + selectedMedias.length}/5
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaList}>
                {/* 기존 미디어 표시 */}
                {record.medias.map((media) => (
                  <View key={media.id} style={styles.mediaItem}>
                    <Image source={{ uri: media.path }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.mediaDeleteButton}
                      onPress={() => 
                        isMediaMarkedForDeletion(media.id)
                          ? handleUndoMediaDelete(media.id)
                          : handleMediaDelete(media.id)
                      }
                    >
                      <Ionicons
                        name={isMediaMarkedForDeletion(media.id) ? "reload" : "trash"}
                        size={20}
                        color={isMediaMarkedForDeletion(media.id) ? "#666" : "#ff0000"}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* 새로 선택된 미디어 표시 */}
                {selectedMedias.map((media, index) => (
                  <View key={`new-${index}`} style={styles.mediaItem}>
                    <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.mediaDeleteButton}
                      onPress={() => {
                        setSelectedMedias(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff0000" />
                    </TouchableOpacity>
                    {media.type === 'video' && (
                      <View style={styles.videoIndicator}>
                        <Ionicons name="videocam" size={20} color="#fff" />
                      </View>
                    )}
                  </View>
                ))}

                {/* 미디어 추가 버튼 */}
                {record.medias.length - mediaIdsToDelete.length + selectedMedias.length < 5 && (
                  <TouchableOpacity 
                    style={styles.addMediaButton}
                    onPress={handleSelectMedia}
                  >
                    <Ionicons name="add" size={40} color="#666" />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  mediaSection: {
    marginTop: 20,
  },
  mediaSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  mediaItem: {
    marginRight: 15,
    position: 'relative',
  },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  mediaDeleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 5,
  },
  mediaList: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  addMediaButton: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mediaSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mediaCount: {
    fontSize: 14,
    color: '#666',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});

export default EditExerciseModal;