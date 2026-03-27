import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../../src/contexts/AuthContext'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }
    const success = await login(email, password)
    if (success) {
      router.replace('/(tabs)')
    } else {
      Alert.alert('Login Failed', 'Incorrect email or password')
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
      <View className="flex-1 justify-center px-8 py-12">
        <View className="mb-10 items-center">
          <Text className="text-4xl font-bold text-blue-700">DigiShop</Text>
          <Text className="text-gray-500 mt-2 text-base">
            Sign in to your account
          </Text>
        </View>

        <View className="space-y-4 gap-4">
          <View>
            <Text className="text-gray-700 font-medium mb-1">
              Email Address
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-1">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity className="items-end">
              <Text className="text-blue-600 text-sm">Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-2 ${isLoading ? 'bg-blue-300' : 'bg-blue-700'}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-8 items-center">
          <Text className="text-gray-500 mb-3">Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity className="border border-blue-700 rounded-xl py-3 px-8">
              <Text className="text-blue-700 font-bold">Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  )
}
