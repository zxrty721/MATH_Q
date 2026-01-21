import { Facebook, Users } from 'lucide-react';
import { ContentCard } from '../components/ContentCard';

export const AboutPage = () => {
  const creators = [
    { 
      name: 'อนุศิษฏ์ จันทร์', 
      role: 'Web Developer', 
      image: 'https://img.pbntc.site/tar2.jpeg', 
      fbLink: 'https://www.facebook.com/share/1AUWav7cFM/' 
    },
    { 
      name: 'วริสา พานแก้ว', 
      role: 'Web designer', 
      image: 'https://img.pbntc.site/urm.jpeg', 
      fbLink: 'https://www.facebook.com/a.pearl.iris?' 
    },
    { 
      name: 'กมลพรรณ เพชรบาง', 
      role: 'Testing', 
      image: 'https://img.pbntc.site/yok.jpeg', 
      fbLink: 'https://www.facebook.com/share/1FxmBD5P8h/' 
    },
  ];

  return (
    <div className="w-full max-w-2xl h-[85vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 p-4">
      
      <ContentCard variant="score" className="w-full flex-col gap-4 md:gap-6 p-6 md:p-8 bg-[#1e293b]/90 border-slate-600">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 md:p-4 bg-cyan-500/10 rounded-full mb-3 md:mb-4 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Users size={32} className="text-cyan-400 md:w-12 md:h-12" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">คณะผู้จัดทำ</h2>
          <p className="text-slate-400 text-sm">โครงงานสื่อการเรียนรู้คณิตศาสตร์ <span className="text-cyan-400 font-bold">MATH_Q</span></p>
        </div>

        {/* Name List */}
        <div className="w-full flex flex-col gap-3 mt-2 overflow-y-auto max-h-[50vh] custom-scrollbar pr-1">
          {creators.map((person, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-cyan-500/50 transition-all group hover:bg-slate-800/80 active:scale-98">
              <div className="flex items-center gap-4"> 
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={person.image} 
                      alt={person.name} 
                      className="w-full h-full rounded-full object-cover border-2 border-slate-900 bg-slate-800"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="font-bold text-base md:text-xl text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {person.name}
                  </div>
                  <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                    {person.role}
                  </div>
                </div>
              </div>
              
              <a 
                href={person.fbLink} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 md:p-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-full transition-transform hover:scale-110 shadow-lg active:scale-95"
                title="Facebook"
              >
                <Facebook size={20} className="md:w-6 md:h-6" />
              </a>
            </div>
          ))}
        </div>

        <div className="text-center text-slate-500 text-[10px] md:text-xs mt-2">
          © 2026 MATH_Q Project. All rights reserved.
        </div>

      </ContentCard>
    </div>
  );
};