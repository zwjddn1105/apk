import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";
interface Badge {
  id: number;
  name: string;
  description: string;
  imagePath: string;
}

interface MyBadge {
  id: number;
  badgeId: number;
  createDate: string;
}

const BadgeScreen = () => {
  const screenWidth = Dimensions.get("window").width;
  const navigation = useNavigation();
  const BASE_URL = EXPO_PUBLIC_BASE_URL;
  const itemSize = (screenWidth - 48) / 3;

  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<MyBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const [allBadgesResponse, myBadgesResponse] = await Promise.all([
        axios.get(`${BASE_URL}/badges`, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        }),
        axios.get(`${BASE_URL}/badges/my`, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        }),
      ]);

      setAllBadges(allBadgesResponse.data);
      setMyBadges(myBadgesResponse.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const isOwnedBadge = (badgeId: number) => {
    return myBadges.some((myBadge) => myBadge.badgeId === badgeId);
  };

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
            <Text style={styles.headerTitle}>뱃지</Text>
            <View style={styles.headerButton} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color="#0000ff"
          />
        ) : (
          <ScrollView contentContainerStyle={styles.badgeContainer}>
            {allBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <Image
                  source={{ uri: badge.imagePath }}
                  style={[
                    styles.badgeImage,
                    !isOwnedBadge(badge.id) && styles.grayscaleImage,
                  ]}
                />
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}
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
    backgroundColor: "#FFFFFF",
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
  },
  badgeItem: {
    width: (Dimensions.get("window").width - 48) / 3,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  badgeImage: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  badgeName: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
  grayscaleImage: {
    opacity: 0.3,
  },
});

export default BadgeScreen;
