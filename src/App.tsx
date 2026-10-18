/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { Loader2, Clapperboard } from 'lucide-react';
import { initAuthListener } from './services/firebase.ts';
import { LoginPage } from './components/LoginPage.tsx';
import { DashboardPage } from './components/DashboardPage.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';
import { SpaceBackground } from './components/background/SpaceBackground.tsx';

function MainApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initAuthListener((user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  if (authChecking) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-base)',
          color: 'var(--text-primary)',
        }}
      >
        <SpaceBackground />
        <div
          className="p-6 rounded-2xl border shadow-2xl flex flex-col items-center space-y-3 z-10 backdrop-blur-xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="p-3 rounded-xl shadow-md font-bold text-black"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Clapperboard className="w-8 h-8 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <span>Initializing JARVIS Command Center...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider user={currentUser}>
      <DashboardPage
        user={currentUser}
        onSignOut={() => setCurrentUser(null)}
        onSignIn={() => setAuthModalOpen(true)}
      />
      {authModalOpen && (
        <LoginPage
          isModal
          onSuccess={() => setAuthModalOpen(false)}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
