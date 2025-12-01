import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabsNavigator from './navigation/navigation';
import SignIn from './auth/SignIn';

import { supabase } from './lib/SupabaseClient';

const Stack = createNativeStackNavigator();

export default function Router() {
  const [session,setSession]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setSession(session)
      setLoading(false)
    })
    const {data:authListener}=supabase.auth.onAuthStateChange((event,session)=>{
      setSession(session)
    })
    return()=>{
      authListener.subscription.unsubscribe()
    }

  },[])

  if (loading) return null
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {
          session?(

            <Stack.Screen  name="Tabs" component={TabsNavigator} />
          ):(
            <>
              <Stack.Screen name="SignIn" component={SignIn} />
 
        </>
          )
        }
     

      </Stack.Navigator>
    </NavigationContainer>
  );
}