import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://70.12.246.176:8080/badges';

export const fetchBadges = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(response)

    if (!response.ok) {
      throw new Error('Failed to fetch badges');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }
};
