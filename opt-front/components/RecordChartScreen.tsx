import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_BASE_URL } from "@env";

const BASE_URL = EXPO_PUBLIC_BASE_URL;

type ChartDataItem = {
  progress: number;
  passed: boolean;
  challengeId: number;
};

const RecordChartScreen = () => {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getRefreshToken = async () => {
    try {
      return await AsyncStorage.getItem("refreshToken");
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("Refresh token not found");

        const response = await axios.get(`${BASE_URL}/challenges/record`, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        // 필요한 데이터만 추출
        const formattedData = response.data.map((item: any) => ({
          progress: item.progress,
          passed: item.passed,
          challengeId: item.challengeId,
        }));

        setChartData(formattedData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.rowContainer}>
        <Text style={styles.title}>나의 챌린지 참여현황</Text>
      </View>
      <View style={styles.container}>
        {/* 그래프 */}
        <VictoryChart
          theme={VictoryTheme.material}
          domainPadding={{ x: 40, y: 10 }}
          style={{
            parent: { marginTop: -30 }, // 차트 위쪽 여백을 줄임
          }}
        >
          {/* X축 */}
          <VictoryAxis
            label="time"
            tickFormat={() => ""} // 라벨 제거
            style={{
              axisLabel: { padding: 20, fontSize: 18, fontWeight: "bold" },
              ticks: { stroke: "transparent" },
              tickLabels: { fontSize: 10 },
              grid: { stroke: "transparent" },
            }}
          />

          {/* Y축 */}
          <VictoryAxis
            dependentAxis
            label="Progress"
            style={{
              axisLabel: { fontWeight: "bold", padding: 40 },
              tickLabels: { fontSize: 12 },
              grid: { stroke: "transparent" },
            }}
          />

          {/* 막대 그래프 */}
          <VictoryBar
            data={chartData}
            x="challengeId" // X축 값으로 challengeId 사용
            y="progress" // Y축 값으로 progress 사용
            cornerRadius={{ top: 5 }}
            barWidth={({ data = [] }) => Math.min(40, 300 / (data.length || 1))}
            style={{
              data: {
                fill: ({ datum }) => (datum.passed ? "#0C508B" : "#F88379"), // 색상 설정
                width: 20,
              },
            }}
          />
        </VictoryChart>

        {/* 범례 */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColorBox, { backgroundColor: "#0C508B" }]}
            />
            <Text style={styles.legendText}>목표치 달성! 😊</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColorBox, { backgroundColor: "#F88379" }]}
            />
            <Text style={styles.legendText}>목표치 미달성 😢</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "#fff",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    // alignItems: "flex-start",
    marginTop: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendColorBox: {
    width: 20,
    height: 20,
    marginRight: 5,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RecordChartScreen;
