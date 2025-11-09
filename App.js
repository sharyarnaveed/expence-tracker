import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import SignIn from './SignIn';
import Signup from './Signup';

const Stack = createNativeStackNavigator();

export default function Router() {
  return (
    <NavigationContainer>
      <Stack.Navigator  initialRouteName="Home">
        <Stack.Screen options={{headerShown:false}} name="Home" component={HomeScreen} />
        <Stack.Screen options={{headerShown:false}} name="SignIn" component={SignIn} />
        <Stack.Screen options={{headerShown:false}} name="SignUp" component={Signup} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}