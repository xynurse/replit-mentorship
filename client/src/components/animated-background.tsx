import { useTheme } from "./theme-provider";

export function AnimatedBackground() {
  const { theme } = useTheme();

  if (theme !== "dark") return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute rounded-full"
        style={{
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
        }} 
      />
      <div 
        className="absolute rounded-full"
        style={{
          bottom: '-30%',
          left: '-15%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse',
        }} 
      />
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} 
      />
    </div>
  );
}
