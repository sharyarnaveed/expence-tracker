import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "../lib/SupabaseClient";

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const bottomSpace = (insets?.bottom || 16) + 120; // extra padding to clear floating tab bar
  const chartData = [50, 10, 40, 95, 85, 35, 70];

  const [currentamount, SetcurrentAmount] = useState(0);
  const [montlyadded, SetMonthlyadded] = useState(0);
  const [montlyExpense, SetMonthlyExpense] = useState(0);

  const getuserdata = async () => {
    const { data } = await supabase.auth.getUser();
    const username = data.user.user_metadata.full_name;
    const userid = data.user.id;

    const { data: getCurrentbalance, error: errorcurrentbalance } =
      await supabase
        .from("useramount")
        .select("addedamount")
        .eq("userid", userid)
        .single();
    SetcurrentAmount(getCurrentbalance.addedamount);

    if (errorcurrentbalance) {
      Alert.alert("Cant Get Current Balance!");
    }

    const { data: totaladded, error: errortotaladded } = await supabase.rpc(
      "get_monthly_amounts",
      {
        user_id: userid,
      }
    );

    if (errortotaladded) {
      console.error(errortotaladded);
    }

    const { data: totalspent, error: errortotalspent } = await supabase.rpc(
      "get_monthly_expense",
      {
        user_id: userid,
      }
    );

    if (errortotalspent) {
      console.error(errortotalspent);
    }


    SetMonthlyadded(totaladded[0].total_amount);
    SetMonthlyExpense(totalspent[0].total_amount)
    console.log(totalspent);
  };

  useEffect(() => {
    getuserdata();
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.heroBackdrop}>
        <View style={[styles.heroBubble, styles.heroBubbleOne]} />
        <View style={[styles.heroBubble, styles.heroBubbleTwo]} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomSpace }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.username}>Sharyar 👋</Text>
            </View>

            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=10" }}
              style={styles.profileImage}
            />
          </View>

          {/* OVERVIEW TITLE */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Overview (This Month)</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Synced</Text>
            </View>
          </View>

          {/* MAIN BALANCE CARD */}
          <View style={styles.mainCard}>
            <Text style={styles.label}>Current Balance</Text>
            <Text style={styles.bigAmount}>${currentamount}</Text>

            <View style={styles.rowBetween}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Income</Text>
                <Text style={[styles.statValue, { color: "#00E676" }]}>
                  ${montlyadded}
                </Text>
              </View>

              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={[styles.statValue, { color: "#FF5252" }]}>
                  ${montlyExpense}
                </Text>
              </View>
            </View>
          </View>

          {/* QUICK CARDS */}
          <View style={styles.quickRow}>
            <View style={styles.quickCard}>
              <View style={[styles.accentBar, styles.accentThird]} />
              <Text style={styles.quickLabel}>Today’s Spend</Text>
              <Text style={styles.quickAmount}>$32.50</Text>
            </View>

            <View style={styles.quickCard2}>
              <View style={[styles.accentBar, styles.accentForth]} />
              <Text style={styles.quickLabel}>Week Total</Text>
              <Text style={styles.quickAmount}>$138.92</Text>
            </View>
          </View>

          {/* SPENDING PATTERN CHART */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Spending Pattern</Text>
            <Text style={styles.subtleText}>Last 7 days</Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Weekly flow</Text>
                <Text style={styles.chartSubtitle}>
                  Smoothed average, last 7 days
                </Text>
              </View>
              <Text style={styles.chartDelta}>+12%</Text>
            </View>
            <LineChart
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [
                  {
                    data: chartData,
                  },
                ],
              }}
              width={Dimensions.get("window").width - 74}
              height={180}
              chartConfig={{
                backgroundColor: Colors.CARD,
                backgroundGradientFrom: Colors.CARD,
                backgroundGradientTo: Colors.CARD,
                decimalPlaces: 0,
                color: (opacity = 1) => Colors.SECOND,
                labelColor: (opacity = 1) => Colors.MUTED,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: Colors.FORTH,
                  fill: Colors.FORTH,
                },
                propsForBackgroundLines: {
                  stroke: "rgba(72, 66, 109, 0.1)",
                },
              }}
              bezier
              style={{
                borderRadius: 16,
              }}
            />
          </View>
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
  LIGHT: "#F8F5EF",
  CARD: "#FFF9F3",
  MUTED: "#B4AFC3",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.LIGHT,
  },

  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: Colors.DARK,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  heroBubble: {
    position: "absolute",
    backgroundColor: Colors.THIRD,
    opacity: 0.32,
    borderRadius: 200,
  },

  heroBubbleOne: {
    width: 220,
    height: 220,
    top: -70,
    right: -40,
  },

  heroBubbleTwo: {
    width: 170,
    height: 170,
    bottom: -30,
    left: -40,
    backgroundColor: Colors.FORTH,
    opacity: 0.28,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  greeting: {
    color: Colors.THIRD,
    fontSize: 15,
  },

  username: {
    color: Colors.CARD,
    fontSize: 26,
    fontWeight: "800",
    marginTop: -3,
  },

  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.THIRD,
  },

  /* TITLES */
  sectionTitle: {
    color: Colors.CARD,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 5,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 2,
  },

  badge: {
    backgroundColor: "rgba(240, 195, 131, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.THIRD,
  },

  badgeText: {
    color: Colors.DARK,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  subtleText: {
    color: Colors.MUTED,
    fontSize: 12,
    fontWeight: "600",
  },

  /* MAIN BALANCE CARD */
  mainCard: {
    backgroundColor: Colors.SECOND,
    padding: 24,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  label: {
    color: Colors.CARD,
    fontSize: 14,
  },

  bigAmount: {
    color: Colors.CARD,
    fontSize: 36,
    fontWeight: "800",
    marginVertical: 8,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  statBlock: {
    alignItems: "center",
  },

  statLabel: {
    color: Colors.CARD,
    fontSize: 14,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },

  /* QUICK CARDS */
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 14,
  },

  quickCard: {
    backgroundColor: Colors.CARD,
    width: "48%",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: "hidden",
  },

  quickCard2: {
    backgroundColor: Colors.THIRD,
    width: "48%",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: "hidden",
  },

  accentBar: {
    height: 6,
    width: "110%",
    marginHorizontal: -18,
    marginTop: -18,
  },

  accentThird: {
    backgroundColor: Colors.THIRD,
  },

  accentForth: {
    backgroundColor: Colors.FORTH,
  },

  quickLabel: {
    color: Colors.DARK,
    fontSize: 14,
  },

  quickAmount: {
    color: Colors.DARK,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },

  /* CHART CARD */
  chartCard: {
    backgroundColor: Colors.CARD,
    padding: 16,
    borderRadius: 22,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.08)",
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  chartTitle: {
    color: Colors.DARK,
    fontSize: 16,
    fontWeight: "700",
  },

  chartSubtitle: {
    color: Colors.MUTED,
    fontSize: 12,
    marginTop: 2,
  },

  chartDelta: {
    color: Colors.SECOND,
    fontWeight: "800",
    fontSize: 16,
  },
});

export default HomeScreen;
