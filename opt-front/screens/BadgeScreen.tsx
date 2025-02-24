import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchBadges } from '../api/badges';

interface Badge {
  id: number;
  name: string;
  description: string;
  imagePath: string;
}

const BadgeScreen = ({ navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - 48) / 3;
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const data = await fetchBadges();
        setBadges(data);
      } catch (error) {
        Alert.alert('오류', '뱃지 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBadges();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#000000" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <Text style={styles.title}>운동</Text>
        <Text style={styles.subtitle}>새로운 기록과 뱃지로 목표를 달성해 보세요</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <View style={styles.badgeContainer}>
            {badges.map((badge) => (
              <View key={badge.id} style={[styles.badgeItem, { width: itemSize, height: itemSize + 40 }]}> 
                <Image 
                  source={{ uri: `http://70.12.246.176:8080${badge.imagePath}` }} 
                  style={styles.badge} 
                />
                <Text style={styles.badgeTitle} numberOfLines={2}>{badge.name}</Text>
                <Text style={styles.progressText}>{badge.description}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  badgeItem: {
    padding: 12,
    alignItems: 'center',
  },
  badge: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 50,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#000000',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
  },
});

export default BadgeScreen;
