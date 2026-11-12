import React from 'react';

interface AnimatedBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AnimatedBorderCard: React.FC<AnimatedBorderCardProps> = ({ children, className, ...props }) => {
  return (
    <div className={`animated-border-card rounded-lg ${className}`} {...props}>
      {children}
    </div>
  );
};

//<AnimatedBorderCard className="shadow-lg shadow-accent/5 p-4 sm:p-6"> </AnimatedBorderCard>
// Example usage in a component