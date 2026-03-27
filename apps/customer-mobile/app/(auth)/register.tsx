import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { createUserRequest } from "../../src/utils/requestAuthUtils";

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", middleName: "", lastName: "",
    email: "", password: "", confirmPassword: "",
    recipientName: "", phone: "", address_number: "", building: "",
    subStreet: "", street: "", subdistrict: "", district: "",
    province: "", country: "Thailand", postalCode: "", addressType: "HOME",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const { confirmPassword, ...payload } = form;
      await createUserRequest(payload);
      Alert.alert("Verification Sent", "Please check your email to verify your account.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      Alert.alert("Registration Failed", e?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, k, secure, keyboard }: { label: string; k: string; secure?: boolean; keyboard?: any }) => (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
        placeholder={label}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize="none"
        value={(form as any)[k]}
        onChangeText={(v) => update(k, v)}
      />
    </View>
  );

  return (
    <ScrollView className="bg-white" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-blue-700 mb-6">Create Account</Text>
      <Text className="text-gray-500 font-semibold mb-3">Personal Info</Text>
      <Field label="First Name *" k="firstName" />
      <Field label="Middle Name" k="middleName" />
      <Field label="Last Name *" k="lastName" />
      <Field label="Email *" k="email" keyboard="email-address" />
      <Field label="Password *" k="password" secure />
      <Field label="Confirm Password *" k="confirmPassword" secure />

      <Text className="text-gray-500 font-semibold mb-3 mt-4">Shipping Address (optional)</Text>
      <Field label="Recipient Name" k="recipientName" />
      <Field label="Phone" k="phone" keyboard="phone-pad" />
      <Field label="Address Number" k="address_number" />
      <Field label="Building" k="building" />
      <Field label="Street" k="street" />
      <Field label="Sub-district" k="subdistrict" />
      <Field label="District" k="district" />
      <Field label="Province" k="province" />
      <Field label="Postal Code" k="postalCode" keyboard="numeric" />

      <TouchableOpacity
        className={`rounded-xl py-4 items-center mt-4 mb-8 ${loading ? "bg-blue-300" : "bg-blue-700"}`}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Register</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
