import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface MessageProps {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  messageType: 'CHAT' | 'SYSTEM';
  currentUserId: string;
  otherUserType: 'USER' | 'TRAINER';
}

export const Message = React.memo(({ 
  senderId, 
  content, 
  timestamp, 
  messageType,
  currentUserId,
  otherUserType
}: MessageProps) => {
  const isOwnMessage = senderId === currentUserId;
  const isSystemMessage = messageType === 'SYSTEM';

  return (
    <View style={[
      styles.messageContainer,
      isOwnMessage ? styles.ownMessageContainer : null,
      isSystemMessage ? styles.systemMessageContainer : null,
    ]}>
      {!isOwnMessage && !isSystemMessage && (
        <Image
          source={{ uri: otherUserType === 'TRAINER' ? 'trainer-profile-image' : 'user-profile-image' }}
          style={styles.profileImage}
        />
      )}
      <View style={[
        styles.messageContent,
        isOwnMessage ? styles.ownMessageContent : null,
        isSystemMessage ? styles.systemMessageContent : null,
      ]}>
        <Text style={[
          styles.messageText,
          isSystemMessage ? styles.systemMessageText : null,
          isOwnMessage ? styles.ownMessageText : null,
        ]}>
          {content}
        </Text>
        <Text style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : null
        ]}>
          {new Date(timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
});

Message.displayName = 'Message';

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    flexDirection: 'row-reverse',
  },
  systemMessageContainer: {
    justifyContent: 'center',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '70%',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 12,
  },
  ownMessageContent: {
    backgroundColor: '#007AFF',
  },
  systemMessageContent: {
    backgroundColor: '#eee',
    alignSelf: 'center',
    borderRadius: 12,
    padding: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  ownMessageText: {
    color: '#fff',
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});