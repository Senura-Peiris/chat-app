import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Register from './pages/Register';
import './App.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Same as your backend server port

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* ✅ Pass socket as a prop */}
        <Route path="/chat" element={<Chat socket={socket} />} />
      </Routes>
    </Router>
  );
}

export default App;
