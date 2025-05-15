import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './components/Home';
import { RepairForm } from './components/RepairForm';
import { RepairList } from './components/RepairList';
import { RepairDetail } from './components/RepairDetail';
import { SupabaseProvider } from './context/SupabaseContext';
import { Toaster } from './components/ui/Toaster';

function App() {
  return (
    <SupabaseProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-blue-900 text-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 18v-6"/>
                  <path d="m8 5.3 8 3.5"/>
                  <path d="M12 4v2"/>
                </svg>
                <h1 className="text-xl font-bold">AutoTech Repair</h1>
              </div>
              <nav>
                <ul className="flex space-x-4">
                  <li>
                    <a href="/" className="px-3 py-2 rounded-md hover:bg-blue-800 transition-colors">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="/new" className="px-3 py-2 rounded-md hover:bg-blue-800 transition-colors">
                      New Repair
                    </a>
                  </li>
                  <li>
                    <a href="/repairs" className="px-3 py-2 rounded-md hover:bg-blue-800 transition-colors">
                      View Repairs
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/new" element={<RepairForm />} />
              <Route path="/repairs" element={<RepairList />} />
              <Route path="/repairs/:id" element={<RepairDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-gray-600">
              <p>© {new Date().getFullYear()} AutoTech Repair Shop. All rights reserved.</p>
            </div>
          </footer>
          
          <Toaster />
        </div>
      </Router>
    </SupabaseProvider>
  );
}

export default App;