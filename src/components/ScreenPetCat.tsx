import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';

const walkingAnimation = require('../../assets/cat-lottie/walking.json');
const idleAnimation = require('../../assets/cat-lottie/idle.json');
const happyAnimation = require('../../assets/cat-lottie/happy.json');

interface ScreenPetCatProps {
  quotes: string[];
  enabled: boolean;
  onOpenSettings: () => void;
}

type CatState = 'walking' | 'idle' | 'happy';

export const ScreenPetCat: React.FC<ScreenPetCatProps> = ({
  quotes,
  enabled,
  onOpenSettings,
}) => {
  if (!enabled) return null;

  const [catState, setCatState] = useState<CatState>('idle');
  const [speechText, setSpeechText] = useState<string>('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);

  // Vị trí (X, Y) của chú mèo
  const posX = useRef(new Animated.Value(60)).current;
  const posY = useRef(new Animated.Value(200)).current;
  const currentPos = useRef({ x: 60, y: 200 });

  // Hoạt ảnh bong bóng lời nói
  const bubbleScale = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const isMounted = useRef(true);
  const isInteracting = useRef(false);
  const speechTimeoutRef = useRef<any>(null);

  useEffect(() => {
    isMounted.current = true;
    startCatBehaviorLoop();

    return () => {
      isMounted.current = false;
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  // Lặp lại chu kỳ hành vi: Nghỉ ngơi -> Đi bộ ngẫu nhiên -> Nghỉ ngơi
  const startCatBehaviorLoop = async () => {
    while (isMounted.current) {
      if (isInteracting.current) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      // 1. Nghỉ chân ở trạng thái IDLE từ 3 đến 6 giây
      setCatState('idle');
      const idleTime = Math.floor(Math.random() * 3000) + 3000;
      await new Promise((r) => setTimeout(r, idleTime));

      if (!isMounted.current || isInteracting.current) continue;

      // 2. Chọn tọa độ đích mới trong phạm vi an toàn của màn hình
      const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
      const minX = 20;
      const maxX = Math.max(minX, windowWidth - 110);
      const minY = 90; // Dưới thanh Header
      const maxY = Math.max(minY, windowHeight - 170); // Trên thanh ExportShareBar

      const targetX = Math.floor(Math.random() * (maxX - minX)) + minX;
      const targetY = Math.floor(Math.random() * (maxY - minY)) + minY;

      const deltaX = targetX - currentPos.current.x;
      const deltaY = targetY - currentPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Quay mặt sang hướng di chuyển
      setFacingLeft(deltaX < 0);

      // 3. Bắt đầu đi bộ
      setCatState('walking');
      // Tốc độ thong dong: ~45px/giây, thời gian tối thiểu 2.5s
      const moveDuration = Math.max(2500, Math.floor(distance * 22));

      await new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(posX, {
            toValue: targetX,
            duration: moveDuration,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(posY, {
            toValue: targetY,
            duration: moveDuration,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          currentPos.current = { x: targetX, y: targetY };
          resolve();
        });
      });
    }
  };

  // Tương tác khi người dùng bấm vào chú mèo
  const handleCatPress = () => {
    isInteracting.current = true;
    setCatState('happy');

    // Chọn ngẫu nhiên một câu nói
    if (quotes && quotes.length > 0) {
      const randomIdx = Math.floor(Math.random() * quotes.length);
      setSpeechText(quotes[randomIdx]);
    } else {
      setSpeechText('Meo meo~ Chúc bạn một ngày tốt lành! 🐾');
    }

    // Hiển thị bong bóng thoại hoạt hình
    setShowSpeech(true);
    bubbleScale.setValue(0.3);
    bubbleOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(bubbleScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Tự động ẩn bong bóng thoại sau 4.5 giây
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setShowSpeech(false);
        isInteracting.current = false;
        setCatState('idle');
      });
    }, 4500);
  };

  // Chọn hoạt ảnh Lottie tương ứng với trạng thái
  const currentLottieSource =
    catState === 'walking'
      ? walkingAnimation
      : catState === 'happy'
      ? happyAnimation
      : idleAnimation;

  return (
    <Animated.View
      style={[
        styles.catContainer,
        {
          transform: [
            { translateX: posX },
            { translateY: posY },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Bong bóng lời thoại (Speech Bubble) */}
      {showSpeech && (
        <Animated.View
          style={[
            styles.speechBubble,
            {
              opacity: bubbleOpacity,
              transform: [{ scale: bubbleScale }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowSpeech(false)}
            onLongPress={onOpenSettings}
          >
            <Text style={styles.speechText}>{speechText}</Text>
            <View style={styles.bubbleFooter}>
              <Text style={styles.bubbleHint}>Chạm để đóng • Giữ để sửa câu</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.bubbleArrow} />
        </Animated.View>
      )}

      {/* Chú mèo Lottie */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCatPress}
        onLongPress={onOpenSettings}
        style={[
          styles.catTouchArea,
          {
            transform: [{ scaleX: facingLeft ? -1 : 1 }],
          },
        ]}
      >
        <LottieView
          source={currentLottieSource}
          autoPlay
          loop={catState !== 'happy'}
          style={styles.lottieCat}
          speed={catState === 'walking' ? 1.0 : 0.8}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  catContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 9999,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTouchArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieCat: {
    width: 80,
    height: 80,
  },
  speechBubble: {
    position: 'absolute',
    bottom: 84,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    maxWidth: 220,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    alignItems: 'center',
  },
  speechText: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
  bubbleFooter: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 3,
    alignItems: 'center',
  },
  bubbleHint: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#38BDF8',
  },
});
