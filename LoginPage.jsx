import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleUser, ShieldCheck, Lock, ArrowRight } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const colors = {
    admin: {
      primary: '#312e81',
      button: '#4338ca',
      secondary: '#e0e7ff',
      bgGradient: 'linear-gradient(135deg, #eef2ff 0%, #e2e8f0 100%)',
      text: '#1e293b',
      iconColor: '#6366f1'
    },
    student: {
      primary: '#ea580c',
      button: '#f97316',
      secondary: '#ffedd5',
      bgGradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      text: '#431407',
      iconColor: '#f97316'
    }
  };

  const theme = role === 'admin' ? colors.admin : colors.student;

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your details');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (role === 'admin') {
        // 🔒 Admin still requires password
        if (email === 'admin' && password === 'admin123') {
          navigate('/admin');
        } else {
          setError('Invalid Admin Credentials');
        }
      } else {
        // ✅ Student just passes the name up to App.js
        if (onLogin) {
          onLogin(email.trim());
        }
        navigate('/student');
      }
      setLoading(false);
    }, 800); // Slightly faster for better UX
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.bgGradient,
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px',
      transition: 'background 0.5s ease'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      width: '100%',
      maxWidth: '900px',
      display: 'flex',
      overflow: 'hidden',
      minHeight: '550px'
    },
    banner: {
      width: '50%',
      padding: '50px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: theme.primary,
      transition: 'background-color 0.5s ease',
      backgroundImage: role === 'admin'
        ? 'radial-gradient(circle at top right, #4338ca 0%, transparent 40%)'
        : 'radial-gradient(circle at top right, #fb923c 0%, transparent 40%)'
    },
    bannerTitle: { fontSize: '36px', fontWeight: '800', marginBottom: '15px', letterSpacing: '-0.5px' },
    bannerText: { fontSize: '16px', opacity: 0.9, lineHeight: '1.6', fontWeight: '400' },
    formSection: {
      width: '50%',
      padding: '50px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      color: theme.text
    },
    toggleContainer: {
      display: 'flex',
      backgroundColor: role === 'student' ? '#FFF7ED' : '#F1F5F9',
      borderRadius: '12px',
      padding: '6px',
      marginBottom: '35px',
      border: `1px solid ${theme.secondary}`
    },
    toggleBtn: (isActive, activeColor) => ({
      flex: 1,
      padding: '12px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: '700',
      fontSize: '14px',
      backgroundColor: isActive ? 'white' : 'transparent',
      color: isActive ? activeColor : '#64748b',
      boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }),
    label: { display: 'block', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: theme.text, marginBottom: '8px', opacity: 0.8 },
    inputWrapper: { position: 'relative', marginBottom: '24px' },
    icon: { position: 'absolute', top: '14px', left: '16px', color: theme.iconColor, width: '20px', transition: 'color 0.3s' },
    input: {
      width: '100%',
      padding: '14px 14px 14px 48px',
      borderRadius: '12px',
      border: '2px solid transparent',
      backgroundColor: role === 'student' ? '#FFF7ED' : '#F8FAFC',
      fontSize: '15px',
      fontWeight: '500',
      outline: 'none',
      color: theme.text,
      transition: 'all 0.2s ease',
      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
    },
    submitBtn: {
      width: '100%',
      padding: '16px',
      backgroundColor: theme.button,
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.8 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginTop: '10px',
      transition: 'transform 0.1s ease, box-shadow 0.2s ease',
      boxShadow: `0 10px 15px -3px ${role === 'admin' ? 'rgba(67, 56, 202, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '20px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.banner}>
          <div>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '10px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              DIVA V1.0
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '500', opacity: 0.9 }}>Verification System</h1>
          </div>
          <div>
            <h2 style={styles.bannerTitle}>
              {role === 'admin' ? 'Official Portal' : 'Student Portal'}
            </h2>
            <p style={styles.bannerText}>
              {role === 'admin'
                ? "Restricted access for authorized personnel. Advanced AI forensics & validation tools."
                : "Your academic achievements, verified and secure. Download credentials instantly."}
            </p>
          </div>
          {/* ✅ UPDATED TEXT HERE */}
          <div style={{ fontSize: '12px', opacity: 0.6, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
            DIVA Verification
          </div>
        </div>

        <div style={styles.formSection}>
          <div style={styles.toggleContainer}>
            <button
              onClick={() => { setRole('admin'); setError(''); }}
              style={styles.toggleBtn(role === 'admin', colors.admin.primary)}
            >
              <ShieldCheck size={18} /> Admin
            </button>
            <button
              onClick={() => { setRole('student'); setError(''); }}
              style={styles.toggleBtn(role === 'student', colors.student.primary)}
            >
              <CircleUser size={18} /> Student
            </button>
          </div>

          <h3 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', color: theme.text }}>
            Welcome Back
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '30px' }}>
            {role === 'admin' ? 'Please enter your credentials to continue.' : 'Enter your name to access your dashboard.'}
          </p>

          <form onSubmit={handleLogin}>
            <div>
              <label style={styles.label}>
                {role === 'admin' ? 'Username / Email' : 'Student Name'}
              </label>
              <div style={styles.inputWrapper}>
                <div style={styles.icon}><CircleUser size={20} /></div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder={role === 'admin' ? "admin" : "Enter your full name"}
                  onFocus={(e) => e.target.style.borderColor = theme.button}
                  onBlur={(e) => e.target.style.borderColor = 'transparent'}
                />
              </div>
            </div>

            {/* ✅ PASSWORD FIELD: Only visible if Admin */}
            {role === 'admin' && (
              <div>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.icon}><Lock size={20} /></div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                    onFocus={(e) => e.target.style.borderColor = theme.button}
                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                  />
                </div>
              </div>
            )}

            {error && <div style={styles.error}><span>⚠️</span> {error}</div>}

            <button
              type="submit"
              style={styles.submitBtn}
              disabled={loading}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? "Verifying..." : "Access Dashboard"} <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;