import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, AppLayout } from './components/layout';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Landing from './pages/auth/Landing';

// Dashboard & main pages
import Dashboard from './pages/dashboard/Dashboard';
import Groups from './pages/groups/Groups';
import GroupDetails from './pages/groups/GroupDetails';
import Friends from './pages/friends/Friends';
import Expenses from './pages/expenses/Expenses';
import Balances from './pages/balances/Balances';
import SettleUp from './pages/balances/SettleUp';
import Activity from './pages/activity/Activity';
import Profile from './pages/profile/Profile';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetails />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/balances" element={<Balances />} />
              <Route path="/settle" element={<SettleUp />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
