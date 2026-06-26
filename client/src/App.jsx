import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages

import Home      from './pages/Home';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import PublicRoute from './components/common/PublicRoute';
import Profile   from './pages/Profile';
import Directory from './pages/Directory';
import AdminLogin     from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute     from './components/common/AdminRoute';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="flex flex-col min-h-screen">
                    <Navbar />

                    <main className="flex-grow">
                        <Routes>
                            {/* Public routes */}

                            <Route path="/"         element={<Home />} />
                            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
                            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                            {/* Protected routes — user must be logged in */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard"   element={<Dashboard />} />
                                <Route path="/profile/:id" element={<Profile />} />
                                <Route path="/directory"   element={<Directory />} />
                                {/* Admin routes */}
                                <Route path="/admin/login" element={<AdminLogin />} />
                                <Route element={<AdminRoute />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                                </Route>
                            </Route>
                        </Routes>
                    </main>

                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}