import React, { MouseEvent as ReactMouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className, ...props }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`
    radial-gradient(
      650px circle at ${mouseX}px ${mouseY}px,
      rgb(var(--color-accent) / 0.15),
      transparent 80%
    )
  `;

  return (
    <div
      className={`group relative rounded-lg border border-border bg-card ${className}`}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-lg opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative z-10">{/* Ensure content is above the spotlight */}
        {children}
      </div>
    </div>
  );
};

// Example usage in a component
// <SpotlightCard className="p-4 shadow-lg">
//   <h3 className="text-lg font-bold">Spotlight Card</h3>
//   <p>This card has a spotlight effect on hover.</p>
// </SpotlightCard>