import React, { useEffect, useState } from 'react';
import { ToastNotification } from '../hooks/useNotifications';
import { Icon, IconName } from './Icons';

const TYPE_CONFIG: Record<string, { icon: IconName; accent: string; bg: string }> = {
  ride_accepted:   { icon: 'car',       accent: '#4caf50', bg: '#f0fff4' },
  ride_cancelled:  { icon: 'cancel',    accent: '#f44336', bg: '#fff5f5' },
  ride_completed:  { icon: 'check-circle', accent: '#ff7300', bg: '#fff8f0' },
  chat_message:    { icon: 'chat',      accent: '#2196f3', bg: '#e3f2fd' },
  rating_received: { icon: 'star-fill', accent: '#ff9800', bg: '#fffde7' },
  default:         { icon: 'bell',      accent: '#061ffa', bg: '#e8edff' },
};

interface Props {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onAction?: (type: string, rideId?: string) => void;
}

export default function NotificationToastContainer({ toasts, onDismiss, onAction }: Props) {
  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} onAction={onAction} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss, onAction }: {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  onAction?: (type: string, rideId?: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.default;

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const handleTap = () => {
    onAction?.(toast.type, toast.rideId);
    handleDismiss();
  };

  const isActionable = ['ride_accepted','ride_cancelled','ride_completed','chat_message'].includes(toast.type);

  return (
    <div style={{
      ...styles.toast,
      background: cfg.bg,
      borderLeft: `4px solid ${cfg.accent}`,
      transform: visible && !exiting ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.96)',
      opacity: visible && !exiting ? 1 : 0,
      transition: exiting
        ? 'all 0.3s cubic-bezier(0.4,0,0.6,1)'
        : 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <button style={styles.toastInner} onClick={handleTap}>
        <div style={{ ...styles.iconBox, background: cfg.accent }}>
          <Icon name={cfg.icon} size={18} color="white" strokeWidth={1.75} />
        </div>
        <div style={styles.texts}>
          <div style={styles.title}>{toast.title}</div>
          <div style={styles.body}>{toast.body}</div>
          {isActionable && (
            <div style={{ ...styles.actionHint, color: cfg.accent }}>Tap to view →</div>
          )}
        </div>
      </button>
      <button style={styles.closeBtn} onClick={handleDismiss}>
        <Icon name="close" size={13} color="#999" strokeWidth={2.5} />
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2000,
    padding: '52px 12px 0', display: 'flex', flexDirection: 'column',
    gap: 8, pointerEvents: 'none',
  },
  toast: {
    borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    display: 'flex', alignItems: 'flex-start', overflow: 'hidden',
    pointerEvents: 'all',
  },
  toastInner: {
    flex: 1, display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '12px 8px 12px 14px', background: 'transparent', border: 'none',
    cursor: 'pointer', textAlign: 'left',
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  texts: { flex: 1, overflow: 'hidden' },
  title: { fontSize: 13, fontWeight: 700, color: '#222', fontFamily: "'Poppins', sans-serif", lineHeight: 1.3 },
  body: {
    fontSize: 12, color: '#555', marginTop: 2, lineHeight: 1.4,
    fontFamily: "'Poppins', sans-serif", overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  actionHint: { fontSize: 11, fontWeight: 700, marginTop: 4, fontFamily: "'Poppins', sans-serif" },
  closeBtn: {
    padding: '14px 12px 12px 4px', background: 'transparent',
    border: 'none', cursor: 'pointer', display: 'flex',
    alignItems: 'flex-start', flexShrink: 0,
  },
};
