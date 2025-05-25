"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  BookOpenIcon,
  UserCircleIcon,
  PlusIcon,
  BookmarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon as BookOpenSolidIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  AcademicCapIcon,
  BookmarkIcon as BookmarkSolidIcon,
  HomeIcon,
  BookOpenIcon as BookOpenOutlineIcon,
  UserGroupIcon,
  KeyIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  ArrowPathRoundedSquareIcon,
  DocumentCheckIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  BookmarkSquareIcon,
  BookmarkSlashIcon,
  BookOpenIcon as BookOpenIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  SparklesIcon as SparklesIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/react/24/outline';
import ProfileModal from "@/components/ProfileModal";
import Loader from "@/components/loader";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  available_copies: number;
  total_copies: number;
  borrowed_at?: string;
  due_date?: string;
  returned_date?: string;
  added_by?: string;
  user?: {
    name: string;
  };
  transaction_id: number;
  unique_key?: string;
  status?: string;
}

interface SidebarProps {
  activeTab: "all" | "available" | "borrowed";
  setActiveTab: (tab: "all" | "available" | "borrowed") => void;
  setShowProfileModal: (show: boolean) => void;
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  trend: "up" | "down";
  trendText: string;
}

interface BookCardProps {
  book: Book;
  onBorrow: (id: number) => void;
  selectedBookId: number | null;
  setSelectedBookId: (id: number | null) => void;
  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;
  loading: {
    action: boolean;
  };
}

interface BorrowedBooksTableProps {
  books: Book[];
  onReturn: (transactionId: number, bookTitle: string) => void;
  loading: {
    borrowed: boolean;
    action: boolean;
  };
}

