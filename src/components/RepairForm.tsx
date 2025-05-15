import React from 'react';

function RepairForm() {
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Measurements Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Tire Tread Measurements */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Tire Tread Measurements</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Front (LF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.lf"
                    value={form.tire_tread.lf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Rear (LR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.lr"
                    value={form.tire_tread.lr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Front (RF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.rf"
                    value={form.tire_tread.rf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Rear (RR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.rr"
                    value={form.tire_tread.rr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Brake Pad Measurements */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Brake Pad Measurements</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Front (LF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.lf"
                    value={form.brake_pads.lf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Rear (LR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.lr"
                    value={form.brake_pads.lr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Front (RF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.rf"
                    value={form.brake_pads.rf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Rear (RR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.rr"
                    value={form.brake_pads.rr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tire Pressure Readings */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Tire Pressure Readings</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">TIRE PRESSURE IN: FRONT</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_pressure.front_in"
                    value={form.tire_pressure.front_in}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">PSI</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700 ml-16">REAR</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_pressure.rear_in"
                    value={form.tire_pressure.rear_in}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">PSI</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">TIRE PRESSURE OUT: FRONT</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_pressure.front_out"
                    value={form.tire_pressure.front_out}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">PSI</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 ml-16">REAR</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_pressure.rear_out"
                    value={form.tire_pressure.rear_out}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">PSI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default RepairForm;