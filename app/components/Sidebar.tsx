import type React from 'react';

interface SidebarProps {
	children: React.ReactNode;
	className?: string;
}

export function Sidebar({ children, className = '' }: SidebarProps) {
	return <aside className={`${className}`}>{children}</aside>;
}
