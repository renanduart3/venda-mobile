import { StyleSheet } from 'react-native';

export const createSettingsStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.topbar,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.topbar,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.white,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    scrollContent: {
      paddingBottom: 0,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitleWithMargin: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitleNoMargin: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
    labelWithMargin: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      backgroundColor: colors.surface,
    },
    // Premium section
    premiumContainer: {
      marginBottom: 16,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    premiumStatusText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.success,
    },
    freeStatusText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    premiumBadgeContainer: {
      backgroundColor: colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    premiumBadgeText: {
      color: colors.success,
      fontSize: 11,
      fontFamily: 'Inter-Bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Theme section
    themeOptions: {
      gap: 12,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeOptionActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    themeOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    themeOptionText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    colorButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },
    // Info rows
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    infoValue: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    // Danger section
    dangerSection: {
      marginBottom: 24,
    },
    dangerCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    dangerText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      marginBottom: 12,
      lineHeight: 20,
    },
    dangerTextSmall: {
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      marginTop: 8,
    },
    dangerTextSuccess: {
      color: colors.success,
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      marginTop: 8,
    },
    confirmationInput: {
      borderColor: colors.border,
      borderWidth: 1,
      backgroundColor: colors.background,
    },
    // Premium card overlay
    premiumCard: {
      opacity: 0.6,
    },
    premiumBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 10,
    },
    premiumBadgeOverlayText: {
      color: colors.white,
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
    },
    // Action buttons
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 8,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
    },
    actionButtonTextPrimary: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    actionButtonTextSecondary: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 8,
      backgroundColor: colors.error,
      paddingVertical: 16,
    },
    resetButtonText: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.white,
    },
    // Store settings section
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    editButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    readOnlyText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    // PIX keys
    pixKeyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    pixKeyInputContainer: {
      flex: 1,
    },
    pixKeyReadOnlyContainer: {
      flex: 1,
    },
    pixKeyTypeLabel: {
      fontSize: 11,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.primary,
    },
    pixKeyInput: {
      flex: 1,
    },
    pixKeyText: {
      flex: 1,
    },
    copyButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    removeButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.error + '20',
      borderWidth: 1,
      borderColor: colors.error,
    },
    addPixButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      marginTop: 8,
    },
    addPixButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    // Bottom spacer
    bottomSpacer: {
      backgroundColor: colors.bottombar,
    },
      // Modal styles
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      modalContainer: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 420,
      },
      modalTitle: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: colors.text,
        marginBottom: 12,
      },
      modalText: {
        color: colors.textSecondary,
        marginBottom: 12,
      },
      modalTextBold: {
        fontFamily: 'Inter-Bold',
        color: colors.error,
        marginBottom: 12,
      },
      modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
      },
      modalButtonFlex: {
        flex: 1,
      },
      modalNote: {
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 8,
      },
  });
};
