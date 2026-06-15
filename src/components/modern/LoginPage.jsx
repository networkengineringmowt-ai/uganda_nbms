import { useState } from 'react';
import { ShieldCheck, Lock, User } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    const pw = password.trim().toLowerCase();
    
    if (!mail.endsWith('@unra.go.ug')) {
      setError('Access restricted to @unra.go.ug domain users.');
      return;
    }

    if (pw === 'bms') {
      onLogin('bms');
    } else if (pw === 'super') {
      onLogin('super');
    } else if (pw === 'admin') {
      onLogin('admin');
    } else {
      setError('Invalid credentials. Access denied.');
      setPassword('');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="ambient-background" style={{ zIndex: 0 }}></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="mowt.jpg" alt="MoWT Logo" className="login-logo" />
            <div className="login-brand">
              <strong>MoWT BMS</strong>
              <span>National Roads Registry</span>
            </div>
          </div>
          
          <div className="login-body">
            <div className="login-icon-container">
              <ShieldCheck size={48} color="var(--accent-cyan)" />
            </div>
            <h2>Secure Gateway</h2>
            <p>Please authenticate to access the national registry systems.</p>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => { setEmail(e.target.value); setError(''); }} 
                  placeholder="first.lastname@unra.go.ug" 
                  autoFocus 
                  required
                />
              </div>
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => { setPassword(e.target.value); setError(''); }} 
                  placeholder="Enter access code" 
                  required
                />
              </div>
              
              {error && <div className="login-error">{error}</div>}
              
              <button type="submit" className="login-btn">
                Authenticate
              </button>
            </form>
          </div>
          
          <div className="login-footer">
            <p>Authorized access only. Activity is monitored.</p>
          </div>
        </div>
      </div>
      
      <style>{`
        .login-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          background:
            linear-gradient(rgba(75, 111, 177, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(75, 111, 177, 0.06) 1px, transparent 1px),
            radial-gradient(circle at 50% 22%, rgba(52, 97, 187, 0.28), transparent 38%),
            #050817;
          background-size: 34px 34px, 34px 34px, 100% 100%, 100% 100%;
          position: relative;
          overflow: hidden;
        }
        .login-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 24px;
        }
        .login-card {
          background: rgba(5, 13, 32, 0.86);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(96, 165, 250, 0.24);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 24px 70px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.03);
        }
        .login-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
        }
        .login-logo {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          background: #fff;
          padding: 4px;
          object-fit: contain;
        }
        .login-brand {
          display: flex;
          flex-direction: column;
        }
        .login-brand strong {
          font-size: 20px;
          color: #fff;
          letter-spacing: 0.5px;
        }
        .login-brand span {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
        }
        .login-body {
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .login-icon-container {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(96, 165, 250, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .login-body h2 {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 8px;
        }
        .login-body p {
          color: #94a3b8;
          font-size: 14px;
          margin: 0 0 32px;
          line-height: 1.5;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          color: #64748b;
        }
        .input-group input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #fff;
          font-size: 16px;
          outline: none;
          transition: all 0.2s;
        }
        .input-group input:focus {
          border-color: #38bdf8;
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }
        .login-error {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
        }
        .login-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #2563eb, #38bdf8);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
        }
        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(2, 132, 199, 0.5);
        }
        .login-footer {
          padding: 16px;
          text-align: center;
          background: rgba(0, 0, 0, 0.4);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .login-footer p {
          margin: 0;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
