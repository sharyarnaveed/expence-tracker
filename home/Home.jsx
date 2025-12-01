import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";

const HomeScreen = () => {
  const chartData = [50, 10, 40, 95, 85, 35, 70];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

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
        <Text style={styles.sectionTitle}>Overview (This Month)</Text>

        {/* MAIN BALANCE CARD */}
        <View style={styles.mainCard}>
          <Text style={styles.label}>Current Balance</Text>
          <Text style={styles.bigAmount}>$1,245.62</Text>

          <View style={styles.rowBetween}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: "#00E676" }]}>$2,000</Text>
            </View>

            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, { color: "#FF5252" }]}>$754.38</Text>
            </View>
          </View>
        </View>

        {/* QUICK CARDS */}
        <View style={styles.quickRow}>
          <View style={styles.quickCard}>
            <Text style={styles.quickLabel}>Today’s Spend</Text>
            <Text style={styles.quickAmount}>$32.50</Text>
          </View>

          <View style={styles.quickCard2}>
            <Text style={styles.quickLabel}>Week Total</Text>
            <Text style={styles.quickAmount}>$138.92</Text>
          </View>
        </View>

        {/* SPENDING PATTERN CHART */}
        <Text style={styles.sectionTitle}>Spending Pattern</Text>

        <View style={styles.chartCard}>
          <LineChart
            data={{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{
                data: chartData
              }]
            }}
            width={Dimensions.get("window").width - 74}
            height={160}
            chartConfig={{
              backgroundColor: Colors.SECOND,
              backgroundGradientFrom: Colors.SECOND,
              backgroundGradientTo: Colors.SECOND,
              decimalPlaces: 0,
              color: (opacity = 1) => Colors.FORTH,
              labelColor: (opacity = 1) => "#DDDDDD",
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: Colors.FORTH
              }
            }}
            bezier
            style={{
              borderRadius: 16
            }}
          />
        </View>

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
    paddingHorizontal: 22,
    paddingTop: 10,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  greeting: {
    color: "#CFCFCF",
    fontSize: 15,
  },

  username: {
    color: "white",
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
    color: "#DDDDDD",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 5,
  },

  /* MAIN BALANCE CARD */
  mainCard: {
    backgroundColor: Colors.SECOND,
    padding: 22,
    borderRadius: 26,
    marginBottom: 20,
  },

  label: {
    color: "#DADADA",
    fontSize: 14,
  },

  bigAmount: {
    color: "white",
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
    color: "#DCDCDC",
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
  },

  quickCard: {
    backgroundColor: Colors.THIRD,
    width: "48%",
    padding: 18,
    borderRadius: 22,
  },

  quickCard2: {
    backgroundColor: Colors.FORTH,
    width: "48%",
    padding: 18,
    borderRadius: 22,
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
    backgroundColor: Colors.SECOND,
    padding: 15,
    borderRadius: 22,
    marginBottom: 40,
  },
});

export default HomeScreen;