const Sidebar = ({ activeTab, setActiveTab, setShowProfileModal }: SidebarProps) => (
  <div className="fixed right-0 top-0 h-full w-48 bg-white border-l border-gray-200 flex flex-col items-center py-4">
    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mb-6 rounded-lg">
      <BookOpenIcon className="h-7 w-7 text-gray-600" />
    </div>
    <div className="flex flex-col items-center space-y-3 w-full px-2">
      <button 
        onClick={() => setActiveTab("all")}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg ${
          activeTab === "all" 
            ? "bg-blue-50 text-blue-600" 
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <BookOpenIconSolid className="h-5 w-5" />
        <span className="text-sm font-medium">All Books</span>
      </button>
      <button 
        onClick={() => setActiveTab("available")}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg ${
          activeTab === "available" 
            ? "bg-blue-50 text-blue-600" 
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <DocumentArrowUpIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Available</span>
      </button>
      <button 
        onClick={() => setActiveTab("borrowed")}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg ${
          activeTab === "borrowed" 
            ? "bg-blue-50 text-blue-600" 
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <BookmarkSquareIcon className="h-5 w-5" />
        <span className="text-sm font-medium">My Books</span>
      </button>
    </div>
    <div className="flex-grow"></div>
    <button 
      onClick={() => setShowProfileModal(true)}
      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
    >
      <UserCircleIconSolid className="h-5 w-5" />
      <span className="text-sm font-medium">Profile</span>
    </button>
  </div>
);

const StatsCard = ({ title, value, icon: Icon, color, trend, trendText }: StatsCardProps) => (
  <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        {trend === 'up' ? (
          <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
        ) : (
          <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      <p className={`text-xs mt-2 text-${trend === 'up' ? 'green' : 'red'}-500`}>{trendText}</p>
    </div>
  </div>
);

const QuickGuide = () => (
  <div className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-lg mb-8">
    <h3 className="text-lg font-semibold text-white mb-3">Quick Guide</h3>
    <ul className="text-sm text-gray-400 space-y-2">
      <li className="flex items-center">
        <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
        Books can be borrowed for up to 7 days
      </li>
      <li className="flex items-center">
        <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
        Return books on time to maintain good standing
      </li>
      <li className="flex items-center">
        <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
        Use the refresh button to update your reading status
      </li>
      <li className="flex items-center">
        <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
        Click your profile picture to update your information
      </li>
    </ul>
  </div>
);

const BookCard = ({ book, onBorrow, selectedBookId, setSelectedBookId, dueDate, setDueDate, loading }: BookCardProps) => (
  <div className="bg-white border border-gray-200">
    <div className="p-4">
      <div className="flex flex-col h-full">
        <div className="mb-3">
          <h3 className="text-base font-medium text-gray-900 mb-1">{book.title}</h3>
          <h4 className="text-sm text-gray-600">by {book.author}</h4>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {book.description || 'No description available'}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>{book.genre}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <ClipboardDocumentListIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>{book.available_copies}/{book.total_copies} copies available</span>
          </div>
        </div>
      </div>
    </div>
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
      {selectedBookId === book.id ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Select return date (max 1 week)
            </label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              minDate={new Date()}
              maxDate={new Date(new Date().setDate(new Date().getDate() + 7))}
              className="w-full px-3 py-1 text-sm bg-white border border-gray-300 focus:outline-none focus:border-gray-400"
              placeholderText="Select return date"
              dateFormat="MMM d, yyyy"
            />
          </div>
          <div className="flex space-x-2">
            <button
              className="flex-1 px-3 py-1 text-sm text-white bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
              onClick={() => onBorrow(book.id)}
              disabled={loading.action}
            >
              {loading.action ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  <span>Confirm Borrow</span>
                </>
              )}
            </button>
            <button
              className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              onClick={() => {
                setSelectedBookId(null);
                setDueDate(null);
              }}
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          className={`w-full px-3 py-1 text-sm flex items-center justify-center ${
            book.available_copies > 0
              ? 'text-white bg-gray-800 hover:bg-gray-700'
              : 'text-gray-400 bg-gray-100'
          }`}
          onClick={() => book.available_copies > 0 && setSelectedBookId(book.id)}
          disabled={book.available_copies <= 0 || loading.action}
        >
          {book.available_copies > 0 ? (
            <>
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              <span>Borrow Now</span>
            </>
          ) : (
            <>
              <BookmarkSlashIcon className="h-4 w-4 mr-1" />
              <span>Currently Unavailable</span>
            </>
          )}
        </button>
      )}
    </div>
  </div>
);

const BorrowedBooksTable = ({ books, onReturn, loading }: BorrowedBooksTableProps) => (
  <div className="bg-white border border-gray-200">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs text-gray-500">Book Details</th>
            <th className="px-4 py-2 text-left text-xs text-gray-500">Status</th>
            <th className="px-4 py-2 text-left text-xs text-gray-500">Due Date</th>
            <th className="px-4 py-2 text-left text-xs text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading.borrowed ? (
            <tr>
              <td colSpan={4} className="px-4 py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm text-gray-600">Loading your borrowed books...</p>
                </div>
              </td>
            </tr>
          ) : books.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8">
                <div className="flex flex-col items-center">
                  <BookOpenOutlineIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Your reading list is empty.</p>
                </div>
              </td>
            </tr>
          ) : (
            books.map(book => (
              <tr key={book.unique_key} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{book.title}</div>
                    <div className="text-sm text-gray-600">{book.author}</div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800">
                    {book.status === 'returned' ? (
                      <>
                        <DocumentCheckIcon className="h-3 w-3 mr-1" />
                        Returned
                      </>
                    ) : (
                      <>
                        <BookOpenIcon className="h-3 w-3 mr-1" />
                        Currently Reading
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {book.due_date ? new Date(book.due_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-2">
                  {book.status !== 'returned' ? (
                    <button
                      className="px-3 py-1 text-sm text-white bg-gray-800 hover:bg-gray-700 flex items-center"
                      onClick={() => onReturn(book.transaction_id, book.title)}
                      disabled={loading.action}
                    >
                      {loading.action ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span>Returning...</span>
                        </>
                      ) : (
                        <>
                          <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                          <span>Return Book</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      className="px-3 py-1 text-sm text-gray-400 bg-gray-50 flex items-center"
                      disabled
                    >
                      <DocumentCheckIcon className="h-4 w-4 mr-1" />
                      <span>Already Returned</span>
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const UserDashboard = () => {
  const { authToken, user, isLoading, logout } = useAppContext();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "available" | "borrowed">("all");
  const [loading, setLoading] = useState({
    books: false,
    borrowed: false,
    action: false
  });
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (authToken) {
      fetchBooks();
      fetchBorrowedBooks();
    }
  }, [authToken]);

  const fetchBooks = async () => {
    setLoading(prev => ({...prev, books: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/books`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      const data = Array.isArray(response.data) ? response.data : 
                  response.data.books ? response.data.books : 
                  response.data.data ? response.data.data : [];
      
      const formattedBooks = data.map((book: any) => ({
        id: book.id,
        title: book.title || 'No Title',
        author: book.author || 'Unknown Author',
        genre: book.genre || 'Uncategorized',
        description: book.description || 'No description available',
        available_copies: book.available_copies || 0,
        total_copies: book.total_copies || 0,
        added_by: book.user?.name || 'Admin'
      }));
      
      setBooks(formattedBooks);
    } catch (error: any) {
      console.error('Book fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to load books"
      );
    } finally {
      setLoading(prev => ({...prev, books: false}));
    }
  };

  const fetchBorrowedBooks = async () => {
    setLoading(prev => ({...prev, borrowed: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/borrowed-books`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      const data = Array.isArray(response.data) ? response.data : 
                  response.data.books ? response.data.books : 
                  response.data.data ? response.data.data : [];
      //
      const formattedBooks = data.map((book: any) => {
        console.log('Raw book data:', book); // Debug log
        const formatted = {
          id: book.id,
          title: book.title || 'No Title',
          author: book.author || 'Unknown Author',
          genre: book.genre || 'Uncategorized',
          description: book.description || 'No description available',
          available_copies: book.available_copies || 0,
          total_copies: book.total_copies || 0,
          transaction_id: book.transaction_id || book.id,
          status: book.status || 'borrowed',
          due_date: book.due_date || null,
          borrowed_at: book.borrowed_at || null,
          returned_date: book.returned_date || null,
          unique_key: `${book.id}-${book.transaction_id || book.id}-${Date.now()}`
        };
        console.log('Formatted book:', formatted); // Debug log
        return formatted;
      });
      
      console.log('All formatted books:', formattedBooks); // Debug log
      setBorrowedBooks(formattedBooks);
    } catch (error: any) {
      console.error('Borrowed books fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to load borrowed books"
      );
    } finally {
      setLoading(prev => ({...prev, borrowed: false}));
    }
  };

  const handleBorrow = async (bookId: number) => {
    if (!dueDate) {
      toast.error("Please select a return date");
      return;
    }

    const today = new Date();
    const maxDueDate = new Date();
    maxDueDate.setDate(today.getDate() + 7);

    if (dueDate > maxDueDate) {
      toast.error("Maximum borrowing period is 1 week");
      return;
    }

    if (dueDate < today) {
      toast.error("Return date cannot be in the past");
      return;
    }

    setLoading(prev => ({...prev, action: true}));
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/books/${bookId}/borrow`,
        { due_date: dueDate.toISOString().split('T')[0] },
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      toast.success(response.data?.message || "Book borrowed successfully");
      setDueDate(null);
      setSelectedBookId(null);
      await Promise.all([fetchBooks(), fetchBorrowedBooks()]);
    } catch (error: any) {
      console.error('Borrow error:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to borrow book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleReturn = async (transactionId: number, bookTitle: string) => {
    if (!authToken) {
      toast.error("Authentication required");
      return;
    }

    try {
      const result = await Swal.fire({
        title: "Confirm Return",
        text: `Are you sure you want to return "${bookTitle}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, return it",
      });

      if (result.isConfirmed) {
        setLoading(prev => ({...prev, action: true}));
        
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/return`,
            {},
            {
              headers: { 
                Authorization: `Bearer ${authToken}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data?.success) {
            toast.success(response.data.message || "Book returned successfully");
            await Promise.all([fetchBooks(), fetchBorrowedBooks()]);
          } else {
            throw new Error(response.data?.message || "Failed to process return");
          }
        } catch (error: any) {
          console.error('Return error:', error);
          let errorMessage = "Failed to return book";
          
          if (error.response) {
            if (error.response.status === 404) {
              errorMessage = "Transaction not found";
            } else if (error.response.status === 403) {
              errorMessage = "You are not authorized to return this book";
            } else if (error.response.status === 400) {
              errorMessage = error.response.data?.message || "This book was already returned";
            } else if (error.response.data?.message) {
              errorMessage = error.response.data.message;
            }
          }
          
          toast.error(errorMessage);
        } finally {
          setLoading(prev => ({...prev, action: false}));
        }
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error("An error occurred during confirmation");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return "Invalid Date";
    }
  };

  const formatReturnDate = (dateString?: string) => {
    if (!dateString) return "Not returned yet";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return "Invalid Date";
    }
  };

  const isBookOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    return dueDate < new Date();
  };

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: "Confirm Logout",
        text: "Are you sure you want to logout?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, logout",
      });

      if (result.isConfirmed) {
        await logout();
        router.push('/auth');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  if (isLoading || !authToken || (user?.role === 'admin')) {
    return <Loader />;
  }

  const filteredBooks = activeTab === "available" 
    ? books.filter(book => book.available_copies > 0)
    : activeTab === "borrowed" 
      ? borrowedBooks 
      : books;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setShowProfileModal={setShowProfileModal} 
      />
      
      <div className="pr-48">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search books by title or author..."
                    className="w-72 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => {
                      // Add search functionality here
                    }}
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {activeTab !== "borrowed" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading.books ? (
                  <div className="col-span-full">
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-sm text-gray-600">Loading your books...</p>
                    </div>
                  </div>
                ) : filteredBooks.length === 0 ? (
                  <div className="col-span-full">
                    <div className="text-center py-8">
                      <BookOpenOutlineIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No books available.</p>
                    </div>
                  </div>
                ) : (
                  filteredBooks.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onBorrow={handleBorrow}
                      selectedBookId={selectedBookId}
                      setSelectedBookId={setSelectedBookId}
                      dueDate={dueDate}
                      setDueDate={setDueDate}
                      loading={loading}
                    />
                  ))
                )}
              </div>
            ) : (
              <BorrowedBooksTable
                books={borrowedBooks}
                onReturn={handleReturn}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default UserDashboard;