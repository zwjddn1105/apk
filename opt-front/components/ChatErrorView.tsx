import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ChatErrorViewProps {
  onRetry: () => void;
}

export const ChatErrorView: React.FC<ChatErrorViewProps> = ({ onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>메시지를 불러오지 못했습니다</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryText}>다시 시도</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#666', marginBottom: 16 },
  retryButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
