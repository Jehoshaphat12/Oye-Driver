import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { AuthService } from '../services/authService';
import { FirestoreService } from '../services/firestoreService';
import type { VehicleType } from '../types';

// ─── Input Sanitizers ─────────────────────────────────────────────────────────
// Applied on every onChange so the field never holds dirty data.

/** Full name: letters, spaces, hyphens, apostrophes only; collapse runs of spaces. */
function sanitizeName(v: string): string {
  return v
    .replace(/[^a-zA-Z\s\-']/g, '')   // strip invalid chars
    .replace(/\s{2,}/g, ' ')           // collapse multiple spaces
    .replace(/^[\s]/, '');             // no leading space on first char
}

/** Email: strip all whitespace, force lowercase. */
function sanitizeEmail(v: string): string {
  return v.replace(/\s/g, '').toLowerCase();
}

/** Phone: keep only digits and a single leading +, max 15 chars (E.164). */
function sanitizePhone(v: string): string {
  const leading = v.startsWith('+') ? '+' : '';
  const digits = v.replace(/\D/g, '');
  return (leading + digits).slice(0, 15);
}

/** Plate number: alphanumeric + hyphens only, forced uppercase, max 12 chars. */
function sanitizePlate(v: string): string {
  return v
    .replace(/[^a-zA-Z0-9\-]/g, '')
    .toUpperCase()
    .slice(0, 12);
}

/** Vehicle model: letters, digits, spaces, hyphens; collapse spaces; trim leading. */
function sanitizeVehicleModel(v: string): string {
  return v
    .replace(/[^a-zA-Z0-9\s\-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s]/, '');
}

/** Vehicle color: letters and spaces only; capitalize first letter. */
function sanitizeColor(v: string): string {
  const clean = v
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s]/, '');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// ─── Validators ───────────────────────────────────────────────────────────────

const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validatePhone  = (p: string) => p.replace(/\D/g, '').length >= 7;
const validatePw     = (p: string) => p.length >= 6;

// ─── Step 1 field-level errors ────────────────────────────────────────────────

interface Step1Errors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

interface Step2Errors {
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleColor?: string;
}

// ─── Vehicle type selector button ─────────────────────────────────────────────

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: 'motorcycle' | 'box' | 'bicycle' }[] = [
  { type: 'motor',            label: 'Motor',    icon: 'motorcycle' },
  { type: 'delivery',         label: 'Delivery', icon: 'box'        },
  { type: 'bicycle_delivery', label: 'Bicycle',  icon: 'bicycle'    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DriverSignUpPage() {
  const navigate = useNavigate();

  // Step
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name,            setName           ] = useState('');
  const [email,           setEmail          ] = useState('');
  const [phone,           setPhone          ] = useState('');
  const [password,        setPassword       ] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw,          setShowPw         ] = useState(false);
  const [showCpw,         setShowCpw        ] = useState(false);
  const [photoFile,       setPhotoFile      ] = useState<File | null>(null);
  const [photoPreview,    setPhotoPreview   ] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 fields
  const [vehicleType,   setVehicleType  ] = useState<VehicleType>('motor');
  const [vehicleModel,  setVehicleModel ] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleColor,  setVehicleColor ] = useState('');

  // UI state
  const [loading,      setLoading     ] = useState(false);
  const [step1Errors,  setStep1Errors ] = useState<Step1Errors>({});
  const [step2Errors,  setStep2Errors ] = useState<Step2Errors>({});
  const [submitError,  setSubmitError ] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Photo picker ─────────────────────────────────────────────────────────────

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Photo must be under 5 MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // ── Step 1 validation ────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const errs: Step1Errors = {};

    const trimmedName = name.trim();
    if (!trimmedName)               errs.name = 'Full name is required';
    else if (trimmedName.length < 2) errs.name = 'Name must be at least 2 characters';

    if (!email)                     errs.email = 'Email address is required';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address';

    if (!phone)                     errs.phone = 'Phone number is required';
    else if (!validatePhone(phone)) errs.phone = 'Enter a valid phone number (min 7 digits)';

    if (!password)                  errs.password = 'Password is required';
    else if (!validatePw(password)) errs.password = 'Password must be at least 6 characters';

    if (!confirmPassword)           errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) setStep(2);
  };

  // ── Step 2 validation + submit ────────────────────────────────────────────────

  const validateStep2 = (): boolean => {
    const errs: Step2Errors = {};

    if (!vehicleModel.trim())   errs.vehicleModel  = 'Vehicle model is required';
    if (!vehicleNumber.trim())  errs.vehicleNumber = 'Plate number is required';
    else if (vehicleNumber.length < 3) errs.vehicleNumber = 'Enter a valid plate number';
    if (!vehicleColor.trim())   errs.vehicleColor  = 'Vehicle color is required';

    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;
    setSubmitError('');
    setLoading(true);

    try {
      // 1. Create Firebase Auth + users doc
      const user = await AuthService.registerDriver(
        email.trim(),
        password,
        name.trim(),
        phone.trim(),
      );

      // 2. Upload profile photo if selected
      setUploadingPhoto(true);
      let photoUrl: string | undefined;
      if (photoFile) {
        try {
          photoUrl = await FirestoreService.uploadProfilePhoto(user.id, photoFile);
        } catch (e) {
          console.warn('Photo upload failed, continuing without it:', e);
        }
      }
      setUploadingPhoto(false);

      // 3. Create drivers doc with vehicle info
      await FirestoreService.createDriverProfile(user.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        vehicle: {
          vehicleType,
          vehicleModel: vehicleModel.trim(),
          vehicleNumber: vehicleNumber.trim(),
          color: vehicleColor.trim(),
        },
        isAvailable: false,
        isOnline: false,
        rating: 0,
        totalTrips: 0,
        isVerified: false,
        ...(photoUrl ? { photoUrl } : {}),
      });

      // 4. If photo was uploaded, patch users doc too
      if (photoUrl) {
        await FirestoreService.updateUser(user.id, { photoUrl } as any);
      }

      navigate('/', { replace: true });
    } catch (err: any) {
      setUploadingPhoto(false);
      const code: string = err?.code ?? '';
      if (code === 'auth/email-already-in-use')
        setSubmitError('This email is already registered. Try signing in instead.');
      else if (code === 'auth/weak-password')
        setSubmitError('Password is too weak. Use at least 6 characters.');
      else if (code === 'auth/network-request-failed')
        setSubmitError('Network error. Check your connection and try again.');
      else
        setSubmitError('Registration failed. Please try again.');
      // On error drop back to step 1 so user can fix
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderField = (
    label: string,
    iconName: Parameters<typeof Icon>[0]['name'],
    inputEl: React.ReactNode,
    error?: string,
    hint?: string,
  ) => (
    <div style={ss.field}>
      <label style={ss.label}>{label}</label>
      <div style={{ ...ss.inputWrap, ...(error ? ss.inputWrapError : {}) }}>
        <Icon name={iconName} size={18} color={error ? '#f44336' : '#aaa'} />
        {inputEl}
      </div>
      {error  && <p style={ss.fieldError}>{error}</p>}
      {hint && !error && <p style={ss.hint}>{hint}</p>}
    </div>
  );

  const PwInput = ({
    value, onChange, show, onToggle, placeholder, error, name: fieldName,
  }: {
    value: string; onChange: (v: string) => void; show: boolean;
    onToggle: () => void; placeholder: string; error?: string; name: string;
  }) => (
    <div style={ss.field}>
      <label style={ss.label}>{fieldName === 'password' ? 'Password' : 'Confirm Password'}</label>
      <div style={{ ...ss.inputWrap, ...(error ? ss.inputWrapError : {}) }}>
        <Icon name="lock" size={18} color={error ? '#f44336' : '#aaa'} />
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ss.input}
          autoComplete={fieldName === 'password' ? 'new-password' : 'new-password'}
        />
        <button style={ss.eyeBtn} type="button" onClick={onToggle} tabIndex={-1}>
          <Icon name={show ? 'eye-off' : 'eye'} size={18} color="#aaa" />
        </button>
      </div>
      {error && <p style={ss.fieldError}>{error}</p>}
    </div>
  );

  // ─── Step 1 ───────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <>
      {/* Photo picker */}
      <div style={ss.photoPicker}>
        <div
          style={ss.photoCircle}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          title="Pick a profile photo"
        >
          {photoPreview ? (
            <>
              <img src={photoPreview} alt="Preview" style={ss.photoImg} />
              <div style={ss.photoOverlay}>
                <Icon name="upload" size={16} color="white" />
              </div>
            </>
          ) : (
            <div style={ss.photoPlaceholder}>
              <Icon name="user" size={28} color="#061ffa" />
              <span style={ss.photoLabel}>Add Photo</span>
            </div>
          )}
        </div>
        <span style={ss.photoHint}>Profile photo (optional)</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
      </div>

      {/* Name */}
      {renderField(
        'Full Name',
        'user',
        <input
          type="text"
          placeholder="John Driver"
          value={name}
          onChange={(e) => setName(sanitizeName(e.target.value))}
          style={ss.input}
          autoComplete="name"
          maxLength={60}
        />,
        step1Errors.name,
      )}

      {/* Email */}
      {renderField(
        'Email Address',
        'mail',
        <input
          type="email"
          placeholder="driver@email.com"
          value={email}
          onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
          style={ss.input}
          autoComplete="email"
          inputMode="email"
          maxLength={254}
        />,
        step1Errors.email,
      )}

      {/* Phone */}
      {renderField(
        'Phone Number',
        'phone',
        <input
          type="tel"
          placeholder="+233 20 000 0000"
          value={phone}
          onChange={(e) => setPhone(sanitizePhone(e.target.value))}
          style={ss.input}
          autoComplete="tel"
          inputMode="tel"
        />,
        step1Errors.phone,
        'Include country code, e.g. +233',
      )}

      {/* Password */}
      <PwInput
        name="password"
        value={password}
        onChange={setPassword}
        show={showPw}
        onToggle={() => setShowPw((v) => !v)}
        placeholder="Minimum 6 characters"
        error={step1Errors.password}
      />

      {/* Confirm password */}
      <PwInput
        name="confirmPassword"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showCpw}
        onToggle={() => setShowCpw((v) => !v)}
        placeholder="Re-enter your password"
        error={step1Errors.confirmPassword}
      />

      <button
        style={{ ...ss.submitBtn, marginTop: 4 }}
        onClick={handleNextStep}
        type="button"
      >
        Next — Vehicle Details
        <Icon name="arrow-right" size={18} color="white" />
      </button>
    </>
  );

  // ─── Step 2 ───────────────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <>
      {/* Vehicle type selector */}
      <div style={ss.field}>
        <label style={ss.label}>Vehicle Type</label>
        <div style={ss.vehicleRow}>
          {VEHICLE_OPTIONS.map(({ type, label, icon }) => {
            const active = vehicleType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setVehicleType(type)}
                style={{
                  ...ss.vehicleBtn,
                  background:   active ? '#061ffa' : '#f5f5f5',
                  borderColor:  active ? '#061ffa' : '#e0e0e0',
                  color:        active ? 'white'   : '#555',
                }}
              >
                <Icon name={icon} size={22} color={active ? 'white' : '#061ffa'} />
                <span style={{ ...ss.vehicleBtnLabel, color: active ? 'white' : '#555' }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vehicle model */}
      {renderField(
        'Vehicle Model',
        'motorcycle',
        <input
          type="text"
          placeholder="e.g. Honda CB150"
          value={vehicleModel}
          onChange={(e) => setVehicleModel(sanitizeVehicleModel(e.target.value))}
          style={ss.input}
          maxLength={50}
        />,
        step2Errors.vehicleModel,
      )}

      {/* Plate number */}
      {renderField(
        'Plate Number',
        'document',
        <input
          type="text"
          placeholder="e.g. GW-1234-20"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(sanitizePlate(e.target.value))}
          style={{ ...ss.input, textTransform: 'uppercase', letterSpacing: 1 }}
          maxLength={12}
        />,
        step2Errors.vehicleNumber,
        'Letters and numbers only, auto-uppercased',
      )}

      {/* Color */}
      {renderField(
        'Vehicle Color',
        'edit',
        <input
          type="text"
          placeholder="e.g. Red, Black, Blue"
          value={vehicleColor}
          onChange={(e) => setVehicleColor(sanitizeColor(e.target.value))}
          style={ss.input}
          maxLength={30}
        />,
        step2Errors.vehicleColor,
      )}

      <button
        style={{
          ...ss.submitBtn,
          opacity: loading ? 0.7 : 1,
          marginTop: 8,
        }}
        onClick={handleSignUp}
        disabled={loading}
        type="button"
      >
        {loading ? (
          <>
            <div style={ss.spinner} />
            {uploadingPhoto ? 'Uploading photo…' : 'Creating account…'}
          </>
        ) : (
          <>
            <Icon name="check-circle" size={18} color="white" />
            Register as Driver
          </>
        )}
      </button>
    </>
  );

  // ─── Page ─────────────────────────────────────────────────────────────────────

  return (
    <div style={ss.screen}>
      {/* Top header — mirrors login page gradient */}
      <div style={ss.topDecor}>
        {/* Back button */}
        {step === 2 ? (
          <button style={ss.backBtn} onClick={() => setStep(1)} type="button">
            <Icon name="arrow-back" size={20} color="white" />
          </button>
        ) : (
          <Link to="/login" style={ss.backBtn}>
            <Icon name="arrow-back" size={20} color="white" />
          </Link>
        )}

        <div style={ss.logoCircle}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M8 28c2-8 6-14 14-14s12 6 14 14" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <circle cx="22" cy="13" r="4" fill="white" />
            <path d="M14 34l4-6h8l4 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={ss.logoText}>OyeRide</div>
        <div style={ss.logoSub}>Become a Driver</div>
      </div>

      {/* Form card */}
      <div style={ss.card}>
        {/* Step indicator */}
        <div style={ss.stepRow}>
          <div style={{ ...ss.stepDot, background: '#061ffa' }} />
          <div style={{ ...ss.stepLine, background: step === 2 ? '#061ffa' : '#e0e0e0' }} />
          <div style={{ ...ss.stepDot, background: step === 2 ? '#061ffa' : '#e0e0e0' }} />
        </div>

        <h2 style={ss.cardTitle}>
          {step === 1 ? 'Create your account' : 'Vehicle Details'}
        </h2>
        <p style={ss.cardSub}>
          {step === 1
            ? 'Step 1 of 2 — Personal information'
            : 'Step 2 of 2 — Your vehicle information'}
        </p>

        {/* Global submit error */}
        {submitError && <div style={ss.errorBox}>{submitError}</div>}

        {step === 1 ? renderStep1() : renderStep2()}

        {/* Terms */}
        <p style={ss.terms}>
          By registering, you agree to our{' '}
          <a href="#" style={ss.termsLink}>Terms of Service</a>
          {' '}and{' '}
          <a href="#" style={ss.termsLink}>Privacy Policy</a>.
        </p>

        {/* Switch to login */}
        <div style={ss.switchRow}>
          <span style={ss.switchText}>Already have an account?</span>{' '}
          <Link to="/login" style={ss.switchLink}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss: Record<string, React.CSSProperties> = {
  screen: {
    flex: 1, minHeight: '100%', display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(160deg, #061ffa 0%, #0215be 40%, #f5f6fa 40%)',
    overflowY: 'auto',
  },

  // ── Header ──
  topDecor: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '48px 20px 44px', gap: 10, position: 'relative',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 38, height: 38, borderRadius: 19,
    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
    border: '1.5px solid rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', textDecoration: 'none', color: 'white',
  },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255,255,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 26, fontWeight: 600, color: 'white', letterSpacing: -0.5,
    fontFamily: "'Poppins', sans-serif",
  },
  logoSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.7)',
    fontFamily: "'Poppins', sans-serif", fontWeight: 500,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  // ── Card ──
  card: {
    background: 'white', borderRadius: '24px 24px 0 0',
    padding: '24px 24px 40px', flex: 1,
    boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
  },

  // ── Step indicator ──
  stepRow: {
    display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20,
  },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    transition: 'background 0.3s',
  },
  stepLine: {
    flex: 1, height: 3, borderRadius: 2, margin: '0 6px',
    transition: 'background 0.3s',
  },

  cardTitle: {
    fontSize: 21, fontWeight: 600, color: '#222',
    fontFamily: "'Poppins', sans-serif", marginBottom: 4,
  },
  cardSub: {
    fontSize: 13, color: '#888',
    fontFamily: "'Poppins', sans-serif", marginBottom: 20,
  },

  errorBox: {
    background: '#fff0f0', border: '1px solid #ffcccc', color: '#d32f2f',
    padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 16,
    fontFamily: "'Poppins', sans-serif", lineHeight: 1.45,
  },

  // ── Photo picker ──
  photoPicker: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginBottom: 20, gap: 6,
  },
  photoCircle: {
    width: 88, height: 88, borderRadius: 44,
    border: '2px dashed #061ffa',
    background: '#f0f3ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', overflow: 'hidden', position: 'relative',
    transition: 'border-color 0.2s',
  },
  photoImg: {
    width: '100%', height: '100%', objectFit: 'cover', borderRadius: 44,
  },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  photoLabel: {
    fontSize: 11, color: '#061ffa', fontFamily: "'Poppins', sans-serif", fontWeight: 600,
  },
  photoHint: {
    fontSize: 12, color: '#aaa', fontFamily: "'Poppins', sans-serif",
  },

  // ── Form fields ──
  field: { marginBottom: 14 },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#555',
    marginBottom: 7, fontFamily: "'Poppins', sans-serif",
  },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#f5f5f5', borderRadius: 14, padding: '0 14px', height: 52,
    border: '1.5px solid transparent', transition: 'border-color 0.2s',
  },
  inputWrapError: {
    border: '1.5px solid #f44336', background: '#fff8f8',
  },
  input: {
    flex: 1, border: 'none', background: 'transparent',
    fontSize: 15, color: '#333', outline: 'none',
    fontFamily: "'Poppins', sans-serif",
  },
  eyeBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 0,
  },
  fieldError: {
    fontSize: 12, color: '#f44336', marginTop: 5,
    fontFamily: "'Poppins', sans-serif",
  },
  hint: {
    fontSize: 12, color: '#aaa', marginTop: 4,
    fontFamily: "'Poppins', sans-serif",
  },

  // ── Vehicle type buttons ──
  vehicleRow: {
    display: 'flex', gap: 10,
  },
  vehicleBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6, padding: '14px 8px', borderRadius: 14,
    border: '1.5px solid', cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Poppins', sans-serif",
  },
  vehicleBtnLabel: {
    fontSize: 12, fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
  },

  // ── Submit button ──
  submitBtn: {
    width: '100%', height: 56, borderRadius: 16,
    background: '#061ffa', border: 'none',
    color: 'white', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
    marginTop: 6, marginBottom: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'opacity 0.2s',
  },
  spinner: {
    width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)',
    borderTop: '2.5px solid white', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // ── Footer ──
  terms: {
    fontSize: 12, color: '#aaa', textAlign: 'center',
    fontFamily: "'Poppins', sans-serif", lineHeight: '1.6', marginBottom: 14,
  },
  termsLink: { color: '#061ffa', fontWeight: 600 },
  switchRow: {
    display: 'flex', justifyContent: 'center', gap: 4,
  },
  switchText: {
    fontSize: 14, color: '#888', fontFamily: "'Poppins', sans-serif",
  },
  switchLink: {
    fontSize: 14, fontWeight: 700, color: '#061ffa',
    fontFamily: "'Poppins', sans-serif", textDecoration: 'none',
  },
};
