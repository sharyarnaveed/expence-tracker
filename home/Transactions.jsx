import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/SupabaseClient";

const Colors = {
  DARK: "#312C51",
  SECOND: "#48426D",
  THIRD: "#F0C383",
  FORTH: "#F1AA9B",
  LIGHT: "#F8F5EF",
  CARD: "#FFF9F3",
  MUTED: "#A29BB5",
};

const FILTERS = ["Category", "Date", "Amount"];
const SORT_OPTIONS = ["Latest", "Highest", "Lowest", "A-Z"];
const DATE_RANGES = [
  { id: "all", label: "All" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
];
const AMOUNT_RANGES = [
  { id: "all", label: "All" },
  { id: "under50", label: "Under $50" },
  { id: "50to500", label: "$50 – $500" },
  { id: "over500", label: "Over $500" },
];
// Must match Add.jsx thecat (id + name) so category filter and display are correct. DB stores categoryname = id.
const CATEGORIES = [
  { id: "food", name: "Food & Dining", color: "#FF6B6B" },
  { id: "groceries", name: "Groceries", color: "#4ECDC4" },
  { id: "transport", name: "Transportation", color: "#1A535C" },
  { id: "rent", name: "Rent", color: "#5F27CD" },
  { id: "utilities", name: "Utilities", color: "#F368E0" },
  { id: "shopping", name: "Shopping", color: "#10AC84" },
  { id: "health", name: "Health & Medical", color: "#EE5253" },
  { id: "education", name: "Education", color: "#54A0FF" },
  { id: "entertainment", name: "Entertainment", color: "#FECB2F" },
  { id: "subscriptions", name: "Subscriptions", color: "#8395A7" },
  { id: "travel", name: "Travel", color: "#00D2D3" },
  { id: "personal", name: "Personal Care", color: "#576574" },
  { id: "gifts", name: "Gifts & Donations", color: "#FF9F43" },
  { id: "insurance", name: "Insurance", color: "#222F3E" },
  { id: "other", name: "Other", color: "#C8D6E5" },
];

// Icons by category id (same as Add.jsx thecat icons). DB stores categoryname = id.
const CATEGORY_ICONS_BY_ID = {
  food: "utensils",
  groceries: "shopping-cart",
  transport: "bus",
  rent: "home",
  utilities: "zap",
  shopping: "shopping-bag",
  health: "heart",
  education: "book",
  entertainment: "film",
  subscriptions: "repeat",
  travel: "map",
  personal: "user",
  gifts: "gift",
  insurance: "shield",
  other: "more-horizontal",
};

function formatDateKey(createdAt) {
  const d = new Date(createdAt);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const BUCKET_ADDIMAGES = "addimages";
const SIGNED_URL_EXPIRY_SEC = 3600; // 1 hour

function mapHistoryToTransaction(row) {
  const { id, amount, categoryname, date, notes, created_at } = row;
  const receiptUri =
    row.receiptUri ??
    (row.uploadimg
      ? supabase.storage.from(BUCKET_ADDIMAGES).getPublicUrl(row.uploadimg).data.publicUrl
      : null);
  const amountNum = Number(amount);
  // categoryname from DB is the category id (e.g. "food") as set in Add.jsx
  const categoryId = categoryname || "other";
  return {
    id: `txn-${id}`,
    title: notes || CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId,
    category: categoryId,
    date,
    amount: `-$${amountNum.toFixed(2)}`,
    amountNum: -amountNum,
    type: "expense",
    icon: CATEGORY_ICONS_BY_ID[categoryId] || "dollar-sign",
    receiptUri,
    sortAt: new Date(created_at).getTime(),
  };
}

async function getReceiptSignedUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET_ADDIMAGES)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SEC);
  return error ? null : data?.signedUrl ?? null;
}

