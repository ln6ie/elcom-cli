import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { Download, XCircle, Info, ChevronRight } from 'lucide-react-native';
import { UpdateInfo } from '../services/UpdateService';

interface UpdateModalProps {
  visible: boolean;
  info?: UpdateInfo;
  isForce?: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ visible, info, isForce, onClose }) => {
  if (!info) return null;

  const handleUpdate = () => {
    Linking.openURL(info.downloadUrl);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.systemTag}>SYSTEM_PATCH_NOTICE</Text>
              <Text style={styles.title}>UPDATE_AVAILABLE_v{info.latestVersion}</Text>
            </View>
            <Info size={20} color={COLORS.primary} />
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>[ RELEASE_NOTES.LOG ]</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{info.releaseNotes}</Text>
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <ChevronRight size={14} color={COLORS.textDim} />
                <Text style={styles.detailText}>STATUS: {isForce ? 'CRITICAL_UPDATE' : 'STABLE_ENHANCEMENT'}</Text>
              </View>
              <View style={styles.detailRow}>
                <ChevronRight size={14} color={COLORS.textDim} />
                <Text style={styles.detailText}>SOURCE: cli.elcomlab.site</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {!isForce && (
              <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
                <Text style={styles.skipText}>IGNORE_FOR_NOW</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
              <Download size={18} color="#000" />
              <Text style={styles.updateText}>DOWNLOAD_&_DEPLOY</Text>
            </TouchableOpacity>
          </View>
          
          {isForce && (
            <View style={styles.forceBanner}>
              <XCircle size={14} color={COLORS.error} />
              <Text style={styles.forceText}>THIS_UPDATE_IS_MANDATORY_FOR_SYSTEM_INTEGRITY</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryDim,
    borderRadius: 4,
    padding: 20,
    maxHeight: '80%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  systemTag: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontFamily: FONTS.monoBold,
    fontSize: 18,
  },
  body: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 12,
    marginBottom: 8,
  },
  notesBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
  },
  notesText: {
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 14,
    lineHeight: 22,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderRadius: 4,
  },
  skipText: {
    color: COLORS.textDim,
    fontFamily: FONTS.monoBold,
    fontSize: 12,
  },
  updateBtn: {
    flex: 1.5,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 4,
    gap: 10,
  },
  updateText: {
    color: '#000',
    fontFamily: FONTS.monoBold,
    fontSize: 12,
  },
  forceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  forceText: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: 10,
    textAlign: 'center',
  }
});
