import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
  StyleSheet,
} from 'react-native';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.56;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.85;

interface AddScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (schedule: { 
    nickname: string; 
    startTime: Date;
    endTime: Date;
  }) => void;
  selectedDate: Date;
}

interface TimePickerProps {
  selectedHour: string;
  selectedMinute: string;
  selectedPeriod: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  onPeriodChange: (period: string) => void;
}

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  visible,
  onClose,
  onSubmit,
  selectedDate,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [modalHeight, setModalHeight] = useState(DEFAULT_HEIGHT);
  const nicknameInputRef = useRef<TextInput>(null);
  
  // 상태 관리
  const [nickname, setNickname] = useState('');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // 초기 시간값 설정 함수
  const getInitialTimeValues = () => {
    const now = new Date();
    
    // 10분 단위로 올림 처리
    const currentMinutes = now.getMinutes();
    const ceiledMinutes = Math.ceil(currentMinutes / 10) * 10;
    
    // 분이 올림되어 60이 되면 시간을 1 증가
    let additionalHours = 0;
    if (ceiledMinutes === 60) {
      additionalHours = 1;
    }

    // 시작 시간 설정
    const startTime = new Date(now);
    startTime.setMinutes(ceiledMinutes % 60);
    startTime.setHours(now.getHours() + additionalHours);

    // 종료 시간은 시작 시간 + 1시간
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // 시작 시간 12시간 형식 변환
    let startHour = startTime.getHours();
    const startPeriod = startHour >= 12 ? 'PM' : 'AM';
    startHour = startHour % 12 || 12;

    // 종료 시간 12시간 형식 변환
    let endHour = endTime.getHours();
    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
    endHour = endHour % 12 || 12;

    return {
      startHour: startHour.toString().padStart(2, '0'),
      startMinute: (startTime.getMinutes()).toString().padStart(2, '0'),
      startPeriod,
      endHour: endHour.toString().padStart(2, '0'),
      endMinute: (endTime.getMinutes()).toString().padStart(2, '0'),
      endPeriod,
    };
  };

  // 현재 시간으로 초기값 설정
  const initialTime = getInitialTimeValues();
  const [selectedStartHour, setSelectedStartHour] = useState(initialTime.startHour);
  const [selectedStartMinute, setSelectedStartMinute] = useState(initialTime.startMinute);
  const [selectedStartPeriod, setSelectedStartPeriod] = useState(initialTime.startPeriod);
  
  const [selectedEndHour, setSelectedEndHour] = useState(initialTime.endHour);
  const [selectedEndMinute, setSelectedEndMinute] = useState(initialTime.endMinute);
  const [selectedEndPeriod, setSelectedEndPeriod] = useState(initialTime.endPeriod);

  // 모달이 열릴 때마다 시간 초기화
  useEffect(() => {
    if (visible) {
      const initialTime = getInitialTimeValues();
      setSelectedStartHour(initialTime.startHour);
      setSelectedStartMinute(initialTime.startMinute);
      setSelectedStartPeriod(initialTime.startPeriod);
      setSelectedEndHour(initialTime.endHour);
      setSelectedEndMinute(initialTime.endMinute);
      setSelectedEndPeriod(initialTime.endPeriod);
    }
  }, [visible]);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 6 }, (_, i) => (i * 10).toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // 모달이 닫힐 때 상태 초기화
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }
  }, [visible]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (showStartTimePicker || showEndTimePicker) {
      setModalHeight(EXPANDED_HEIGHT);
    } else {
      setModalHeight(DEFAULT_HEIGHT);
    }
  }, [showStartTimePicker, showEndTimePicker]);

  const handleSubmit = () => {
    if (!nickname.trim()) {
      nicknameInputRef.current?.focus();
      return;
    }

    const startTime = getTimeAsDate(selectedStartHour, selectedStartMinute, selectedStartPeriod);
    const endTime = getTimeAsDate(selectedEndHour, selectedEndMinute, selectedEndPeriod, true);

    onSubmit({
      nickname,
      startTime,
      endTime,
    });

    setNickname('');
    onClose();
  };
  
  // 시간 변환 함수
  const convertTo24Hour = (hour: string, period: string) => {
    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    return hour24;
  };

  const getTimeAsDate = (hour: string, minute: string, period: string, isEndTime: boolean = false) => {
    const hour24 = convertTo24Hour(hour, period);
    const date = new Date(selectedDate);
    date.setHours(hour24);
    date.setMinutes(parseInt(minute));
    date.setSeconds(0);
    date.setMilliseconds(0);

    if (isEndTime) {
      const startTime = getTimeAsDate(selectedStartHour, selectedStartMinute, selectedStartPeriod);
      if (date < startTime) {
        date.setDate(date.getDate() + 1);
      }
    }

    return date;
  };

  const formatDisplayTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // TimePicker 컴포넌트
  const TimePicker: React.FC<TimePickerProps> = ({ 
    selectedHour,
    selectedMinute,
    selectedPeriod,
    onHourChange,
    onMinuteChange,
    onPeriodChange,
  }) => {
    const hourScrollViewRef = useRef<ScrollView>(null);
    const minuteScrollViewRef = useRef<ScrollView>(null);
    const periodScrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
      const scrollToSelected = () => {
        const hourIndex = hours.findIndex(h => h === selectedHour);
        const minuteIndex = minutes.findIndex(m => m === selectedMinute);
        const periodIndex = periods.findIndex(p => p === selectedPeriod);

        if (hourIndex !== -1) {
          hourScrollViewRef.current?.scrollTo({ y: hourIndex * 44, animated: false });
        }
        if (minuteIndex !== -1) {
          minuteScrollViewRef.current?.scrollTo({ y: minuteIndex * 44, animated: false });
        }
        if (periodIndex !== -1) {
          periodScrollViewRef.current?.scrollTo({ y: periodIndex * 44, animated: false });
        }
      };

      setTimeout(scrollToSelected, 50);
    }, []);

    return (
      <View style={styles.pickerRow}>
        <ScrollView 
          ref={hourScrollViewRef}
          style={styles.pickerColumn} 
          showsVerticalScrollIndicator={false}
        >
          {hours.map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.pickerItem,
                selectedHour === hour && styles.selectedPickerItem
              ]}
              onPress={() => onHourChange(hour)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedHour === hour && styles.selectedPickerItemText
              ]}>{hour}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.pickerSeparator}>:</Text>

        <ScrollView 
          ref={minuteScrollViewRef}
          style={styles.pickerColumn}
          showsVerticalScrollIndicator={false}
        >
          {minutes.map((minute) => (
            <TouchableOpacity
              key={minute}
              style={[
                styles.pickerItem,
                selectedMinute === minute && styles.selectedPickerItem
              ]}
              onPress={() => onMinuteChange(minute)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedMinute === minute && styles.selectedPickerItemText
              ]}>{minute}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView 
          ref={periodScrollViewRef}
          style={styles.pickerColumn}
          showsVerticalScrollIndicator={false}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.pickerItem,
                selectedPeriod === period && styles.selectedPickerItem
              ]}
              onPress={() => onPeriodChange(period)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedPeriod === period && styles.selectedPickerItemText
              ]}>{period}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View 
            style={[
              styles.modalView,
              {
                height: modalHeight,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [EXPANDED_HEIGHT, 0]
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContainer}
            >
              {/* 헤더 */}
              <View style={styles.header}>
                <Text style={styles.modalTitle}>일정 추가</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
  
              {/* 스크롤 가능한 콘텐츠 영역 */}
              <View style={styles.contentContainer}>
                {/* 날짜 */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>날짜</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.dateText}>
                      {selectedDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                {/* 이름 입력 */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>이름</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={nicknameInputRef}
                      style={styles.input}
                      value={nickname}
                      onChangeText={setNickname}
                      placeholder="이름을 입력하세요"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* 시작 시간 */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>시작 시간</Text>
                  <TouchableOpacity
                    style={styles.timeInputContainer}
                    onPress={() => {
                      setShowStartTimePicker(true);
                      setShowEndTimePicker(false);
                    }}
                  >
                    <Text style={styles.timeInputText}>
                      {formatDisplayTime(getTimeAsDate(selectedStartHour, selectedStartMinute, selectedStartPeriod))}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 종료 시간 */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>종료 시간</Text>
                  <TouchableOpacity
                    style={styles.timeInputContainer}
                    onPress={() => {
                      setShowEndTimePicker(true);
                      setShowStartTimePicker(false);
                    }}
                  >
                    <Text style={styles.timeInputText}>
                      {formatDisplayTime(getTimeAsDate(selectedEndHour, selectedEndMinute, selectedEndPeriod, true))}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 시간 선택 UI */}
                {(showStartTimePicker || showEndTimePicker) && (
                  <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerHeader}>
                      <TouchableOpacity 
                        onPress={() => {
                          setShowStartTimePicker(false);
                          setShowEndTimePicker(false);
                        }}
                      >
                        <Text style={styles.doneButtonText}>완료</Text>
                      </TouchableOpacity>
                    </View>
                    <TimePicker
                      selectedHour={showStartTimePicker ? selectedStartHour : selectedEndHour}
                      selectedMinute={showStartTimePicker ? selectedStartMinute : selectedEndMinute}
                      selectedPeriod={showStartTimePicker ? selectedStartPeriod : selectedEndPeriod}
                      onHourChange={showStartTimePicker ? setSelectedStartHour : setSelectedEndHour}
                      onMinuteChange={showStartTimePicker ? setSelectedStartMinute : setSelectedEndMinute}
                      onPeriodChange={showStartTimePicker ? setSelectedStartPeriod : setSelectedEndPeriod}
                    />
                  </View>
                )}
              </View>
  
              {/* 하단 버튼 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>추가</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    justifyContent: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  modalContent: {
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  formGroup: {
    marginBottom: 20, 
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeInputContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeInputText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  dateText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
  },
  timePickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 20,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  doneButtonText: {
    color: '#0047FF',
    fontSize: 16,
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  pickerColumn: {
    height: 180,
    width: 60,
  },
  pickerItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPickerItem: {
    backgroundColor: 'rgba(0, 71, 255, 0.1)',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 18,
    color: '#666',
  },
  selectedPickerItemText: {
    color: '#0047FF',
    fontWeight: '600',
  },
  pickerSeparator: {
    fontSize: 24,
    color: '#666',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  bottomButtonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: '#0047FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonWithPicker: {
    marginTop: 'auto',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
});