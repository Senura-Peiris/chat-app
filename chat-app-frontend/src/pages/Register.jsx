import React, { useState } from 'react';
import axios from 'axios';
import RegisterImg from '../images/Register.webp';

function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage("✅ Registration successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500); // 1.5 seconds delay before redirect

    } catch (error) {
      console.error("Registration failed:", error.response?.data || error.message);
      alert("Registration failed: " + (error.response?.data?.error || "Unknown error"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <img
          src={RegisterImg}
          alt="Register"
          className="w-full h-auto rounded mb-4"
        />
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Register</h2>

        {successMessage && (
          <p className="mb-4 text-green-600 font-medium">{successMessage}</p>
        )}

        <input
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded"
          placeholder="Email"
          type="email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded"
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded"
          placeholder="Password"
          type="password"
          onChange={e => setPassword(e.target.value)}
        />
        <input
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded"
          type="file"
          accept="image/*"
          onChange={e => setProfileImage(e.target.files[0])}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          onClick={handleRegister}
        >
          Register
        </button>

        <p className="mt-4 text-sm text-gray-700">
          Have an account? <a href="/" className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
