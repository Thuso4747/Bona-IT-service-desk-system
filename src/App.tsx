import React, { useState, useEffect } from 'react';
import { AppView, Ticket, UserAccount } from './types';
import AuthPortal from './components/AuthPortal';
import AgentDashboard from './components/AgentDashboard';
import ClientSimulator from './components/ClientSimulator';

export default function App() {
  const [view, setView] = useState<AppView>(() => {
    // Detect initial route
    if (
      window.location.pathname === '/tickets/simulate-test' || 
      window.location.hash === '#/tickets/simulate-test'
    ) {
      return 'client-simulator';
    }
    return 'auth';
  });

  const [userEmail, setUserEmail] = useState<string>('');

  // Lifted state for Tickets
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('bona_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 1,
        ticketRef: 'TKT-CE8B1648',
        title: 'Complaint - I cannot check out',
        description: 'Complaint - I cannot complete checkout with my card, it throws an error.',
        status: 'PROCESSING',
        reportType: 'CHECKOUT_FAIL',
        creationDate: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedDate: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        ticketRef: 'TKT-0C4E74A1',
        title: 'Complaint - I am struggling to log in',
        description: 'Complaint - I am struggling to log in, keep getting verification errors.',
        status: 'CREATED',
        reportType: 'LOGIN_ISSUE',
        creationDate: new Date(Date.now() - 1800000).toISOString(),
        updatedDate: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 3,
        ticketRef: 'TKT-4A742028',
        title: 'Complaint - I am struggling to reset my password',
        description: 'Complaint - I am struggling to reset my password, link is expired.',
        status: 'COMPLETED',
        reportType: 'PASSWORD_RESET',
        creationDate: new Date(Date.now() - 7200000).toISOString(),
        updatedDate: new Date(Date.now() - 3600000).toISOString(),
      }
    ];
  });

  // Lifted state for User Accounts
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('bona_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 1,
        userRef: 'USR-85CFF13D',
        name: 'Thuso',
        email: 'thusorampheng13@icloud.com',
        role: 'CLIENT',
        password: 'password123'
      },
      {
        id: 2,
        userRef: 'USR-55F0F60E',
        name: 'Nathan',
        email: 'Nathan@gmail.com',
        role: 'CLIENT',
        password: 'password123'
      },
      {
        id: 3,
        userRef: 'USR-A8057540',
        name: 'Nathan',
        email: 'Nathan12@gmail.com',
        role: 'CLIENT',
        password: 'password123'
      }
    ];
  });

  // Sync tickets and users with Postgres backend upon mount and poll for real-time changes
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const response = await fetch('/api/tickets');
        const data = await response.json();
        if (data.success && Array.isArray(data.tickets)) {
          const mapped = data.tickets.map((t: any) => ({
            id: t.id,
            ticketRef: t.ticketRef,
            title: t.title,
            description: t.description,
            status: t.status,
            reportType: t.reportType,
            submittedByEmail: t.submittedBy?.email,
            submittedByName: t.submittedBy?.name,
            creationDate: t.creationDate,
            updatedDate: t.updatedDate
          }));
          setTickets(mapped);
        }
      } catch (e) {
        console.warn("Backend API offline or not ready. Falling back to local state.", e);
      }

      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (data.success && Array.isArray(data.users)) {
          const mapped = data.users.map((u: any) => ({
            id: u.id,
            userRef: u.userRef,
            name: u.name,
            email: u.email,
            role: u.role,
            password: u.password
          }));
          setUsers(mapped);
        }
      } catch (e) {
        console.warn("Backend API offline or not ready. Falling back to local state.", e);
      }
    };
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Persist states to localStorage when changed
  useEffect(() => {
    localStorage.setItem('bona_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('bona_users', JSON.stringify(users));
  }, [users]);

  // Sync back & forward path history manually for a nice experience
  useEffect(() => {
    const handleLocationChange = () => {
      if (
        window.location.pathname === '/tickets/simulate-test' ||
        window.location.hash === '#/tickets/simulate-test'
      ) {
        setView('client-simulator');
      } else if (view === 'client-simulator') {
        setView(userEmail ? 'agent-dashboard' : 'auth');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [view, userEmail]);

  const handleAuthSuccess = (email: string, signUpName?: string, role?: 'CLIENT' | 'AGENT', isSignUp?: boolean) => {
    setUserEmail(email);
    
    // Automatically register or update the user in the database list
    setUsers(prev => {
      const exists = prev.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        if (signUpName) {
          return prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, name: signUpName, role: role || u.role } : u);
        }
        if (role) {
          return prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, role } : u);
        }
        return prev;
      }
      
      const nextId = prev.length > 0 ? Math.max(...prev.map(u => u.id)) + 1 : 1;
      const userHex = Math.random().toString(16).substring(2, 10).toUpperCase();
      const userRef = `USR-${userHex}`;
      
      const name = signUpName || email.split('@')[0];
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
      
      const resolvedRole = role || (email.toLowerCase() === 'admin@portal.com' ? 'AGENT' : 'CLIENT');
      
      return [...prev, {
        id: nextId,
        userRef,
        name: capitalizedName,
        email: email,
        role: resolvedRole
      }];
    });

    const isAdmin = email.toLowerCase() === 'admin@portal.com' || role === 'AGENT';

    if (isSignUp || !isAdmin) {
      window.history.pushState(null, '', '/tickets/simulate-test');
      setView('client-simulator');
    } else {
      setView('agent-dashboard');
      if (window.location.pathname === '/tickets/simulate-test') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleSignOut = () => {
    setUserEmail('');
    setView('auth');
    if (window.location.pathname === '/tickets/simulate-test') {
      window.history.pushState(null, '', '/');
    }
  };

  const navigateToSimulator = () => {
    window.history.pushState(null, '', '/tickets/simulate-test');
    setView('client-simulator');
  };

  const navigateToAgentDesk = () => {
    window.history.pushState(null, '', '/');
    setView(userEmail ? 'agent-dashboard' : 'auth');
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/25">
      {view === 'auth' && (
        <AuthPortal onSuccess={handleAuthSuccess} onGoToSimulator={navigateToSimulator} />
      )}
      
      {view === 'agent-dashboard' && (
        <AgentDashboard 
          onSignOut={handleSignOut} 
          currentUserEmail={userEmail}
          tickets={tickets}
          setTickets={setTickets}
          users={users}
          setUsers={setUsers}
        />
      )}

      {view === 'client-simulator' && (
        <ClientSimulator
          tickets={tickets}
          setTickets={setTickets}
          users={users}
          setUsers={setUsers}
          onGoToAgent={navigateToAgentDesk}
          currentUserEmail={userEmail}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
