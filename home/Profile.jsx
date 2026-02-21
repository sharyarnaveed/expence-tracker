import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import React, { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/SupabaseClient";

const DEFAULT_AVATAR_URL =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=150";

const Profile = ({ navigation }) => {
  const [fullname, setFullname] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState(DEFAULT_AVATAR_URL);
  const [usertransactions, setUsertransactions] = React.useState(0);
  const [usercategories, setUsercategories] = React.useState(0);
  const [userage, setUserage] = React.useState(0);

  const statsItems = [
    { id: "transactions", label: "Transactions", value: usertransactions },
    { id: "categories", label: "Categories", value: usercategories },
    { id: "months", label: "Months", value: userage },
  ];

  const openExternalLink = async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Unable to open link");
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.log("error while opening link", error);
      Alert.alert("Unable to open link");
    }
  };

  const accountItems = [
    {
      id: "edit-profile",
      label: "Edit Profile",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      id: "privacy-policy",
      label: "Privacy Policy",
      onPress: () =>
        openExternalLink("https://expense-tracker-nu-rust-79.vercel.app/privacy-policy"),
    },
    {
      id: "help-support",
      label: "Help & Support",
      onPress: () =>
        openExternalLink(
          "mailto:sharyarmalik430@gmail.com?subject=Expense%20Tracker%20Support",
        ),
    },
  ];

  const handleLogout = async () => {
    try {
      console.log("in logout");

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log("failed to log out", error);
      }
    } catch (error) {
      console.log("failed to log out", error);
    }
  };

  const GetUsersdata = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        return;
      }
      const metadata = data.user.user_metadata ?? {};
      setEmail(data.user.email ?? "");
      setFullname(metadata.full_name ?? "");
      setAvatarUrl(metadata.avatar_url ?? DEFAULT_AVATAR_URL);

      // ✅ Correct - count is an option in select()
      const result = await supabase
        .from("userhistory")
        .select("*", { count: "exact" })
        .eq("userid", data.user.id);

      // Get distinct categories for this user
      const { data: categoriesResult, error: categorieserror } = await supabase
        .from("userhistory")
        .select("categoryname")
        .eq("userid", data.user.id);

      if (categorieserror) {
        console.log(categorieserror);
      }

      // Count unique categories
      const uniqueCategories = categoriesResult
        ? [...new Set(categoriesResult.map((r) => r.categoryname))]
        : [];

      // Calculate account age in months from auth created_at
      const createdAt = new Date(data.user.created_at);
      const now = new Date();
      const ageMonths =
        (now.getFullYear() - createdAt.getFullYear()) * 12 +
        (now.getMonth() - createdAt.getMonth());
      setUserage(ageMonths < 1 ? 1 : ageMonths);

      setUsercategories(uniqueCategories.length);

      setUsertransactions(result.count ?? 0);
    } catch (error) {
      console.log("error in getting users data", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      GetUsersdata();
    }, [])
  );
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HEADER WITH PROFILE */}
          <View style={styles.headerSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: avatarUrl || DEFAULT_AVATAR_URL,
                }}
                style={styles.profileImage}
              />
              <View style={styles.statusDot} />
            </View>
            <Text style={styles.userName}>{fullname}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>

          {/* STATS ROW */}
          <View style={styles.statsRow}>
            {statsItems.map((stat, index) => (
              <React.Fragment key={stat.id}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {index !== statsItems.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* SETTINGS TITLE */}
          <Text style={styles.sectionTitle}>Settings</Text>

          {/* SETTINGS CARD */}
          <View style={[styles.settingCard, { backgroundColor: Colors.THIRD }]}> 
            <View style={styles.cardRow}>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>CUR</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Currency</Text>
                <Text style={styles.cardValue}>USD ($)</Text>
              </View>
            </View>
          </View>

          {/* ACCOUNT SECTION */}
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.accountSection}>
            {accountItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                style={[
                  styles.accountItem,
                  index !== accountItems.length - 1 && styles.accountItemBorder,
                ]}
              >
                <View style={styles.accountIndicator} />
                <Text style={styles.accountText}>{item.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const Colors = {
  DARK: "#312C51",
  SECOND: "#48426D",
  THIRD: "#F0C383",
  FORTH: "#F1AA9B",
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
    paddingBottom: 100,
    paddingHorizontal: 22,
    paddingTop: 20,
  },

  /* HEADER SECTION */
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.THIRD,
  },

  statusDot: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.FORTH,
    borderWidth: 3,
    borderColor: Colors.DARK,
  },

  userName: {
    color: "white",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 5,
  },

  userEmail: {
    color: "#CFCFCF",
    fontSize: 15,
  },

  /* STATS ROW */
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.SECOND,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    justifyContent: "space-around",
    alignItems: "center",
  },

  statBox: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    color: Colors.THIRD,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },

  statLabel: {
    color: "#CFCFCF",
    fontSize: 12,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#ffffff15",
  },

  /* SECTION TITLE */
  sectionTitle: {
    color: "#DDDDDD",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    marginLeft: 5,
  },

  /* SETTINGS CARD */
  settingCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 30,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardBadge: {
    backgroundColor: Colors.DARK,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 15,
  },

  cardBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  cardInfo: {
    flex: 1,
  },

  cardTitle: {
    color: Colors.DARK,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },

  cardValue: {
    color: Colors.DARK,
    fontSize: 18,
    fontWeight: "800",
  },

  /* ACCOUNT SECTION */
  accountSection: {
    backgroundColor: Colors.SECOND,
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
  },

  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
  },

  accountItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff15",
  },

  accountIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.THIRD,
    marginRight: 18,
  },

  accountText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },

  chevron: {
    color: Colors.THIRD,
    fontSize: 24,
    fontWeight: "300",
  },

  /* LOGOUT BUTTON */
  logoutButton: {
    backgroundColor: Colors.SECOND,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.FORTH,
  },

  logoutText: {
    color: Colors.FORTH,
    fontSize: 18,
    fontWeight: "800",
  },

  /* VERSION */
  versionText: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default Profile;
