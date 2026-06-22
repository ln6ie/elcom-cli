import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";

interface HeaderAction {
  icon: React.ReactNode;
  onPress: () => void;
  badge?: number;
  borderColor?: string;
}

interface SharedHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
  rightText?: { label: string; onPress: () => void; color?: string; disabled?: boolean };
  variant?: "floating" | "fixed";
  floatingTop?: number;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  title,
  subtitle,
  onBack,
  leftAction,
  rightActions,
  rightText,
  variant = "fixed",
  floatingTop,
}) => {
  const insets = useSafeAreaInsets();
  const hasLeft = !!(onBack || leftAction);

  const renderLeft = () => {
    if (leftAction) {
      return (
        <TouchableOpacity style={s.btn} onPress={leftAction.onPress}>
          {leftAction.icon}
        </TouchableOpacity>
      );
    }
    if (onBack) {
      return (
        <TouchableOpacity style={s.btn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderTitle = () => (
    <View style={[s.titleContainer, !hasLeft && s.titleLeft]}>
      <Text style={[s.titleText, !hasLeft && s.titleTextLeft]} numberOfLines={1}>
        {title}
      </Text>
      {subtitle && (
        <Text style={s.subtitleText} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderRight = () => {
    if (rightActions && rightActions.length > 0) {
      return (
        <View style={s.rightGroup}>
          {rightActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.actionBtn, action.borderColor && { borderColor: action.borderColor }]}
              onPress={action.onPress}
            >
              {action.icon}
              {action.badge != null && (
                <View style={[s.badge, action.borderColor && { borderColor: action.borderColor }]}>
                  <Text style={s.badgeText}>{action.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (rightText) {
      return (
        <TouchableOpacity onPress={rightText.onPress} disabled={rightText.disabled}>
          <Text style={[s.rightText, rightText.color && { color: rightText.color }, rightText.disabled && { opacity: 0.3 }]}>
            {rightText.label}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (variant === "floating") {
    return (
      <View style={[s.floatingContainer, { top: floatingTop ?? insets.top }]}>
        {renderLeft() || <View style={s.placeholder} />}

        <View style={s.floatingTitleCard}>
          <Text style={s.floatingTitleText} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={s.floatingSubtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {renderRight() || <View style={s.placeholder} />}
      </View>
    );
  }

  return (
    <View style={[s.fixedContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      {renderLeft()}
      {renderTitle()}
      {renderRight()}
    </View>
  );
};

const s = StyleSheet.create({
  placeholder: {
    width: 40,
    height: 40,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginLeft: 8,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: 8,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightText: {
    color: COLORS.error,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.label,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  titleLeft: {
    alignItems: "flex-start",
    marginLeft: 0,
  },
  titleText: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
    textAlign: "center",
  },
  titleTextLeft: {
    textAlign: "left",
    color: COLORS.primary,
    fontSize: FONT_SIZES.title,
  },
  subtitleText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    textAlign: "center",
    marginTop: 2,
  },
  floatingContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
    pointerEvents: "box-none",
  },
  floatingTitleCard: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingTitleText: {
    color: COLORS.text,
    fontFamily: FONTS.monoBold,
    fontSize: FONT_SIZES.small,
    textAlign: "center",
  },
  floatingSubtitleText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.tiny,
    textAlign: "center",
    marginTop: 1,
  },
  fixedContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
});
