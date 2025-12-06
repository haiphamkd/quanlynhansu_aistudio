
import React, { Component, useState, useEffect, ReactNode, ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import EmployeeManager from "./pages/EmployeeManager";
import AttendanceManager from "./pages/AttendanceManager";
import FundManager from "./pages/FundManager";
import ReportManager from "./pages/ReportManager";
import EvaluationManager from "./pages/EvaluationManager";
import ProposalManager from "./pages/ProposalManager";
import ShiftManager from "./pages/ShiftManager";
import AiAssistant from "./pages/AiAssistant";
import CategoryManager from "./pages/CategoryManager";
import { User } from "./types";

// Error Boundary with proper types
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public declare props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-600">Something went wrong: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for persisted session
    const savedUser = localStorage.getItem('pharmahr_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('pharmahr_user');
      }
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('pharmahr_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pharmahr_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeManager />} />
          <Route path="/shifts" element={<ShiftManager />} />
          <Route path="/attendance" element={<AttendanceManager />} />
          <Route path="/funds" element={<FundManager />} />
          <Route path="/reports" element={<ReportManager />} />
          <Route path="/evaluation" element={<EvaluationManager />} />
          <Route path="/proposals" element={<ProposalManager />} />
          <Route path="/categories" element={<CategoryManager />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);
