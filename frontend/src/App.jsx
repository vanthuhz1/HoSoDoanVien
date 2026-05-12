import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ToastProvider } from './components/common/Toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DoanPhiPage from './pages/DoanPhiPage';
import AdminPage from './pages/AdminPage';
import DoanKhoaPage from './pages/DoanKhoaPage';
import BiThuPage from './pages/BiThuPage';
import DoanVienPage from './pages/DoanVienPage';
import ThongTinHoatDongPage from './pages/ThongTinHoatDongPage';
import ActivityDetailPage from './pages/ActivityDetailPage';

function App() {
  return (
    <ToastProvider>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/activity/:id" element={<ActivityDetailPage />} />

        {/* Role 1: Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[1]}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={[1]}>
            <AdminPage />
          </ProtectedRoute>
        } />

        {/* Role 2: Đoàn khoa */}
        <Route path="/doan-khoa" element={
          <ProtectedRoute allowedRoles={[2]}>
            <DoanKhoaPage />
          </ProtectedRoute>
        } />
        <Route path="/doan-khoa/*" element={
          <ProtectedRoute allowedRoles={[2]}>
            <DoanKhoaPage />
          </ProtectedRoute>
        } />

        {/* Role 3: Bí thư */}
        <Route path="/bi-thu" element={
          <ProtectedRoute allowedRoles={[3]}>
            <BiThuPage />
          </ProtectedRoute>
        } />
        <Route path="/bi-thu/*" element={
          <ProtectedRoute allowedRoles={[3]}>
            <BiThuPage />
          </ProtectedRoute>
        } />

        {/* Hồ sơ cá nhân (Role 3, 4) */}
        <Route path="/doan-vien/*" element={
          <ProtectedRoute allowedRoles={[3, 4]}>
            <DoanVienPage />
          </ProtectedRoute>
        } />

        {/* Hoạt động của cá nhân (Role 3, 4) */}
        <Route path="/thong-tin" element={
          <ProtectedRoute allowedRoles={[3, 4]}>
            <ThongTinHoatDongPage />
          </ProtectedRoute>
        } />

        {/* Đoàn phí (Role 3, 4) */}
        <Route path="/doan-phi" element={
          <ProtectedRoute allowedRoles={[3, 4]}>
            <DoanPhiPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
