import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/SupabaseClient";

const DEFAULT_AVATAR_URL =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=150";

const Colors = {
  DARK: "#312C51",
  SECOND: "#48426D",
  THIRD: "#F0C383",
  FORTH: "#F1AA9B",
};

const EditProfile = ({ navigation }) => {
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        return;
      }

      setUserId(data.user.id);
      const metadata = data.user.user_metadata ?? {};

      setFullName(metadata.full_name ?? "");
      setEmail(data.user.email ?? "");
      setOriginalEmail(data.user.email ?? "");
      setPhone(metadata.phone ?? "");
      setCity(metadata.city ?? "");
      setAvatarUrl(metadata.avatar_url ?? DEFAULT_AVATAR_URL);
    } catch (error) {
      console.log("error in loading edit profile data", error);
    }
  };


  const handleSaveProfile = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedCity = city.trim();

    if (!trimmedName || !trimmedEmail) {
      Alert.alert("Missing fields", "Full name and email are required.");
      return;
    }

    const emailChanged = trimmedEmail !== originalEmail;
    setIsSavingProfile(true);
    try {
      const payload = {
        data: {
          full_name: trimmedName,
          phone: trimmedPhone,
          city: trimmedCity,
          avatar_url: avatarUrl,
        },
      };

      if (emailChanged) {
        payload.email = trimmedEmail;
      }

      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        Alert.alert("Update failed", error.message);
        return;
      }

      setOriginalEmail(trimmedEmail);
      Alert.alert(
        "Success",
        emailChanged
          ? "Profile updated. Confirm your new email from your inbox if prompted."
          : "Profile updated.",
      );
    } catch (error) {
      console.log("profile update error", error);
      Alert.alert(
        "Update failed",
        error?.message ?? "Unable to update profile right now.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please enter and confirm new password.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Weak password",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert("Password update failed", error.message);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password updated successfully.");
    } catch (error) {
      console.log("password update error", error);
      Alert.alert(
        "Password update failed",
        error?.message ?? "Unable to update password right now.",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const runDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert("Delete account failed", "Unable to get current user.");
        return;
      }
      const uid = userData.user.id;

      // Delete user's transaction history
      const { error: historyError } = await supabase
        .from("userhistory")
        .delete()
        .eq("userid", uid);
      if (historyError) {
        console.log("delete userhistory error", historyError);
      }

      // Delete user's amount record
      const { error: amountError } = await supabase
        .from("useramount")
        .delete()
        .eq("userid", uid);
      if (amountError) {
        console.log("delete useramount error", amountError);
      }

      Alert.alert("Account data deleted", "Your data has been removed. Signing out.");
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        Alert.alert("Signed out with warning", signOutError.message);
        return;
      }
    } catch (error) {
      console.log("delete account error", error);
      Alert.alert(
        "Delete account failed",
        error?.message ?? "Unable to delete account right now.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your account. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: runDeleteAccount,
        },
      ],
    );
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.photoWrap}>
              <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Personal Info</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#8f8f9e"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#8f8f9e"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#8f8f9e"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Enter your city"
                placeholderTextColor="#8f8f9e"
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSavingProfile && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={isSavingProfile}
          >
            <Text style={styles.saveButtonText}>
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#8f8f9e"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#8f8f9e"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, isUpdatingPassword && styles.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
            >
              <Text style={styles.secondaryButtonText}>
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerText}>
              Permanently remove your account and all related data.
            </Text>
            <TouchableOpacity
              style={[styles.dangerButton, isDeletingAccount && styles.buttonDisabled]}
              onPress={handleDeleteAccountPress}
              disabled={isDeletingAccount}
            >
              <Text style={styles.dangerButtonText}>
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backTextButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.DARK,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 34,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.SECOND,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    color: Colors.THIRD,
    fontSize: 30,
    fontWeight: "400",
    lineHeight: 32,
    marginTop: -2,
  },

  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 44,
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  photoWrap: {
    position: "relative",
    width: 110,
    height: 110,
    marginBottom: 14,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.THIRD,
  },



  formCard: {
    backgroundColor: Colors.SECOND,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },

  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },

  fieldWrap: {
    marginBottom: 14,
  },

  fieldLabel: {
    color: Colors.THIRD,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#2b2747",
    borderWidth: 1,
    borderColor: "#ffffff22",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    fontSize: 15,
  },

  saveButton: {
    backgroundColor: Colors.THIRD,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },

  saveButtonText: {
    color: Colors.DARK,
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    backgroundColor: Colors.DARK,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.THIRD,
  },

  secondaryButtonText: {
    color: Colors.THIRD,
    fontSize: 15,
    fontWeight: "700",
  },

  dangerCard: {
    backgroundColor: "#5a3043",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffb2cb33",
  },

  dangerTitle: {
    color: "#FFD9E4",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  dangerText: {
    color: "#FFD9E4",
    fontSize: 13,
    marginBottom: 14,
  },

  dangerButton: {
    backgroundColor: "#E45858",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  dangerButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  backTextButton: {
    alignItems: "center",
    paddingVertical: 10,
  },

  backText: {
    color: "#CFCFCF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default EditProfile;
