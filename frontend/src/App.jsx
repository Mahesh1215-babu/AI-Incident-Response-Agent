import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page Components
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AnalyzeIncident from './pages/AnalyzeIncident';
import IncidentHistory from './pages/IncidentHistory';
import MemoryExplorer from './pages/MemoryExplorer';
import MemoryDelta from './pages/MemoryDelta';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';

// Protected layout frame wrapper
const DashboardLayout = () => {
  return (
    <div className="min-h-screen pl-64 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar Panel */}
      <Sidebar />
      
      {/* Page Body Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar status header */}
        <Navbar />
        
        {/* View Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Application Layout Routes */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzeIncident />} />
            <Route path="/history" element={<IncidentHistory />} />
            <Route path="/memory" element={<MemoryExplorer />} />
            <Route path="/memory-delta" element={<MemoryDelta />} />
            <Route path="/reports" element={<Reports />} />
            
            {/* Admin Restricted Endpoint */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Route>

          {/* Redirection fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
