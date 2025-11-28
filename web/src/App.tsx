import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LibraryListPage from './pages/LibraryListPage';
import LibraryDetailPage from './pages/LibraryDetailPage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/auth" />;
}

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFF5F8',
        background: 'linear-gradient(180deg, #FFFBFD 0%, #FFF5F8 100%)',
      }}
    >
      <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/libraries"
        element={
          <PrivateRoute>
            <LibraryListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/libraries/:id"
        element={
          <PrivateRoute>
            <LibraryDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/libraries" />} />
    </Routes>
    </div>
  );
}

export default App;

