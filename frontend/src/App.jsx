import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import EmployeeManagement from './pages/EmployeeManagement';
import Roster from './pages/Roster';
import MyRoster from './pages/MyRoster';
import Vacation from './pages/Vacation';
import Availability from './pages/Availability';
import TimeTracking from './pages/TimeTracking';
import TimeApprovals from './pages/TimeApprovals';
import ReportsOnCall from './pages/ReportsOnCall';
import ReportsIllness from './pages/ReportsIllness';
import ShiftSettings from './pages/ShiftSettings';

// Placeholder Pages for Phase 1+
const Placeholder = ({ title }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border h-full flex items-center justify-center">
    <h2 className="text-2xl font-semibold text-brand-text-sec">{title} (Phase 2+)</h2>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/my-roster" element={<MyRoster />} />
          <Route path="/vacation" element={<Vacation />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/my-overview" element={<TimeTracking />} />
          <Route path="/approvals" element={<TimeApprovals />} />

          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/reports/oncall" element={<ReportsOnCall />} />
          <Route path="/reports/illness" element={<ReportsIllness />} />

          <Route path="/shift-settings" element={<ShiftSettings />} />
          <Route path="/settings" element={<Placeholder title="Systemeinstellungen" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
