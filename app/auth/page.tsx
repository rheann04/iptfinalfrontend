'use client';

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppProvider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Loader from '@/components/loader';

interface FormData {
  name?: string;
  email: string;
  password: string;
  password_confirmation?: string;
  role: 'user' | 'admin';
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "user"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();
  const { login, register, authToken, isLoading, user } = useAppContext();

  useEffect(() => {
    if (!hasRedirected && authToken && !isLoading && user?.role) {
      if (user.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/user');
      }
      setHasRedirected(true);
    }
  }, [authToken, isLoading, user?.role, hasRedirected, router]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success("Welcome back!");
      } else {
        if (formData.password !== formData.password_confirmation) {
          toast.error("Passwords don't match");
          setIsSubmitting(false);
          return;
        }
        await register(
          formData.name!,
          formData.email,
          formData.password,
          formData.password_confirmation!,
          formData.role
        );
        toast.success("Account created! Please sign in");
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authToken) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {isLogin ? "Login" : "Register"}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isLogin ? "Welcome back" : "Create new account"}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="user">Regular User</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {!isLogin ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Confirm</label>
                    <input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      required
                      minLength={8}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Reset password
                    </button>
                  </div>
                </>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : isLogin ? (
                  "Login"
                ) : (
                  "Register"
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {isLogin ? "New user? Register" : "Have an account? Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;