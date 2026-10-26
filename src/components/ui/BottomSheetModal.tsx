import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MotiView } from 'moti';
import { Easing, LinearTransition } from 'react-native-reanimated';
import { useColors, useInsets } from '@/components/ui/theme';
import { BackdropBlur } from '@/components/ui/BackdropBlur';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  blurTarget: React.RefObject<React.ComponentRef<typeof View> | null>;
  children: React.ReactNode;
  maxHeight?: DimensionValue;
  bottomPaddingExtra?: number;
  sheetStyle?: StyleProp<ViewStyle>;
}

const OPEN_DURATION = 300;
const CLOSE_DURATION = 220;
const OPEN_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const CLOSE_EASING = Easing.bezier(0.4, 0, 1, 1);

export function BottomSheetModal({
  visible,
  onClose,
  blurTarget,
  children,
  maxHeight,
  bottomPaddingExtra = 24,
  sheetStyle,
}: BottomSheetModalProps) {
  const colors = useColors();
  const insets = useInsets();

  const [isRendered, setIsRendered] = useState(visible);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setIsRendered(true);
      setIsAnimatingIn(false);
    } else {
      setIsAnimatingIn(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(
      () => {
        if (cancelled) return;
        if (visible) {
          setIsAnimatingIn(true);
        } else {
          setIsRendered(false);
        }
      },
      visible ? 16 : CLOSE_DURATION
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [visible]);

  if (!isRendered) return null;

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <BackdropBlur visible={isAnimatingIn} onPress={onClose} blurTarget={blurTarget} />

      <View style={styles.backdrop} pointerEvents="box-none">
        <MotiView
          from={{ translateY: 420, opacity: 0 }}
          animate={{
            translateY: isAnimatingIn ? 0 : 420,
            opacity: isAnimatingIn ? 1 : 0,
          }}
          transition={{
            type: 'timing',
            duration: isAnimatingIn ? OPEN_DURATION : CLOSE_DURATION,
            easing: isAnimatingIn ? OPEN_EASING : CLOSE_EASING,
          } as any}
          layout={LinearTransition.duration(220).easing(Easing.out(Easing.quad))}
          pointerEvents={isAnimatingIn ? 'auto' : 'none'}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + bottomPaddingExtra,
              maxHeight,
            },
            sheetStyle,
          ]}
        >
          {children}
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
    elevation: 1,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    zIndex: 1,
    elevation: 1,
  },
});
