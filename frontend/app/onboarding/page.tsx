'use client';

/**
 * /onboarding — Subscription enrollment
 * 
 * Flow:
 *   Step 1: Connect wallet (MetaMask / WalletConnect / Coinbase)
 *   Step 2: Enter email → send magic-link
 *   Step 3: Magic-link lands here with ?token= → verify → enroll subscription
 *   Step 4: Success — redirect to /mlat
 * 
 * No external auth library needed. Works with any EIP-1193 wallet.
 * Magic-link token verification handled by /api/auth/verify route.
 */

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────
type Step = 'wallet' | 'email' | 'check-email' | 'verifying' | 'enrolled' | 'error';

interface WalletState {
  address: string;
  chainId: string;
  provider: 'metamask' | 'coinbase' | 'injected';
}

// ─── Wallet detection helpers ────────────────────────────────────────────────────
function getProvider(): unknown {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.ethereum?.isMetaMask) return w.ethereum;
  if (w.ethereum?.isCoinbaseWallet) return w.ethereum;
  if (w.ethereum) return w.ethereum;
  return null;
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Plan options ────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Basic',
    price: '$0/month',
    features: ['Live tracking', 'Historical data', 'Email support'],
    color: '#10B981',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29/month',
    features: ['Everything in Basic', 'Real-time MLAT', 'AI intelligence', 'Priority support'],
    color: '#3B82F6',
    highlight: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'contact us',
    features: ['Everything in Pro', 'Private sensor cluster', 'Custom MLAT coverage area', 'SLA + support', 'White-label dashboard', 'Hedera mainnet access'],
    color: '#FFB020',
    highlight: false,
  },
];

