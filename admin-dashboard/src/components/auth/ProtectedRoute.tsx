import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // 'admin', 'resident', 'guard'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    console.log('[ProtectedRoute] MOUNTED');
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (!isAuthenticated) {
        console.warn('[ProtectedRoute] Not authenticated, redirecting to login.');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role Check
    const userRole = user ? (typeof user.role === 'string' ? user.role : user.role?.name) : null;

    // DEBUG LOGS - FORCE VISIBLE
    console.group('ProtectedRoute Debug');
    console.log('Path:', location.pathname);
    console.log('User Role (Raw):', user?.role);
    console.log('User Role (Parsed):', userRole);
    console.log('Allowed Roles:', allowedRoles);
    console.groupEnd();

    if (!userRole) {
        console.error('[ProtectedRoute] User has no role defined! Redirecting to login.');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && userRole) {
        const normalizedUserRole = String(userRole).toLowerCase().trim();
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase().trim());

        // Check for exact match OR if 'admin' is allowed and user is 'superadmin' etc (optional, but good for safety)
        const isAllowed = normalizedAllowedRoles.includes(normalizedUserRole) ||
            (normalizedAllowedRoles.includes('admin') && normalizedUserRole.includes('admin'));

        if (!isAllowed) {
            console.error(`[ProtectedRoute] Access Denied! Role '${normalizedUserRole}' is NOT in [${normalizedAllowedRoles}]`);

            // Redirect based on actual role
            if (normalizedUserRole === 'resident') {
                // Prevent infinite redirect loop if we are already at /resident
                if (location.pathname.startsWith('/resident')) {
                    console.log('[ProtectedRoute] Role is resident and path is /resident. ALLOWING.');
                    return <>{children}</>;
                }
                console.log('[ProtectedRoute] Redirecting resident to /resident');
                return <Navigate to="/resident" replace />;
            }

            if (['admin', 'guard', 'vigilante', 'celador'].includes(normalizedUserRole)) {
                console.log('[ProtectedRoute] Allowing staff override');
                return <>{children}</>;
            }

            console.log('[ProtectedRoute] Fallback redirect to /login');
            // Fallback: unauthorized for this route
            return <Navigate to="/login" replace />;
        }
    }

    return <>{children}</>;
};
