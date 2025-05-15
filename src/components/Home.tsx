import React from 'react';

interface HomeProps {
  onNavigate: (route: 'home' | 'form' | 'list' | 'detail') => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center py-12">
      <div className="max-w-3xl text-center mb-24">
        <h2 className="text-3xl font-bold text-blue-900 mb-8">Tech Sheets Management</h2>
        
        <div className="grid md:grid-cols-2 gap-12 mt-12">
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600 hover:shadow-lg transition-shadow">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mx-auto mb-6">
              <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
              <path d="M12 11v6"/>
              <path d="m9 14 3-3 3 3"/>
            </svg>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Create Repair Sheet</h3>
            <p className="text-gray-600 mb-6">
              
            </p>
            <button 
              onClick={() => onNavigate('form')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md transition-colors w-full"
            >
              Create New
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600 hover:shadow-lg transition-shadow">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mx-auto mb-6">
              <path d="M8 6h13"/>
              <path d="M8 12h13"/>
              <path d="M8 18h13"/>
              <path d="M3 6h.01"/>
              <path d="M3 12h.01"/>
              <path d="M3 18h.01"/>
            </svg>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">View History</h3>
            <p className="text-gray-600 mb-6">
              
            </p>
            <button 
              onClick={() => onNavigate('list')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md transition-colors w-full"
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};