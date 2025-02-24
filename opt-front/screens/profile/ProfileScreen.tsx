import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  SafeAreaView,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { EXPO_PUBLIC_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import InterestModal from "components/InterestModal";
import * as ImagePicker from "expo-image-picker";
import ReviewModal from "screens/profile/ReviewModal";
import ReviewComponent from "./ReviewComponent";
import MapScreen from "./MapScreen";
import PriceModal from "./PriceModal";
import { chatApi } from "api/chatApi";
import ChatService from "services/ChatService";

type SortType = "id,desc" | "rate,desc" | "rate,asc";

type RootStackParamList = {
  LoginNeedScreen: { returnScreen: string } | undefined;
  ProfileScreen: { profileData: any };
  Badge: undefined;
  SettingScreen: undefined;
  Chat: {
    roomId: string;
    otherUserName: string;
    otherUserType: "TRAINER" | "USER" | "ADMIN"; // 필요에 따라 다른 타입도 추가 가능
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ProfileScreenRouteProp = RouteProp<RootStackParamList, "ProfileScreen">;

interface Review {
  id: number;
  trainerId: number;
  comment: string;
  createdAt: string;
  rate: number;
  imageUrls: string[];
}

interface Badge {
  description: string;
  id: number;
  imagePath: string;
  name: string;
}

interface Interest {
  id: number;
  displayName: string;
}

interface Profile {
  nickname: string;
  image: string;
  followers: number;
  following: number;
  certification: string;
  licenses: string[];

  rating: number;
  interests?: Interest[];
  reviews: Review[];
  mainBadge: Badge;
  isFollow: boolean;
}

interface Follower {
  id: string;
  memberId: number;
  name: string;
  nickname: string;
  imagePath: string;
  role: string;
}
interface Certificate {
  name: string;
  isVerified: boolean;
  imagePath: string;
}
const generateStars = (rating: number) => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i < rating ? "star" : "star-outline"}
        size={16}
        color="#FFD700"
      />
    );
  }
  return stars;
};

