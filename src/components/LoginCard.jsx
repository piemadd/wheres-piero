import { useState } from 'react';
import { users } from '../lib/pocketbase';

const LoginCard = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await users().authWithPassword(email.trim(), password);
    } catch (err) {
      setError(err.status === 400 ? 'Incorrect email or password.' : err.message || 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <div className="login-backdrop">
      <form className="card login" onSubmit={onSubmit}>
        <h1>Where's Piero?</h1>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginCard;
