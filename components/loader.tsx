import React from 'react';

const Loader = () => {
    return (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700 font-medium">Loading...</p>
            </div>
        </div>
    );
}

export default Loader;