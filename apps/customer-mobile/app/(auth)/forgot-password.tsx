import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native'
import { sendResetPassword } from '../../src/utils/requestAuthUtils'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email')
      return
    }
    try {
      setLoading(true)
      await sendResetPassword(email)
      setSent(true)
    } catch {
      Alert.alert('Error', 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 justify-center px-8 bg-white">
      <Text className="text-3xl font-bold text-blue-700 mb-2">
        Forgot Password
      </Text>
      <Text className="text-gray-500 mb-8">
        Enter your email to receive a reset link
      </Text>
      {sent ? (
        <View className="bg-green-50 border border-green-300 rounded-xl p-4">
          <Text className="text-green-700 font-medium">
            ✅ Reset email sent! Check your inbox.
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-gray-700 font-medium mb-1">Email Address</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 mb-4"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${loading ? 'bg-blue-300' : 'bg-blue-700'}`}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">Send Reset Email</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}
