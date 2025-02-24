import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { TopHeader } from "../../components/TopHeader";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { EXPO_PUBLIC_BASE_URL } from "@env";

type RootStackParamList = {
  MyChallenge: undefined;
  DetailChallenge: { challengeId: number };
};

type Challenge = {
  id: number;
  type: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  reward: string;
};

const BASE_URL = EXPO_PUBLIC_BASE_URL;

const AllUpComingChallengesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchChallenges = async () => {
    if (!hasMore) return;

    try {
      const response = await axios.get<{ content: Challenge[]; last: boolean }>(
        `${BASE_URL}/challenges`,
        {
          params: {
            status: "open",
            page,
            size: 20,
          },
        }
      );
      setChallenges((prev) => [...prev, ...response.data.content]);
      setPage((prev) => prev + 1);
      setHasMore(!response.data.last);
    } catch (error) {
      console.error("개최예정정인 챌린지 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const renderChallengeCard = ({ item: challenge }: { item: Challenge }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("DetailChallenge", { challengeId: challenge.id })
      }
      activeOpacity={0.8}
    >
      <View style={styles.challengeCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{challenge.title}</Text>
          <Text style={styles.cardSubtitle}>{challenge.type}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>기간</Text>
            <Text
              style={styles.infoValue}
            >{`${challenge.startDate} ~ ${challenge.endDate}`}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>상태</Text>
            <Text style={styles.infoValue}>{challenge.status}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>보상</Text>
            <Text style={styles.infoValue}>{challenge.reward}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopHeader />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          {renderSectionHeader("개최 예정인 챌린지")}
        </View>
        <FlatList
          data={challenges}
          renderItem={renderChallengeCard}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={fetchChallenges}
          onEndReachedThreshold={0.1}
          contentContainerStyle={styles.section}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    marginBottom: 10,
    flex: 1,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 30,
  },
  challengeCard: {
    width: cardWidth,
    height: 220,
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    width: 70,
    fontSize: 12,
    color: "#666",
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
});

export default AllUpComingChallengesScreen;
