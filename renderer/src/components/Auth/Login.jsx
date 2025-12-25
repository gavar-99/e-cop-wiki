import React, { useState } from 'react';
import bgImage from '../../assets/home-screen.jpg';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await window.wikiAPI.login({ username, password });
    if (result.success) {
      onLogin(result.user);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={loginPanelStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ 
                fontFamily: 'Milker', 
                color: '#fff', 
                margin: '0', 
                fontSize: '3.5em', 
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                letterSpacing: '2px'
            }}>
                E-Cop Wiki
            </h2>
            <h3 style={{ 
                fontFamily: 'Wasted-Vindey', 
                color: 'rgba(255,255,255,0.8)', 
                marginTop: '10px', 
                fontSize: '1.2em', 
                fontWeight: '400',
                letterSpacing: '1px'
            }}>
                Intelligence is the first line of defense.
            </h3>
        </div>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '100%' }}>
          <div style={inputGroupStyle}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={modernInputStyle}
              autoFocus
            />
          </div>
          <div style={inputGroupStyle}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={modernInputStyle}
            />
          </div>
          <button type="submit" style={modernButtonStyle}>
            Login to Vault
          </button>
        </form>
      </div>
    </div>
  );
};

const containerStyle = {
  width: '100vw',
  height: '100vh',
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'stretch',
};

const loginPanelStyle = {
  width: '450px',
  minWidth: '320px',
  height: '100%',
  backgroundColor: 'rgba(20, 30, 40, 0.55)', // More transparent
  backdropFilter: 'blur(15px)',
  WebkitBackdropFilter: 'blur(15px)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '0 50px', // Horizontal padding
  boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
  borderLeft: '1px solid rgba(255,255,255,0.1)',
};

const inputGroupStyle = {
  width: '100%',
};

const modernInputStyle = {
  width: '100%',
  padding: '18px 20px', // More comfortable padding
  fontSize: '1em',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px',
  backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker input bg
  color: '#fff',
  outline: 'none',
  transition: 'all 0.3s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
};

const modernButtonStyle = {
  width: '100%',
  padding: '18px',
  fontSize: '1.4em',
  fontFamily: 'Wasted-Vindey', // Custom font
  backgroundColor: '#d33', // More aggressive red/accent? Or stick to blue? User said "E-Cop" might imply Police Blue, but "Wasted-Vindey" sounds edgy. Let's stick to the previous blue gradient but updated. Or maybe Red for "Top Secret"? 
  // Let's keep the Blue gradient but make it deeper.
  backgroundImage: 'linear-gradient(135deg, #0052d4, #4364f7, #6fb1fc)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 'normal',
  letterSpacing: '1px',
  boxShadow: '0 4px 15px rgba(0, 82, 212, 0.4)',
  transition: 'transform 0.1s ease',
  marginTop: '10px',
  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
};

const errorStyle = {
  backgroundColor: 'rgba(255, 80, 80, 0.1)',
  color: '#ffaaaa',
  border: '1px solid rgba(255, 80, 80, 0.3)',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '0.9em',
  textAlign: 'center',
  width: '100%',
};

export default Login;

