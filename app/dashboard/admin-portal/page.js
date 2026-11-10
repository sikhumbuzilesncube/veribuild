'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [expandedLead, setExpandedLead] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Discount form states
  const [newCode, setNewCode] = useState('');
  const [newPercentage, setNewPercentage] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);

  const loadStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    try {
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!res.ok) { if (res.status === 403) { router.replace('/dashboard'); return; } throw new Error('Failed'); }
      setData(await res.json());
    } catch (err) { setError('Could not load admin data.'); } finally { setLoading(false); }
  };

  useEffect(() => { loadStats(); }, [router]);

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!newCode || !newPercentage) return;
    setCreatingCode(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: newCode, percentage: newPercentage, maxUses: newMaxUses || 100 }),
      });
      if (res.ok) { setNewCode(''); setNewPercentage(''); setNewMaxUses(''); await loadStats(); }
      else { const err = await res.json(); alert(err.error || 'Failed'); }
    } catch (err) { alert('Failed'); } finally { setCreatingCode(false); }
  };

  // NEW: Disable code handler
  const handleDisableCode = async (codeId) => {
    if (!confirm('Are you sure you want to disable this code? It will stop working immediately.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/discounts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ codeId }),
      });
      if (res.ok) await loadStats();
      else { const err = await res.json(); alert(err.error || 'Failed to disable code'); }
    } catch (err) { alert('Failed to disable code'); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) setSearchResults(await res.json());
    } catch (err) {} finally { setIsSearching(false); }
  };

  const toWhatsAppNumber = (phone) => {
    if (!phone) return '';
    let cleaned = String(phone).replace(/[^\d+]/g, '').replace(/^\+/, '');
    if (cleaned.startsWith('0')) cleaned = '263' + cleaned.slice(1);
    return cleaned;
  };

  const getWelcomeMessage = (name, role) => {
    const base = `Hi ${name}, this is the founder of VeriBuild. Welcome aboard! `;
    switch (role) {
      case 'client': return base + `I saw you just signed up. Do you need any help uploading your floor plan or finding a contractor for your project? Let me know!`;
      case 'worker': return base + `I saw you just signed up. Have you completed your profile yet? Once it's active, clients will be able to find you for jobs in your city. Let me know if you need help setting it up!`;
      case 'architect': return base + `I saw you just signed up. We're helping homeowners find trusted architects across Zimbabwe. Do you need any help setting up your firm's profile and portfolio?`;
      case 'construction': return base + `I saw you just signed up. We're connecting builders with clients who are ready to build. Do you need any help setting up your company listing?`;
      case 'hardware': return base + `I saw you just signed up. We're helping hardware stores get discovered by builders. Do you need any help uploading your product prices?`;
      default: return base + `I saw you just signed up. Let me know if you need any help getting started!`;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !data) return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="md:ml-64 p-6"><div className="bg-red-50 text-red-700 p-4 rounded-lg">{error || 'Unauthorized'}</div></div></div>;

  const { stats, recentPayments, chartData, recentLogs, recentUnpaidLeads, usersByRole, discountCodes } = data;
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
              <input type="text" placeholder="Search email, phone, or project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] outline-none text-sm" />
              <button type="submit" disabled={isSearching || searchQuery.length < 3} className="absolute right-1 top-1 bottom-1 bg-[#2C3E50] text-white px-3 rounded-md text-xs font-semibold disabled:opacity-50">{isSearching ? '...' : 'Search'}</button>
            </form>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('overview')} className={`py-3 px-6 font-semibold text-sm border-b-2 ${activeTab === 'overview' ? 'border-[#F47B20] text-[#F47B20]' : 'border-transparent text-gray-500'}`}>Overview & Leads</button>
            <button onClick={() => setActiveTab('discounts')} className={`py-3 px-6 font-semibold text-sm border-b-2 ${activeTab === 'discounts' ? 'border-[#F47B20] text-[#F47B20]' : 'border-transparent text-gray-500'}`}>Discount Codes</button>
          </div>

          {activeTab === 'overview' && (
            <>
              {(stats.recentErrorCount > 0 || stats.recentFailedPayments > 0 || stats.totalUnpaidLeads > 5) && (
                <div className="mb-6 space-y-2">
                  {stats.recentErrorCount > 0 && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-sm"><strong className="text-red-800">System Errors Detected:</strong> <span className="text-red-700">{stats.recentErrorCount} errors in the last 24 hours.</span></div>}
                  {stats.recentFailedPayments > 0 && <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-sm"><strong className="text-amber-800">Payment Failures:</strong> <span className="text-amber-700">{stats.recentFailedPayments} failed attempts in the last 24 hours.</span></div>}
                  {stats.totalUnpaidLeads > 5 && <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-sm"><strong className="text-blue-800">Follow-up Required:</strong> <span className="text-blue-700">{stats.totalUnpaidLeads} abandoned BOQ uploads.</span></div>}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Total Users</p>
                  <p className="text-3xl font-bold text-[#2C3E50] mb-3">{stats.totalUsers}</p>
                  <div className="mt-auto space-y-1">
                    <button onClick={() => setSelectedRole('client')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20]"><span>Clients</span><span className="font-semibold">{roles.client}</span></button>
                    <button onClick={() => setSelectedRole('worker')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20]"><span>Workers</span><span className="font-semibold">{roles.worker}</span></button>
                    <button onClick={() => setSelectedRole('architect')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20]"><span>Architects</span><span className="font-semibold">{roles.architect}</span></button>
                    <button onClick={() => setSelectedRole('construction')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20]"><span>Construction</span><span className="font-semibold">{roles.construction}</span></button>
                    <button onClick={() => setSelectedRole('hardware')} className="w-full flex justify-between text-xs text-gray-600 hover:text-[#F47B20]"><span>Hardware</span><span className="font-semibold">{roles.hardware}</span></button>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Total Revenue</p>
                  <p className="text-3xl font-bold text-[#F47B20] mt-1">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Completed BOQs</p>
                  <p className="text-3xl font-bold text-[#2C3E50] mt-1">{stats.completedProjects}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Total Uploads</p>
                  <p className="text-3xl font-bold text-gray-500 mt-1">{stats.totalProjectsStarted}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Urgent Jobs</p>
                  <p className="text-3xl font-bold text-[#2C3E50] mt-1">{stats.totalUrgentJobs}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-white p-5 rounded-xl border border-gray-100">
                  <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Revenue & BOQs (Last 7 Days)</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => val.slice(5)} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#F47B20" strokeWidth={3} />
                        <Line yAxisId="right" type="monotone" dataKey="boqs" stroke="#2C3E50" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 flex flex-col">
                  <div className="p-4 border-b bg-red-50"><h2 className="font-bold text-red-700 text-sm">Recent System Errors</h2></div>
                  <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                    {!recentLogs || recentLogs.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center justify-center h-full">All systems healthy. No recent errors.</div>
                    ) : (
                      recentLogs.map((log) => (
                        <div key={log.id} className="p-3 text-xs">
                          <span className="font-semibold text-red-600 truncate">{log.message}</span>
                          <pre className="text-[10px] text-gray-500 bg-gray-50 p-2 mt-1 rounded overflow-x-auto">{JSON.stringify(log.context)}</pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b bg-gray-50"><h2 className="font-bold text-[#2C3E50]">Recent Payments (Who used promos)</h2></div>
                  <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {recentPayments.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No payments yet.</div>
                    ) : (
                      recentPayments.map((p, i) => (
                        <div key={i} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm text-[#2C3E50] capitalize">{p.payment_method.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-gray-800 font-semibold mt-0.5">{p.client_name}</p>
                            <p className="text-[10px] text-gray-500">{p.client_email}</p>
                            {p.discount_code_used && (
                              <span className="inline-block mt-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                Promo: {p.discount_code_used}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+${p.amount.toFixed(2)}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{p.payment_purpose}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b bg-amber-50"><h2 className="font-bold text-amber-800">Recent Unpaid Uploads (Leads)</h2></div>
                  <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {recentUnpaidLeads.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No unpaid uploads.</div>
                    ) : (
                      recentUnpaidLeads.map((p) => {
                        const isExpanded = expandedLead === p.id;
                        const waNumber = toWhatsAppNumber(p.client_phone);
                        return (
                          <div key={p.id} className="border-b last:border-0">
                            <button onClick={() => setExpandedLead(isExpanded ? null : p.id)} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center">
                              <div className="truncate pr-4">
                                <p className="font-medium text-sm text-[#2C3E50] truncate">{p.project_name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{p.client_name}</p>
                              </div>
                              <div className="text-right text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</div>
                            </button>
                            {isExpanded && (
                              <div className="bg-gray-50 p-4 border-t">
                                <div className="text-xs text-gray-600 mb-3 space-y-1">
                                  <div className="flex justify-between"><span>Role:</span><span className="capitalize">{p.client_role}</span></div>
                                  <div className="flex justify-between"><span>Phone:</span><span>{p.client_phone}</span></div>
                                  <div className="flex justify-between"><span>Email:</span><span className="truncate max-w-[150px]">{p.client_email}</span></div>
                                </div>
                                <div className="flex gap-2">
                                  {waNumber && <a href={`https://wa.me/${waNumber}?text=Hi ${p.client_name}, I noticed you uploaded a plan on VeriBuild but didn't finish generating the BOQ. Did you have trouble with the payment options?`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-3 py-1.5 rounded text-xs font-semibold flex-1 text-center">WhatsApp</a>}
                                  {p.client_phone && <a href={`tel:${p.client_phone}`} className="bg-[#F47B20] text-white px-3 py-1.5 rounded text-xs font-semibold flex-1 text-center">Call</a>}
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
            </>
          )}

          {activeTab === 'discounts' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Create New Discount Code</h2>
                <form onSubmit={handleCreateCode} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full"><label className="block text-xs font-semibold mb-1">Code</label><input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="LAUNCH50" className="w-full px-4 py-2 border rounded-lg uppercase" required /></div>
                  <div className="w-full md:w-32"><label className="block text-xs font-semibold mb-1">Discount %</label><input type="number" value={newPercentage} onChange={(e) => setNewPercentage(e.target.value)} placeholder="50" className="w-full px-4 py-2 border rounded-lg" required /></div>
                  <div className="w-full md:w-32"><label className="block text-xs font-semibold mb-1">Max Uses</label><input type="number" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} placeholder="100" className="w-full px-4 py-2 border rounded-lg" /></div>
                  <button type="submit" disabled={creatingCode} className="w-full md:w-auto bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold">{creatingCode ? '...' : 'Create'}</button>
                </form>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50"><h2 className="font-bold text-[#2C3E50]">Active Codes</h2></div>
                <div className="divide-y divide-gray-100">
                  {!discountCodes || discountCodes.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No codes created yet.</div> : discountCodes.map((code) => (
                    <div key={code.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg text-[#2C3E50]">{code.code}</p>
                        <p className="text-xs text-gray-500">{new Date(code.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-sm font-semibold text-green-600">{code.percentage}% Off</p>
                          <p className="text-xs text-gray-500">{code.times_used} / {code.max_uses} used</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{code.is_active ? 'Active' : 'Inactive'}</span>
                          {code.is_active && (
                            <button onClick={() => handleDisableCode(code.id)} className="text-[10px] text-red-500 hover:text-red-700 font-semibold">Disable</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#2C3E50] p-4 flex justify-between text-white"><h3 className="text-lg font-bold capitalize">{selectedRole} Directory</h3><button onClick={() => setSelectedRole(null)} className="text-white">X</button></div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              {activeUsersList.length === 0 ? <p className="text-center text-gray-500 py-8">No users found.</p> : (
                <div className="space-y-3">
                  {activeUsersList.map((u) => (
                    <div key={u.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2"><p className="font-bold text-[#2C3E50]">{u.name}</p><span className="text-[10px] text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span></div>
                      <div className="text-xs text-gray-600 space-y-1 mb-3"><p>Email: {u.email}</p><p>Phone: {u.phone}</p></div>
                      <div className="flex gap-2">
                        {toWhatsAppNumber(u.phone) && <a href={`https://wa.me/${toWhatsAppNumber(u.phone)}?text=${encodeURIComponent(getWelcomeMessage(u.name, u.role))}`} target="_blank" className="bg-[#25D366] text-white px-3 py-1 rounded text-xs font-semibold">Send Welcome</a>}
                        {u.phone !== 'No phone provided' && <a href={`tel:${u.phone}`} className="bg-[#F47B20] text-white px-3 py-1 rounded text-xs font-semibold">Call</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {searchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#F47B20] p-4 flex justify-between text-white"><h3 className="text-lg font-bold">Results for "{searchQuery}"</h3><button onClick={() => setSearchResults(null)} className="text-white">X</button></div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50 space-y-6">
              {searchResults.users.length > 0 && <div><h4 className="text-sm font-bold mb-3">Users</h4><div className="space-y-3">{searchResults.users.map(u => <div key={u.id} className="bg-white border rounded-lg p-4 flex justify-between items-center"><div><p className="font-bold">{u.name}</p><p className="text-xs text-gray-500">{u.email} · {u.phone}</p></div><a href={`https://wa.me/${toWhatsAppNumber(u.phone)}`} target="_blank" className="bg-[#25D366] text-white px-3 py-1 rounded text-xs font-semibold">WhatsApp</a></div>)}</div></div>}
              {searchResults.projects.length > 0 && <div><h4 className="text-sm font-bold mb-3">Projects</h4><div className="space-y-2">{searchResults.projects.map((p, i) => <div key={i} className="bg-white border rounded-lg p-3"><p className="font-semibold text-sm">{p.project_name}</p><p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p></div>)}</div></div>}
              {searchResults.payments.length > 0 && <div><h4 className="text-sm font-bold mb-3">Payments</h4><div className="space-y-2">{searchResults.payments.map((p, i) => <div key={i} className="bg-white border rounded-lg p-3 flex justify-between items-center"><div><p className="font-semibold text-sm">{p.transaction_reference}</p><p className="text-xs text-gray-500">{p.payment_method}</p></div><p className="font-bold text-green-600">${p.amount}</p></div>)}</div></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
    }
