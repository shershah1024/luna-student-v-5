export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      <div className="w-full min-h-screen">{children}</div>
    </div>
  );
}
