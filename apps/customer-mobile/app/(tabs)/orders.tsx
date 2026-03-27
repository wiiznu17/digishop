import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { fetchUserOrders } from "../../src/utils/requestOrderUtils";
import { Order } from "../../src/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETE: "bg-green-200 text-green-900",
  CUSTOMER_CANCELED: "bg-red-100 text-red-800",
  MERCHANT_CANCELED: "bg-red-100 text-red-800",
  REFUND_REQUEST: "bg-orange-100 text-orange-800",
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetchUserOrders(user.id) as any;
      setOrders(res?.body || []);
    } catch { setOrders([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const fmt = (minor: number, currency = "THB") => `฿${(minor / 100).toFixed(2)}`;

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  return (
    <FlatList
      className="bg-gray-50"
      contentContainerStyle={{ padding: 16 }}
      data={orders}
      keyExtractor={(o) => String(o.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={
        <View className="items-center justify-center mt-20">
          <Text className="text-5xl mb-4">📦</Text>
          <Text className="text-gray-500 text-lg">No orders yet</Text>
        </View>
      }
      renderItem={({ item }) => {
        const color = STATUS_COLORS[item.status] || "bg-gray-100 text-gray-800";
        const [bg, fg] = color.split(" ");
        return (
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
            onPress={() => router.push({ pathname: "/order/[id]", params: { id: item.checkout?.orderCode || String(item.id) } })}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-500 text-xs">#{item.checkout?.orderCode || item.reference}</Text>
              <View className={`px-2 py-1 rounded-full ${bg}`}>
                <Text className={`text-xs font-semibold ${fg}`}>{item.status.replace(/_/g, " ")}</Text>
              </View>
            </View>
            <Text className="text-gray-900 font-semibold" numberOfLines={1}>
              {item.items?.[0]?.productNameSnapshot || item.reference}
            </Text>
            {item.items && item.items.length > 1 && (
              <Text className="text-gray-400 text-xs">+{item.items.length - 1} more items</Text>
            )}
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
              <Text className="text-blue-700 font-bold">{fmt(item.grandTotalMinor)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}
