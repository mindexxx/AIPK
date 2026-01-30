import React, { useState } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { UserProfile, LABELS } from '../types';
import { customDataService } from '../services/customDataService';

interface UserProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const t = LABELS['cn'];
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');

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

  const handleSave = () => {
    const updated = { ...user, username, bio, avatar };
    customDataService.updateProfile(updated);
    onUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-100 p-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">{t.editProfile}</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        
        <div className="p-6 space-y-4">
            <div className="flex justify-center">
                <label className="w-24 h-24 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center cursor-pointer hover:opacity-80 overflow-hidden relative">
                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-500">{username[0]}</span>}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t.displayName}</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t.bio}</label>
                <textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                />
            </div>

            <button onClick={handleSave} className="w-full bg-gray-900 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800">
                <Save className="w-4 h-4" /> {t.save}
            </button>
        </div>
      </div>
    </div>
  );
};