import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResetStorageButton = () => {
    const resetAsyncStorage = async () => {
        try {
            await AsyncStorage.clear();
            Alert.alert('초기화 완료', 'AsyncStorage 데이터가 초기화되었습니다.');
            console.log('AsyncStorage가 초기화되었습니다.');
        } catch (error) {
            console.error('AsyncStorage 초기화 중 오류 발생:', error);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ marginBottom: 10 }}>AsyncStorage 초기화</Text>
            <Button title="초기화하기" onPress={resetAsyncStorage} color="red" />
        </View>
    );
};

export default ResetStorageButton;
