// components/ExerciseModal/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { Exercise, ExerciseModalProps } from '../../types/exercise';
import { fetchExercises, toggleFavorite, fetchFavoriteExercises } from '../../api/exercises';
import { ExerciseRecordForm } from './ExerciseRecordForm';

const BODY_PARTS = [
  'back',
  'cardio',
  'chest',
  'lower arms',
  'lower legs',
  'neck',
  'shoulders',
  'upper arms',
  'upper legs',
  'waist',
] as const;

type TabType = 'all' | 'favorites' | typeof BODY_PARTS[number];

const ExerciseModal = ({ visible, onClose, onSave, selectedDate }: ExerciseModalProps) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [searchName, setSearchName] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favoriteExercises, setFavoriteExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      animateModal(1);
      loadFavoriteExercises();
      if (exercises.length === 0 && !selectedExercise) {
        loadExercises(true);
      }
    } else {
      animateModal(0);
    }
  }, [visible]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!selectedExercise) {
        setPage(0);
        setExercises([]);
        loadExercises(true);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchName, activeTab]);

  const animateModal = (toValue: number) => {
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(prev => prev === tab ? 'all' : tab);
  };

  const loadExercises = async (reset: boolean = false) => {
    if (isLoading || isLoadingMore || (!hasMore && !reset)) return;

    const currentPage = reset ? 0 : page;
    
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);

    try {
      const response = await fetchExercises({
        page: currentPage,
        size: 20,
        name: searchName,
        bodyPart: BODY_PARTS.includes(activeTab as any) ? activeTab : ''
      });
      
      if (response.exercises && response.exercises.length > 0) {
        setExercises(prev => {
          const updatedExercises = reset ? response.exercises : [...prev, ...response.exercises];
          return updatedExercises;
        });
        
        setHasMore(response.exercises.length === 20);
        setPage(reset ? 1 : currentPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      setError('운동 목록을 불러오는데 실패했습니다.');
      console.error('Failed to load exercises:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadFavoriteExercises = async () => {
    try {
      const favorites = await fetchFavoriteExercises();
      const favoritesWithState = favorites.map(exercise => ({
        ...exercise,
        isFavorite: true
      }));
      setFavoriteExercises(favoritesWithState);
    } catch (error) {
      console.error('Failed to load favorite exercises:', error);
      Alert.alert('오류', '즐겨찾기 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleToggleFavorite = async (exercise: Exercise) => {
    try {
      const newFavoriteState = !exercise.isFavorite;

      // 즉각적인 UI 업데이트 (전체 목록)
      setExercises(prevExercises =>
        prevExercises.map(ex =>
          ex.id === exercise.id
            ? { ...ex, isFavorite: newFavoriteState }
            : ex
        )
      );

      // 즐겨찾기 목록 업데이트
      if (newFavoriteState) {
        setFavoriteExercises(prev => [...prev, { ...exercise, isFavorite: true }]);
      } else {
        setFavoriteExercises(prev => prev.filter(ex => ex.id !== exercise.id));
      }

      // 서버 업데이트
      await toggleFavorite(exercise.id, !newFavoriteState);
    } catch (error) {
      // UI 롤백 (전체 목록)
      setExercises(prevExercises =>
        prevExercises.map(ex =>
          ex.id === exercise.id
            ? { ...ex, isFavorite: !exercise.isFavorite }
            : ex
        )
      );

      // UI 롤백 (즐겨찾기 목록)
      if (!exercise.isFavorite) {
        setFavoriteExercises(prev => prev.filter(ex => ex.id !== exercise.id));
      } else {
        setFavoriteExercises(prev => [...prev, { ...exercise, isFavorite: true }]);
      }

      let errorMessage = '즐겨찾기 업데이트에 실패했습니다.';
        if (error instanceof Error) {
          if (error.message.includes('No refresh token found')) {
            errorMessage = '로그인이 필요합니다.';
          } else if (error.message.includes('network')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
          }
        }

      Alert.alert('오류', errorMessage, [{ text: '확인' }]);
    }
  };

  const getFilteredExercises = () => {
    if (activeTab === 'favorites') {
      return favoriteExercises;
    }
    return exercises;
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleBackFromForm = () => {
    setSelectedExercise(null);
  };

  const renderExerciseItem = ({ item: exercise }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => handleExerciseSelect(exercise)}
    >
      <View style={styles.exerciseInfo}>
        <Text 
          style={styles.exerciseName}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {exercise.name}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={(e) => {
          e.stopPropagation();
          handleToggleFavorite(exercise);
        }}
        style={styles.favoriteButton}
      >
        <Ionicons 
          name={exercise.isFavorite ? "bookmark" : "bookmark-outline"} 
          size={24} 
          color={exercise.isFavorite ? "#000" : "#999"} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#004AAD" />
      </View>
    );
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [800, 0]
  });

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View style={[styles.modalView, { transform: [{ translateY }] }]}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            {selectedExercise ? (
              <ExerciseRecordForm
                exercise={selectedExercise}
                onBack={handleBackFromForm}
                onClose={onClose}
                onSave={onSave}
                selectedDate={selectedDate}
              />
            ) : (
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="chevron-back" size={24} color="black" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <TextInput 
                    style={styles.searchInput}
                    placeholder="찾으시는 운동을 검색해보세요"
                    placeholderTextColor="#999"
                    value={searchName}
                    onChangeText={setSearchName}
                  />
                </View>

                <View style={styles.tabContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContainer}
                  >
                    <TouchableOpacity 
                      style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
                      onPress={() => handleTabChange('favorites')}
                    >
                      <Ionicons 
                        name="star" 
                        size={20} 
                        color={activeTab === 'favorites' ? '#fff' : '#666'} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                      onPress={() => handleTabChange('all')}
                    >
                      <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                        전체
                      </Text>
                    </TouchableOpacity>
                    {BODY_PARTS.map((bodyPart) => (
                      <TouchableOpacity
                        key={bodyPart}
                        style={[styles.tab, activeTab === bodyPart && styles.activeTab]}
                        onPress={() => handleTabChange(bodyPart)}
                      >
                        <Text style={[styles.tabText, activeTab === bodyPart && styles.activeTabText]}>
                          {bodyPart}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {isLoading ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#004AAD" />
                  </View>
                ) : error ? (
                  <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => loadExercises(true)}
                    >
                      <Text style={styles.retryButtonText}>다시 시도</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={getFilteredExercises()}
                    renderItem={renderExerciseItem}
                    keyExtractor={item => `${item.id}-${activeTab}`}
                    onEndReached={() => activeTab === 'all' && loadExercises()}
                    onEndReachedThreshold={0.2}
                    ListFooterComponent={renderFooter}
                    contentContainerStyle={styles.flatListContent}
                    showsVerticalScrollIndicator={true}
                    indicatorStyle="black"
                  />
                )}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ExerciseModal;