// ─── Styles ────────────────────────────────────────────────────────────
const S = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdrop: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },
  btnPrimary: {
    background: '#007bff',
    color: 'white',
  },
  btnSecondary: {
    background: '#6c757d',
    color: 'white',
  },
  errorBox: {
    marginTop: '12px',
    padding: '10px 12px',
    background: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#721c24',
  },
  divider: {
    height: '1px',
    background: '#e9ecef',
    margin: '24px 0',
  },
  text: {
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  muted: {
    color: '#6c757d',
    fontSize: '12px',
  },
  success: {
    color: '#28a745',
  },
  heading: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  subheading: {
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '4px',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
function OnboardingPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ─── State ────────────────────────────────────────────────────────────
  const [step,       setStep]       = useState<Step>('wallet');
  const [wallet,     setWallet]     = useState<WalletState | null>(null);
  const [email,      setEmail]      = useState('');
  const [plan,       setPlan]       = useState('operator');
  const [error,      setError]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [hasWallet,  setHasWallet]  = useState(false);

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setStep('verifying');
      // TODO: Verify token with backend
    }
  }, [searchParams]);

  // ─── Wallet detection ────────────────────────────────────────────────────
  useEffect(() => {
    const provider = getProvider();
    setHasWallet(!!provider);
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError('No wallet detected. Install MetaMask or use a Web3 browser.');
      return;
    }

    try {
      setError('');
      const eth = provider as any;
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || !accounts.length) {
        throw new Error('No accounts returned from wallet');
      }

      const chainId = await eth.request({ method: 'eth_chainId' });
      
      let providerName: 'metamask' | 'coinbase' | 'injected';
      if (eth.isMetaMask) providerName = 'metamask';
      else if (eth.isCoinbaseWallet) providerName = 'coinbase';
      else providerName = 'injected';

      setWallet({
        address: accounts[0],
        chainId,
        provider: providerName,
      });
      setStep('email');
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      let errorMessage = 'Wallet connection failed';
      if (err instanceof Error) {
        if (err.message.includes('rejected') || err.message.includes('User denied')) {
          errorMessage = 'Connection rejected. Please approve in your wallet.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Connection timeout. Please try again.';
        } else if (err.message.includes('MetaMask extension not found')) {
          errorMessage = 'MetaMask extension not found. Please install MetaMask first.';
        } else if (err.message.includes('Already processing')) {
          errorMessage = 'Wallet is busy. Please wait and try again.';
        } else if (err.message.includes('Failed to connect to MetaMask')) {
          errorMessage = 'MetaMask connection failed. Please check your MetaMask extension.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    }
  }, []);

  const sendMagicLink = useCallback(async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!wallet) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          wallet_address: wallet.address,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setError('Magic link sent! Please check your email.');
        setStep('check-email');
      } else {
        setError('Failed to send magic link. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Magic link error:', err);
      setError('Failed to send magic link. Please try again.');
    } finally {
      setSending(false);
    }
  }, [email, wallet]);

  // ─── Render step ────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 'wallet':
        return (
          <div style={S.container}>
            <div style={S.card}>
              <div style={S.heading}>Connect Your Wallet</div>
              <div style={S.text}>
                Choose your preferred Web3 wallet to connect with AircraftWorth.
              </div>
              
              {!hasWallet && (
                <div style={{ ...S.errorBox, textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px' }}>🦊 No Wallet Detected</div>
                  <div style={{ marginBottom: '8px' }}>Install a Web3 wallet to continue:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color: '#FFB020', textDecoration: 'underline' }}>
                      • Install MetaMask (Recommended)
                    </a>
                    <a href="https://www.coinbase.com/wallet" target="_blank" rel="noreferrer" style={{ color: '#FFB020', textDecoration: 'underline' }}>
                      • Install Coinbase Wallet
                    </a>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                    Or use "Sign Up with Email" to skip wallet for now
                  </div>
                </div>
              )}
              
              <button onClick={connectWallet} style={{ ...S.btn, ...S.btnPrimary }}>
                Connect MetaMask
              </button>
            </div>
          </div>
        );

      case 'email':
        return (
          <div style={S.container}>
            <div style={S.card}>
              <div style={S.heading}>Enter Your Email</div>
              <div style={S.text}>
                We'll send you a one-click sign-in link. No password needed.
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
                  placeholder="you@example.com"
                  style={S.input}
                  autoFocus
                />
                <button onClick={sendMagicLink} disabled={sending} style={{ ...S.btn, ...S.btnPrimary, minWidth: '140px', height: '40px' }}>
                  {sending ? '⟳ Sending…' : '✉ Send Magic Link'}
                </button>
              </div>
              
              <div style={{ color: '#444', fontSize: '11px', marginTop: '8px' }}>
                We'll send a one-click sign-in link. No password needed.
              </div>
            </div>
            
            {error && <div style={S.errorBox}>{error}</div>}
          </div>
        );

      case 'check-email':
        return (
          <div style={S.container}>
            <div style={S.card}>
              <div style={S.heading}>Check Your Email</div>
              <div style={S.text}>
                We've sent a magic link to <strong>{email}</strong>. Please check your inbox and click the link to continue.
              </div>
            </div>
          </div>
        );

      case 'verifying':
        return (
          <div style={S.container}>
            <div style={S.card}>
              <div style={S.heading}>Verifying Magic Link...</div>
              <div style={S.text}>Please wait while we verify your authentication link.</div>
            </div>
          </div>
        );

      case 'enrolled':
        return (
          <div style={S.container}>
            <div style={S.card}>
              <div style={S.heading}>🎉 Welcome Aboard!</div>
              <div style={S.text}>
                <p style={S.success}>✓ Authentication successful</p>
                <p>You're now ready to start tracking aircraft with AircraftWorth.</p>
              </div>
              <button onClick={() => router.push('/mlat')} style={{ ...S.btn, ...S.btnPrimary, marginTop: '16px' }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div style={S.container}>
            <div style={S.card}>
              <div style={S.heading}>❌ Something went wrong</div>
              <div style={S.text}>{error}</div>
              <button onClick={() => setStep('wallet')} style={{ ...S.btn, ...S.btnSecondary, marginTop: '16px' }}>
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div style={S.container}>
            <div style={S.card}>
              <div style={S.heading}>Loading...</div>
            </div>
          </div>
        );
    }
  };

  return renderStep();
}

// ─── Main Page Component with Suspense Boundary ───────────────────────
const fallbackStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontSize: '18px',
  color: '#666',
  background: '#f8f9fa',
};

export default function OnboardingWrapper() {
  return (
    <Suspense fallback={
      <div style={fallbackStyle}>
        Loading AircraftWorth...
      </div>
    }>
      <OnboardingPage />
    </Suspense>
  );
}
