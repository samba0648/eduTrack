import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen'; // Import your login screen
import HomeScreen from './src/screens/HomeScreen'; // Create a basic Home screen
import AttendanceScreen from './src/screens/AttendanceScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import RegisterStudentsScreen from './src/screens/RegisterStudentsScreen';
import CameraCaptureScreen from './src/screens/CameraCaptureScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="RegisterStudents" component={RegisterStudentsScreen} />
        <Stack.Screen name="CameraCapture" component={CameraCaptureScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
