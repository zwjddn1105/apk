import React from "react";
import { View, StyleSheet } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryLabel,
} from "victory-native";

type Contribution = {
  memberId: number;
  nickname: string;
  measurement: number;
  contributionPercentage: number;
  myRecord: boolean;
};

type ContributionChartProps = {
  contributions: Contribution[];
};

const ContributionChart: React.FC<ContributionChartProps> = ({
  contributions,
}) => {
  // 최대 및 최소 기여도를 가진 닉네임 찾기
  const maxContribution = contributions.reduce((max, current) =>
    current.contributionPercentage > max.contributionPercentage ? current : max
  );
  const minContribution = contributions.reduce((min, current) =>
    current.contributionPercentage < min.contributionPercentage ? current : min
  );

  return (
    <View style={styles.container}>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={{ x: 50, y: 0 }}
        animate={{ duration: 500 }}
        width={350} // 차트의 너비 설정
        height={220} // 차트의 높이 설정
      >
        <VictoryLabel
          text="Progress (%)"
          x={175} // 차트 너비의 절반
          y={30} // 상단에서의 거리
          textAnchor="middle"
          style={{ fontSize: 16, fontWeight: "bold" }}
        />
        {/* x축 */}
        <VictoryAxis
          tickFormat={(t) => {
            const contribution = contributions.find((c) => c.nickname === t);
            if (contribution) {
              if (
                contribution.myRecord ||
                contribution.nickname === maxContribution.nickname ||
                contribution.nickname === minContribution.nickname
              ) {
                return t;
              }
            }
            return "";
          }}
          style={{
            tickLabels: {
              angle: 0,
              textAnchor: "middle",
              fontSize: 8,
              padding: 5,
            },
            grid: { stroke: "none" },
          }}
        />

        {/* y축 */}
        <VictoryAxis
          dependentAxis
          domain={[0, 100]}
          tickValues={[0, 25, 50, 75, 100]}
          style={{
            axisLabel: { padding: 40 },
            tickLabels: { fontSize: 10 },
            grid: { stroke: "none" },
          }}
        />

        {/* 막대 그래프 */}
        <VictoryBar
          data={contributions}
          x="nickname"
          y="contributionPercentage"
          cornerRadius={{ top: 5 }}
          barWidth={({ data = [] }) => Math.min(40, 300 / (data.length || 1))}
          style={{
            data: {
              fill: ({ datum }) => (datum.myRecord ? "#FF5733" : "#0FB5AE"),
            },
          }}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    elevation: 3,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
    // width: 320, // 컨테이너의 너비 설정
    // height: 220, // 컨테이너의 높이 설정
  },
});

export default ContributionChart;
