'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [expandedLead, setExpandedLead] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          if (res.status === 403) {
            router.replace('/dashboard');
            return;
          }
          throw new Error('Failed to fetch stats');
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError('Could not load admin data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [router]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 3) return;

    setIsSearching(true);
    setSearchResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setSearchResults(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const toWhatsAppNumber = (phone) => {
    if (!phone) return '';
    let cleaned = String(phone).replace(/[^\d+]/g, '');
    cleaned = cleaned.replace(/^\+/, '');
    if (cleaned.startsWith('0')) cleaned = '263' + cleaned.slice(1);
    return cleaned;
  };

  // NEW: Role-based welcome message generator
  const getWelcomeMessage = (name, role) => {
    const base = `Hi ${name}, this is the founder of VeriBuild. Welcome aboard! `;
    
    switch (role) {
      case 'client':
        return base + `I saw you just signed up. Do you need any help uploading your floor plan or finding a contractor for your project? Let me know!`;
      case 'worker':
        return base + `I saw you just signed up. Have you completed your profile yet? Once it's active, clients will be able to find you for jobs in your city. Let me know if you need help setting it up!`;
      case 'architect':
        return base + `I saw you just signed up. We're helping homeowners find trusted architects across Zimbabwe. Do you need any help setting up your firm's profile and portfolio?`;
      case 'construction':
        return base + `I saw you just signed up. We're connecting builders with clients who are ready to build. Do you need any help setting up your company listing?`;
      case 'hardware':
        return base + `I saw you just signed up. We're helping hardware stores get discovered by builders. Do you need any help uploading your product prices?`;
      default:
        return base + `I saw you just signed up. Let me know if you need any help getting started!`;
    }
  };

  const downloadLeadsCSV = () => {
    if (!data || !data.recentUnpaidLeads) return;

    const rows = [];
    rows.push(['Project Name', 'Date', 'Client Name', 'Role', 'Phone', 'Email']);
    
    data.recentUnpaidLeads.forEach(lead => {
      rows.push([
        lead.project_name,
        new Date(lead.created_at).toLocaleDateString(),
        lead.client_name,
        lead.client_role,
        lead.client_phone,
        lead.client_email
      ]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `unpaid_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:ml-64 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error || 'Unauthorized'}
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentPayments, chartData, recentLogs, recentUnpaidLeads, usersByRole } = data;
  const roles = stats.roleCounts || { client: 0, worker: 0, architect: 0, construction: 0, hardware: 0 };
  const activeUsersList = selectedRole && usersByRole ? usersByRole[selectedRole] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="md:ml-64 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50]">Platform Overview</h1>
              <p className="text-gray-600 text-sm">Live stats and recent activity.</p>
            </div>

            <form onSubmit={handleSearch} className="w-full md:w-96 relative">
              <input
                type="text"
                placeholder="Search email, phone, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                disabled={isSearching || searchQuery.length < 3}
                className="absolute right-1 top-1 bottom-1 bg-[#2C3E50] text-white px-3 rounded-md text-xs font-semibold hover:bg-[#1a252f] transition disabled:opacity-50"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>
          </div>

          {(stats.recentErrorCount > 0 || stats.recentFailedPayments > 0 || stats.totalUnpaidLeads > 5) && (
            <div className="mb-6 space-y-2">
              {stats.recentErrorCount > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-bold text-red-800 text-sm">System Errors Detected</p>
                    <p className="text-red-700 text-xs">There have been {stats.recentErrorCount} system errors in the last 24 hours. Check the error log below.</p>
                  </div>
                </div>
              )}

              {stats.recentFailedPayments > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-bold text-amber-800 text-sm">Payment Failures</p>
                    <p className="text-amber-700 text-xs">There were {stats.recentFailedPayments} failed payment attempts in the last 24 hours. Users may need assistance.</p>
                  </div>
                </div>
              )}

              {stats.totalUnpaidLeads > 5 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="font-bold text-blue-800 text-sm">Follow-up Required</p>
                    <p className="text-blue-700 text-xs">There are {stats.totalUnpaidLeads} abandoned BOQ uploads. Consider contacting them to recover sales.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 items-stretch">
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                +{stats.recentSignups} this week
              </div>
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mt-2">Total Users</p>
              <p className="text-3xl font-bold text-[#2C3E50] mb-3">{stats.totalUsers}</p>
              
              <div className="mt-auto space-y-1">
                <button onClick={() => setSelectedRole('client')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20] transition">
                  <span>Clients</span>
                  <span className="font-semibold">{roles.client}</span>
                </button>
                <button onClick={() => setSelectedRole('worker')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20] transition">
                  <span>Workers</span>
                  <span className="font-semibold">{roles.worker}</span>
                </button>
                <button onClick={() => setSelectedRole('architect')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20] transition">
                  <span>Architects</span>
                  <span className="font-semibold">{roles.architect}</span>
                </button>
                <button onClick={() => setSelectedRole('construction')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20] transition">
                  <span>Construction</span>
                  <span className="font-semibold">{roles.construction}</span>
                </button>
                <button onClick={() => setSelectedRole('hardware')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20] transition">
                  <span>Hardware</span>
                  <span className="font-semibold">{roles.hardware}</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                +${stats.recentRevenue} this week
              </div>
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mt-2">Total Revenue</p>
              <p className="text-3xl font-bold text-[#F47B20] mt-1">${stats.totalRevenue.toFixed(2)}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mt-2">Completed BOQs</p>
              <p className="text-3xl font-bold text-[#2C3E50] mt-1">{stats.completedProjects}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mt-2">Total Uploads</p>
              <p className="text-3xl font-bold text-gray-500 mt-1">{stats.totalProjectsStarted}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mt-2">Urgent Jobs</p>
              <p className="text-3xl font-bold text-[#2C3E50] mt-1">{stats.totalUrgentJobs}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Revenue & BOQs (Last 7 Days)</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => val.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name) => {
                        if (name === 'revenue') return [`$${value}`, 'Revenue'];
                        if (name === 'boqs') return [value, 'BOQs Generated'];
                        return [value, name];
                      }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#F47B20" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="boqs" stroke="#2C3E50" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-red-50">
                <h2 className="font-bold text-red-700 flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Recent System Errors
                </h2>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                {!recentLogs || recentLogs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center justify-center h-full">
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    All systems healthy. No recent errors.
                  </div>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="p-3 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-red-600 truncate mr-2">{log.message}</span>
                        <span className="text-gray-400 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      {log.context && (
                        <pre className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-[#2C3E50]">Recent Payments</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentPayments.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No completed payments yet.</div>
                ) : (
                  recentPayments.map((p, i) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm text-[#2C3E50] capitalize">{p.payment_method.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${p.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 capitalize">{p.payment_purpose}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
                <h2 className="font-bold text-amber-800">Recent Unpaid Uploads (Leads)</h2>
                <button 
                  onClick={downloadLeadsCSV}
                  className="text-[10px] bg-amber-800 text-white px-2 py-1 rounded hover:bg-amber-900 transition font-semibold uppercase tracking-wide"
                >
                  Download CSV
                </button>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {recentUnpaidLeads.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No unpaid uploads. Everyone is paying!</div>
                ) : (
                  recentUnpaidLeads.map((p) => {
                    const isExpanded = expandedLead === p.id;
                    const waNumber = toWhatsAppNumber(p.client_phone);
                    
                    return (
                      <div key={p.id} className="border-b border-gray-100 last:border-0">
                        <button 
                          onClick={() => setExpandedLead(isExpanded ? null : p.id)}
                          className="w-full text-left p-4 hover:bg-gray-50 transition flex justify-between items-center"
                        >
                          <div className="truncate pr-4">
                            <p className="font-medium text-sm text-[#2C3E50] truncate">{p.project_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{p.client_name}</p>
                          </div>
                          <div className="text-right flex-shrink-0 flex items-center gap-2">
                            <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="bg-gray-50 p-4 border-t border-gray-100">
                            <div className="text-xs text-gray-600 mb-3 space-y-1">
                              <div className="flex justify-between">
                                <span className="font-semibold">Role:</span>
                                <span className="capitalize">{p.client_role}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-semibold">Phone:</span>
                                <span>{p.client_phone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-semibold">Email:</span>
                                <span className="truncate max-w-[150px]">{p.client_email}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                              {waNumber && (
                                <a
                                  href={`https://wa.me/${waNumber}?text=Hi ${p.client_name}, I noticed you uploaded a plan on VeriBuild but didn't finish generating the BOQ. Did you have trouble with the payment options, or is there anything I can help you with?`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-[#25D366] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1ebe5a] transition flex-1 text-center"
                                >
                                  WhatsApp
                                </a>
                              )}
                              {p.client_phone && (
                                <a
                                  href={`tel:${p.client_phone}`}
                                  className="bg-[#F47B20] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#E06B10] transition flex-1 text-center"
                                >
                                  Call
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* User List Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#2C3E50] p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold capitalize">{selectedRole} Directory</h3>
              <button onClick={() => setSelectedRole(null)} className="text-gray-300 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              {activeUsersList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found in this category.</p>
              ) : (
                <div className="space-y-3">
                  {activeUsersList.map((u) => {
                    const waNumber = toWhatsAppNumber(u.phone);
                    // Generate the role-specific welcome message
                    const welcomeMsg = getWelcomeMessage(u.name, u.role);
                    
                    return (
                      <div key={u.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-[#2C3E50]">{u.name}</p>
                          <span className="text-[10px] text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mb-3">
                          <p>Email: {u.email}</p>
                          <p>Phone: {u.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          {waNumber && (
                            <a
                              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(welcomeMsg)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#25D366] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#1ebe5a] transition"
                            >
                              Send Welcome
                            </a>
                          )}
                          {u.phone !== 'No phone provided' && (
                            <a
                              href={`tel:${u.phone}`}
                              className="bg-[#F47B20] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#E06B10] transition"
                            >
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {searchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#F47B20] p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">Search Results for "{searchQuery}"</h3>
              <button onClick={() => setSearchResults(null)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50 space-y-6">
              
              {searchResults.users.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[#2C3E50] mb-3 uppercase tracking-wider">Users Matched</h4>
                  <div className="space-y-3">
                    {searchResults.users.map((u) => (
                      <div key={u.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-[#2C3E50]">{u.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                          </div>
                          <a
                            href={`https://wa.me/${toWhatsAppNumber(u.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#25D366] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#1ebe5a] transition"
                          >
                            WhatsApp
                          </a>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>Email: {u.email}</p>
                          <p>Phone: {u.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.projects.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[#2C3E50] mb-3 uppercase tracking-wider">Projects Matched</h4>
                  <div className="space-y-2">
                    {searchResults.projects.map((p, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-[#2C3E50]">{p.project_name}</p>
                          <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[#2C3E50] mb-3 uppercase tracking-wider">Payments Found</h4>
                  <div className="space-y-2">
                    {searchResults.payments.map((p, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-[#2C3E50]">{p.transaction_reference}</p>
                          <p className="text-xs text-gray-500 capitalize">{p.payment_method.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-green-600">${p.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{p.payment_status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.users.length === 0 && searchResults.projects.length === 0 && searchResults.payments.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">No results found for "{searchQuery}"</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
                                                   }
