import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {useTheme} from '../contexts';

interface SelectionModalProps {
  visible: boolean;
  title: string;
  data: any[];
  selectedValue?: any;
  onSelect: (item: any) => void;
  onClose: () => void;
  displayKey?: string;
  valueKey?: string;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  data,
  selectedValue,
  onSelect,
  onClose,
  displayKey = 'name',
  valueKey = 'id',
}) => {
  const {colors, theme} = useTheme();
  const styles = createStyles(colors, theme);

  const handleSelect = (item: any) => {
    onSelect(item);
    onClose();
  };

  const renderItem = ({item}: {item: any}) => {
    let isSelected = false;

    if (selectedValue) {
      if (typeof item === 'string' && typeof selectedValue === 'string') {
        isSelected = item === selectedValue;
      } else if (
        typeof item === 'object' &&
        typeof selectedValue === 'object'
      ) {
        isSelected = item[valueKey] === selectedValue[valueKey];
      }
    }

    const displayText = typeof item === 'string' ? item : item[displayKey];

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleSelect(item)}>
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {displayText}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            typeof item === 'string'
              ? item
              : item[valueKey]?.toString() || index.toString()
          }
          style={styles.list}
          showsVerticalScrollIndicator={true}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.inputBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    list: {
      flex: 1,
    },
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
    },
    selectedItem: {
      backgroundColor: colors.accent + '15', // 15% opacity
    },
    itemText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    selectedItemText: {
      color: colors.accent,
      fontWeight: '500',
    },
    checkmark: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: 'bold',
      marginLeft: 12,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 20,
    },
  });

export default SelectionModal;
