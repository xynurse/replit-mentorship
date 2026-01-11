import React, { useState, useEffect } from 'react';
import { Heart, Microscope, Lightbulb, Rocket, Building2, Crown, Users, Globe, Calendar, ArrowRight, ChevronRight } from 'lucide-react';

const SONSIELHomepage = () => {
  const [activeTrack, setActiveTrack] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setActiveTrack((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tracks = [
    { name: 'Scientist', icon: Microscope, desc: 'Research & Evidence-Based Practice', color: '#60A5FA' },
    { name: 'Innovator', icon: Lightbulb, desc: 'Design Thinking & Solutions', color: '#FBBF24' },
    { name: 'Entrepreneur', icon: Rocket, desc: 'Healthcare Ventures & Startups', color: '#F472B6' },
    { name: 'Intrapreneur', icon: Building2, desc: 'Organizational Change & Innovation', color: '#34D399' },
    { name: 'Leader', icon: Crown, desc: 'Executive & Strategic Leadership', color: '#A78BFA' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0D4F6B 100%)',
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      color: '#F8FAFC',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {/* Gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-15%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse'
        }} />
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(2deg); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .track-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -10px rgba(20,184,166,0.5);
        }
        
        .login-button:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.6s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px -8px rgba(20,184,166,0.5)'
          }}>
            <Heart size={26} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ 
              fontSize: '22px', 
              fontWeight: '700', 
              letterSpacing: '-0.5px',
              fontFamily: "'Outfit', sans-serif"
            }}>SONSIEL</div>
            <div style={{ 
              fontSize: '11px', 
              color: '#94A3B8', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: '500'
            }}>Mentorship Hub</div>
          </div>
        </div>
        <button className="login-button" style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '10px',
          padding: '12px 28px',
          color: '#F8FAFC',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Sign In
          <ArrowRight size={16} />
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        padding: '40px 48px 60px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Hero Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center',
          marginBottom: '80px'
        }}>
          <div style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease 0.2s'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(20,184,166,0.15)',
              border: '1px solid rgba(20,184,166,0.3)',
              borderRadius: '100px',
              padding: '8px 16px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#5EEAD4'
            }}>
              <Calendar size={14} />
              2026 Cohort Now Active
            </div>
            
            <h1 style={{
              fontSize: '52px',
              fontWeight: '700',
              lineHeight: '1.1',
              marginBottom: '24px',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-1px'
            }}>
              Advancing{' '}
              <span style={{
                background: 'linear-gradient(135deg, #14B8A6 0%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Nursing Excellence</span>{' '}
              Through Mentorship
            </h1>
            
            <p style={{
              fontSize: '18px',
              color: '#94A3B8',
              lineHeight: '1.7',
              marginBottom: '32px',
              maxWidth: '500px'
            }}>
              The <strong style={{ color: '#E2E8F0' }}>Society of Nurse Scientists, Innovators, Entrepreneurs & Leaders</strong> connects nursing professionals with expert mentors across five specialized career tracks.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
              <button className="cta-button" style={{
                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                color: '#F8FAFC',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 12px 32px -8px rgba(20,184,166,0.4)'
              }}>
                Apply as Mentee
                <ChevronRight size={18} />
              </button>
              <button style={{
                background: 'transparent',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '16px 32px',
                color: '#F8FAFC',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                Become a Mentor
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '40px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: '700', 
                  color: '#14B8A6',
                  fontFamily: "'Outfit', sans-serif"
                }}>5</div>
                <div style={{ fontSize: '13px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Career Tracks
                </div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: '700', 
                  color: '#60A5FA',
                  fontFamily: "'Outfit', sans-serif"
                }}>6-12</div>
                <div style={{ fontSize: '13px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Month Programs
                </div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: '700', 
                  color: '#A78BFA',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  <Globe size={28} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Global Network
                </div>
              </div>
            </div>
          </div>

          {/* Track Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 0.8s ease 0.4s'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              Specialized Mentorship Tracks
            </div>
            {tracks.map((track, index) => {
              const Icon = track.icon;
              const isActive = activeTrack === index;
              return (
                <div
                  key={track.name}
                  className="track-card"
                  onClick={() => setActiveTrack(index)}
                  style={{
                    background: isActive 
                      ? `linear-gradient(135deg, ${track.color}15 0%, ${track.color}08 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? track.color + '40' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: track.color,
                      borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: isActive ? `${track.color}25` : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={24} color={isActive ? track.color : '#64748B'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: isActive ? '#F8FAFC' : '#CBD5E1',
                      marginBottom: '4px'
                    }}>
                      {track.name} Track
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: isActive ? '#94A3B8' : '#475569'
                    }}>
                      {track.desc}
                    </div>
                  </div>
                  <ChevronRight 
                    size={18} 
                    color={isActive ? track.color : '#475569'} 
                    style={{ 
                      opacity: isActive ? 1 : 0,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Program Features */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '32px',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.6s'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(20,184,166,0.2) 0%, rgba(20,184,166,0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Users size={26} color="#14B8A6" />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>1:1 Matching</div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
              Personalized mentor-mentee pairing based on goals & expertise
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(96,165,250,0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Microscope size={26} color="#60A5FA" />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>SMART Goals</div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
              Structured goal-setting framework for measurable progress
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Globe size={26} color="#A78BFA" />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Global Community</div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
              Connect with nursing professionals worldwide
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Lightbulb size={26} color="#FBBF24" />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Track Resources</div>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
              Specialized tools & templates for each career path
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        padding: '24px 48px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.6s ease 0.8s'
      }}>
        <div style={{ fontSize: '13px', color: '#475569' }}>
          © 2026 SONSIEL - Society of Nurse Scientists, Innovators, Entrepreneurs & Leaders
        </div>
        <div style={{ 
          fontSize: '13px', 
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22C55E',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          Empowering the next generation of nursing leaders
        </div>
      </footer>
    </div>
  );
};

export default SONSIELHomepage;
