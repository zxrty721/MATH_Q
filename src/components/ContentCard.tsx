import type { ReactNode } from "react";

type CardVariant = 'table' | 'filter' | 'score';

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}

export const ContentCard = ({ children, className = '', variant = 'table' }: ContentCardProps) => {
  // Base Style ที่ทุกกล่องต้องมี
  const baseStyles = "backdrop-blur-md transition-all relative";

  // แยกดีไซน์ตามการใช้งาน
  const variants = {
    // กล่องใหญ่สำหรับใส่ตาราง (สีเข้มสุด)
    table: "bg-[#0f172a]/90 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl",
    
    // กล่องตัวกรอง (Filter Bar)
    filter: "bg-[#1e293b]/80 border border-slate-600 p-3 rounded-2xl shadow-lg flex flex-wrap gap-2 items-center justify-center",
    
    // กล่องโชว์คะแนน (ด้านซ้ายของ History)
    score: "bg-slate-800/50 border border-slate-600 rounded-3xl p-6 shadow-lg flex items-center justify-between"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};