function mapAddAmountToTransaction(row) {
  const { id, amount, created_at } = row;
  const date = formatDateKey(created_at);
  const amountNum = Number(amount);
  return {
    id: `add-${id}`,
    title: "Amount added",
    category: "Income",
    date,
    amount: `+$${amountNum.toFixed(2)}`,
    amountNum,
    type: "income",
    icon: "plus-circle",
    receiptUri: null,
    sortAt: new Date(created_at).getTime(),
  };
}

function formatCurrency(value) {
  return "$" + Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const bottomSpace = (insets?.bottom || 16) + 120;
  const [activeFilter, setActiveFilter] = useState("Category");
  const [activeSort, setActiveSort] = useState("Latest");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDateRange, setActiveDateRange] = useState("all");
  const [activeAmountRange, setActiveAmountRange] = useState("all");
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredAndSortedTransactions = useMemo(() => {
    let list = [...transactions];

    if (activeFilter === "Category" && activeCategory !== "all") {
      list = list.filter((item) => item.category === activeCategory);
    }

    if (activeFilter === "Date" && activeDateRange !== "all") {
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      list = list.filter((item) => {
        const t = item.sortAt || 0;
        if (activeDateRange === "week") return t >= weekAgo;
        if (activeDateRange === "month") return t >= monthStart;
        if (activeDateRange === "year") return t >= yearStart;
        return true;
      });
    }

    if (activeFilter === "Amount" && activeAmountRange !== "all") {
      list = list.filter((item) => {
        const abs = Math.abs(item.amountNum || 0);
        if (activeAmountRange === "under50") return abs < 50;
        if (activeAmountRange === "50to500") return abs >= 50 && abs <= 500;
        if (activeAmountRange === "over500") return abs > 500;
        return true;
      });
    }

    if (activeSort === "Latest") {
      list.sort((a, b) => (b.sortAt || 0) - (a.sortAt || 0));
    } else if (activeSort === "Highest") {
      list.sort((a, b) => (b.amountNum ?? 0) - (a.amountNum ?? 0));
    } else if (activeSort === "Lowest") {
      list.sort((a, b) => (a.amountNum ?? 0) - (b.amountNum ?? 0));
    } else if (activeSort === "A-Z") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [transactions, activeFilter, activeCategory, activeDateRange, activeAmountRange, activeSort]);

  const groupedTransactions = useMemo(() => {
    return filteredAndSortedTransactions.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [filteredAndSortedTransactions]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    let thisMonthSpent = 0;
    let totalIncome = 0;
    transactions.forEach((item) => {
      const inMonth = item.sortAt >= monthStart && item.sortAt <= monthEnd;
      if (item.type === "expense" && inMonth) {
        thisMonthSpent += Math.abs(item.amountNum || 0);
      }
      if (item.type === "income") {
        totalIncome += item.amountNum || 0;
      }
    });
    return {
      totalEntries: transactions.length,
      thisMonthSpent,
      totalIncome,
    };
  }, [transactions]);

  const openEditModal = (transaction) => {
    setSelectedTransaction(transaction);
    setEditTitle(transaction?.title ?? "");
    setEditCategory(transaction?.category ?? "");
    setEditAmount(transaction?.amountNum != null ? String(Math.abs(Number(transaction.amountNum))) : "");
    setEditDate(transaction?.date ?? "");
    setIsEditVisible(true);
  };

  const closeEditModal = () => {
    Keyboard.dismiss();
    setIsEditVisible(false);
    setSelectedTransaction(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedTransaction) return;
    const rawId = selectedTransaction.id.startsWith("txn-")
      ? selectedTransaction.id.replace("txn-", "")
      : selectedTransaction.id.startsWith("add-")
        ? selectedTransaction.id.replace("add-", "")
        : null;
    if (!rawId) return;
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "You must be signed in to save.");
        return;
      }
      const userId = user.id;

      if (selectedTransaction.type === "expense") {
        const oldAmount = Math.abs(selectedTransaction.amountNum || 0);
        const categoryIdToSave = CATEGORIES.find((c) => c.id === editCategory)
          ? editCategory
          : (CATEGORIES.find((c) => c.name === editCategory)?.id ?? editCategory);
        const { error: updateHistoryError } = await supabase
          .from("userhistory")
          .update({
            amount: newAmount,
            notes: editTitle,
            categoryname: categoryIdToSave,
            date: editDate,
          })
          .eq("id", rawId)
          .eq("userid", userId);
        if (updateHistoryError) {
          Alert.alert("Error", "Could not update expense. " + (updateHistoryError.message || ""));
          return;
        }
        const { data: amountRow, error: amountError } = await supabase
          .from("useramount")
          .select("addedamount")
          .eq("userid", userId)
          .single();
        if (amountError || !amountRow) {
          Alert.alert("Error", "Could not read your balance.");
          return;
        }
        const newBalance = amountRow.addedamount + oldAmount - newAmount;
        const { error: updateAmountError } = await supabase
          .from("useramount")
          .update({ addedamount: newBalance })
          .eq("userid", userId);
        if (updateAmountError) {
          Alert.alert("Error", "Expense updated but balance could not be updated.");
        } else {
          Alert.alert("Saved", "Expense updated. Your total amount has been adjusted.");
        }
      } else {
        const oldAmount = selectedTransaction.amountNum || 0;
        const { error: updateHistoryError } = await supabase
          .from("addmounthistory")
          .update({ amount: newAmount })
          .eq("id", rawId)
          .eq("userid", userId);
        if (updateHistoryError) {
          Alert.alert("Error", "Could not update income. " + (updateHistoryError.message || ""));
          return;
        }
        const { data: amountRow, error: amountError } = await supabase
          .from("useramount")
          .select("addedamount")
          .eq("userid", userId)
          .single();
        if (amountError || !amountRow) {
          Alert.alert("Error", "Could not read your balance.");
          return;
        }
        const newBalance = amountRow.addedamount - oldAmount + newAmount;
        const { error: updateAmountError } = await supabase
          .from("useramount")
          .update({ addedamount: newBalance })
          .eq("userid", userId);
        if (updateAmountError) {
          Alert.alert("Error", "Income updated but balance could not be updated.");
        } else {
          Alert.alert("Saved", "Income updated. Your total amount has been adjusted.");
        }
      }
      closeEditModal();
      getData();
    } catch (err) {
      console.log("handleSaveEdit error", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const openDetailModal = (transaction) => {
    setDetailTransaction(transaction);
    setIsDetailVisible(true);
  };

  const closeDetailModal = () => {
    setIsDetailVisible(false);
    setDetailTransaction(null);
  };


  const getData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setTransactions([]);
        return;
      }
      const userId = user.id;
      const [historyRes, addAmountRes] = await Promise.all([
        supabase.rpc("get_user_history", { p_userid: userId }),
        supabase.rpc("get_add_amount_history", { p_userid: userId }),
      ]);
      if (historyRes.error) {
        console.log("get_user_history error", historyRes.error);
      }
      if (addAmountRes.error) {
        console.log("get_add_amount_history error", addAmountRes.error);
      }
      const historyRows = historyRes.data || [];
      const historyWithReceiptUrls = await Promise.all(
        historyRows.map(async (row) => {
          const receiptUri = row.uploadimg
            ? await getReceiptSignedUrl(row.uploadimg)
            : null;
          return { ...row, receiptUri: receiptUri ?? row.receiptUri };
        })
      );
      const expenses = historyWithReceiptUrls.map(mapHistoryToTransaction);
      const income = (addAmountRes.data || []).map(mapAddAmountToTransaction);
      const combined = [...expenses, ...income].sort(
        (a, b) => (b.sortAt || 0) - (a.sortAt || 0)
      );
      setTransactions(combined);
    } catch (err) {
      console.log("getData error", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };


useFocusEffect(
  React.useCallback(() => {
    getData();
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
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>Transactions</Text>
              <Text style={styles.pageSubtitle}>
                Your transaction history and added amounts
              </Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="sliders" size={18} color={Colors.DARK} />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Total Entries</Text>
              <Text style={styles.summaryValue}>{stats.totalEntries}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>This Month</Text>
              <Text style={styles.summaryValue}>{formatCurrency(stats.thisMonthSpent)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, styles.incomeText]}>{formatCurrency(stats.totalIncome)}</Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Feather name="search" size={18} color={Colors.MUTED} />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={Colors.MUTED}
              style={styles.searchInput}
              cursorColor={Colors.SECOND}
            />
          </View>

          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Filters</Text>
            <Text style={styles.blockHint}>Category, date, amount</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          >
            {FILTERS.map((filter) => {
              const selected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.chip,
                    selected ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {activeFilter === "Category" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  activeCategory === "all"
                    ? styles.categoryChipActive
                    : styles.categoryChipInactive,
                ]}
                onPress={() => setActiveCategory("all")}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    activeCategory === "all"
                      ? styles.categoryChipTextActive
                      : styles.categoryChipTextInactive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((item) => {
                const selected = activeCategory === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.categoryChip,
                      selected
                        ? { backgroundColor: item.color, borderColor: item.color }
                        : styles.categoryChipInactive,
                    ]}
                    onPress={() => setActiveCategory(item.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selected
                          ? styles.categoryChipTextActive
                          : styles.categoryChipTextInactive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {activeFilter === "Date" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
            >
              {DATE_RANGES.map((item) => {
                const selected = activeDateRange === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.categoryChip,
                      selected ? styles.categoryChipActive : styles.categoryChipInactive,
                    ]}
                    onPress={() => setActiveDateRange(item.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selected
                          ? styles.categoryChipTextActive
                          : styles.categoryChipTextInactive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {activeFilter === "Amount" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
            >
              {AMOUNT_RANGES.map((item) => {
                const selected = activeAmountRange === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.categoryChip,
                      selected ? styles.categoryChipActive : styles.categoryChipInactive,
                    ]}
                    onPress={() => setActiveAmountRange(item.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selected
                          ? styles.categoryChipTextActive
                          : styles.categoryChipTextInactive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Sorting</Text>
            <Text style={styles.blockHint}>Choose order</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          >
            {SORT_OPTIONS.map((option) => {
              const selected = activeSort === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    selected ? styles.sortChipActive : styles.chipInactive,
                  ]}
                  onPress={() => setActiveSort(option)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected ? styles.sortChipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Your transactions</Text>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>Export</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.SECOND} />
              <Text style={styles.loadingText}>Loading your transactions…</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.loadingWrap}>
              <Feather name="inbox" size={48} color={Colors.MUTED} />
              <Text style={styles.loadingText}>No transactions yet</Text>
              <Text style={styles.emptyHint}>Expenses and added amounts will appear here</Text>
            </View>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <View style={styles.loadingWrap}>
              <Feather name="filter" size={48} color={Colors.MUTED} />
              <Text style={styles.loadingText}>No transactions match your filters</Text>
              <Text style={styles.emptyHint}>Try changing the filter or sort</Text>
            </View>
          ) : (
          Object.keys(groupedTransactions).map((date) => (
            <View key={date} style={styles.groupCard}>
              <Text style={styles.groupDate}>{date}</Text>
              {groupedTransactions[date].map((item) => (
                <View key={item.id} style={styles.transactionRow}>
                  <View style={styles.leftContent}>
                    <View
                      style={[
                        styles.iconWrap,
                        item.type === "income"
                          ? styles.iconIncome
                          : styles.iconExpense,
                      ]}
                    >
                      <Feather
                        name={item.icon}
                        size={15}
                        color={item.type === "income" ? "#1F9E6D" : Colors.SECOND}
                      />
                    </View>
                    <View>
                      <Text style={styles.transactionTitle}>{item.title}</Text>
                      <Text style={styles.transactionMeta}>{CATEGORIES.find((c) => c.id === item.category)?.name ?? item.category}</Text>
                    </View>
                  </View>

                  <View style={styles.rightContent}>
                    <Text
                      style={[
                        styles.amountText,
                        item.type === "income"
                          ? styles.incomeText
                          : styles.expenseText,
                      ]}
                    >
                      {item.amount}
                    </Text>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => openEditModal(item)}
                      >
                        <Feather name="edit-2" size={13} color={Colors.SECOND} />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      {item.receiptUri ? (
                        <TouchableOpacity
                          style={styles.detailBtn}
                          onPress={() => openDetailModal(item)}
                        >
                          <Feather name="image" size={13} color={Colors.DARK} />
                          <Text style={styles.detailBtnText}>Details</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isEditVisible}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity style={styles.modalClose} onPress={closeEditModal}>
                <Feather name="x" size={16} color={Colors.SECOND} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editModalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Title</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Transaction title"
                  placeholderTextColor={Colors.MUTED}
                  editable={selectedTransaction?.type !== "income"}
                />
              </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Category</Text>
              <TextInput
                style={styles.modalInput}
                value={CATEGORIES.find((c) => c.id === editCategory)?.name ?? editCategory}
                onChangeText={(text) => {
                  const byName = CATEGORIES.find((c) => c.name === text);
                  setEditCategory(byName ? byName.id : text);
                }}
                placeholder="Category"
                placeholderTextColor={Colors.MUTED}
                editable={selectedTransaction?.type !== "income"}
              />
            </View>

              <View style={styles.modalRow}>
                <View style={[styles.modalField, styles.modalHalf]}>
                  <Text style={styles.modalLabel}>Amount</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editAmount}
                    onChangeText={setEditAmount}
                    placeholder="0.00"
                    placeholderTextColor={Colors.MUTED}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.modalField, styles.modalHalf]}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editDate}
                    onChangeText={setEditDate}
                    placeholder="Date"
                    placeholderTextColor={Colors.MUTED}
                    editable={selectedTransaction?.type !== "income"}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeEditModal} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isDetailVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Details</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={closeDetailModal}
              >
                <Feather name="x" size={16} color={Colors.SECOND} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailInfo}>
              <Text style={styles.detailTitle}>
                {detailTransaction?.title || "Expense"}
              </Text>
              <Text style={styles.detailMeta}>
                {detailTransaction?.category || "Category"} •{" "}
                {detailTransaction?.date || "Date"}
              </Text>
              <Text style={styles.detailAmount}>
                {detailTransaction?.amount || "$0.00"}
              </Text>
            </View>

            {detailTransaction?.receiptUri ? (
              <View style={styles.receiptFrame}>
                <Image
                  source={{ uri: detailTransaction.receiptUri }}
                  style={styles.receiptImage}
                  resizeMode="contain"
                />
                <View style={styles.receiptOverlay}>
                  <Text style={styles.receiptLabel}>Receipt Image</Text>
                </View>
              </View>
            ) : (
              <View style={styles.receiptPlaceholder}>
                <Feather name="image" size={20} color={Colors.MUTED} />
                <Text style={styles.receiptPlaceholderText}>
                  No receipt attached.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.detailCloseBtn}
              onPress={closeDetailModal}
            >
              <Text style={styles.detailCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.LIGHT,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: Colors.DARK,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  heroBubble: {
    position: "absolute",
    borderRadius: 200,
    opacity: 0.25,
  },
  heroBubbleOne: {
    width: 210,
    height: 210,
    top: -80,
    right: -40,
    backgroundColor: Colors.THIRD,
  },
  heroBubbleTwo: {
    width: 160,
    height: 160,
    bottom: -50,
    left: -30,
    backgroundColor: Colors.FORTH,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: Colors.THIRD,
  },
  pageSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.THIRD,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.16)",
  },
  summaryCard: {
    backgroundColor: Colors.CARD,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.08)",
  },
  summaryColumn: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.MUTED,
    fontWeight: "600",
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: Colors.DARK,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(72, 66, 109, 0.12)",
  },
  incomeText: {
    color: "#15A06F",
  },
  expenseText: {
    color: Colors.FORTH,
  },
  searchBox: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.1)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.DARK,
    fontWeight: "600",
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  blockTitle: {
    color: Colors.SECOND,
    fontSize: 16,
    fontWeight: "800",
  },
  blockHint: {
    color: Colors.MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  horizontalRow: {
    paddingBottom: 12,
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.2,
  },
  chipActive: {
    backgroundColor: Colors.THIRD,
    borderColor: Colors.THIRD,
  },
  sortChipActive: {
    backgroundColor: Colors.SECOND,
    borderColor: Colors.SECOND,
  },
  chipInactive: {
    backgroundColor: Colors.CARD,
    borderColor: "rgba(72, 66, 109, 0.18)",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: Colors.DARK,
  },
  sortChipTextActive: {
    color: "white",
  },
  chipTextInactive: {
    color: Colors.SECOND,
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: Colors.THIRD,
    borderColor: Colors.THIRD,
  },
  categoryChipInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(72, 66, 109, 0.16)",
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: Colors.DARK,
  },
  categoryChipTextInactive: {
    color: Colors.SECOND,
  },
  listHeader: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.DARK,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.MUTED,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.MUTED,
    marginTop: 4,
  },
  viewAllBtn: {
    backgroundColor: "rgba(241, 170, 155, 0.25)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(241, 170, 155, 0.7)",
  },
  viewAllText: {
    color: Colors.DARK,
    fontSize: 12,
    fontWeight: "700",
  },
  groupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.1)",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    marginBottom: 12,
  },
  groupDate: {
    color: Colors.SECOND,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(72, 66, 109, 0.08)",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconIncome: {
    backgroundColor: "rgba(21, 160, 111, 0.15)",
  },
  iconExpense: {
    backgroundColor: "rgba(72, 66, 109, 0.1)",
  },
  transactionTitle: {
    color: Colors.DARK,
    fontSize: 14,
    fontWeight: "700",
  },
  transactionMeta: {
    marginTop: 2,
    color: Colors.MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  rightContent: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.14)",
    backgroundColor: Colors.CARD,
  },
  editBtnText: {
    color: Colors.SECOND,
    fontSize: 11,
    fontWeight: "700",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(241, 170, 155, 0.6)",
    backgroundColor: "rgba(241, 170, 155, 0.2)",
  },
  detailBtnText: {
    color: Colors.DARK,
    fontSize: 11,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(27, 24, 45, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: Colors.CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.15)",
    padding: 16,
  },
  editModalScroll: {
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.DARK,
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(72, 66, 109, 0.1)",
  },
  modalField: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.SECOND,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.DARK,
    fontSize: 13,
    fontWeight: "600",
  },
  modalRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalHalf: {
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.2)",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelBtnText: {
    color: Colors.SECOND,
    fontSize: 13,
    fontWeight: "800",
  },
  saveBtn: {
    flex: 1.1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.THIRD,
    borderWidth: 1,
    borderColor: Colors.THIRD,
  },
  saveBtnText: {
    color: Colors.DARK,
    fontSize: 13,
    fontWeight: "900",
  },
  detailCloseBtn: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.FORTH,
    borderWidth: 1,
    borderColor: "rgba(49, 44, 81, 0.1)",
  },
  detailCloseText: {
    color: "#1E1A2E",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  detailCard: {
    backgroundColor: Colors.CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.15)",
    padding: 16,
  },
  detailInfo: {
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.DARK,
  },
  detailMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.MUTED,
  },
  detailAmount: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "800",
    color: Colors.SECOND,
  },
  receiptFrame: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
    backgroundColor: "#fff",
    marginBottom: 14,
  },
  receiptImage: {
    width: "100%",
    height: 210,
  },
  receiptOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(49, 44, 81, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  receiptLabel: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  receiptPlaceholder: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(72, 66, 109, 0.12)",
    backgroundColor: "rgba(241, 170, 155, 0.15)",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  receiptPlaceholderText: {
    color: Colors.SECOND,
    fontSize: 12,
    fontWeight: "700",
  },
});
