import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

/**
 * Component bảo vệ route - yêu cầu đăng nhập và đúng vai trò
 * @param {ReactNode} children - Component con
 * @param {number[]} allowedRoles - Mảng vai trò được phép truy cập (nếu rỗng = chỉ cần đăng nhập)
 * @param {string} redirectTo - Đường dẫn redirect nếu không đủ quyền
 */
const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const currentUser = authService.getCurrentUser();
    const userRole = parseInt(currentUser?.role);

    if (!allowedRoles.includes(userRole)) {
      // Redirect về trang phù hợp với vai trò hiện tại
      const roleRedirect = {
        1: '/admin',
        2: '/doan-khoa',
        3: '/bi-thu',
        4: '/doan-vien/ho-so'
      };
      return <Navigate to={roleRedirect[userRole] || '/'} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
