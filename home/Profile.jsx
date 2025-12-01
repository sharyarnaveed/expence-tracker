import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
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
                source={{ uri: "https://i.pravatar.cc/150?img=10" }}
                style={styles.profileImage}
              />
              <View style={styles.statusDot} />
            </View>
            <Text style={styles.userName}>Sharyar Naveed</Text>
            <Text style={styles.userEmail}>sharyar@example.com</Text>
          </View>

          {/* STATS ROW */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>47</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Months</Text>
            </View>
          </View>

          {/* SETTINGS TITLE */}
          <Text style={styles.sectionTitle}>Settings</Text>

          {/* SETTINGS GRID */}
          <View style={styles.settingsGrid}>
            {/* Currency Card */}
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: Colors.THIRD }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>CUR</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Currency</Text>
              <Text style={styles.cardValue}>USD ($)</Text>
            </TouchableOpacity>

            {/* Theme Card */}
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: Colors.FORTH }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>THE</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Theme</Text>
              <Text style={styles.cardValue}>Dark</Text>
            </TouchableOpacity>

            {/* Notifications Card */}
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: Colors.SECOND }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>ALR</Text>
                </View>
              </View>
              <Text style={[styles.cardTitle, styles.cardTitleOnDark]}>
                Alerts
              </Text>
              <Text style={[styles.cardValue, styles.cardValueOnDark]}>On</Text>
            </TouchableOpacity>

            {/* Language Card */}
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: Colors.SECOND }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>LAN</Text>
                </View>
              </View>
              <Text style={[styles.cardTitle, styles.cardTitleOnDark]}>
                Language
              </Text>
              <Text style={[styles.cardValue, styles.cardValueOnDark]}>
                English
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACCOUNT SECTION */}
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.accountSection}>
            <TouchableOpacity style={styles.accountItem}>
              <View style={styles.accountIndicator} />
              <Text style={styles.accountText}>Edit Profile</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accountItem}>
              <View style={styles.accountIndicator} />
              <Text style={styles.accountText}>Privacy & Security</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accountItem}>
              <View style={styles.accountIndicator} />
              <Text style={styles.accountText}>Help & Support</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity style={styles.logoutButton}>
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

  /* SETTINGS GRID */
  settingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  settingCard: {
    width: "48%",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    minHeight: 120,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  cardBadge: {
    backgroundColor: Colors.DARK,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  cardBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  cardTitle: {
    color: Colors.DARK,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },

  cardValue: {
    color: Colors.DARK,
    fontSize: 18,
    fontWeight: "800",
  },

  cardTitleOnDark: {
    color: "white",
  },

  cardValueOnDark: {
    color: "white",
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
