import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

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

const TRANSACTIONS = [
  {
    id: "txn-1",
    title: "Salary",
    category: "Other",
    date: "Feb 18, 2026",
    amount: "+$3,200",
    type: "income",
    icon: "briefcase",
  },
  {
    id: "txn-2",
    title: "Groceries",
    category: "Food & Dining",
    date: "Feb 18, 2026",
    amount: "-$54.20",
    type: "expense",
    icon: "shopping-cart",
    receiptUri:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "txn-3",
    title: "Netflix",
    category: "Subscriptions",
    date: "Feb 17, 2026",
    amount: "-$14.99",
    type: "expense",
    icon: "monitor",
  },
  {
    id: "txn-4",
    title: "Freelance Project",
    category: "Other",
    date: "Feb 16, 2026",
    amount: "+$780",
    type: "income",
    icon: "code",
  },
  {
    id: "txn-5",
    title: "Ride Share",
    category: "Transportation",
    date: "Feb 15, 2026",
    amount: "-$21.75",
    type: "expense",
    icon: "navigation",
    receiptUri:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "txn-6",
    title: "Coffee",
    category: "Food & Dining",
    date: "Feb 15, 2026",
    amount: "-$6.50",
    type: "expense",
    icon: "coffee",
  },
];

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const bottomSpace = (insets?.bottom || 16) + 120;
  const [activeFilter, setActiveFilter] = useState("Category");
  const [activeSort, setActiveSort] = useState("Latest");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState(null);

  const groupedTransactions = useMemo(() => {
    return TRANSACTIONS.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    }, {});
  }, []);

  const openEditModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditVisible(true);
  };

  const closeEditModal = () => {
    setIsEditVisible(false);
    setSelectedTransaction(null);
  };

  const openDetailModal = (transaction) => {
    setDetailTransaction(transaction);
    setIsDetailVisible(true);
  };

  const closeDetailModal = () => {
    setIsDetailVisible(false);
    setDetailTransaction(null);
  };

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
                Track and edit your past entries
              </Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="sliders" size={18} color={Colors.DARK} />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Total Entries</Text>
              <Text style={styles.summaryValue}>128</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>This Month</Text>
              <Text style={styles.summaryValue}>$1,948</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, styles.incomeText]}>$3,980</Text>
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
            <Text style={styles.listTitle}>All Transactions</Text>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>Export</Text>
            </TouchableOpacity>
          </View>

          {Object.keys(groupedTransactions).map((date) => (
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
                      <Text style={styles.transactionMeta}>{item.category}</Text>
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
          ))}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isEditVisible}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity style={styles.modalClose} onPress={closeEditModal}>
                <Feather name="x" size={16} color={Colors.SECOND} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={selectedTransaction?.title || ""}
                editable={false}
                placeholder="Transaction title"
                placeholderTextColor={Colors.MUTED}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Category</Text>
              <TextInput
                style={styles.modalInput}
                value={selectedTransaction?.category || ""}
                editable={false}
                placeholder="Category"
                placeholderTextColor={Colors.MUTED}
              />
            </View>

            <View style={styles.modalRow}>
              <View style={[styles.modalField, styles.modalHalf]}>
                <Text style={styles.modalLabel}>Amount</Text>
                <TextInput
                  style={styles.modalInput}
                  value={selectedTransaction?.amount || ""}
                  editable={false}
                  placeholder="$0.00"
                  placeholderTextColor={Colors.MUTED}
                />
              </View>
              <View style={[styles.modalField, styles.modalHalf]}>
                <Text style={styles.modalLabel}>Date</Text>
                <TextInput
                  style={styles.modalInput}
                  value={selectedTransaction?.date || ""}
                  editable={false}
                  placeholder="Date"
                  placeholderTextColor={Colors.MUTED}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeEditModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={closeEditModal}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
