import React, { useState } from 'react';
import { X, User, Lock, Upload } from 'lucide-react';
import { UserProfile, Language, LABELS } from '../types';
import { customDataService } from '../services/customDataService';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  lang?: Language; // Optional prop, usually passed from Layout context if available, but here we can just default to 'cn' if needed or rely on parent
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  // Hack: Since AuthModal is often top level, we assume 'cn' if not passed or rely on App level.
  // Ideally, AuthModal should receive lang. We will stick to the requested "All text to CN" philosophy.
  // But for better architecture, let's assume 'cn' is the default target now.
  const t = LABELS['cn']; 
  
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
       if (!username || !password) {
           setError("Please fill all fields");
           return;
       }
       const newUser: UserProfile = { username, password, avatar, isLoggedIn: true, bio: 'Industrial Expert' };
       const saved = customDataService.register(newUser);
       onLoginSuccess(saved);
       onClose();
    } else {
        const user = customDataService.login(username, password);
        if (user) {
            onLoginSuccess(user);
            onClose();
        } else {
            setError("Invalid credentials (or user not found)");
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
            <h2 className="text-xl font-bold">{isRegister ? t.createAccount : t.welcomeBack}</h2>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isRegister && (
                <div className="flex justify-center mb-4">
                    <label className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 overflow-hidden relative">
                        {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-gray-400" />}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t.username}</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={t.username}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t.password}</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={t.password}
                    />
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors">
                {isRegister ? t.register : t.login}
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
                {isRegister ? t.alreadyAccount : t.noAccount}{" "}
                <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-bold hover:underline">
                    {isRegister ? t.login : t.register}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};