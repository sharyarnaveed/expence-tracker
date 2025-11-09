import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { supabase } from "./lib/SupabaseClient";

const SignUp = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [Repassword, setRePassword] = useState("");


const handlesignup = async () => {
  if (!email || !password || !fullname) {
    Alert.alert("Missing fields", "Please fill name, email and password");
    return;
  }
  if (password !== Repassword) {
    Alert.alert("Password mismatch", "Passwords do not match");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullname,
        },
      },
    });

    if (error) {
      console.log("supabase error", error);
      Alert.alert("Sign up failed", error.message || JSON.stringify(error));
      return;
    }

    console.log("signup data", data);
    Alert.alert("Success", "Check your email for a confirmation link (if required).");
    navigation.navigate("SignIn");
  } catch (err) {
    console.log("error in creating account", err);
    Alert.alert("Unexpected error", "See console for details");
  }
}

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <View style={styles.accentBar} />
          <Text style={styles.heading}>Sign Up</Text>
          <Text style={styles.subheading}>Welcome back to your tracker</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={fullname}
              onChangeText={setFullname}
              keyboardType="default"
              editable
              cursorColor="#F0C38E"
            />
          </View>

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
              keyboardType="visible-password"
              editable
              cursorColor="#F0C38E"
            />
          </View>

          <View style={styles.fieldSmall}>
            <Text style={styles.label}> Re-Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={Repassword}
              onChangeText={setRePassword}
              secureTextEntry
              keyboardType="visible-password"
              editable
              cursorColor="#F0C38E"
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.button} onPress={handlesignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.note}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.signUp}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#312C51",
    width: "100%",
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#48426D",
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 32,
    justifyContent: "center",
    // shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    // elevation (Android)
    elevation: 8,
  },
  accentBar: {
    backgroundColor: "#F0C38E",
    height: 4,
    width: 64,
    alignSelf: "center",
    marginBottom: 32,
    borderRadius: 999,
  },
  heading: {
    color: "#F0C38E",
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    color: "#F1AA9B",
    textAlign: "center",
    marginBottom: 32,
  },
  field: {
    marginBottom: 16,
  },
  fieldSmall: {
    marginBottom: 8,
  },
  label: {
    color: "#F0C38E",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#312C51",
    borderColor: "#F0C38E",
    borderWidth: 2,
    width: "100%",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
  },
  forgot: {
    marginBottom: 24,
    alignSelf: "flex-end",
  },
  forgotText: {
    color: "#F1AA9B",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#F0C38E",
    width: "100%",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: "center",
    // subtle button shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: "#312C51",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F0C38E",
  },
  dividerText: {
    color: "#F0C38E",
    paddingHorizontal: 8,
    fontSize: 14,
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  note: {
    color: "#F0C38E",
    fontSize: 14,
  },
  signUp: {
    color: "#F1AA9B",
    fontWeight: "700",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default SignUp;
