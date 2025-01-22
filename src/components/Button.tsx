'use client'

import { forwardRef } from 'react'
import clsx from 'clsx'

const buttonStyles = {
  text: 'text-sm font-medium transition-colors hover:text-gray-900',
  primary:
    'rounded-md bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700',
  secondary:
    'rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100',
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'text', className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={clsx(
          'group flex items-center',
          buttonStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
