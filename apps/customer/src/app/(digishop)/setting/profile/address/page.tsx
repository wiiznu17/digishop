'use client'

import { useState } from 'react'

export default function ExpandableCard() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Card Header - Clickable */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex justify-between items-center"
          >
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">
                What is UX Design?
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {isExpanded ? 'Click to collapse' : 'Click to expand'}
              </p>
            </div>
            
            {/* Chevron Icon */}
            <svg
              className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Expandable Content */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            } overflow-hidden`}
          >
            <div className="p-6 pt-0 border-t border-gray-200">
              <p className="text-gray-700 mb-4 leading-relaxed">
                UX Design (User Experience Design) is the process of creating 
                products that provide meaningful and relevant experiences to users. 
                This involves the design of the entire process of acquiring and 
                integrating the product, including aspects of branding, design, 
                usability, and function.
              </p>
              
              <h4 className="font-semibold text-gray-800 mb-3">Key Areas:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">User research and testing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">Information architecture</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">Wireframing and prototyping</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">Interaction design</span>
                </li>
              </ul>

              <div className="mt-6">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}