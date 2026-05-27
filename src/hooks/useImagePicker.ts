import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export const useImagePicker = () => {
  const [isPicking, setIsPicking] = useState(false);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("PERMISSION_DENIED", "MEDIA_LIBRARY_ACCESS_REQUIRED");
      return null;
    }

    setIsPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Don't force crop, stay natural
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const filename = `img_${Date.now()}.jpg`;
        const permanentUri = `${(FileSystem as any).documentDirectory}${filename}`;

        // Copy to permanent storage
        await (FileSystem as any).copyAsync({
          from: asset.uri,
          to: permanentUri,
        });

        return {
          uri: permanentUri,
          base64: asset.base64,
          type: "image/jpeg",
        };
      }
    } catch (error) {
      console.error("ImagePicker: Failed", error);
      Alert.alert("SYSTEM_ERROR", "FAILED_TO_LOAD_IMAGE");
    } finally {
      setIsPicking(false);
    }
    return null;
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("PERMISSION_DENIED", "CAMERA_ACCESS_REQUIRED");
      return null;
    }

    setIsPicking(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Natural without crop
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const filename = `photo_${Date.now()}.jpg`;
        const permanentUri = `${(FileSystem as any).documentDirectory}${filename}`;

        // Copy to permanent storage
        await (FileSystem as any).copyAsync({
          from: asset.uri,
          to: permanentUri,
        });

        return {
          uri: permanentUri,
          base64: asset.base64,
          type: "image/jpeg",
        };
      }
    } catch (error) {
      console.error("Camera: Failed", error);
      Alert.alert("SYSTEM_ERROR", "FAILED_TO_CAPTURE_PHOTO");
    } finally {
      setIsPicking(false);
    }
    return null;
  }, []);

  return { pickImage, takePhoto, isPicking };
};