const ProfileScreen = ({ route }: { route: ProfileScreenRouteProp }) => {
  const navigation = useNavigation<NavigationProp>();
  const [memberId, setMemberId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMemberId = async () => {
      const id = await AsyncStorage.getItem("memberId");
      setMemberId(id ? Number(id) : null);
    };
    fetchMemberId();
  }, []);

  const BASE_URL = EXPO_PUBLIC_BASE_URL;
  const profileData = route.params.profileData;
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(
    null
  );
  const [average, setAverage] = useState<{
    count: number;
    averageRate: number;
  }>({ count: 0, averageRate: 0 });
  const [newNickname, setNewNickname] = useState("");
  const [cityDistrict, setCityDistrict] = useState("위치 정보 없음");

  useEffect(() => {
    const loadCityDistrict = async () => {
      try {
        // AsyncStorage에서 city와 district 값 가져오기
        const city = await AsyncStorage.getItem("city");
        const district = await AsyncStorage.getItem("district");

        // city와 district가 모두 있으면 합쳐서 cityDistrict에 저장
        if (city && district) {
          setCityDistrict(`${city} ${district}`);
        } else {
          setCityDistrict("위치 정보 없음");
        }
      } catch (error) {}
    };

    loadCityDistrict();
  }, []); // 빈 배열로 한 번만 실행되도록 설정

  const [certificateData, setCertificateData] = useState<Certificate[] | null>(
    null
  );
  const [sortType, setSortType] = useState<SortType>("id,desc"); // 기본 정렬: 최신순
  const [reviews, setReviews] = useState<Review[]>([]); // 리뷰 데이터를 저장할 상태
  const [isSortedReviewModalVisible, setIsSortedReviewModalVisible] =
    useState(false); // 정렬된 리뷰 모달 표시 여부 상태

  const [isPriceModalVisible, setIsPriceModalVisible] = useState(false);
  const openPriceModal = () => {
    setIsPriceModalVisible(true);
  };

  const closePriceModal = () => {
    setIsPriceModalVisible(false);
  };
  const fetchReviews = async (sort: SortType) => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const response = await axios.get(
        `${BASE_URL}/trainer-reviews/${profileData.id}`,
        {
          params: {
            page: 0, // 첫 페이지부터 가져옴
            size: 20, // 페이지 크기
            sort: sort, // 선택된 정렬 방식
          },
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      setReviews(response.data.content); // 리뷰 데이터 설정
    } catch (error) {}
  };

  const [specialties, setSpecialties] = useState<string[]>([]); // specialties 상태
  const SpecialtiesList = () => {
    useEffect(() => {
      const fetchSpecialties = async () => {
        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          const response = await axios.get(
            `${BASE_URL}/trainers/${profileData.id}/specialties`,
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data && Array.isArray(response.data)) {
            setSpecialties(response.data);
          } else {
            throw new Error("Invalid response data");
          }
        } catch (error) {}
      };

      fetchSpecialties();
    }, []);
  };
  SpecialtiesList();

  const handleSortTypeChange = (sort: SortType) => {
    setSortType(sort); // 정렬 방식 상태 업데이트
    fetchReviews(sort); // 선택된 정렬 방식으로 리뷰 데이터 가져오기
    setIsSortedReviewModalVisible(true); // 리뷰 모달 표시
  };

  // useEffect를 사용하여 컴포넌트 마운트 시 초기 리뷰 데이터 로드
  useEffect(() => {
    fetchReviews(sortType); // 초기 정렬 방식으로 리뷰 데이터 가져오기
  }, [profileData.id]);
  const [profile, setProfile] = useState<Profile>({
    nickname: "",
    image: "",
    followers: 0,
    following: 0,
    certification: "",
    licenses: [],

    rating: 0,
    interests: [],
    reviews: [],
    mainBadge: { id: 0, name: "", description: "", imagePath: "" },
    isFollow: false,
  });

  // InterestModal에 전달할 전체 관심사 목록
  const [allInterests, setAllInterests] = useState<Interest[]>([
    { id: 1, displayName: "근력 향상" },
    { id: 2, displayName: "체지방 감량" },
    { id: 3, displayName: "체형 교정" },
    { id: 4, displayName: "유연성 증가" },
    { id: 5, displayName: "코어 강화" },
    { id: 6, displayName: "심폐지구력 향상" },
    { id: 7, displayName: "운동 습관 형성" },
    { id: 8, displayName: "부상 예방 및 재활" },
    { id: 9, displayName: "스포츠 경기력 향상" },
    { id: 10, displayName: "다이어트 및 체중 관리" },
  ]);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);

  const toggleInterestSelection = (id: number) => {
    setSelectedInterests((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((interestId) => interestId !== id)
        : [...prevSelected, id]
    );
  };

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        if (profileData.role === "ROLE_TRAINER") {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          const trainerId = await AsyncStorage.getItem("memberId");
          const realTrainerId = Number(trainerId);
          const response = await axios.get(
            `${BASE_URL}/certificate?trainerId=${realTrainerId}`,
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );
          setCertificateData(response.data);
        }
      } catch (error) {}
    };

    fetchCertificate();
  }, [profileData.role]);

  useEffect(() => {
    setProfile({
      nickname: profileData.nickname || "닉네임 안함",
      image: profileData.imagePath,
      followers: followers.length,
      following: following.length,
      certification: profileData.intro || null,
      licenses: [],

      rating: parseFloat(average.averageRate.toFixed(1)),
      interests: profileData.interests || [],
      reviews: [],
      mainBadge: profileData.mainBadge,
      isFollow: profileData.isFollow,
    });
  }, [profileData, followers, following, average]);

  useEffect(() => {
    const saveGymId = async () => {
      if (profileData.gymId) {
        try {
          await AsyncStorage.setItem("gymId", profileData.gymId.toString()); // 문자열로 변환 후 저장
        } catch (error) {}
      } else {
      }
    };

    saveGymId();
  }, [profileData.gymId]);

  useEffect(() => {
    const fetchAverageRating = async () => {
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const response = await axios.get(
          `${BASE_URL}/trainer-reviews/summary?trainerId=${profileData.id}`,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );
        setAverage(response.data);
      } catch (error) {}
    };

    fetchAverageRating();
  }, [profileData.id]);

  const fetchFollowList = async (endpoint: string) => {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch follow list");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    const loadFollowers = async () => {
      const followersData = await fetchFollowList(
        `/follows/follower?memberId=${profileData.id}`
      );
      setFollowers(followersData);
    };

    const loadFollowing = async () => {
      const followingData = await fetchFollowList(
        `/follows/following?memberId=${profileData.id}`
      );
      setFollowing(followingData);
    };

    loadFollowers();
    loadFollowing();
  }, []);

  const openModal = (type: "followers" | "following") => {
    setModalType(type);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const updateNickname = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      await axios.patch(
        `${BASE_URL}/members/nickname`,
        { nickname: newNickname },
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      setProfile((prevProfile) => ({ ...prevProfile, nickname: newNickname }));
      setNewNickname(""); // 입력 필드 초기화
    } catch (error) {
      Alert.alert("닉네임은 20자까지만 설정이 가능합니다!");
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("사진 라이브러리 접근 권한이 필요합니다.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0].uri; // 선택된 이미지 URI 반환
    }

    return null;
  };

  const handleTrainerRegistration = async () => {
    try {
      const imageUri = await pickImage();

      if (!imageUri) {
        alert("이미지 선택이 취소되었습니다.");
        return;
      }

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "trainer_image.jpg",
        type: "image/jpeg",
      });

      const refreshToken = await AsyncStorage.getItem("refreshToken");

      const response = await axios.post(
        `${BASE_URL}/license/business`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      if (response.status === 200) {
        alert("트레이너 등록이 완료되었습니다!");
      } else {
        alert("트레이너 등록 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("트레이너 등록 중 문제가 발생했습니다.");
    }
  };

  const handleCertificateUpload = async () => {
    try {
      const imageUri = await pickImage();

      if (!imageUri) {
        alert("이미지 선택이 취소되었습니다.");
        return;
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "certificate.jpg", // 서버에서 요구하는 파일 이름
        type: "image/jpeg", // 파일 타입
      });

      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (!refreshToken) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await axios.post(`${BASE_URL}/certificate`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (response.status === 200) {
        alert("자격증 등록이 완료되었습니다!");
      } else {
        alert("자격증 등록 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("자격증 등록 중 문제가 발생했습니다.");
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [newCertification, setNewCertification] = useState<string>(
    profile.certification || ""
  );

  const handleEditCertification = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) {
        alert("로그인이 필요합니다.");
        return;
      }
      const updatedCertification = newCertification;
      const response = await axios.patch(
        `${BASE_URL}/members/intro`,
        { text: updatedCertification },
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      if (response.status === 200) {
        alert("학력사항이 성공적으로 업데이트되었습니다!");
      } else {
        alert("업데이트 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("업데이트 중 문제가 발생했습니다.");
    }
  };

  const [interestModalVisible, setInterestModalVisible] = useState(false);

  const openInterestModal = () => {
    setInterestModalVisible(true);
    setSelectedInterests(
      profile.interests?.map((interest) => interest.id) || []
    );
  };

  const closeInterestModal = () => {
    setInterestModalVisible(false);
  };

  const submitInterest = async (selectedIds: number[]) => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await axios.patch(
        `${BASE_URL}/members/interest`,
        { interestIds: selectedIds }, // selectedIds를 API 요청 바디에 포함
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      if (response.status === 200) {
        alert("관심사가 성공적으로 업데이트되었습니다!");
        const updatedInterests = allInterests.filter((interest) =>
          selectedIds.includes(interest.id)
        );

        setProfile((prevProfile) => ({
          ...prevProfile,
          interests: updatedInterests,
        }));
      } else {
        alert("관심사 업데이트 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("관심사 업데이트 중 문제가 발생했습니다.");
    } finally {
      closeInterestModal();
    }
  };

  const toggleFollow = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      const endpoint = profileData.isFollow
        ? `${BASE_URL}/follows/${profileData.id}`
        : `${BASE_URL}/follows?targetId=${profileData.id}`;
      const method = profileData.isFollow ? "delete" : "post";

      await axios({
        method: method,
        url: endpoint,
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      setProfile((prev) => ({
        ...prev,
        isFollow: !prev.isFollow,
        followers: prev.isFollow ? prev.followers - 1 : prev.followers + 1,
      }));
    } catch (error) {
      Alert.alert("오류", "팔로우/언팔로우 중 문제가 발생했습니다.");
    }
  };

  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const response = await axios.post(
        `${BASE_URL}/trainer-reviews`,
        {
          trainerId: profileData.id,
          comment: comment,
          rate: rating,
        },
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      if (response.status === 200) {
        Alert.alert("성공", "리뷰가 성공적으로 등록되었습니다.");
        setIsReviewModalVisible(false);
      }
    } catch (error) {
      Alert.alert("오류", "리뷰 등록 중 문제가 발생했습니다.");
    }
  };
  const handleChatButtonPress = async () => {
    try {
      // 채팅방 생성
      const chatRoomResponse = await chatApi.createChatRoom(profileData.id);

      // 생성된 채팅방 ID 추출
      const roomId = String(chatRoomResponse.id);

      // 채팅방 구독
      await ChatService.subscribeToRoom(roomId, (message) => {});

      // 채팅방으로 이동
      navigation.navigate("Chat", {
        roomId: roomId,
        otherUserName: profileData.nickname,
        otherUserType: "TRAINER",
      });
    } catch (error) {}
  };
  console.log(profileData);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.fixedHeader}>
          <View style={styles.statusBarPlaceholder} />
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.headerRight}>
              {profileData.role === "ROLE_USER" && (
                <TouchableOpacity
                  style={styles.trainerRegisterButton}
                  onPress={handleTrainerRegistration}
                >
                  <Text style={styles.trainerRegisterText}>
                    트레이너 등록하기
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerIcon}
                onPress={() => navigation.navigate("Badge")}
              >
                <MaterialIcons name="military-tech" size={24} color="black" />
              </TouchableOpacity>
              {profileData.id !== memberId && (
                <TouchableOpacity
                  style={styles.headerIcon}
                  onPress={toggleFollow}
                >
                  <Ionicons
                    name={profile.isFollow ? "heart" : "heart-outline"}
                    size={24}
                    color={profile.isFollow ? "red" : "black"}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerIcon}
                onPress={() => navigation.navigate("SettingScreen")}
              >
                <Ionicons name="settings-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* 프로필섹션 */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: profile.image }}
                style={styles.profileImage}
              />
              <View style={styles.badgeOverlay}>
                {profileData.mainBadge?.imagePath ? (
                  <Image
                    source={{ uri: profileData.mainBadge.imagePath }}
                    style={styles.badgeImage}
                  />
                ) : (
                  <Text>뱃지</Text>
                )}
              </View>
            </View>
            {/* 내 닉네임 */}
            <View style={styles.nicknameContainer}>
              <Text style={styles.profileName}>{profile.nickname}</Text>
              <View style={{ flex: 1 }} />
              {profileData.id === memberId && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setNewNickname(profile.nickname)}
                >
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
              )}
            </View>
            {newNickname !== "" && (
              <View style={styles.editNicknameContainer}>
                <TextInput
                  style={styles.nicknameInput}
                  value={newNickname}
                  onChangeText={setNewNickname}
                  placeholder="새 닉네임"
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateNickname}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            )}
            {profileData.role === "ROLE_TRAINER" && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.locationText}>{cityDistrict}</Text>
              </View>
            )}

            {/* 평점정보 */}
            {profileData.role === "ROLE_TRAINER" && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingInner}>
                  <Text style={styles.ratingNumber}>{profile.rating}</Text>
                  <View style={styles.starsContainer}>
                    {generateStars(profile.rating)}
                  </View>
                </View>
              </View>
            )}

            {/* 팔로워/팔로잉 */}
            <View style={styles.followContainer}>
              <TouchableOpacity onPress={() => openModal("followers")}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.followers}</Text>
                  <Text style={styles.statLabel}>팔로워</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openModal("following")}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.following}</Text>
                  <Text style={styles.statLabel}>팔로잉</Text>
                </View>
              </TouchableOpacity>
              <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={closeModal}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        {modalType === "followers" ? "팔로워" : "팔로잉"}
                      </Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={closeModal}
                      >
                        <Text style={styles.closeButtonText}>닫기</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                      <View style={styles.followList}>
                        {modalType === "followers"
                          ? followers.map((item, index) => (
                              <View key={index} style={styles.followItem}>
                                <Image
                                  style={styles.followImage}
                                  source={{
                                    uri: `${item?.imagePath}`,
                                  }}
                                />
                                <Text style={styles.followNickname}>
                                  {item?.nickname}
                                </Text>
                              </View>
                            ))
                          : following.map((item, index) => (
                              <View key={index} style={styles.followItem}>
                                <Image
                                  style={styles.followImage}
                                  source={{
                                    uri: `${BASE_URL}${item?.imagePath}`,
                                  }}
                                />
                                <Text style={styles.followNickname}>
                                  {item?.nickname}
                                </Text>
                              </View>
                            ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </View>

            {/* 관심사 태그 */}
            {profileData.id === memberId && (
              <View style={styles.interestsTitleContainer}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={openInterestModal}
                >
                  <Text style={styles.editButtonText}>관심사수정</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.interestsContainer}>
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((interest) => (
                  <View key={interest.id} style={styles.interestTag}>
                    <Text style={styles.interestText}>
                      {interest.displayName}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noInterestsText}>
                  관심사가 설정되지 않았습니다.
                </Text>
              )}
            </View>
          </View>

          {/* 자격/학력 섹션 */}
          {profileData.role === "ROLE_TRAINER" && (
            <View style={styles.section}>
              <View style={styles.nicknameContainer}>
                <Text style={styles.sectionTitle}>자기소개(전문분야)</Text>
                {profileData.id === memberId && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.editButtonText}>수정</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isEditing ? (
                <View style={styles.editNicknameContainer}>
                  <TextInput
                    style={styles.nicknameInput}
                    value={newCertification}
                    onChangeText={setNewCertification}
                    placeholder="자기소개를 입력하면 AI가 전문분야를 반환합니다."
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleEditCertification} // 저장 버튼 클릭 시 실행
                  >
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.certificationText}>
                  {profile.certification}
                  <View></View>

                  {specialties.length > 0 ? (
                    specialties.map((specialty, index) => (
                      <Text key={index}> {specialty}</Text>
                    ))
                  ) : (
                    <Text>(No specialties available)</Text>
                  )}
                </Text>
              )}
            </View>
          )}

          {/* 자격증세션션 */}
          {profileData.role === "ROLE_TRAINER" && (
            <View style={styles.section}>
              <View style={styles.nicknameContainer}>
                <Text style={styles.sectionTitle}>증명된자격증</Text>
                {profileData.id === memberId && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleCertificateUpload}
                  >
                    <Text style={styles.editButtonText}>등록하기</Text>
                  </TouchableOpacity>
                )}
              </View>

              {certificateData && certificateData.length > 0 ? (
                certificateData.map((certificate, index) => (
                  <View key={index} style={styles.licenseItem}>
                    <Image
                      source={{ uri: certificate.imagePath }}
                      style={styles.licenseImage}
                    />
                    <View style={styles.licenseInfo}>
                      <Text style={styles.licenseText}>{certificate.name}</Text>
                      {certificate.isVerified && (
                        <MaterialIcons
                          name="verified"
                          size={24}
                          color="#4169E1"
                        />
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noLicenseText}>
                  등록된 자격증이 없습니다.
                </Text>
              )}
            </View>
          )}

          {/* Location Section */}
          {profileData.role === "ROLE_TRAINER" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>위치</Text>
              <MapScreen />
            </View>
          )}

          {/* Reviews Section */}
          {profileData.role === "ROLE_TRAINER" && (
            <View style={styles.section}>
              <View style={styles.nicknameContainer}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.sectionTitle}>후기</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingNumber}>{profile.rating}</Text>
                    <View style={styles.starsContainer}>
                      {generateStars(profile.rating)}
                    </View>
                  </View>
                </View>
                {profileData.id !== memberId && (
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => setIsReviewModalVisible(true)}
                  >
                    <Text style={styles.reviewButtonText}>리뷰쓰기</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 정렬 방식 선택 버튼 */}
              {profileData.role === "ROLE_TRAINER" && (
                <View style={styles.sortButtonsContainer}>
                  <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => handleSortTypeChange("id,desc")}
                  >
                    <Text style={styles.sortButtonText}>최신순</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => handleSortTypeChange("rate,desc")}
                  >
                    <Text style={styles.sortButtonText}>별점 높은 순</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => handleSortTypeChange("rate,asc")}
                  >
                    <Text style={styles.sortButtonText}>별점 낮은 순</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 리뷰 모달 */}
              <ReviewComponent
                isVisible={isSortedReviewModalVisible}
                onClose={() => setIsSortedReviewModalVisible(false)}
                reviews={reviews} // 리뷰 데이터 전달
              />
            </View>
          )}
          {profileData.role === "ROLE_TRAINER" && (
            <TouchableOpacity
              style={styles.pricingButton}
              onPress={openPriceModal}
            >
              <Text style={styles.buttonText}>가격표 정보 보기</Text>
            </TouchableOpacity>
          )}

          {/* PriceModal 추가 */}
          <PriceModal
            isVisible={isPriceModalVisible}
            onClose={closePriceModal}
            trainerId={profileData.id}
          />

          <View style={styles.bottomPadding} />
        </ScrollView>
        {profileData.role === "ROLE_TRAINER" && profileData.id !== memberId && (
          <View style={styles.fixedBottomButtons}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleChatButtonPress}
            >
              <Text style={styles.buttonText}>채팅상담</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Modal */}
      <InterestModal
        visible={interestModalVisible}
        onClose={closeInterestModal}
        interests={allInterests}
        selectedInterests={selectedInterests}
        onSelectInterest={toggleInterestSelection}
        onSubmit={submitInterest}
      />
      <ReviewModal
        isVisible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        onSubmit={handleReviewSubmit}
      />
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
  fixedHeader: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statusBarPlaceholder: {
    height: StatusBar.currentHeight || 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 50,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingRight: 5,
  },
  headerIcon: {
    padding: 5,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
  },
  profileImageContainer: {
    width: 160,
    height: 160,
    marginBottom: 16,
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  badgeOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: "#E0E0E0",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  statItem: {
    alignItems: "center",
    marginHorizontal: 20,
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  certificationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  licenseText: {
    fontSize: 16,
    marginRight: 8,
  },
  mapImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingNumber: {
    marginTop: 5,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
    marginTop: 5,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontWeight: "bold",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  pricingContainer: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
  },
  pricingButton: {
    backgroundColor: "#FF6B6B",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
  },

  bottomPadding: {
    height: 80,
  },
  fixedBottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  chatButton: {
    flex: 1,
    backgroundColor: "#0C508B",
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: "#0C508B",
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  badgeImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  interestTag: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 14,
    color: "#333",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 30,
  },
  followContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    width: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
  },
  closeButton: {
    backgroundColor: "#0C508B",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContent: {
    flexGrow: 1,
  },
  followList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  followItem: {
    width: 80,
    alignItems: "center",
    marginBottom: 10,
  },
  followImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 5,
    borderWidth: 3,
    borderColor: "gray",
  },
  followNickname: {
    fontSize: 14,
    textAlign: "center",
  },
  noInterestsText: {
    fontSize: 14,
    color: "#666",
  },
  nicknameContainer: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "space-between", // 변경된 부분
    alignItems: "center", // 추가된 부분 (세로 정렬)
  },
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0C508B",
    borderRadius: 5,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
  },
  editNicknameContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  nicknameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  saveButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#F88379",
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
  },
  trainerRegisterButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#0C508B",
    borderRadius: 5,
  },
  trainerRegisterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    fontSize: 14,
  },
  interestsTitleContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  licenseItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  licenseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  licenseInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  noLicenseText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  sortButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  sortButton: {
    backgroundColor: "#0FB5AE",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    width: 85,
    alignItems: "center",
  },
  sortButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  reviewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0C508B",
    borderRadius: 5,
    marginTop: -25,
  },
  reviewButtonText: {
    color: "white",
    fontSize: 12,
  },
});

export default ProfileScreen;
