import { Modal } from '../ui/Modal';
import { AuthForm } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

export function AuthModal({ isOpen, onClose, mode, onSuccess, onModeChange }: AuthModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="px-4 py-5 sm:p-6">
        <AuthForm 
          mode={mode} 
          onSuccess={onSuccess} 
          onModeChange={onModeChange}
        />
      </div>
    </Modal>
  );
} 