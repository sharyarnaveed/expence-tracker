import React from 'react'
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { supabase } from './lib/SupabaseClient'

const SignIn = ({navigation}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handlesignin=async()=>{
    const {data,error}=await supabase.auth.signInWithPassword({
       email,
    password,
    })

    console.log(data);
    
  }
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <View style={styles.accentBar} />
          <Text style={styles.heading}>Sign In</Text>
          <Text style={styles.subheading}>Welcome back to your tracker</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable
              cursorColor="#F0C38E"
            />
          </View>

          {/* Password Input */}
          <View style={styles.fieldSmall}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable
              cursorColor="#F0C38E"
            />
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        

          {/* Sign In Button */}
          <TouchableOpacity onPress={handlesignin}  style={styles.button}>
            <Text  style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.note}>Don't have an account?{' '}</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('SignUp')}>
              <Text style={styles.signUp}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312C51',
    width: '100%',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#48426D',
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 32,
    justifyContent: 'center',
    // shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    // elevation (Android)
    elevation: 8,
  },
  accentBar: {
    backgroundColor: '#F0C38E',
    height: 4,
    width: 64,
    alignSelf: 'center',
    marginBottom: 32,
    borderRadius: 999,
  },
  heading: {
    color: '#F0C38E',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    color: '#F1AA9B',
    textAlign: 'center',
    marginBottom: 32,
  },
  field: {
    marginBottom: 16,
  },
  fieldSmall: {
    marginBottom: 8,
  },
  label: {
    color: '#F0C38E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#312C51',
    borderColor: '#F0C38E',
    borderWidth: 2,
    width: '100%',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  forgot: {
    marginBottom: 24,
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: '#F1AA9B',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#F0C38E',
    width: '100%',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
    // subtle button shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#312C51',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0C38E',
  },
  dividerText: {
    color: '#F0C38E',
    paddingHorizontal: 8,
    fontSize: 14,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  note: {
    color: '#F0C38E',
    fontSize: 14,
  },
  signUp: {
    color: '#F1AA9B',
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
})

export default SignIn