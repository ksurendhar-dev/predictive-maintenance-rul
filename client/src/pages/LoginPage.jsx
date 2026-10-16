import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Wrench, Eye, ArrowRight, Lock, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_DEMO_USERS = [
  {
    username: 'admin',
    password: 'password123',
    name: 'Dr. Elena Vance',
    role: 'ADMIN',
    title: 'Reliability Engineer',
    desc: 'Full access to fleet simulation & diagnostics',
    icon: ShieldCheck,
    badgeColor: '#ea580c',
    badgeBg: '#fff7ed'
  },
  {
    username: 'tech',
    password: 'password123',
    name: 'Marcus Brody',
    role: 'TECHNICIAN',
    title: 'Maintenance Tech',
    desc: 'Acknowledge alerts & manage repairs',
    icon: Wrench,
    badgeColor: '#0284c7',
    badgeBg: '#f0f9ff'
  },
  {
    username: 'operator',
    password: 'password123',
    name: 'Sarah Chen',
    role: 'OPERATOR',
    title: 'Floor Operator',
    desc: 'Real-time telemetry & machine health view',
    icon: Eye,
    badgeColor: '#059669',
    badgeBg: '#ecfdf5'
  }
];

export const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [demoAccounts, setDemoAccounts] = useState(DEFAULT_DEMO_USERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load live demo users from backend if available
  useEffect(() => {
    let isMounted = true;
    api.getDemoUsers()
      .then(res => {
        if (res.success && isMounted && Array.isArray(res.data) && res.data.length > 0) {
          const merged = res.data.map(u => {
            const match = DEFAULT_DEMO_USERS.find(d => d.username === u.username);
            return {
              ...u,
              password: match?.password || 'password123',
              desc: match?.desc || u.title,
              icon: match?.icon || ShieldCheck,
              badgeColor: match?.badgeColor || '#64748b',
              badgeBg: match?.badgeBg || '#f8fafc'
            };
          });
          setDemoAccounts(merged);
        }
      })
      .catch(() => {
        // Fall back gracefully to DEFAULT_DEMO_USERS
      });
    return () => { isMounted = false; };
  }, []);

  const handleQuickFill = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password || 'password123');
    setSelectedRole(acc.role);
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.login({ username: username.trim(), password });
      if (res.success && res.data) {
        if (res.token) {
          localStorage.setItem('predictive_token', res.token);
        }
        onLoginSuccess(res.data);
      } else {
        setError(res.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeAccount = demoAccounts.find(d => d.username === username) || demoAccounts[0];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: '24px 16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Branding Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div className="logo-badge" style={{ width: 44, height: 44 }}>
            <Activity size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Equipment Health Monitor
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>
              Predictive Maintenance & RUL Analytics Platform
            </p>
          </div>
        </div>

        {/* Quick Role Fill-In Selector */}
        <div>
          <label style={{ 
            fontSize: '0.72rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            color: 'var(--text-dim)',
            display: 'block',
            marginBottom: 8
          }}>
            Quick Fill-In Role:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {demoAccounts.map(acc => {
              const Icon = acc.icon || ShieldCheck;
              const isSelected = selectedRole === acc.role && username === acc.username;

              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  style={{
                    background: isSelected ? acc.badgeBg : '#ffffff',
                    border: `1.5px solid ${isSelected ? acc.badgeColor : 'var(--border-color)'}`,
                    borderRadius: 8,
                    padding: '8px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  <Icon size={16} style={{ color: acc.badgeColor }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? acc.badgeColor : 'var(--text-main)' }}>
                    {acc.title || acc.role}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>
                    @{acc.username}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Role Capabilities Hint */}
        {activeAccount && (
          <div style={{
            background: activeAccount.badgeBg,
            border: `1px solid ${activeAccount.badgeColor}33`,
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: '0.74rem',
            color: activeAccount.badgeColor,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontWeight: 700 }}>{activeAccount.name}:</span>
            <span style={{ color: 'var(--text-muted)' }}>{activeAccount.desc}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: 'var(--color-danger)',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  const match = demoAccounts.find(d => d.username.toLowerCase() === e.target.value.toLowerCase());
                  if (match) setSelectedRole(match.role);
                }}
                placeholder="Enter username"
                required
                style={{ width: '100%', paddingLeft: 32 }}
              />
              <UserIcon size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{ width: '100%', paddingLeft: 32 }}
              />
              <Lock size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-dim)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4
            }}
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${activeAccount?.title || 'User'}`}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Role-Based Access Control (RBAC) · Industrial Predictive Operations
          </span>
        </div>
      </div>
    </div>
  );
};
