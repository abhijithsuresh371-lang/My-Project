import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import AdminPortal from './pages/AdminPortal'; // ✅ Import AdminPortal
import StudentDashboard from './components/student/StudentDashboard';

const App = () => {
  const [currentUser, setCurrentUser] = useState("");

  return (
    <Router>
      <Routes>
        {/* Pass the setter function to LoginPage */}
        <Route path="/" element={<LoginPage onLogin={(name) => setCurrentUser(name)} />} />

        {/* ✅ ADD THE ADMIN ROUTE HERE */}
        <Route path="/admin" element={<AdminPortal />} />

        {/* PROTECTED ROUTE: If no name, redirect to Login ("/") */}
        <Route 
          path="/student" 
          element={currentUser ? <StudentDashboard studentName={currentUser} /> : <Navigate to="/" />} 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;