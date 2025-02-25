import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, Alert, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { BASE_URL } from './Common/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

let BEARER_TOKEN = ''; // Replace with your token
const CameraCaptureScreen = ({ route, navigation }) => {
    const { student, onSuccess } = route.params; // Accept token from navigation params
    const device = useCameraDevice('back');
    const cameraRef = useRef<Camera>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { hasPermission, requestPermission } = useCameraPermission();

    // Request camera permissions on mount
    useEffect(() => {
        const checkPermissions = async () => {
            if (!hasPermission) {
                await requestPermission();
            }
        };
        const checkAuthStatus = async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (token) {
                BEARER_TOKEN = token;
              } else {
              }
            } catch (error) {
              console.error('Error checking auth status:', error);
            }
          };
        checkAuthStatus();
        checkPermissions();
    }, [hasPermission]);

    if (!device) {
        return <Text>No Camera Available</Text>;
    }

    // Capture photo from the camera
    const capturePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePhoto();
                setCapturedPhoto(photo.path);
                setIsCameraActive(false); // Stop camera preview after capture
            } catch (error) {
                Alert.alert('Error', 'Failed to capture image.');
            }
        }
    };

    // Upload captured photo to enroll face
    const uploadPhoto = async () => {
        if (!capturedPhoto) return;

        const formData = new FormData();
        formData.append('id', student._id); // Ensure correct student ID
        formData.append('faceImage', {
            uri: `file://${capturedPhoto}`,
            name: 'faceImage.jpg',
            type: 'image/jpeg',
        });

        try {
            setIsLoading(true);
            const response = await fetch(`${BASE_URL}/users/enroll-face`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${BEARER_TOKEN}`, // Include token for authentication
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                Alert.alert('Success', `Face enrolled for ${student.name} successfully!`);
                onSuccess?.(); // Trigger success callback if provided
                navigation.goBack(); // Navigate back after success
            } else {
                Alert.alert('Error', result.message || 'Failed to enroll face.');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Error', 'Network error, please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {isCameraActive ? (
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    photo={true}
                />
            ) : (
                <Image source={{ uri: `file://${capturedPhoto}` }} style={styles.preview} />
            )}

            <View style={styles.controls}>
                {isCameraActive ? (
                    <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
                        <Text style={styles.buttonText}>Capture</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#fff" />
                        ) : (
                            <TouchableOpacity style={styles.uploadButton} onPress={uploadPhoto}>
                                <Text style={styles.buttonText}>Upload</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.retakeButton} onPress={() => setIsCameraActive(true)}>
                            <Text style={styles.buttonText}>Retake</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    preview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    controls: {
        position: 'absolute',
        bottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    captureButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    uploadButton: {
        backgroundColor: 'green',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retakeButton: {
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
});

export default CameraCaptureScreen;
