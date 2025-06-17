// src/components/LoginPage.js
import React, { useState } from 'react';
import { LogIn } from 'lucide-react'; // Assuming you use lucide-react icons

const LoginPage = ({ onLogin, onSignUpClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    try {
      await onLogin(email, password);
    } catch (error) {
      setErrorMessage(error.message || 'Login failed. Please check your credentials.');
      console.error('Login error in LoginPage:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Log In to EventFlow</h2>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out flex items-center justify-center text-sm"
            >
              <LogIn className="w-4 h-4 mr-2" /> Sign In
            </button>
            <button
              type="button"
              onClick={onSignUpClick}
              className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
            >
              Don't have an account? Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;