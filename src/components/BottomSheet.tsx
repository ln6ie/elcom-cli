import { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { COLORS } from "@/constants/theme";

export function BottomSheet({ visible, onClose, children }: PropsWithChildren<{ visible: boolean; onClose: () => void }>) {
  console.info("[BottomSheet] render", { visible });
  const sheetRef = useRef<BottomSheetModalType>(null);
  const snapPoints = useMemo(() => ["80%"], []);

  useEffect(() => {
    console.info("[BottomSheet] visibility changed", { visible, hasRef: Boolean(sheetRef.current) });
    if (visible) {
      if (!sheetRef.current) {
        console.error("[BottomSheet] Cannot present: modal ref is not ready");
        return;
      }
      console.info("[BottomSheet] presenting modal");
      requestAnimationFrame(() => {
        if (!sheetRef.current) {
          console.error("[BottomSheet] Modal ref lost before present");
          return;
        }
        sheetRef.current.present();
        console.info("[BottomSheet] present called");
      });
    } else {
      console.info("[BottomSheet] dismissing modal");
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.45} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableContentPanningGesture
      onChange={(index) => console.info("[BottomSheet] index changed", { index })}
      onDismiss={() => {
        console.info("[BottomSheet] dismissed");
        onClose();
      }}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleStyle={styles.hiddenHandle}
      handleIndicatorStyle={styles.hiddenHandleIndicator}
    >
      <BottomSheetView style={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.closeButton} onPress={onClose} hitSlop={8}>
          <X size={18} color="#001018" strokeWidth={2.5} />
        </Pressable>
        <View style={styles.children}>{children}</View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: COLORS.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  content: { flex: 1, backgroundColor: COLORS.background },
  children: { flex: 1 },
  hiddenHandle: { height: 1, paddingVertical: 0 },
  hiddenHandleIndicator: { width: 0, height: 0, opacity: 0 },
  closeButton: { position: "absolute", top: 14, left: 16, zIndex: 20, elevation: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
});
