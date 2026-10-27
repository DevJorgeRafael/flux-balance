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

  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    let renderTimeout: ReturnType<typeof setTimeout>;
    let animationTimeout: ReturnType<typeof setTimeout>;

    if (visible) {
      renderTimeout = setTimeout(() => {
        setIsRendered(true);
      }, 0);
      animationTimeout = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 20);
    } else {
      renderTimeout = setTimeout(() => {
        setIsAnimatingIn(false);
      }, 0);
      animationTimeout = setTimeout(() => {
        setIsRendered(false);
      }, 250);
    }

    return () => {
      clearTimeout(renderTimeout);
      clearTimeout(animationTimeout);
    };
  }, [visible]);

  const handleClose = () => {
    setIsAnimatingIn(false);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  if (!isRendered) return null;

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <BackdropBlur visible={isAnimatingIn} onPress={handleClose} blurTarget={blurTarget} />

      <View style={styles.backdrop} pointerEvents="box-none">
        <MotiView
          animate={{
            translateY: isAnimatingIn ? 0 : 500,
            opacity: isAnimatingIn ? 1 : 0,
          }}
          transition={{
            type: 'timing',
            duration: isAnimatingIn ? OPEN_DURATION : CLOSE_DURATION,
            easing: isAnimatingIn ? OPEN_EASING : CLOSE_EASING,
          } as any}
          layout={LinearTransition.duration(OPEN_DURATION).easing(OPEN_EASING)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.modal,
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
    position: 'relative',
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

