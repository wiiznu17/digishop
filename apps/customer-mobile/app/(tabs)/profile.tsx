import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { getUserDetail, getAddress, updateUserName, deleteAddress } from "../../src/utils/requestUserUtils";
import { Address } from "../../src/types";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [userDetail, setUserDetail] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [detail, addr] = await Promise.all([
        getUserDetail(user.id),
        getAddress(user.id),
      ]);
      const d = (detail as any)?.data;
      setUserDetail(d);
      setFirstName(d?.firstName || "");
      setLastName(d?.lastName || "");
      setAddresses((addr as any)?.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleSaveName = async () => {
    if (!user?.id) return;
    await updateUserName(user.id, { firstName, lastName });
    setEditingName(false);
    load();
  };

  const handleDeleteAddress = async (id?: number) => {
    if (!id) return;
    Alert.alert("Delete Address", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteAddress(id); load(); } },
    ]);
  };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      {/* Profile Card */}
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mr-4">
            <Text className="text-2xl font-bold text-blue-700">{(firstName[0] || "?").toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            {editingName ? (
              <View className="gap-2">
                <TextInput className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900" value={firstName} onChangeText={setFirstName} placeholder="First name" />
                <TextInput className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900" value={lastName} onChangeText={setLastName} placeholder="Last name" />
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={handleSaveName} className="bg-blue-700 rounded-lg px-4 py-2"><Text className="text-white font-medium">Save</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingName(false)} className="bg-gray-200 rounded-lg px-4 py-2"><Text className="text-gray-700">Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text className="text-gray-900 font-bold text-lg">{firstName} {lastName}</Text>
                <Text className="text-gray-500 text-sm">{user?.email}</Text>
              </>
            )}
          </View>
          {!editingName && (
            <TouchableOpacity onPress={() => setEditingName(true)} className="p-2">
              <Text className="text-blue-600">✏️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Addresses */}
      <Text className="text-gray-700 font-bold text-base mb-3">📍 My Addresses</Text>
      {addresses.map((addr) => (
        <View key={addr.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-gray-900 font-semibold">{addr.recipientName}</Text>
                {addr.isDefault && <View className="bg-blue-100 px-2 py-0.5 rounded-full"><Text className="text-blue-700 text-xs font-medium">Default</Text></View>}
              </View>
              <Text className="text-gray-600 text-sm">{addr.phone}</Text>
              <Text className="text-gray-500 text-sm mt-1">{addr.address_number} {addr.street}, {addr.subdistrict}, {addr.district}, {addr.province} {addr.postalCode}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)} className="p-1 ml-2">
              <Text className="text-red-400">🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity
        className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center mt-4 mb-8"
        onPress={() => Alert.alert("Sign Out", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: logout },
        ])}
      >
        <Text className="text-red-600 font-bold text-base">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
