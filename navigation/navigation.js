import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../home/Home";
import Profile from "../home/Profile";
import { Feather } from "@expo/vector-icons";
import AddExpense from "../home/Add";
import AntDesign from '@expo/vector-icons/AntDesign';
const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: "#48426D",
        tabBarInactiveTintColor: "#828282",

        // 🚀 Floating Futuristic Tab Bar
        tabBarStyle: {
          borderTopWidth: 0,
          position: "absolute",
          bottom: 20,
          alignSelf: "center",
          backgroundColor: "#F0C38E",
          elevation: 8,
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 6,
          shadowColor: "#F1AA9B",
          borderRadius: 30,
          marginHorizontal: 16,
          marginBottom: 20,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 30,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },

       tabBarIconStyle: {
            marginBottom: 0,
            marginTop: 0,
          },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          ),
        }}
      />
<Tab.Screen
      name="Add"
      component={AddExpense}
      options={{
          tabBarIcon: ({ color, size }) => (
          <AntDesign name="plus" size={size} color={color} />
          ),
      }}/>
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" color={color} size={size} />
          ),
        }}
      />

      
    </Tab.Navigator>
  );
}
