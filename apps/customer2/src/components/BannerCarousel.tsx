'use client'
import React, { useState, useEffect } from 'react'

const banners = [
  { id: 1, color: 'bg-blue-pastel-200', title: 'Summer Flash Sale', subtitle: 'Up to 50% Off' },
  { id: 2, color: 'bg-blue-pastel-300', title: 'New Arrivals', subtitle: 'Discover the latest trends' },
  { id: 3, color: 'bg-blue-pastel-400', title: 'Free Shipping', subtitle: 'On orders over ฿500' },
]

export const BannerCarousel = () => {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full max-w-6xl mx-auto mt-6 rounded-lg overflow-hidden shadow-sm h-48 md:h-72 lg:h-96">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex flex-col items-center justify-center text-white ${banner.color} ${index === current ? 'opacity-100 relative' : 'opacity-0'}`}
        >
          <div className="text-center p-6 bg-black/10 rounded-xl backdrop-blur-sm">
            <h2 className="text-3xl md:text-5xl font-bold mb-2">{banner.title}</h2>
            <p className="text-xl md:text-2xl">{banner.subtitle}</p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all ${index === current ? 'bg-white scale-110' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}
