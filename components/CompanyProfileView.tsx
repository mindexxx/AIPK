import React, { useState, useEffect } from 'react';
import { Building2, Save, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { CompanyProfile, Language, LABELS } from '../types';
import { customDataService } from '../services/customDataService';

interface CompanyProfileViewProps {
  lang: Language;
}

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({ lang }) => {
  const [profile, setProfile] = useState<CompanyProfile>({ name: '', description: '', website: '', images: [] });
  const [isSaved, setIsSaved] = useState(false);
  const t = LABELS[lang];

  useEffect(() => {
    setProfile(customDataService.getCompanyProfile());
  }, []);

  const handleSave = () => {
    customDataService.saveCompanyProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                {t.companyProfile}
            </h2>
            <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${isSaved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
            >
                {isSaved ? <span className="flex items-center gap-2">{t.saved}</span> : <><Save className="w-4 h-4" /> {t.save}</>}
            </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t.companyName}</label>
                <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full text-lg font-bold border-b border-gray-200 focus:border-blue-600 outline-none py-2"
                    placeholder={t.enterName}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t.description}</label>
                <textarea 
                    value={profile.description}
                    onChange={(e) => setProfile({...profile, description: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg p-4 h-40 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    placeholder="Describe your company, history, and capabilities..."
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> {t.website}</label>
                    <input 
                        type="url" 
                        value={profile.website}
                        onChange={(e) => setProfile({...profile, website: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="https://example.com"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> {t.coverImage}</label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                        <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setProfile(prev => ({...prev, images: [reader.result as string]}));
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        {profile.images && profile.images.length > 0 ? (
                            <img src={profile.images[0]} className="h-32 mx-auto object-cover rounded" />
                        ) : (
                            <span className="text-gray-400 text-sm">{t.clickUpload}</span>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};