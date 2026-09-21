import React from 'react';
import { Link } from 'react-router-dom';

interface SmartLinkProps {
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
}

/** In-site paths use the router; external links, mailto: and tel: use a normal anchor. */
export default function SmartLink({ to, className, children, onClick, ...rest }: SmartLinkProps) {
  const isExternal = /^(https?:\/\/|mailto:|tel:)/i.test(to);
  if (isExternal) {
    const opensNewTab = /^https?:\/\//i.test(to);
    return (
      <a
        href={to}
        className={className}
        onClick={onClick}
        {...(opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
