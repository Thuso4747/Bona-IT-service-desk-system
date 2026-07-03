import React, { useState, useEffect } from 'react';
import { Ticket, UserAccount } from '../types';
import { Mail, CheckCircle, ArrowRight, Database, Sparkles, LayoutDashboard, ChevronDown, Clock, RefreshCw, AlertCircle, ArrowLeft, LogOut } from 'lucide-react';

interface ClientSimulatorProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  onGoToAgent: () => void;
  currentUserEmail?: string;
  onSignOut?: () => void;
}

export default function ClientSimulator({
  tickets,
  setTickets,
  users,
  setUsers,
  onGoToAgent,
  currentUserEmail,
  onSignOut
}: ClientSimulatorProps) {
  // Find currently logged-in user if any
  const loggedInUser = currentUserEmail 
    ? users.find(u => u.email.toLowerCase() === currentUserEmail.toLowerCase()) 
    : null;

  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('Complaint');
  const [body, setBody] = useState('');
  
  // Sync name and email automatically upon sign-in/sign-up when loggedInUser changes
  useEffect(() => {
    if (loggedInUser) {
      setSenderName(loggedInUser.name);
      setSenderEmail(loggedInUser.email);
    } else {
      setSenderName('');
      setSenderEmail('');
    }
  }, [loggedInUser]);

  // Success indicator state
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

  const [activeTab, setActiveTab] = useState<'submit' | 'tickets'>('submit');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter tickets belonging to the current client email
  const myTickets = tickets.filter(t => 
    t.submittedByEmail?.toLowerCase() === senderEmail.trim().toLowerCase()
  );

  const handleRefreshTickets = async () => {
    setIsRefreshing(true);
    try {
      const ticketsRes = await fetch('/api/tickets');
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success && Array.isArray(ticketsData.tickets)) {
        const mapped = ticketsData.tickets.map((t: any) => ({
          id: t.id,
          ticketRef: t.ticketRef,
          title: t.title,
          description: t.description,
          status: t.status,
          reportType: t.reportType,
          submittedByEmail: t.submittedBy?.email,
          submittedByName: t.submittedBy?.name
        }));
        setTickets(mapped);
      }
    } catch (e) {
      console.warn("Could not fetch fresh tickets", e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !subject.trim() || !body.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: senderName.trim(),
          email: senderEmail.trim(),
          title: subject.trim(),
          description: body.trim(),
          issue: body.trim(),
          reportType: subject.toUpperCase(),
        })
      });

      const data = await response.json();
      if (data.success) {
        // Fetch fresh tickets and users from backend to stay in absolute perfect sync
        const ticketsRes = await fetch('/api/tickets');
        const ticketsData = await ticketsRes.json();
        if (ticketsData.success && Array.isArray(ticketsData.tickets)) {
          const mapped = ticketsData.tickets.map((t: any) => ({
            id: t.id,
            ticketRef: t.ticketRef,
            title: t.title,
            description: t.description,
            status: t.status,
            reportType: t.reportType,
            submittedByEmail: t.submittedBy?.email,
            submittedByName: t.submittedBy?.name
          }));
          setTickets(mapped);
        }

        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          const mapped = usersData.users.map((u: any) => ({
            id: u.id,
            userRef: u.userRef,
            name: u.name,
            email: u.email,
            role: u.role
          }));
          setUsers(mapped);
        }

        setIsSubmittedSuccessfully(true);
        setTimeout(() => setIsSubmittedSuccessfully(false), 2000);

        // Reset non-user fields
        setSubject('Complaint');
        setBody('');
        return;
      }
    } catch (err) {
      console.warn("Backend submission unavailable, using offline fallback.", err);
    }

    // Check if user already exists by email
    const existingUser = users.find(u => u.email.toLowerCase() === senderEmail.trim().toLowerCase());
    let userRef = '';
    let isNewUser = false;

    if (existingUser) {
      userRef = existingUser.userRef;
      // If name was blank or default, update it
      if (existingUser.name !== senderName.trim()) {
        setUsers(prev => prev.map(u => u.id === existingUser.id ? { ...u, name: senderName.trim() } : u));
      }
    } else {
      // Create new user
      const nextUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      const userHex = Math.random().toString(16).substring(2, 10).toUpperCase();
      userRef = `USR-${userHex}`;
      const newUser: UserAccount = {
        id: nextUserId,
        userRef,
        name: senderName.trim(),
        email: senderEmail.trim(),
        role: 'CLIENT'
      };
      setUsers(prev => [...prev, newUser]);
      isNewUser = true;
    }

    // Create new ticket
    let nextTicketId = 1;
    const existingTicketIds = new Set(tickets.map(t => t.id));
    while (existingTicketIds.has(nextTicketId)) {
      nextTicketId++;
    }
    const ticketHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const ticketRef = `TKT-${ticketHex}`;
    
    const newTicket: Ticket = {
      id: nextTicketId,
      ticketRef,
      title: subject.trim(),
      description: body.trim(),
      status: 'CREATED',
      submittedByEmail: senderEmail.trim(),
      submittedByName: senderName.trim(),
      reportType: subject.toUpperCase()
    };

    setTickets(prev => [...prev, newTicket]);

    // Show success details
    setIsSubmittedSuccessfully(true);
    setTimeout(() => setIsSubmittedSuccessfully(false), 2000);

    // Reset non-user fields
    setSubject('Complaint');
    setBody('');
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-start font-sans relative px-4 select-none animate-fade-in py-12">
      
      <div className="w-full max-w-2xl mx-auto font-sans">
        
        {/* Title area matches user request exactly */}
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-bold text-[#1b3bb6] tracking-tight">
            Bona IT Ticket Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Submit support tickets and track their real-time resolution status
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 bg-slate-100 p-1 rounded-xl w-fit mx-auto border border-slate-200/50">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-white text-[#1b3bb6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Submit a Ticket</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'tickets'
                ? 'bg-white text-[#1b3bb6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>View my tickets</span>
          </button>
        </div>

        {activeTab === 'submit' ? (
          <div className="space-y-6">
            {/* Logged in indicator & Sign Out on form */}
            {currentUserEmail && onSignOut && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-lg text-xs">
                <span className="text-slate-600 font-medium">
                  Logged in as <strong className="text-slate-800">{currentUserEmail}</strong>
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="font-bold text-red-600 hover:text-red-700 hover:underline transition-all cursor-pointer"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {/* Input Form Box */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sender Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sender Name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#1b3bb6] focus:ring-2 focus:ring-[#1b3bb6]/5 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sender Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Sender Email Address"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#1b3bb6] focus:ring-2 focus:ring-[#1b3bb6]/5 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Subject</label>
                <div className="relative">
                  <select
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1b3bb6] focus:ring-2 focus:ring-[#1b3bb6]/5 transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Complaint">Complaint</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Body Text Content</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Email Body Text Content"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#1b3bb6] focus:ring-2 focus:ring-[#1b3bb6]/5 transition-all shadow-sm resize-none"
                />
              </div>

              {/* Submit Action Button matches user request exactly */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittedSuccessfully}
                  className={`w-full py-3 px-6 font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all duration-150 text-center cursor-pointer flex items-center justify-center gap-2 ${
                    isSubmittedSuccessfully
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#1b3bb6] hover:bg-[#16309c] active:bg-[#102475] text-white'
                  }`}
                >
                  {isSubmittedSuccessfully ? (
                    <span>Ticket Successfully Submitted</span>
                  ) : (
                    <span>Submit Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {myTickets.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Database className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                <p className="text-sm font-medium text-slate-600">No tickets found</p>
                <p className="text-xs text-slate-400 mt-1">
                  No tickets have been submitted under <span className="font-semibold text-slate-500">{senderEmail || 'this email address'}</span> yet.
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#1b3bb6] hover:underline"
                >
                  <span>Go submit a ticket now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myTickets.map((ticket) => {
                  const lookupStatus = (ticket.status || '').toUpperCase();
                  const statusColors = {
                    CREATED: { textClass: 'text-blue-600', text: 'Created' },
                    PROCESSING: { textClass: 'text-amber-600', text: 'Processing' },
                    COMPLETED: { textClass: 'text-emerald-600', text: 'Complete' },
                  }[lookupStatus as 'CREATED' | 'PROCESSING' | 'COMPLETED'] || { textClass: 'text-slate-600', text: ticket.status };

                  return (
                    <div key={ticket.id} className="py-5 border-b border-slate-100 space-y-3 animate-fade-in">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="text-xs text-slate-500 font-medium space-y-1">
                            <div>
                              <span className="font-bold text-slate-700">Ticket Ref:</span>{' '}
                              <span className="font-mono text-[11px] font-bold text-[#1b3bb6] bg-blue-50 px-2 py-0.5 rounded border border-blue-100/60 inline-block">
                                {ticket.ticketRef}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Email Subject:</span>{' '}
                              <span className="text-slate-800 font-semibold">{ticket.title}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium self-start mt-0.5 whitespace-nowrap">
                          <span className="font-bold text-slate-700">Status: </span>
                          <span className={`font-bold ${statusColors.textClass}`}>
                            {statusColors.text}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-700">Email Content:</span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
