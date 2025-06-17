// src/components/SignupPage.js
import React, { useState } from 'react';
import { User } from 'lucide-react';

const SignupPage = ({ onSignup, onLoginClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee'); // Default role for new signups
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      // Pass email as username, and email as an attribute
      await onSignup(email, password, { email, 'custom:role': role }); // custom:role if you add a custom attribute in Cognito
      setShowConfirmForm(true); // Show confirmation form after successful signup
    } catch (error) {
      setErrorMessage(error.message || 'Signup failed. Please try again.');
      console.error('Signup error in SignupPage:', error);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await onSignup.confirm(email, confirmationCode); // Call confirm function passed from App.js
    } catch (error) {
      setErrorMessage(error.message || 'Confirmation failed. Please check the code.');
      console.error('Confirmation error in SignupPage:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Sign Up for EventFlow</h2>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        {!showConfirmForm ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="signupEmail">
                Email
              </label>
              <input
                type="email"
                id="signupEmail"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="signupPassword">
                Password
              </label>
              <input
                type="password"
                id="signupPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                I am a:
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="attendee">Attendee</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out flex items-center justify-center text-sm"
              >
                <User className="w-4 h-4 mr-2" /> Sign Up
              </button>
              <button
                type="button"
                onClick={onLoginClick}
                className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
              >
                Already have an account? Log In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            <p className="text-gray-700 mb-4 text-center">A verification code has been sent to {email}. Please enter it below.</p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmationCode">
                Confirmation Code
              </label>
              <input
                type="text"
                id="confirmationCode"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out flex items-center justify-center text-sm w-full"
            >
              Confirm Account
            </button>
            <button
              type="button"
              onClick={() => onLoginClick()} // Go back to login after confirming
              className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800 mt-4 w-full text-center"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignupPage;