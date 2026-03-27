import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { resetPassword } from "../../src/utils/requestAuthUtils";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!token) { Alert.alert("Error", "Invalid reset link"); return; }
    if (!password || password !== confirm) { Alert.alert("Error", "Passwords do not match"); return; }
    try {
      setLoading(true);
      await resetPassword(password, token);
      Alert.alert("Success", "Password reset successfully!", [
        { text: "Login", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch {
      Alert.alert("Error", "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-8 bg-white">
      <Text className="text-3xl font-bold text-blue-700 mb-2">Reset Password</Text>
      <Text className="text-gray-500 mb-8">Enter your new password</Text>
      <Text className="text-gray-700 font-medium mb-1">New Password</Text>
      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-4"
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text className="text-gray-700 font-medium mb-1">Confirm Password</Text>
      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-6"
        placeholder="Confirm password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <TouchableOpacity
        className={`rounded-xl py-4 items-center ${loading ? "bg-blue-300" : "bg-blue-700"}`}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Reset Password</Text>}
      </TouchableOpacity>
    </View>
  );
}
