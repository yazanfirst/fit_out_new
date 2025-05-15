// Add type declarations for UI components with missing props
import { ButtonHTMLAttributes, ReactNode } from 'react';

declare module '@/components/ui/button' {
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
    children?: ReactNode;
  }
  
  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
}

declare module '@/components/ui/badge' {
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    children?: ReactNode;
  }
  
  export const Badge: React.FC<BadgeProps>;
}

// Declare that useNavigate exists in react-router-dom v6
declare module 'react-router-dom' {
  export function useNavigate(): (path: string) => void;
} 