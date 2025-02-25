import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { BASE_URL } from './Common/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

let BEARER_TOKEN = ''; // Replace with your token

const RegisterStudentsScreen = ({ navigation }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiLoading, setApiLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (token) {
                BEARER_TOKEN = token;
                fetchStudents();
              } else {
                setLoading(false);
              }
            } catch (error) {
              console.error('Error checking auth status:', error);
                setLoading(false);
            }
          };
        checkAuthStatus();
        requestCameraPermission();
    }, []);

    // Request Camera Permission
    const requestCameraPermission = async () => {
        const status = await Camera.requestCameraPermission();
        if (status === 'granted') {
            setHasPermission(true);
        } else {
            Alert.alert(
                'Camera Permission Denied',
                'Camera access is required to register students. Please enable it in settings.',
                [{ text: 'OK' }]
            );
        }
    };

    // Fetch Students from API
    const fetchStudents = async () => {
        try {
            setApiLoading(true);
            const response = await fetch(`${BASE_URL}/users/students`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch students');
            }

            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
            Alert.alert('Error', 'Failed to fetch students.');
        } finally {
            setApiLoading(false);
            setLoading(false);
        }
    };

    // Navigate to CameraCapture
    const handleRegister = (student) => {
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera access is required to register students.');
            return;
        }

        navigation.navigate('CameraCapture', {
            student,
            onSuccess: () => markAsRegistered(student._id),
        });
    };

    // Mark student as registered
    const markAsRegistered = (studentId) => {
        setStudents((prevStudents) =>
            prevStudents.map((student) =>
                student._id === studentId ? { ...student, isFaceSet: true } : student
            )
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Loading students...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register Students</Text>
            {apiLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text>Updating...</Text>
                </View>
            )}
            <FlatList
                data={students}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.studentRow}>
                        <Text style={styles.studentText}>{item.name}</Text>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                item.isFaceSet && styles.registeredButton,
                            ]}
                            onPress={() => handleRegister(item)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>
                                {item.isFaceSet ? 'Re-Enroll Face' : 'Enroll Face'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 8,
        elevation: 3,
    },
    studentText: {
        fontSize: 16,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        backgroundColor: '#007bff',
    },
    registeredButton: {
        backgroundColor: 'green',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RegisterStudentsScreen;
