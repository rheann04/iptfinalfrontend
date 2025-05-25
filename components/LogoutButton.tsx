"use client";
import { useAppContext } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { toast } from "react-hot-toast";

interface LogoutButtonProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

const LogoutButton = ({ variant = 'default', className = '' }: LogoutButtonProps) => {
  const { logout, isLoading } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const success = await logout();
      if (success) {
        router.push('/auth');
      } else {
        toast.error('Failed to logout. Please try again.');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <button 
        disabled
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors opacity-50 cursor-not-allowed ${className}`}
      >
        <div className="animate-pulse h-4 w-24 bg-gray-700 rounded"></div>
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleLogout}
        className={`flex items-center text-gray-400 hover:text-red-400 transition-colors ${className}`}
        aria-label="Logout"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button 
      onClick={handleLogout} 
      className={`flex items-center px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 rounded-md transition-colors ${className}`}
      aria-label="Logout"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
      Logout
    </button>
  );
};

export default LogoutButton; 