import { StyleSheet } from 'react-native';

export const createFinancasStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabSelector: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
      addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
      },
      addButtonText: {
        color: colors.white,
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
      },
  
      // Filtros
      filterContainer: {
        marginBottom: 16,
      },
      filterLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.text,
        marginBottom: 8,
      },
      monthFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 4,
      },
      monthButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
      },
      monthButtonText: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: colors.primary,
      },
      monthText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: colors.text,
        marginHorizontal: 20,
        textTransform: 'capitalize',
      },
      statusFilterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
      },
      statusFilterButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      statusFilterButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      statusFilterText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: colors.textSecondary,
      },
      statusFilterTextActive: {
        color: colors.white,
      },
  
      // Stats Cards
      statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 12,
      },
      statCard: {
        flex: 1,
        minWidth: '45%',
      },
      statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      },
      statIcon: {
        padding: 8,
        borderRadius: 8,
      },
      statValue: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        marginBottom: 4,
      },
      statLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: colors.textSecondary,
      },
  
      // Expenses List
      expenseCard: {
        marginBottom: 12,
      },
      expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      },
      expenseIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      expenseInfo: {
        flex: 1,
      },
      expenseName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: colors.text,
        marginBottom: 4,
      },
      expenseDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        overflow: 'hidden',
      },
      expenseAmount: {
        fontSize: 14,
        fontFamily: 'Inter-Bold',
        color: colors.primary,
      },
      expenseDate: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
        maxWidth: '55%',
        textAlign: 'right',
      },
      expenseTags: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
      },
      tag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: colors.surface,
      },
      tagText: {
        fontSize: 10,
        fontFamily: 'Inter-Medium',
        color: colors.textSecondary,
      },
      overdueTag: {
        backgroundColor: colors.error + '20',
      },
      overdueTagText: {
        color: colors.error,
      },
      recurringTag: {
        backgroundColor: colors.primary + '20',
      },
      recurringTagText: {
        color: colors.primary,
      },
      actions: {
        flexDirection: 'row',
        gap: 8,
      },
      actionButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      paidButton: {
        backgroundColor: colors.success + '20',
        borderColor: colors.success,
      },
  
      // Modal styles
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      modalContent: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 400,
      },
      modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: colors.text,
        marginBottom: 20,
        textAlign: 'center',
      },
      formGroup: {
        marginBottom: 16,
      },
      label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.text,
        marginBottom: 6,
      },
      input: {
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: colors.text,
        backgroundColor: colors.surface,
      },
      checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
      },
      checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      },
      checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      checkboxText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.text,
      },
      modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
      },
      modalButton: {
        flex: 1,
      },
      inputText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
      },
      expenseCustomer: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
        marginTop: 2,
      },
      customerSelector: {
        position: 'relative',
      },
      clearButton: {
        position: 'absolute',
        right: 12,
        top: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
      },
      clearButtonText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: 'bold',
      },
      customerSuggestions: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        maxHeight: 200,
        zIndex: 1000,
        elevation: 5,
      },
      customerSuggestion: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      customerSuggestionName: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.text,
        marginBottom: 2,
      },
      customerSuggestionEmail: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
      },
  
      // Date Input
      dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      dateInput: {
        flex: 1,
      },
      dateButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: colors.primary,
        borderRadius: 8,
      },
      dateButtonText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: colors.white,
      },
  
      // Report styles
      reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      },
      reportTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: colors.text,
      },
      premiumButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
      },
      premiumButtonText: {
        color: colors.white,
        fontSize: 12,
        fontFamily: 'Inter-Medium',
      },
      monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
      },
      selectorLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.text,
      },
      monthInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: colors.text,
        backgroundColor: colors.surface,
        minWidth: 100,
      },
      summaryContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
      },
      summaryCard: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
      },
      summaryLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: colors.textSecondary,
        marginBottom: 4,
      },
      summaryValue: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
      },
      reportFilterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
      },
      filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
      },
      filterButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      filterButtonText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: colors.textSecondary,
      },
      filterButtonTextActive: {
        color: colors.white,
      },
      dataContainer: {
        marginBottom: 20,
      },
      dataTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: colors.text,
        marginBottom: 12,
      },
      transactionCard: {
        marginBottom: 8,
      },
      transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      },
      transactionInfo: {
        flex: 1,
        marginRight: 12,
      },
      transactionDescription: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.text,
        marginBottom: 4,
      },
      transactionDate: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
        marginBottom: 2,
      },
      transactionCustomer: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: colors.primary,
      },
      transactionAmount: {
        alignItems: 'flex-end',
      },
      detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#4A9EFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        marginTop: 4,
      },
      detailsButtonText: {
        color: colors.white,
        fontSize: 12,
        fontFamily: 'Inter-Medium'
      },
      amountText: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        marginBottom: 2,
      },
      statusText: {
        fontSize: 10,
        fontFamily: 'Inter-Medium',
        color: colors.textSecondary,
      },
      // Modal Detalhes Venda
      detailModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        paddingHorizontal: 20,
      },
      detailModalBox: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        maxHeight: '70%',
        borderWidth: 1,
        borderColor: colors.border,
      },
      detailModalTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: colors.text,
        marginBottom: 10,
      },
      detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      detailName: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: colors.text,
      },
      detailSub: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
        marginTop: 2,
      },
      detailTotal: {
        fontSize: 13,
        fontFamily: 'Inter-Bold',
        color: colors.text,
        minWidth: 80,
        textAlign: 'right',
      },
      detailEmpty: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginVertical: 12,
      },
      detailActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
      },
      detailCloseBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
      },
      detailCloseText: {
        color: colors.white,
        fontSize: 14,
        fontFamily: 'Inter-Medium',
      },
      emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        paddingVertical: 20,
      },
      paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 16,
      },
      paginationButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: colors.primary,
      },
      paginationButtonDisabled: {
        backgroundColor: colors.border,
      },
      paginationText: {
        color: colors.white,
        fontSize: 12,
        fontFamily: 'Inter-Medium',
      },
      paginationTextDisabled: {
        color: colors.textSecondary,
      },
      paginationInfo: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: colors.textSecondary,
      }
});
