import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Switch, StyleSheet, Pressable, Alert, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { BASE_URL } from './Common/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

let BEARER_TOKEN = '';

const AttendanceScreen = () => {
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const device = useCameraDevice('back');
    const cameraRef = useRef<Camera>(null);
    const { hasPermission, requestPermission } = useCameraPermission();
     const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    BEARER_TOKEN = token;
                    fetchStudents();
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
            }
        };
        checkAuthStatus();
    }, []);

    const toggleAttendance = (id: string,fromCam:boolean) => {
        console.log('toggle' + id)
        if(fromCam){
            setAttendance((prev) => ({ ...prev, [id]: true }));

        } else {
            setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/users/students`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch students');
            const data = await response.json();
            setStudentsData(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch students.');
        } finally{
            setLoading(false);
        }
    };

    const handleSmartAttendance = async () => {
        if (!hasPermission) {
            const permission = await requestPermission();
            if (!permission) {
                Alert.alert('Permission Denied', 'Camera access is required for attendance.');
                return;
            }
        }
        setIsCameraOpen(true);
    };

    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePhoto();
                setCapturedPhoto(Platform.OS === 'android' ? `file://${photo.path}` : photo.path);
            } catch {
                Alert.alert('Error', 'Failed to capture image.');
            }
        }
    };

    const handleUpload = async () => {
        if (!capturedPhoto) return;
    
        const formData = new FormData();
        formData.append('faceImage', {
            uri: capturedPhoto,
            name: 'attendance.jpg',
            type: 'image/jpeg',
        });
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/attendance/getUsers`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                },
                body: formData,
            });
    
            const result = await response.json();
    
            if (response.ok) {
                console.log(JSON.stringify(result))
                result.recognizedUsers.forEach((item: any) => toggleAttendance(item.userId,true));
                Alert.alert('Success', 'Attendance updated successfully!');
                setIsCameraOpen(false);
                setCapturedPhoto(null);
            } else {
                throw new Error(result.message || 'Failed to upload.');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Offline Mode', error.message || 'Network error, please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        const present = studentsData.filter((student) => attendance[student._id]);
        const absent = studentsData.filter((student) => !attendance[student._id]);
    
        if (present.length === 0 && absent.length === 0) {
            Alert.alert('Error', 'Please mark attendance before submitting.');
            return;
        }
    
        // Prepare the payload for the backend
        const payload = {
            users: [
                ...present.map((student) => ({ id: student._id, isPresent: "true" })),
                ...absent.map((student) => ({ id: student._id, isPresent: "false" })),
            ],
        };
    
        // Show attendance summary alert
        Alert.alert(
            'Attendance Summary',
            `✅ Present: ${present.map((s) => s.name).join(', ') || 'None'}\n❌ Absent: ${absent.map((s) => s.name).join(', ') || 'None'}\n \n Once you submit the attendance, further edits will not be allowed. Do you want to proceed?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Proceed',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${BASE_URL}/attendance/mark`, {
                                method: 'POST',
                                headers: {
                                    Authorization: `Bearer ${BEARER_TOKEN}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payload),
                            });

                            console.log('req' + JSON.stringify(payload))

                            console.log('resp' + JSON.stringify(response))
    
                            const result = await response.json();
    
                            if (response.ok) {
                                Alert.alert('Success', 'Attendance submitted successfully!');
                            } else {
                                throw new Error(result.message || 'Failed to submit attendance.');
                            }
                        } catch (error) {
                            console.error('Submit Error:', error);
                            Alert.alert('Error', error.message);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };
    
    

    return (
        <SafeAreaView style={styles.container}>
            {isCameraOpen ? (
                <View style={styles.cameraContainer}>
                    {capturedPhoto ? (
                        <Image source={{ uri: capturedPhoto }} style={styles.preview} />
                    ) : (
                        <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={true} photo />
                    )}

                    <View style={styles.cameraControls}>
                        {capturedPhoto ? (
                            <>
                                <Pressable style={styles.button} onPress={handleUpload}>
                                    <Text style={styles.buttonText}>Upload</Text>
                                </Pressable>
                                <Pressable style={styles.button} onPress={() => setCapturedPhoto(null)}>
                                    <Text style={styles.buttonText}>Retake</Text>
                                </Pressable>
                            </>
                        ) : (
                            <Pressable style={styles.button} onPress={handleCapture}>
                                <Text style={styles.buttonText}>Capture</Text>
                            </Pressable>
                        )}
                        <Pressable style={styles.button} onPress={() => setIsCameraOpen(false)}>
                            <Text style={styles.buttonText}>Close Camera</Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <>
                    <Pressable style={styles.buttonFaceAttendance} onPress={handleSmartAttendance}>
                        <Text style={styles.buttonTextFaceAttendance}>Take Face Attendance</Text>
                    </Pressable>

                    <FlatList
                        data={studentsData}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <View style={styles.studentRow}>
                                <Text style={styles.studentText}>{item.name}</Text>
                                <Switch value={attendance[item._id] || false} onValueChange={() => toggleAttendance(item._id,false)} />
                            </View>
                        )}
                    />

                    <Pressable style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Submit Attendance</Text>
                    </Pressable>
                </>
            )}
             {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#007bff" />
                                <Text>Updating...</Text>
                            </View>
                        )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 5,
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cameraControls: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 10,
        elevation: 3,
    },
    studentText: {
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonFaceAttendance: {
        backgroundColor: '#007bff',
        marginBottom: 20,
        padding: 16,
        borderRadius: 8,
        alignItems:'center'

    },
    buttonTextFaceAttendance: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    submitButton: {
        marginTop: 20,
        backgroundColor: '#28a745',
        padding: 16,
        alignItems:'center',
        borderRadius: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AttendanceScreen;
