'use client'
import React from 'react'
import { Laptop, Shirt, Home, Coffee, BookOpen, Car, Headphones, Camera, Gift, Smartphone } from 'lucide-react'

const categories = [
  { id: 1, name: 'Electronics', icon: Laptop },
  { id: 2, name: 'Fashion', icon: Shirt },
  { id: 3, name: 'Home & Living', icon: Home },
  { id: 4, name: 'Groceries', icon: Coffee },
  { id: 5, name: 'Books', icon: BookOpen },
  { id: 6, name: 'Automotive', icon: Car },
  { id: 7, name: 'Audio', icon: Headphones },
  { id: 8, name: 'Camera', icon: Camera },
  { id: 9, name: 'Gifts', icon: Gift },
  { id: 10, name: 'Phones', icon: Smartphone },
]

export const CategoryGrid = () => {
  return (
    <div className="max-w-6xl mx-auto mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg text-gray-700 font-semibold mb-6">Categories</h3>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-y-6 gap-x-2">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              className="flex flex-col items-center group cursor-pointer hover:-translate-y-1 transition-transform"
            >
              <div className="w-14 h-14 bg-blue-pastel-50 rounded-2xl flex items-center justify-center text-blue-pastel-500 group-hover:bg-blue-pastel-100 group-hover:shadow-sm transition-all mb-2">
                <Icon size={24} />
              </div>
              <span className="text-xs text-gray-600 text-center px-1 break-words line-clamp-2">
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
