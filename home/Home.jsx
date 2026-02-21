import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "../lib/SupabaseClient";
import { useFocusEffect } from "@react-navigation/native";

const DEFAULT_AVATAR_URL =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=150";

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const bottomSpace = (insets?.bottom || 16) + 120; // extra padding to clear floating tab bar

  const [fullName, setFullName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [chartData, setChartData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [chartLabels, setChartLabels] = useState([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);

  const [currentamount, SetcurrentAmount] = useState(0);
  const [montlyadded, SetMonthlyadded] = useState(0);
  const [montlyExpense, SetMonthlyExpense] = useState(0);
  const [todayExpense, SetTodayExpense] = useState(0);
  const [weeklyTotal, SetWeeklyTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 220],
  });

  const SkeletonBlock = ({ style, light }) => (
    <View
      style={[
        styles.skeletonBase,
        light ? styles.skeletonBaseLight : styles.skeletonBaseDark,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }, { skewX: "-18deg" }],
          },
        ]}
      />
    </View>
  );

  const getuserdata = async () => {
    setIsLoading(true);
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data?.user) {
        return;
      }
      const metadata = data.user.user_metadata ?? {};
      setFullName(metadata.full_name ?? "User");
      setAvatarUrl(metadata.avatar_url ?? DEFAULT_AVATAR_URL);
      const userid = data.user.id;

      const { data: getCurrentbalance, error: errorcurrentbalance } =
        await supabase
          .from("useramount")
          .select("addedamount")
          .eq("userid", userid)
          .single();
      SetcurrentAmount(getCurrentbalance?.addedamount ?? 0);

      if (errorcurrentbalance) {
        Alert.alert("Cant Get Current Balance!");
      }

      // Monthly added: sum of amounts added to useramount this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: monthlyAddedData, error: errortotaladded } = await supabase
        .from("useramount")
        .select("addedamount")
        .eq("userid", userid)
        .single();

      if (errortotaladded) {
        console.error(errortotaladded);
      }

      // Monthly spent: sum of expenses this month
      const { data: monthlySpentData, error: errortotalspent } = await supabase
        .from("userhistory")
        .select("amount")
        .eq("userid", userid)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      if (errortotalspent) {
        console.error(errortotalspent);
      }

      const monthlyExpenseTotal = (monthlySpentData || []).reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      );

      // Today's expense sum
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const { data: todayData, error: todayError } = await supabase
        .from("userhistory")
        .select("amount")
        .eq("userid", userid)
        .gte("date", todayStart)
        .lte("date", todayEnd);

      if (todayError) {
        console.error(todayError);
      }

      const todayexpense = (todayData || []).reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      );

      // Last 7 days expenses
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();

      const { data: last7Data, error: errorWeeklyData } = await supabase
        .from("userhistory")
        .select("amount, date")
        .eq("userid", userid)
        .gte("date", last7Start)
        .lte("date", todayEnd);

      if (errorWeeklyData) {
        console.error(errorWeeklyData);
      } else {
        // Build a map for last 7 days
        const dailyMap = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          dailyMap[key] = { label: dayLabels[d.getDay()], total: 0 };
        }
        (last7Data || []).forEach((row) => {
          const key = new Date(row.date).toISOString().slice(0, 10);
          if (dailyMap[key]) {
            dailyMap[key].total += Number(row.amount || 0);
          }
        });
        const orderedKeys = Object.keys(dailyMap).sort();
        const labels = orderedKeys.map((k) => dailyMap[k].label);
        const amounts = orderedKeys.map((k) => dailyMap[k].total);
        setChartLabels(labels);
        setChartData(
          amounts.every((a) => a === 0) ? [0, 0, 0, 0, 0, 0, 0] : amounts
        );
        SetWeeklyTotal(amounts.reduce((sum, val) => sum + val, 0));
      }

      SetTodayExpense(todayexpense);
      SetMonthlyadded(monthlyAddedData?.addedamount ?? 0);
      SetMonthlyExpense(monthlyExpenseTotal);
    } catch (err) {
      console.error("getuserdata error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getuserdata();
    }, [])
  );

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
              <Text style={styles.username}>{fullName} 👋</Text>
            </View>

            <Image
              source={{ uri: avatarUrl || DEFAULT_AVATAR_URL }}
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
            {isLoading ? (
              <View style={styles.skeletonStack}>
                <SkeletonBlock style={[styles.skeletonLine, styles.skeletonLabel]} />
                <SkeletonBlock style={[styles.skeletonLine, styles.skeletonBig]} />
                <View style={styles.rowBetween}>
                  <View style={styles.statBlock}>
                    <SkeletonBlock
                      style={[styles.skeletonLine, styles.skeletonSmall]}
                    />
                    <SkeletonBlock
                      style={[styles.skeletonLine, styles.skeletonStat]}
                    />
                  </View>
                  <View style={styles.statBlock}>
                    <SkeletonBlock
                      style={[styles.skeletonLine, styles.skeletonSmall]}
                    />
                    <SkeletonBlock
                      style={[styles.skeletonLine, styles.skeletonStat]}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>

          {/* QUICK CARDS */}
          <View style={styles.quickRow}>
            <View style={styles.quickCard}>
              <View style={[styles.accentBar, styles.accentThird]} />
              {isLoading ? (
                <>
                  <SkeletonBlock
                    light
                    style={[styles.skeletonLine, styles.skeletonSmall]}
                  />
                  <SkeletonBlock
                    light
                    style={[styles.skeletonLine, styles.skeletonAmount]}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.quickLabel}>Today’s Spend</Text>
                  <Text style={styles.quickAmount}>${todayExpense}</Text>
                </>
              )}
            </View>

            <View style={styles.quickCard2}>
              <View style={[styles.accentBar, styles.accentForth]} />
              {isLoading ? (
                <>
                  <SkeletonBlock
                    light
                    style={[styles.skeletonLine, styles.skeletonSmall]}
                  />
                  <SkeletonBlock
                    light
                    style={[styles.skeletonLine, styles.skeletonAmount]}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.quickLabel}>Week Total</Text>
                  <Text style={styles.quickAmount}>${weeklyTotal}</Text>
                </>
              )}
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
            {isLoading ? (
              <SkeletonBlock light style={styles.chartSkeleton} />
            ) : (
              <LineChart
                data={{
                  labels: chartLabels,
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
            )}
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
  skeletonStack: {
    gap: 10,
  },
  skeletonBase: {
    borderRadius: 999,
    overflow: "hidden",
  },
  skeletonBaseDark: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  skeletonBaseLight: {
    backgroundColor: "rgba(72, 66, 109, 0.12)",
  },
  skeletonLine: {
    height: 12,
    borderRadius: 999,
  },
  skeletonLabel: {
    width: 120,
  },
  skeletonBig: {
    height: 34,
    width: 160,
  },
  skeletonSmall: {
    width: 80,
    height: 10,
  },
  skeletonStat: {
    width: 70,
    height: 18,
    marginTop: 8,
  },
  skeletonAmount: {
    width: 100,
    height: 20,
    marginTop: 8,
  },
  chartSkeleton: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
  },
  shimmer: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 80,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
});

export default HomeScreen;
