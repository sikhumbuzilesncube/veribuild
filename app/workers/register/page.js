{/* Trade Information */}
<div className="border-b border-gray-200 pb-4">
  <h3 className="text-sm font-semibold text-[#2C3E50] mb-3">Trade Information</h3>
  
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Trade <span className="text-red-500">*</span>
    </label>
    <select
      name="trade"
      value={formData.trade}
      onChange={handleChange}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
      required
    >
      {trades.map((trade) => (
        <option key={trade} value={trade}>{trade}</option>
      ))}
    </select>
  </div>

  <div className="mt-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Sub-Trade / Specialization
    </label>
    <input
      type="text"
      name="subTrade"
      value={formData.subTrade}
      onChange={handleChange}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
      placeholder="e.g., Bricklaying, Roofing, Wiring"
    />
  </div>

  <div className="mt-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Trade Class (Optional)
    </label>
    <select
      name="tradeClass"
      value={formData.tradeClass}
      onChange={handleChange}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
    >
      <option value="">Select class (optional)</option>
      <option value="Class 1">Class 1 - Apprentice / Entry Level</option>
      <option value="Class 2">Class 2 - Intermediate (2-5 years)</option>
      <option value="Class 3">Class 3 - Advanced (5-10 years)</option>
      <option value="Class 4">Class 4 - Master / Expert (10+ years)</option>
    </select>
    <p className="text-xs text-gray-400 mt-1">
      This helps clients understand your skill level
    </p>
  </div>

  <div className="mt-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Years of Experience
    </label>
    <input
      type="number"
      name="yearsExperience"
      value={formData.yearsExperience}
      onChange={handleChange}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
      placeholder="5"
    />
  </div>

  <div className="mt-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Availability
    </label>
    <select
      name="availability"
      value={formData.availability}
      onChange={handleChange}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
    >
      <option value="available">Available</option>
      <option value="limited">Limited Availability</option>
      <option value="unavailable">Unavailable</option>
    </select>
  </div>
</div>
