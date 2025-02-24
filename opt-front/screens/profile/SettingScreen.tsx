import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  TrainerProfile: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const renderSettingItem = (title: string) => (
    <TouchableOpacity style={styles.settingItem}>
      <Text style={styles.settingText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusBarPlaceholder} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>환경설정</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>공지사항</Text>
          {renderSettingItem('공지사항')}
          {renderSettingItem('도움말')}
          {renderSettingItem('개인정보 수정하기')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>약관 및 정책</Text>
          {renderSettingItem('서비스 이용약관')}
          {renderSettingItem('위치정보이용약관')}
          {renderSettingItem('개인정보처리방침')}
          {renderSettingItem('회원탈퇴')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기타</Text>
          {renderSettingItem('로그아웃')}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusBarPlaceholder: {
    height: StatusBar.currentHeight || 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 50,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  settingText: {
    fontSize: 16,
  },
});

export default SettingScreen;