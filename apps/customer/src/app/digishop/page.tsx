'use client'
import React, { useState } from 'react';
import { Search, Filter, X, Clock, TrendingUp, Key } from 'lucide-react';
import NotFound from '@/components/notFound';
import {useRouter} from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';


const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return;
    setHasSearched(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
  };
  const router = useRouter()
  if(hasSearched){
    router.push(`/digishop/search?query=${searchQuery}`)
  }
  const {user} = useAuth()
  console.log('user',user)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-[#C2D1F4]">
      {/* Main Content */}
      <main className="flex-1">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
            {/* Logo/Title */}
            <div className="text-center mb-12">
              <h1 className='text-black'>
                Hello {user?.id}
              </h1>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
                Find Anything
              </h2>
              <p className="text-xl text-gray-600">
                Search millions of products from thousands of stores
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-3xl relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search for products, brands, or categories..."
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:border-blue-500 focus:outline-none shadow-lg text-black bg-white"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleSearch()}
                    className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
      </main>

      {/* Footer */}
      <footer className="bg-white text-black py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 Digishop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SearchPage;