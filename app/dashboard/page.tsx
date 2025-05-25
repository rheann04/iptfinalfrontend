"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  HomeIcon,
  BookOpenIcon as BookIcon,
  UsersIcon,
  ClockIcon as ClockOutlineIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BookmarkIcon,
  UserCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import ProfileModal from "@/components/ProfileModal";
import Loader from "@/components/loader";
import LogoutButton from "@/components/LogoutButton";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
  added_by?: string;
  publisher: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  profile_image?: string;
}

interface Transaction {
  id: number;
  user_name: string;
  book_title: string;
  borrowed_date: string;
  due_date: string;
  returned_date: string | null;
  status: string;
}

interface DashboardStats {
  books_count: number;
  users_count: number;
  transactions_count: number;
  overdue_count: number;
  recent_transactions: {
    id: number;
    user_name: string;
    book_title: string;
    borrowed_date: string;
    due_date: string;
    returned_date?: string;
    status: string;
  }[];
}

const AdminDashboard = () => {
  const { authToken, user, isLoading } = useAppContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "books" | "users" | "transactions">("dashboard");
  const [loading, setLoading] = useState({
    dashboard: false,
    books: false,
    users: false,
    transactions: false,
    action: false
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    books: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    users: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    transactions: { current_page: 1, last_page: 1, per_page: 10, total: 0 }
  });
  const [searchTerm, setSearchTerm] = useState<{
    dashboard: string;
    books: string;
    users: string;
    transactions: string;
  }>({
    dashboard: "",
    books: "",
    users: "",
    transactions: ""
  });
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    genre: "",
    description: "",
    total_copies: 1,
    publisher: ""
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New book added: The Great Gatsby", time: "2 hours ago", read: false },
    { id: 2, message: "Overdue book reminder: To Kill a Mockingbird", time: "5 hours ago", read: false },
    { id: 3, message: "New user registration: John Doe", time: "1 day ago", read: true },
  ]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Add new state for user management
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  // Add new state for transaction management
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    book_id: "",
    user_id: "",
    due_date: ""
  });

  // Add error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!authToken) {
        router.push("/auth");
      } else if (user?.role !== 'admin') {
        router.push("/");
      } else {
        // Only fetch data if we're authenticated and have admin role
        fetchDashboardStats();
      }
    }
  }, [authToken, isLoading, router, user]);

  useEffect(() => {
    if (authToken && user?.role === 'admin') {
      switch (activeTab) {
        case "dashboard":
          fetchDashboardStats();
          break;
        case "books":
          fetchBooks();
          break;
        case "users":
          fetchUsers();
          break;
        case "transactions":
          fetchTransactions();
          break;
      }
    }
  }, [activeTab, authToken, user]);

  const fetchDashboardStats = async () => {
    setLoading(prev => ({...prev, dashboard: true}));
    setError(null);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard-stats`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      console.log('Dashboard stats response:', response.data); // Debug log
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Dashboard stats fetch error:', error);
      setError(error.response?.data?.message || "Failed to load dashboard statistics");
      toast.error(
        error.response?.data?.message || 
        "Failed to load dashboard statistics"
      );
    } finally {
      setLoading(prev => ({...prev, dashboard: false}));
    }
  };

  const fetchBooks = async (page = 1, search = "") => {
    setLoading(prev => ({...prev, books: true}));
    setError(null);
    try {
      console.log('Fetching books...'); // Debug log
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/books`,
        {
          params: {
            page,
            search: search || undefined,
            per_page: pagination.books.per_page
          },
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      console.log('Books response:', response.data); // Debug log
      
      if (response.data && Array.isArray(response.data.data)) {
        setBooks(response.data.data);
        setPagination(prev => ({
          ...prev,
          books: {
            current_page: response.data.meta?.current_page || 1,
            last_page: response.data.meta?.last_page || 1,
            per_page: response.data.meta?.per_page || 10,
            total: response.data.meta?.total || 0
          }
        }));
      } else {
        console.error('Invalid books data format:', response.data);
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error('Books fetch error:', error);
      setError(error.response?.data?.message || "Failed to load books");
      toast.error(
        error.response?.data?.message || 
        "Failed to load books. Please try again."
      );
    } finally {
      setLoading(prev => ({...prev, books: false}));
    }
  };

  const fetchUsers = async (page = 1, search = "") => {
    setLoading(prev => ({...prev, users: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        {
          params: {
            page,
            search: search || undefined,
            per_page: pagination.users.per_page
          },
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      setUsers(response.data.data);
      setPagination(prev => ({
        ...prev,
        users: {
          current_page: response.data.meta?.current_page || 1,
          last_page: response.data.meta?.last_page || 1,
          per_page: response.data.meta?.per_page || 10,
          total: response.data.meta?.total || 0
        }
      }));
    } catch (error: any) {
      console.error('Users fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to load users"
      );
    } finally {
      setLoading(prev => ({...prev, users: false}));
    }
  };

  const fetchTransactions = async (page = 1, search = "") => {
    setLoading(prev => ({...prev, transactions: true}));
    try {
      console.log('Fetching transactions...'); // Debug log
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/transactions`,
        {
          params: {
            page,
            search: search || undefined,
            per_page: pagination.transactions.per_page
          },
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      console.log('Transaction response:', response.data); // Debug log
      
      if (response.data && Array.isArray(response.data.data)) {
        // Ensure each transaction has the required fields
        const formattedTransactions = response.data.data.map((transaction: any) => ({
          id: transaction.id,
          user_name: transaction.user_name || transaction.user?.name || 'Unknown User',
          book_title: transaction.book_title || transaction.book?.title || 'Unknown Book',
          borrowed_date: transaction.borrowed_date || transaction.created_at,
          due_date: transaction.due_date,
          returned_date: transaction.returned_date,
          status: transaction.status || 'borrowed'
        }));
        
        setTransactions(formattedTransactions);
        setPagination(prev => ({
          ...prev,
          transactions: {
            current_page: response.data.meta?.current_page || 1,
            last_page: response.data.meta?.last_page || 1,
            per_page: response.data.meta?.per_page || 10,
            total: response.data.meta?.total || 0
          }
        }));
      } else {
        console.error('Invalid transaction data format:', response.data); // Debug log
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error('Transactions fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to load transactions. Please try again."
      );
    } finally {
      setLoading(prev => ({...prev, transactions: false}));
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({...prev, action: true}));
    
    try {
      // Validate required fields
      if (!newBook.title || !newBook.author || !newBook.genre) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate total_copies
      const totalCopies = Number(newBook.total_copies);
      if (isNaN(totalCopies) || totalCopies < 1) {
        toast.error("Number of copies must be at least 1");
        return;
      }

      console.log('Adding book:', newBook); // Debug log

      const bookData = {
        title: newBook.title,
        author: newBook.author,
        genre: newBook.genre,
        description: newBook.description || "No description provided",
        total_copies: totalCopies,
        available_copies: totalCopies,
        publisher: newBook.publisher || "Unknown"
      };

      console.log('Sending book data:', bookData); // Debug log

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/books`,
        bookData,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Book response:', response.data); // Debug log
      
      if (response.data && response.data.data) {
        // Add the new book to the list with proper number formatting
        const newBookData = {
          id: response.data.data.id,
          title: response.data.data.title,
          author: response.data.data.author,
          genre: response.data.data.genre,
          description: response.data.data.description,
          total_copies: Number(response.data.data.total_copies),
          available_copies: Number(response.data.data.available_copies),
          publisher: response.data.data.publisher,
          created_at: response.data.data.created_at,
          updated_at: response.data.data.updated_at
        };
        
        console.log('New book data:', newBookData); // Debug log
        
        // Update the books list
        setBooks(prev => [...prev, newBookData]);
        
        // Reset form and close modal
        setShowAddBookModal(false);
        setNewBook({
          title: "",
          author: "",  
          genre: "",
          description: "",
          total_copies: 1,
          publisher: ""
        });
        
        toast.success("Book added successfully");
        
        // Refresh the books list
        await fetchBooks();
        await fetchDashboardStats();
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error('Add book error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to add book. Please try again."
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleUpdateBook = async (bookId: number, bookData: Partial<Book>) => {
    setLoading(prev => ({...prev, action: true}));
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/books/${bookId}`,
        bookData,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      toast.success("Book updated successfully");
      fetchBooks();
      fetchDashboardStats();
      setShowEditBookModal(false);
    } catch (error: any) {
      console.error('Update book error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to update book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        setLoading(prev => ({...prev, action: true}));
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/books/${bookId}`,
          { 
            headers: { 
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json'
            }
          }
        );
        
        setBooks(prev => prev.filter(book => book.id !== bookId));
        toast.success("Book deleted successfully");
        fetchDashboardStats();
      }
    } catch (error: any) {
      console.error('Delete book error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to delete book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        setLoading(prev => ({...prev, action: true}));
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
          { 
            headers: { 
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json'
            }
          }
        );
        
        setUsers(prev => prev.filter(user => user.id !== userId));
        toast.success("User deleted successfully");
        fetchDashboardStats();
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to delete user"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
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

  // Add user CRUD operations
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({...prev, action: true}));
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        newUser,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      setUsers(prev => [...prev, response.data.data]);
      setShowAddUserModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user"
      });
      
      toast.success("User added successfully");
      fetchDashboardStats();
    } catch (error: any) {
      console.error('Add user error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to add user"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleUpdateUser = async (userId: number, userData: Partial<User>) => {
    setLoading(prev => ({...prev, action: true}));
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
        userData,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      toast.success("User updated successfully");
      fetchUsers();
      fetchDashboardStats();
      setShowEditUserModal(false);
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to update user"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  // Add transaction CRUD operations
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({...prev, action: true}));
    try {
      console.log('Adding transaction:', newTransaction); // Debug log
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/transactions`,
        newTransaction,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      console.log('Transaction response:', response.data); // Debug log
      
      if (response.data && response.data.data) {
        const newTransactionData = {
          id: response.data.data.id,
          user_name: response.data.data.user_name || response.data.data.user?.name,
          book_title: response.data.data.book_title || response.data.data.book?.title,
          borrowed_date: response.data.data.borrowed_date || response.data.data.created_at,
          due_date: response.data.data.due_date,
          returned_date: response.data.data.returned_date,
          status: response.data.data.status || 'borrowed'
        };
        
        setTransactions(prev => [...prev, newTransactionData]);
        setShowAddTransactionModal(false);
        setNewTransaction({
          book_id: "",
          user_id: "",
          due_date: ""
        });
        
        toast.success("Transaction added successfully");
        fetchDashboardStats();
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error('Add transaction error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to add transaction. Please try again."
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleReturnBook = async (transactionId: number) => {
    setLoading(prev => ({...prev, action: true}));
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/transactions/${transactionId}/mark-returned`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      toast.success("Book returned successfully");
      fetchTransactions();
      fetchDashboardStats();
    } catch (error: any) {
      console.error('Return book error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to return book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!authToken) {
    router.push("/auth");
    return null;
  }

  if (user?.role !== 'admin') {
    router.push("/");
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchDashboardStats();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <aside className="w-72 bg-white/80 backdrop-blur-md border-r border-indigo-100 flex flex-col">
          <div className="p-6 border-b border-indigo-100">
            <div className="flex items-center space-x-2">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <UserCircleIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Admin</h2>
                <p className="text-sm text-indigo-600">Administrator</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  activeTab === "dashboard" 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:bg-indigo-50/50"
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mr-3" />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab("books")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  activeTab === "books" 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:bg-indigo-50/50"
                }`}
              >
                <BookIcon className="h-5 w-5 mr-3" />
                Books
              </button>
              <button 
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  activeTab === "users" 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:bg-indigo-50/50"
                }`}
              >
                <UsersIcon className="h-5 w-5 mr-3" />
                Members
              </button>
              <button 
                onClick={() => setActiveTab("transactions")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  activeTab === "transactions" 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:bg-indigo-50/50"
                }`}
              >
                <CalendarIcon className="h-5 w-5 mr-3" />
                Borrowings
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {/* Top Bar */}
          <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search in library..."
                  className="w-72 pl-10 pr-4 py-2 rounded-full border border-indigo-100 bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm[activeTab]}
                  onChange={(e) => {
                    setSearchTerm(prev => ({...prev, [activeTab]: e.target.value}));
                    switch(activeTab) {
                      case "books":
                        fetchBooks(1, e.target.value);
                        break;
                      case "users":
                        fetchUsers(1, e.target.value);
                        break;
                      case "transactions":
                        fetchTransactions(1, e.target.value);
                        break;
                    }
                  }}
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-indigo-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={() => {
                  // Clear auth token and user data from localStorage
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user');
                  // Clear the auth context state
                  if (typeof window !== 'undefined') {
                    window.location.href = '/auth';
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-sm"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard Content */}
            {activeTab === "dashboard" && (
              <>
                {/* Recent Transactions */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-100">
                  <div className="p-6 border-b border-indigo-100">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Borrowings</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-indigo-100">
                      <thead className="bg-indigo-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Member</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Book</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Borrowed</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Due</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-indigo-100">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.user_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.book_title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(transaction.borrowed_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(transaction.due_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'borrowed' 
                                  ? 'bg-yellow-50 text-yellow-700' 
                                  : 'bg-green-50 text-green-700'
                              }`}>
                                {transaction.status === 'borrowed' ? 'Borrowed' : 'Returned'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Books Tab */}
            {activeTab === "books" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Book Collection</h2>
                  <button
                    onClick={() => setShowAddBookModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Book
                  </button>
                </div>
                <div className="overflow-x-auto">
                  {loading.books ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : books.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      No books found. Add a new book to get started.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {books.map((book) => (
                          <tr key={book.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.author}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.genre}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {Number(book.total_copies).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                book.available_copies > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {Number(book.available_copies).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setCurrentBook(book);
                                    setShowEditBookModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="bg-white rounded-2xl shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Library Members</h2>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Member
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'admin' ? 'Staff' : 'Member'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(user.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentUser(user);
                                  setShowEditUserModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-600 mb-2">No members found</div>
                      <p className="text-sm text-gray-500">Add a new member to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <div className="bg-white rounded-2xl shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Borrowing Records</h2>
                  <button
                    onClick={() => setShowAddTransactionModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Borrowing
                  </button>
                </div>
                <div className="overflow-x-auto">
                  {loading.transactions ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      No borrowing records found.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrowed</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.user_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.book_title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(transaction.borrowed_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(transaction.due_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'borrowed' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {transaction.status === 'borrowed' ? 'Borrowed' : 'Returned'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {transaction.status === 'borrowed' && (
                                <button
                                  onClick={() => handleReturnBook(transaction.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <CheckCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl max-w-md w-full p-6 shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Add a New Book</h3>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-indigo-500/30 rounded-lg text-indigo-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={newBook.title}
                  onChange={(e) => setNewBook(prev => ({...prev, title: e.target.value}))}
                />
              </div>
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-200 mb-1">Author's Name</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-indigo-500/30 rounded-lg text-indigo-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={newBook.author}
                  onChange={(e) => setNewBook(prev => ({...prev, author: e.target.value}))}
                />
              </div>
              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-200 mb-1">Book Category</label>
                <input
                  type="text"
                  id="genre"
                  name="genre"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-indigo-500/30 rounded-lg text-indigo-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={newBook.genre}
                  onChange={(e) => setNewBook(prev => ({...prev, genre: e.target.value}))}
                />
              </div>
              <div>
                <label htmlFor="total_copies" className="block text-sm font-medium text-gray-200 mb-1">
                  Number of Copies
                  <span className="text-xs text-gray-400 ml-1">(Initial available copies)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="total_copies"
                    name="total_copies"
                    min="1"
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-indigo-500/30 rounded-lg text-indigo-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-16"
                    value={newBook.total_copies}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        setNewBook(prev => ({...prev, total_copies: value}));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.action ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Adding...
                    </div>
                  ) : (
                    'Add Book'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditBookModal && currentBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Update Book Information</h3>
              <button
                onClick={() => {
                  setShowEditBookModal(false);
                  setCurrentBook(null);
                }}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (currentBook) {
                handleUpdateBook(currentBook.id, {
                  title: currentBook.title,
                  author: currentBook.author,
                  genre: currentBook.genre,
                  description: currentBook.description,
                  total_copies: currentBook.total_copies,
                  publisher: currentBook.publisher
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={currentBook.title}
                    onChange={(e) => setCurrentBook(prev => prev ? {...prev, title: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-author" className="block text-sm font-medium text-gray-700 mb-1">Author's Name</label>
                  <input
                    type="text"
                    id="edit-author"
                    name="author"
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={currentBook.author}
                    onChange={(e) => setCurrentBook(prev => prev ? {...prev, author: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-genre" className="block text-sm font-medium text-gray-700 mb-1">Book Category</label>
                  <input
                    type="text"
                    id="edit-genre"
                    name="genre"
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={currentBook.genre}
                    onChange={(e) => setCurrentBook(prev => prev ? {...prev, genre: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-total-copies" className="block text-sm font-medium text-gray-700 mb-1">Number of Copies</label>
                  <div className="relative">
                    <input
                      type="number"
                      id="edit-total-copies"
                      name="total_copies"
                      min="1"
                      required
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-16"
                      value={currentBook.total_copies}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setCurrentBook(prev => prev ? {...prev, total_copies: value} : null);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBookModal(false);
                    setCurrentBook(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.action ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Updating...
                    </div>
                  ) : (
                    'Update Book'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Add New Library Member</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter member's name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter member's email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({...prev, role: e.target.value}))}
                  >
                    <option value="" className="bg-gray-700 text-gray-300">Select a role</option>
                    <option value="user" className="bg-gray-700 text-gray-300">Library Member</option>
                    <option value="admin" className="bg-gray-700 text-gray-300">Library Staff</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.action ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Adding...
                    </div>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && currentUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-100">Update Member Information</h3>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setCurrentUser(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateUser(currentUser.id, {
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-slate-200 mb-1">Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter member's name"
                    value={currentUser.name}
                    onChange={(e) => setCurrentUser(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-slate-200 mb-1">Email</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter member's email"
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser(prev => prev ? {...prev, email: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-slate-200 mb-1">Role</label>
                  <select
                    id="edit-role"
                    name="role"
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                    value={currentUser.role}
                    onChange={(e) => setCurrentUser(prev => prev ? {...prev, role: e.target.value} : null)}
                  >
                    <option value="user" className="bg-slate-800 text-slate-100">Library Member</option>
                    <option value="admin" className="bg-slate-800 text-slate-100">Library Staff</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setCurrentUser(null);
                  }}
                  className="px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action}
                  className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.action ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Updating...
                    </div>
                  ) : (
                    'Update User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-900">Record New Borrowing</h3>
              <button
                onClick={() => setShowAddTransactionModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="book_id" className="block text-sm font-medium text-slate-700">Book</label>
                  <select
                    id="book_id"
                    name="book_id"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newTransaction.book_id}
                    onChange={(e) => setNewTransaction(prev => ({...prev, book_id: e.target.value}))}
                  >
                    <option value="">Select a book</option>
                    {books.map(book => (
                      <option key={book.id} value={book.id}>
                        {book.title} (Available: {book.available_copies})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="user_id" className="block text-sm font-medium text-slate-700">Member</label>
                  <select
                    id="user_id"
                    name="user_id"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newTransaction.user_id}
                    onChange={(e) => setNewTransaction(prev => ({...prev, user_id: e.target.value}))}
                  >
                    <option value="">Select a member</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-slate-700">Due Date</label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newTransaction.due_date}
                    onChange={(e) => setNewTransaction(prev => ({...prev, due_date: e.target.value}))}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTransactionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading.action ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Adding...
                    </div>
                  ) : (
                    'Add Transaction'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default AdminDashboard;
