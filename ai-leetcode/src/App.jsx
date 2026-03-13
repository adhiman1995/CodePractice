import React, { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import PracticeLayout from './components/PracticeLayout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import SplashScreen from './components/SplashScreen';
import API_BASE_URL from './config';
import { archivePreviousDays, loadTodaysProblems, loadHistory, getPendingSync, clearPendingSync } from './services/problemStorage';

function App() {
  const [authToken, setAuthToken] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [isSplashDone, setIsSplashDone] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [appLoaded, setAppLoaded] = useState(false);

  const [currentView, setCurrentView] = useState('Practice');
  const [activeProblem, setActiveProblem] = useState(null);
  const [dailyProblems, setDailyProblems] = useState([]);
  const [allProblems, setAllProblems] = useState([]);

  // On app startup: archive previous days, restore today's problems, restore auth
  useEffect(() => {
    try {
      // Step 1: Archive old daily problem keys into history
      archivePreviousDays();

      // Step 2: Load today's problems if any were already generated
      const todaysProblems = loadTodaysProblems();
      const today = new Date().toISOString().split('T')[0];

      if (todaysProblems.length > 0) {
        setDailyProblems(todaysProblems);
      }

      // Step 3: Load all historical problems AND include today's in allProblems
      const history = loadHistory();
      const flatHistory = history.flatMap(h =>
        h.problems.map(p => ({ ...p, generatedDate: h.date }))
      );

      // Always include today's problems in the full history view
      const todaysTagged = todaysProblems.map(p => ({ ...p, generatedDate: today }));
      const combined = [...todaysTagged, ...flatHistory];
      setAllProblems(combined);

      // Step 4: Restore auth token and user profile
      const token = localStorage.getItem('codepath_token');
      if (token) {
        setAuthToken(token);
        const cachedUser = localStorage.getItem('codepath_user');
        if (cachedUser) {
          setUserProfile(JSON.parse(cachedUser));
        }
      }
    } catch (e) {
      console.error('Error on startup:', e);
    }
    setAppLoaded(true);
  }, []);

  // Fetch history and sync pending items when token changes (login or refresh)
  useEffect(() => {
    if (authToken) {
      // Step 1: Sync pending items from local storage (previous days)
      const pending = getPendingSync();
      if (pending.length > 0) {
        console.log(`[Sync] Found ${pending.length} problems to sync to backend...`);
        fetch(`${API_BASE_URL}/api/problems/save-generated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ problems: pending })
        })
        .then(res => {
            if (res.ok) {
                console.log("[Sync] Successfully synced archived problems.");
                clearPendingSync();
            }
        })
        .catch(err => console.error("[Sync] Failed to sync pending items:", err));
      }

      // Step 2: Fetch History from Backend
      fetch(`${API_BASE_URL}/api/problems/history`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) {
              const backendProblems = data.map(item => ({
                  ...item.generatedProblemDetails,
                  isCompleted: item.isCompleted,
                  assignedDate: item.assignedDate
              }));
              setAllProblems(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const uniqueNew = backendProblems.filter(p => !existingIds.has(p.id));
                  return [...prev, ...uniqueNew];
              });
          }
      })
      .catch(err => console.error("Error fetching problem history", err));
    }
  }, [authToken]);

  const handleSignOut = () => {
    setAuthToken(null);
    setUserProfile(null);
    localStorage.removeItem('codepath_token');
    localStorage.removeItem('codepath_user');
    setCurrentView('Practice');
    setAuthView('login');
  };

  // 1. Initial Load State
  if (!appLoaded) return null;

  // 2. Unauthenticated State
  if (!authToken) {
    if (authView === 'login') return <Login setAuthToken={setAuthToken} setUserProfile={setUserProfile} onNavigateToSignup={() => setAuthView('signup')} />;
    return <Signup setAuthToken={setAuthToken} setUserProfile={setUserProfile} onNavigateToLogin={() => setAuthView('login')} />;
  }

  // 3. Fully Authenticated State
  return (
    <>
      {!isSplashDone && <SplashScreen onComplete={() => setIsSplashDone(true)} />}
      <div className={`flex flex-col h-screen w-full bg-white overflow-hidden transition-opacity duration-1000 ${isSplashDone ? 'opacity-100' : 'opacity-0'}`}>
        <TopNav currentView={currentView} setCurrentView={setCurrentView} onSignOut={handleSignOut} userProfile={userProfile} />
        <div className="flex flex-1 overflow-hidden">
          <PracticeLayout
            dailyProblems={dailyProblems}
            activeProblem={activeProblem}
            setActiveProblem={setActiveProblem}
            setCurrentView={setCurrentView}
            setDailyProblems={setDailyProblems}
            allProblems={allProblems}
            setAllProblems={setAllProblems}
            userProfile={userProfile}
            authToken={authToken}
          />
        </div>
      </div>
    </>
  );
}

export default App;
