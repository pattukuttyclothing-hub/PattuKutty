import { useRef, useState, useEffect, type ReactNode, type MouseEvent } from "react";

interface Hero3DStageProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  ambientGlowColor?: string;
}

export function Hero3DStage({
  children,
  className = "",
  maxTilt = 10,
  perspective = 1200,
  ambientGlowColor = "rgba(201, 162, 76, 0.15)",
}: Hero3DStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    }
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlowPos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlowPos({ x: 50, y: 50 });
  };

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none ${className}`}
      style={{
        perspective: `${perspective}px`,
      }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-out will-change-transform ${
          !isHovered && isTouchDevice ? "animate-gentle-float" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        {/* Dynamic ambient specular reflection layer */}
        <div
          className="pointer-events-none absolute inset-0 z-50 rounded-3xl opacity-0 transition-opacity duration-700"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${ambientGlowColor} 0%, transparent 60%)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}
