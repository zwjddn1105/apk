// screens/SearchScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopHeader } from "../components/TopHeader";
import { BODY_PARTS } from "../components/BodyParts";
import * as Location from 'expo-location';
import { searchTrainers, type TrainerResponse } from '../api/searchTrainer';  

type FilterCategories = {
  [key: string]: string[];
};

const filterOptions: FilterCategories = {
  exfilter: [...BODY_PARTS],
};

interface FilterSideBarProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  sortOptions: { id: string; label: string }[];
  openedFromSort?: boolean;
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

const FilterSideBar: React.FC<FilterSideBarProps> = ({
  visible,
  onClose,
  selectedSort,
  onSortChange,
  sortOptions,
  openedFromSort,
  selectedFilters,
  onFilterChange,
}) => {
  const [isExtendedSort, setIsExtendedSort] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      if (openedFromSort) {
        setIsExtendedSort(true);
      } else {
        setIsExtendedSort(false);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();

      setIsExtendedSort(false);
    }
  }, [visible, openedFromSort]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.filterOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[styles.filterSideBar, { transform: [{ translateX }] }]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.filterContainer}
          >
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>정렬 및 필터</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortSection}>
              <TouchableOpacity
                style={styles.sortTitleContainer}
                onPress={() => setIsExtendedSort(!isExtendedSort)}
              >
                <Text style={styles.sortSectionTitle}>정렬</Text>
                <Ionicons
                  name={isExtendedSort ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              {isExtendedSort &&
                sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.sortOptionItem}
                    onPress={() => {
                      onSortChange(option.id);
                      setIsExtendedSort(false);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        selectedSort === option.id && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedSort === option.id && (
                      <Ionicons name="checkmark" size={20} color="#004AAD" />
                    )}
                  </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.filterContent}>
              <View style={styles.filterGroup}>
                <View style={styles.filterCategoryHeader}>
                  <View style={styles.filterTitleRow}>
                    <Text style={styles.filterCategoryTitle}>필터</Text>
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => onFilterChange([])}
                    >
                      <Text style={styles.resetButtonText}>초기화</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.filterOptionsContainer}>
                  {filterOptions.exfilter.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.filterOption}
                      onPress={() => {
                        if (selectedFilters.includes(option)) {
                          onFilterChange(
                            selectedFilters.filter((f) => f !== option)
                          );
                        } else {
                          onFilterChange([...selectedFilters, option]);
                        }
                      }}
                    >
                      <View style={styles.optionContainer}>
                        <View
                          style={[
                            styles.customCheckbox,
                            selectedFilters.includes(option) &&
                              styles.customCheckboxSelected,
                          ]}
                        >
                          {selectedFilters.includes(option) && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.filterOptionText,
                            selectedFilters.includes(option) &&
                              styles.filterOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const TrainerCard: React.FC<{ trainer: TrainerResponse }> = ({ trainer }) => (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <Text style={styles.intro}>{trainer.intro}</Text>
      <Text style={styles.experience}>경력 {trainer.experienceYears}년</Text>
      <Text style={styles.availableHours}>가능 시간: {trainer.availableHours}</Text>
      {trainer.oneDayAvailable && (
        <View style={styles.oneDayBadge}>
          <Text style={styles.oneDayText}>원데이 클래스 가능</Text>
        </View>
      )}
    </View>
  </View>
);

const SearchScreen = () => {
  const [searchCategory, setSearchCategory] = useState<"address" | "name">("address");
  const [selectedSort, setSelectedSort] = useState("recommended");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [openedFromSort, setOpenedFromSort] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [trainers, setTrainers] = useState<TrainerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const sortOptions = [
    { id: "recommended", label: "추천순" },
    { id: "distance", label: "거리순" },
    { id: "rating", label: "평점순" },
    { id: "review", label: "리뷰순" },
  ];

  const categoryOptions = [
    { id: "address", label: "주소" },
    { id: "name", label: "이름" },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (err) {
      console.error('Error getting location:', err);
    }
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        myLatitude: userLocation?.latitude || null,
        myLongitude: userLocation?.longitude || null,
        name: searchCategory === 'name' ? searchQuery : null,
        address: searchCategory === 'address' ? searchQuery : null,
        interests: selectedFilters.length > 0 ? selectedFilters : null,
        sortBy: selectedSort,
      };

      const result = await searchTrainers(searchParams);
      setTrainers(result);
    } catch (err) {
      setError('트레이너 검색 중 오류가 발생했습니다.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopHeader />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchWrapper}>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            >
              <Text style={styles.categoryText}>
                {searchCategory === "address" ? "주소" : "이름"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            {isCategoryDropdownOpen && (
              <View style={styles.categoryDropdown}>
                {categoryOptions
                  .filter((option) => option.id !== searchCategory)
                  .map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.categoryDropdownItem}
                      onPress={() => {
                        setSearchCategory(option.id as "address" | "name");
                        setIsCategoryDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.categoryDropdownItemText}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={`${searchCategory === "address" ? "주소" : "트레이너 이름"}로 검색`}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.filtersArea}>
          {selectedFilters.length > 0 && (
            <ScrollView
              horizontal
              style={styles.selectedFiltersContainer}
              showsHorizontalScrollIndicator={false}
            >
              {selectedFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={styles.selectedFilterButton}
                  onPress={() =>
                    setSelectedFilters(selectedFilters.filter((f) => f !== filter))
                  }
                >
                  <Text style={styles.selectedFilterText}>{filter}</Text>
                  <Ionicons
                    name="close"
                    size={12}
                    color="#666"
                    style={styles.selectedFilterIcon}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.sortTriggerButton}
              onPress={() => {
                setOpenedFromSort(true);
                setIsFilterVisible(true);
              }}
            >
              <Text style={styles.sortTriggerText}>
                {sortOptions.find((opt) => opt.id === selectedSort)?.label || "추천순"}
              </Text>
              <Text style={styles.arrowText}>↑↓</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                setOpenedFromSort(false);
                setIsFilterVisible(true);
              }}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color="#666"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.filterButtonText}>필터</Text>
              {selectedFilters.length > 0 && (
                <Text style={styles.filterCount}>({selectedFilters.length})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView style={styles.cardContainer}>
            {trainers.map((trainer) => (
              <TrainerCard key={trainer.trainer_id} trainer={trainer} />
            ))}
          </ScrollView>
        )}

        <FilterSideBar
          visible={isFilterVisible}
          onClose={() => {
            setIsFilterVisible(false);
            setOpenedFromSort(false);
          }}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          sortOptions={sortOptions}
          openedFromSort={openedFromSort}
          selectedFilters={selectedFilters}
          onFilterChange={setSelectedFilters}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: '#fff',
    zIndex: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    width: 80,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 8,
    color: '#333',
  },
  searchButton: {
    padding: 8,
    marginLeft: 4,
  },
  categoryDropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 80,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 3,
  },
  categoryDropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  categoryDropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  filtersArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 0,
  },
  selectedFiltersContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  selectedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedFilterText: {
    fontSize: 12,
    color: '#333',
    marginRight: 4,
  },
  selectedFilterIcon: {
    marginLeft: 2,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sortTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  sortTriggerText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  arrowText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 4,
    letterSpacing: -6,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
  },
  filterCount: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 2,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterSideBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: '100%',
    backgroundColor: 'white',
  },
  filterContainer: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
  },
  filterGroup: {
    paddingTop: 10,
  },
  filterCategoryHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  filterCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  resetButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  filterOptionsContainer: {
    width: '100%',
  },
  filterOption: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  customCheckboxSelected: {
    backgroundColor: '#004AAD',
    borderColor: '#004AAD',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#666',
  },
  filterOptionTextSelected: {
    color: '#004AAD',
    fontWeight: '500',
  },
  sortSection: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
  },
  sortOptionTextActive: {
    color: '#004AAD',
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    gap: 8,
  },
  intro: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  experience: {
    fontSize: 14,
    color: '#666',
  },
  availableHours: {
    fontSize: 14,
    color: '#666',
  },
  oneDayBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  oneDayText: {
    color: '#004AAD',
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SearchScreen;