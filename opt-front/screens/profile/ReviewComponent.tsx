import React from "react";
import { View, Text, Modal, StyleSheet, FlatList, Image } from "react-native";
import { Rating } from "react-native-ratings";

interface Review {
  id: number;
  trainerId: number;
  comment: string;
  createdAt: string;
  rate: number;
  imageUrls: string[];
}

interface ReviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  reviews: Review[]; // 리뷰 데이터를 props로 받음
}

const ReviewComponent: React.FC<ReviewModalProps> = ({
  isVisible,
  onClose,
  reviews,
}) => {
  // 리뷰 아이템 렌더링 함수
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: "/api/placeholder/40/40" }}
          style={styles.reviewerImage}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>익명</Text>
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {/* 별점 표시 */}
        <Rating
          type="star"
          ratingCount={5}
          imageSize={20}
          readonly // 수정 불가능하도록 설정
          startingValue={item.rate} // 초기값 설정
          fractions={1} // 소수점 한 자리까지 표시
          style={styles.rating}
        />
        <Text style={styles.reviewRating}>{item.rate.toFixed(1)}</Text>
      </View>
      <Text style={styles.reviewContent}>{item.comment}</Text>
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>리뷰 목록</Text>
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  reviewItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  reviewerInfo: {
    flexDirection: "column",
    flexGrow: 1,
    marginRight: "auto",
  },
  reviewerName: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: -2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  reviewRating: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "bold",
    marginLeft: "auto",
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  rating: {
    marginLeft: "auto", // Rating 컴포넌트 오른쪽 정렬
  },
});

export default ReviewComponent;
