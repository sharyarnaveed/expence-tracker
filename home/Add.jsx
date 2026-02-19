import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../lib/SupabaseClient";
import { Feather } from "@expo/vector-icons";

const Colors = {
  DARK: "#312C51",
  SECOND: "#48426D",
  THIRD: "#F0C383",
  FORTH: "#F1AA9B",
  LIGHT: "#F8F5EF",
  MUTED: "#8C86A0",
  CARD: "#FFF9F3",
};

export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const bottomSpacing = (insets?.bottom || 16) + 12;
  const [tab, SetTabs] = useState("expense");
  const [amount, setAmount] = useState(0);
  const [category, Setcategory] = useState("");
  const [notes, SetNotes] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const thecat = [
    {
      id: "food",
      name: "Food & Dining",
      icon: "utensils",
      color: "#FF6B6B",
    },
    {
      id: "groceries",
      name: "Groceries",
      icon: "shopping-cart",
      color: "#4ECDC4",
    },
    {
      id: "transport",
      name: "Transportation",
      icon: "bus",
      color: "#1A535C",
    },
    {
      id: "rent",
      name: "Rent",
      icon: "home",
      color: "#5F27CD",
    },
    {
      id: "utilities",
      name: "Utilities",
      icon: "zap",
      color: "#F368E0",
    },
    {
      id: "shopping",
      name: "Shopping",
      icon: "shopping-bag",
      color: "#10AC84",
    },
    {
      id: "health",
      name: "Health & Medical",
      icon: "heart",
      color: "#EE5253",
    },
    {
      id: "education",
      name: "Education",
      icon: "book",
      color: "#54A0FF",
    },
    {
      id: "entertainment",
      name: "Entertainment",
      icon: "film",
      color: "#FECB2F",
    },
    {
      id: "subscriptions",
      name: "Subscriptions",
      icon: "repeat",
      color: "#8395A7",
    },
    {
      id: "travel",
      name: "Travel",
      icon: "map",
      color: "#00D2D3",
    },
    {
      id: "personal",
      name: "Personal Care",
      icon: "user",
      color: "#576574",
    },
    {
      id: "gifts",
      name: "Gifts & Donations",
      icon: "gift",
      color: "#FF9F43",
    },
    {
      id: "insurance",
      name: "Insurance",
      icon: "shield",
      color: "#222F3E",
    },
    {
      id: "other",
      name: "Other",
      icon: "more-horizontal",
      color: "#C8D6E5",
    },
  ];

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Media library access is required.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 1,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0].uri);
    }
  };

  const getExtension = (uri) => {
    return uri.split(".").pop().split("?")[0];
  };

  const uploadimage = async (userid) => {
    try {
      if (!receipt) {
        Alert.alert("image Not added");
      }
      const res = await fetch(receipt);
      const fileExt = getExtension(receipt);

      const arraybuffer = await res.arrayBuffer();
      const filename = `img_${Date.now()}_${userid}.${fileExt}`;
      const file = new Uint8Array(arraybuffer);

      const { data, error } = await supabase.storage
        .from("addimages")
        .upload(filename, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: `image/${fileExt}`,
        });

      if (error) {
        console.log("Upload Error:", error.message);
        return;
      }

      return filename;
    } catch (err) {
      console.log("Upload image error:", err);
    }
  };

  const submittheamount = async () => {
    try {
      if (!amount || !category || !date) {
        Alert.alert("Missing fields");
        return;
      }
      if (receipt) {
        //if we have image
        const { data } = await supabase.auth.getUser();
        const fileName = await uploadimage(data.user.id); // return only filename
        const userid = data.user.id;

        const { data: DataSubmit, error: Datasubmiterror } = await supabase
          .from("userhistory")
          .insert({
            amount,
            userid: userid, // make sure this matches
            categoryname: category,
            date,
            uploadimg: fileName, // ⬅️ store only filename
            notes,
          })
          .single();
        if (Datasubmiterror) {
          console.log(Datasubmiterror);

          Alert.alert("Error in Adding Expense!");
        } else {
          const { data: addAmountdata, error: incomeError } = await supabase
            .from("useramount")
            .select("*")
            .eq("userid", userid);

          if (incomeError) {
            console.log(incomeError);

            Alert.alert("Error in Detucting Amount from Current!");
          }
          const savedamount = addAmountdata[0].addedamount;
          const newamount = savedamount - Number(amount);
          const { error: IncomeUpdateError } = await supabase
            .from("useramount")
            .update({ addedamount: newamount })
            .eq("userid", userid);

          if (IncomeUpdateError) {
            console.log(IncomeUpdateError);
            Alert.alert("Error in Adding Amount!");
            return;
          }

          Alert.alert("Expense added!");
          Keyboard.dismiss();
          setAmount(0);
          Setcategory("");
          SetNotes("");
          setDate(new Date());
          setReceipt(null);
        }
      }
      // if no image
      else {
        const { data } = await supabase.auth.getUser();
        const userid = data.user.id;

        const { data: DataSubmit, error: Datasubmiterror } = await supabase
          .from("userhistory")
          .insert({
            amount,
            userid: data.user.id, // make sure this matches
            categoryname: category,
            date,
            notes,
          })
          .single();
        if (Datasubmiterror) {
          Alert.alert("Error in Adding Expense!");
        }
        const { data: addAmountdata, error: incomeError } = await supabase
          .from("useramount")
          .select("*")
          .eq("userid", userid);

        if (incomeError) {
          console.log(incomeError);

          Alert.alert("Error in Detucting Amount from Current!");
        }
        const savedamount = addAmountdata[0].addedamount;
        const newamount = savedamount - Number(amount);
        const { error: IncomeUpdateError } = await supabase
          .from("useramount")
          .update({ addedamount: newamount })
          .eq("userid", userid);

        if (IncomeUpdateError) {
          console.log(IncomeUpdateError);
          Alert.alert("Error in Adding Amount!");
          return;
        }
        Alert.alert("Expense added!");
        Keyboard.dismiss();
        setAmount(0);
        Setcategory("");
        SetNotes("");
        setDate(new Date());
      }
    } catch (error) {
      console.log("error in submitting", error);
    }
  };

  const submitIncome = async () => {
    try {
      if (!amount) {
        Alert.alert("Please enter an amount");
        return;
      }

      const { data } = await supabase.auth.getUser();
      const userid = data.user.id;
      const { data: addAmountdata, error: incomeError } = await supabase
        .from("useramount")
        .select("*")
        .eq("userid", userid);

      if (incomeError) {
        console.log(incomeError);

        Alert.alert("Error in Adding Amount!");
      } else {
        const savedamount = addAmountdata[0].addedamount;
        const newamount = savedamount + Number(amount);
        const { error: IncomeUpdateError } = await supabase
          .from("useramount")
          .update({ addedamount: newamount })
          .eq("userid", userid);

        if (IncomeUpdateError) {
          console.log(IncomeUpdateError);
          Alert.alert("Error in Adding Amount!");
          return;
        } else {
          const { data: addAmountdataHistory, error: incomeErrorHistory } =
            await supabase
              .from("addmounthistory")
              .insert({ userid: userid, amount });
          if (incomeErrorHistory) {
            console.log(incomeErrorHistory);
            Alert.alert("Error in Adding Amount History!");
          }

          Alert.alert("Amount added!");
          Keyboard.dismiss();
          setAmount(0);
        }
      }
    } catch (error) {
      console.log("error in submitting income", error);
    }
  };

  const selectedCategory = thecat.find((item) => item.id === category);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottomSpacing + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBackdrop}>
            <View style={[styles.heroBubble, styles.heroBubbleOne]} />
            <View style={[styles.heroBubble, styles.heroBubbleTwo]} />
          </View>

          <View style={styles.headerContainer}>
            <View style={styles.headerDecor} />
            <Text style={styles.header}>Add Expense/Amount</Text>
            <Text style={styles.subHeader}>Track your spending wisely</Text>
          </View>
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              onPress={() => SetTabs("expense")}
              activeOpacity={0.85}
              style={[
                styles.tabButton,
                tab === "expense" && styles.tabButtonActive,
              ]}
            >
              <View style={styles.tabIconBadge}>
                <Feather
                  name="trending-down"
                  size={18}
                  color={tab === "expense" ? Colors.DARK : Colors.SECOND}
                />
              </View>
              <View style={styles.tabTextGroup}>
                <Text
                  style={[
                    styles.tabLabel,
                    tab === "expense" && styles.tabLabelActive,
                  ]}
                >
                  Add Expense
                </Text>
                <Text
                  style={[
                    styles.tabSubLabel,
                    tab === "expense" && styles.tabSubLabelActive,
                  ]}
                >
                  Track a new cost
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.tabButtonSpacer} />

            <TouchableOpacity
              onPress={() => SetTabs("amount")}
              activeOpacity={0.85}
              style={[
                styles.tabButton,
                tab === "amount" && styles.tabButtonActive,
              ]}
            >
              <View style={styles.tabIconBadge}>
                <Feather
                  name="plus-circle"
                  size={18}
                  color={tab === "amount" ? Colors.DARK : Colors.SECOND}
                />
              </View>
              <View style={styles.tabTextGroup}>
                <Text
                  style={[
                    styles.tabLabel,
                    tab === "amount" && styles.tabLabelActive,
                  ]}
                >
                  Add Amount
                </Text>
                <Text
                  style={[
                    styles.tabSubLabel,
                    tab === "amount" && styles.tabSubLabelActive,
                  ]}
                >
                  Record an income
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {tab === "expense" && (
            <View style={[styles.card, { marginBottom: bottomSpacing }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Expense Details</Text>
                <Text style={styles.sectionSubtitle}>
                  Fill out the essentials to save quickly.
                </Text>
              </View>
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    editable
                    cursorColor={Colors.THIRD}
                    placeholderTextColor="#CCC"
                  />
                </View>
                <View style={styles.quickAmountRow}>
                  {["5", "10", "25", "50", "100"].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={styles.quickAmountChip}
                      activeOpacity={0.85}
                      onPress={() => setAmount(value)}
                    >
                      <Text style={styles.quickAmountText}>${value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryHeaderRow}>
                  <Text style={styles.categoryHint}>
                    Tap a category that matches the expense.
                  </Text>
                  {selectedCategory ? (
                    <View
                      style={[
                        styles.selectedBadge,
                        { backgroundColor: selectedCategory.color },
                      ]}
                    >
                      <Text style={styles.selectedBadgeText}>
                        {selectedCategory.name}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.selectedBadgeMuted}>
                      <Text style={styles.selectedBadgeTextMuted}>
                        Not selected
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.categoryGrid}>
                  {thecat.map((item) => {
                    const isSelected = category === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.categoryCard,
                          isSelected && {
                            backgroundColor: item.color,
                            borderColor: item.color,
                          },
                        ]}
                        activeOpacity={0.85}
                        onPress={() => Setcategory(item.id)}
                      >
                        <View
                          style={[
                            styles.categoryIconWrap,
                            isSelected && styles.categoryIconWrapSelected,
                          ]}
                        >
                          <Feather
                            name={item.icon}
                            size={16}
                            color={isSelected ? "white" : Colors.SECOND}
                          />
                        </View>
                        <Text
                          style={[
                            styles.categoryText,
                            isSelected && styles.categoryTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateContent}>
                    <View style={styles.dateLeft}>
                      <Feather
                        name="calendar"
                        size={16}
                        color={Colors.SECOND}
                      />
                      <Text style={styles.dateText}>{date.toDateString()}</Text>
                    </View>
                    <Text style={styles.dateIcon}>▼</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || date;
                    setShowDatePicker(false);
                    setDate(currentDate);
                  }}
                />
              )}

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={styles.optionalLabel}>Optional</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Add any additional notes..."
                    multiline
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={SetNotes}
                    editable
                    cursorColor={Colors.THIRD}
                    placeholderTextColor="#AAA"
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Upload Receipt (Optional)</Text>
                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.uploadButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadContent}>
                    <View style={styles.uploadIconCircle}>
                      <Feather name="camera" size={18} color={Colors.DARK} />
                    </View>
                    <View>
                      <Text style={styles.uploadText}>Add receipt image</Text>
                      <Text style={styles.uploadSubtext}>
                        JPG, PNG up to 10MB
                      </Text>
                    </View>
                    <View style={styles.uploadArrow}>
                      <Feather name="chevron-right" size={18} color={Colors.DARK} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {receipt && (
                <View style={styles.receiptContainer}>
                  <Image
                    source={{ uri: receipt }}
                    style={styles.receiptPreview}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setReceipt(null)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={submittheamount}
                style={[styles.saveButton, { marginBottom: bottomSpacing }]}
                activeOpacity={0.8}
              >
                <View style={styles.saveButtonContent}>
                      <Text style={styles.saveText}>Save Expense</Text>
                      <Feather
                        name="check"
                        size={18}
                        color={Colors.THIRD}
                      />
                </View>
              </TouchableOpacity>
            </View>
          )}
          {tab === "amount" && (
            <View style={[styles.card, { marginBottom: bottomSpacing }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add Income</Text>
                <Text style={styles.sectionSubtitle}>
                  Keep your balance up to date.
                </Text>
              </View>
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    editable
                    cursorColor={Colors.THIRD}
                    placeholderTextColor="#CCC"
                  />
                </View>
                <View style={styles.quickAmountRow}>
                  {["100", "250", "500", "1000"].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={styles.quickAmountChip}
                      activeOpacity={0.85}
                      onPress={() => setAmount(value)}
                    >
                      <Text style={styles.quickAmountText}>${value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={submitIncome}
                style={[
                  styles.saveButton,
                  { marginTop: 10, marginBottom: bottomSpacing },
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.saveButtonContent}>
                  <Text style={styles.saveText}>Save Amount</Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={Colors.THIRD}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tabSwitch: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 6,
    backgroundColor: "rgba(72, 66, 109, 0.05)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.1)",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.LIGHT,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.08)",
    minHeight: 62,
  },
  tabButtonActive: {
    backgroundColor: Colors.THIRD,
    borderColor: Colors.THIRD,
  },
  tabIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(72, 66, 109, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tabTextGroup: {
    flex: 1,
  },
  tabLabel: {
    fontWeight: "800",
    fontSize: 15,
    color: Colors.SECOND,
  },
  tabLabelActive: {
    color: Colors.DARK,
  },
  tabSubLabel: {
    fontSize: 12,
    color: Colors.MUTED,
    marginTop: 2,
  },
  tabSubLabelActive: {
    color: Colors.SECOND,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.LIGHT,
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: Colors.DARK,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  heroBubble: {
    position: "absolute",
    backgroundColor: Colors.THIRD,
    opacity: 0.22,
    borderRadius: 200,
  },
  heroBubbleOne: {
    width: 260,
    height: 260,
    top: -80,
    right: -60,
  },
  heroBubbleTwo: {
    width: 180,
    height: 180,
    bottom: -40,
    left: -50,
    backgroundColor: Colors.FORTH,
    opacity: 0.22,
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  headerDecor: {
    width: 60,
    height: 4,
    backgroundColor: Colors.THIRD,
    borderRadius: 2,
    marginBottom: 15,
  },
  header: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subHeader: {
    color: Colors.THIRD,
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 0.3,
    opacity: 0.95,
  },
  tagRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  tagChip: {
    backgroundColor: "rgba(240, 195, 131, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.THIRD,
  },
  tagChipSecondary: {
    backgroundColor: "rgba(241, 170, 155, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.FORTH,
  },
  tagText: {
    color: Colors.DARK,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  tagTextSecondary: {
    color: Colors.FORTH,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  tabButtonSpacer: {
    width: 10,
  },
  card: {
    backgroundColor: Colors.CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.1)",
    minHeight: 520,
    shadowColor: "#1F1A32",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.DARK,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.MUTED,
  },
  amountSection: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1.2,
    borderColor: "rgba(240, 195, 131, 0.6)",
    shadowColor: "#1F1A32",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.SECOND,
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIGHT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
  },
  currencySymbol: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.THIRD,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: Colors.DARK,
    paddingVertical: 10,
  },
  quickAmountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -2,
    marginTop: 12,
  },
  quickAmountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(240, 195, 131, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(240, 195, 131, 0.6)",
    margin: 4,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.DARK,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(72, 66, 109, 0.12)",
    marginVertical: 18,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  categoryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryHint: {
    flex: 1,
    fontSize: 12,
    color: Colors.MUTED,
    fontWeight: "600",
    marginRight: 8,
  },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  selectedBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  selectedBadgeMuted: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(72, 66, 109, 0.1)",
  },
  selectedBadgeTextMuted: {
    color: Colors.SECOND,
    fontSize: 11,
    fontWeight: "700",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 10,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(72, 66, 109, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconWrapSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  categoryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.DARK,
  },
  categoryTextSelected: {
    color: "white",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.MUTED,
    marginTop: 0,
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  optionalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.SECOND,
    backgroundColor: "rgba(72, 66, 109, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
    color: Colors.DARK,
  },
  notesInput: {
    height: 100,
    paddingTop: 16,
  },
  dateButton: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
  },
  dateContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  dateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    color: Colors.DARK,
    fontWeight: "700",
    fontSize: 16,
  },
  dateIcon: {
    color: Colors.MUTED,
    fontSize: 12,
    opacity: 0.6,
  },
  uploadButton: {
    backgroundColor: Colors.LIGHT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(241, 170, 155, 0.7)",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  uploadContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(241, 170, 155, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadText: {
    fontWeight: "700",
    fontSize: 17,
    color: Colors.DARK,
  },
  uploadSubtext: {
    fontSize: 13,
    color: Colors.MUTED,
    marginTop: 2,
  },
  uploadArrow: {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(240, 195, 131, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptContainer: {
    position: "relative",
    marginTop: 16,
  },
  receiptPreview: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
  },
  removeButtonText: {
    fontSize: 18,
    color: Colors.DARK,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: Colors.SECOND,
    borderRadius: 16,
    marginTop: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.25)",
    shadowColor: "#1F1A32",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  saveText: {
    color: "white",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.6,
    marginRight: 8,
  },
});
