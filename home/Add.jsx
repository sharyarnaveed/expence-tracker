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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../lib/SupabaseClient";
import { Picker } from "@react-native-picker/picker";

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
    console.log(result);

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
        const { data } = await supabase.auth.getUser();
        const fileName = await uploadimage(data.user.id); // return only filename

        const { data: DataSubmit, error: Datasubmiterror } = await supabase
          .from("userhistory")
          .insert({
            amount,
            userid: data.user.id, // make sure this matches
            categoryname: category,
            date,
            uploadimg: fileName, // ⬅️ store only filename
            notes,
          })
          .single();
        if (Datasubmiterror) {
          Alert.alert("Error in Adding Expense!");
        } else {
          Alert.alert("Expense added!");
        }
      } else {
        const { data } = await supabase.auth.getUser();

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
        console.log(data);
        Alert.alert("Expense added!");
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
        console.log(newamount);
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
        }
      }
    } catch (error) {
      console.log("error in submitting income", error);
    }
  };

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
                <Text
                  style={[
                    styles.tabIcon,
                    tab === "expense" && styles.tabIconActive,
                  ]}
                >
                  💸
                </Text>
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

            <TouchableOpacity
              onPress={() => SetTabs("amount")}
              activeOpacity={0.85}
              style={[
                styles.tabButton,
                tab === "amount" && styles.tabButtonActive,
              ]}
            >
              <View style={styles.tabIconBadge}>
                <Text
                  style={[
                    styles.tabIcon,
                    tab === "amount" && styles.tabIconActive,
                  ]}
                >
                  ➕
                </Text>
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
              </View>

              <View style={styles.divider} />

              <Text style={styles.label}>📁 Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(value) => Setcategory(value)}
                  style={styles.picker}
                  dropdownIconColor={Colors.DARK}
                >
                  <Picker.Item label="-- Select Category --" value={null} />
                  {thecat.map((item) => (
                    <Picker.Item
                      key={item.id}
                      label={item.name}
                      value={item.id}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>📅 Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                activeOpacity={0.7}
              >
                <View style={styles.dateContent}>
                  <Text style={styles.dateText}>{date.toDateString()}</Text>
                  <Text style={styles.dateIcon}>▼</Text>
                </View>
              </TouchableOpacity>

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

              <Text style={styles.label}>📝 Notes</Text>
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

              <Text style={styles.label}>📎 Upload Receipt (Optional)</Text>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.uploadButton}
                activeOpacity={0.8}
              >
                <View style={styles.uploadContent}>
                  <View style={styles.uploadIconCircle}>
                    <Text style={styles.uploadIcon}>📷</Text>
                  </View>
                  <View>
                    <Text style={styles.uploadText}>Choose Image</Text>
                    <Text style={styles.uploadSubtext}>
                      JPG, PNG up to 10MB
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

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
                  <Text style={styles.saveIcon}>✓</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
          {tab === "amount" && (
            <View style={[styles.card, { marginBottom: bottomSpacing }]}>
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
                  <Text style={styles.saveIcon}>➜</Text>
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
  pickerContainer: {
    backgroundColor: Colors.LIGHT,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    overflow: "hidden",
  },
  tabSwitch: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 8,
    backgroundColor: "rgba(72, 66, 109, 0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.14)",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.CARD,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButtonActive: {
    backgroundColor: Colors.THIRD,
    borderColor: Colors.THIRD,
    shadowOpacity: 0.16,
    elevation: 4,
  },
  tabIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(72, 66, 109, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconActive: {
    color: Colors.DARK,
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
  picker: {
    backgroundColor: Colors.LIGHT,
    color: Colors.DARK,
    fontSize: 16,
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
    opacity: 0.32,
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
    opacity: 0.3,
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
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subHeader: {
    color: Colors.THIRD,
    fontSize: 16,
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
  card: {
    backgroundColor: Colors.CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    minHeight: 600,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.08)",
  },
  amountSection: {
    backgroundColor: "rgba(241, 170, 155, 0.14)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.THIRD,
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
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: Colors.THIRD,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.THIRD,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "700",
    color: Colors.DARK,
    padding: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(72, 66, 109, 0.12)",
    marginVertical: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.SECOND,
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: Colors.LIGHT,
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    color: Colors.DARK,
  },
  notesInput: {
    height: 100,
    paddingTop: 16,
  },
  dateButton: {
    backgroundColor: Colors.THIRD,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.THIRD,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dateContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  dateText: {
    color: Colors.DARK,
    fontWeight: "700",
    fontSize: 17,
  },
  dateIcon: {
    color: Colors.DARK,
    fontSize: 12,
    opacity: 0.6,
  },
  uploadButton: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.FORTH,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  uploadContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  uploadIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.FORTH,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
  receiptContainer: {
    position: "relative",
    marginTop: 16,
  },
  receiptPreview: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.THIRD,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  removeButtonText: {
    fontSize: 18,
    color: Colors.DARK,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: Colors.SECOND,
    borderRadius: 18,
    marginTop: 28,
    overflow: "hidden",
    shadowColor: Colors.SECOND,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  saveText: {
    color: "white",
    fontWeight: "900",
    fontSize: 19,
    letterSpacing: 1.2,
    marginRight: 8,
  },
  saveIcon: {
    color: Colors.THIRD,
    fontSize: 22,
    fontWeight: "900",
  },
});
