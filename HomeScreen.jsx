import { View, Text, Button } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const HomeScreen  = ({navigation}) => {
  return (
    <SafeAreaView>
    <View>
      <Text>HomeScreen
         </Text>
        <Button title="Go to Sign In" onPress={() => navigation.navigate('SignIn')} />
    </View>
    </SafeAreaView>
  )
}

export default HomeScreen 