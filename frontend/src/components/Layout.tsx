import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CyberBackground from './CyberBackground';

export default function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-bg">
      {/* Animated Background */}
      <CyberBackground />
      <div className="hex-pattern" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10">
        <div className="p-6 min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Subtle scanline overlay */}
      <div className="scanline-overlay" />
    </div>
  );
}
