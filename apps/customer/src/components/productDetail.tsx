import React, { useState } from 'react';
import { Download, Plus, Trash2, Edit3, Save, X, Copy, ShoppingCart, Heart } from 'lucide-react';

const ProductDetailPage = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'White T-shirt',
      picture: '',
      price: 120,
      currency: '$',
      description: 'High-quality cotton t-shirt perfect for everyday wear. Comfortable fit and durable material.',
      storeName: 'shirtsu shop',
      storeIcon: '🏪',
      options: [
        { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
        { name: 'Color', values: ['White', 'Black', 'Gray'] }
      ],
      category: 'clothing',
      customFields: []
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [newProduct, setNewProduct] = useState<>({
    name: '',
    picture: '',
    price: 0,
    currency: '$',
    description: '',
    storeName: '',
    storeIcon: '🏪',
    options: [],
    category: 'clothing',
    customFields: []
  });

  const handleOptionSelect = (optionName:string, value:string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = () => {
    alert(`Added ${selectedProduct.name} to cart!`);
  };

  const handleBuyNow = () => {
    alert(`Purchasing ${selectedProduct.name} now!`);
  };

  const handleAddOption = () => {
    setNewProduct(prev => ({
      ...prev,
      options: [...prev.options, { name: '', values: [''] }]
    }));
  };

  const handleRemoveOption = (index) => {
    setNewProduct(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setNewProduct(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleAddOptionValue = (optionIndex) => {
    setNewProduct(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === optionIndex ? { ...option, values: [...option.values, ''] } : option
      )
    }));
  };

  const handleRemoveOptionValue = (optionIndex, valueIndex) => {
    setNewProduct(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === optionIndex ? {
          ...option,
          values: option.values.filter((_, vi) => vi !== valueIndex)
        } : option
      )
    }));
  };

  const handleOptionValueChange = (optionIndex, valueIndex, value) => {
    setNewProduct(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === optionIndex ? {
          ...option,
          values: option.values.map((val, vi) => vi === valueIndex ? value : val)
        } : option
      )
    }));
  };

  const handleSaveProduct = () => {
    if (!newProduct.name.trim()) {
      alert('Product name is required!');
      return;
    }

    const productToSave = {
      ...newProduct,
      id: Date.now()
    };

    setProducts(prev => [...prev, productToSave]);
    setSelectedProduct(productToSave);
    setNewProduct({
      name: '',
      picture: '',
      price: 0,
      currency: '$',
      description: '',
      storeName: '',
      storeIcon: '🏪',
      options: [],
      category: 'clothing',
      customFields: []
    });
    setIsCreating(false);
  };

  const exportProductData = () => {
    const data = JSON.stringify(products, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Create New Product</h1>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Picture URL</label>
                <input
                  type="url"
                  value={newProduct.picture}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, picture: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    value={newProduct.currency}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                    <option value="¥">¥ JPY</option>
                    <option value="₿">₿ BTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Store Name</label>
                <input
                  type="text"
                  value={newProduct.storeName}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, storeName: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter store name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Product Options</label>
                  <button
                    onClick={handleAddOption}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Option
                  </button>
                </div>
                <div className="space-y-3">
                  {newProduct.options.map((option, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                          placeholder="Option name (e.g., Size, Color)"
                          className="flex-1 p-2 border rounded-md mr-2"
                        />
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {option.values.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleOptionValueChange(index, valueIndex, e.target.value)}
                              placeholder="Option value"
                              className="flex-1 p-2 border rounded-md"
                            />
                            <button
                              onClick={() => handleRemoveOptionValue(index, valueIndex)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-md"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddOptionValue(index)}
                          className="text-sm text-blue-500 hover:text-blue-600"
                        >
                          + Add value
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProduct}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Save size={20} /> Save Product
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Product Detail Page</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={16} /> Create Product
            </button>
            <button
              onClick={exportProductData}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Product Selection */}
      {products.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <select
            value={selectedProduct.id}
            onChange={(e) => setSelectedProduct(products.find(p => p.id == e.target.value))}
            className="p-2 border rounded-lg"
          >
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Main Product Layout */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left side - Product Image */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h1>
              
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {selectedProduct.picture ? (
                  <img 
                    src={selectedProduct.picture} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: selectedProduct.picture ? 'none' : 'flex'}}>
                  <div className="text-6xl">
                    <div className="w-full h-full border-2 border-gray-300 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gray-300 transform rotate-45"></div>
                        <div className="w-full h-0.5 bg-gray-300 transform -rotate-45 absolute"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Info */}
              <div className="flex items-center gap-3 pt-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                  {selectedProduct.storeIcon}
                </div>
                <span className="text-lg font-medium text-gray-700">{selectedProduct.storeName}</span>
              </div>
            </div>

            {/* Right side - Product Info */}
            <div className="space-y-6">
              {/* Product Choices */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">product choices</h3>
                <div className="space-y-4">
                  {selectedProduct.options.map((option, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{option.name}</label>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value, valueIndex) => (
                          <button
                            key={valueIndex}
                            onClick={() => handleOptionSelect(option.name, value)}
                            className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                              selectedOptions[option.name] === value
                                ? 'border-black bg-black text-white'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="text-4xl font-bold text-gray-900">
                {selectedProduct.currency} {selectedProduct.price}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  className="px-8 py-4 bg-gray-200 text-gray-800 text-lg font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  add
                </button>
                <button
                  onClick={handleBuyNow}
                  className="px-8 py-4 bg-gray-200 text-gray-800 text-lg font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  buy
                </button>
              </div>

              {/* Product Detail Section */}
              <div className="pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Product detail</h3>
                <div className="space-y-3">
                  <div className="h-1 bg-black rounded-full"></div>
                  <div className="h-1 bg-black rounded-full"></div>
                </div>
                {selectedProduct.description && (
                  <p className="text-gray-600 mt-4 leading-relaxed">{selectedProduct.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;