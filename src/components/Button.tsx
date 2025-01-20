'use client'

import { forwardRef } from 'react'
import clsx from 'clsx'

const buttonStyles = {
  text: 'text-sm font-medium transition-colors hover:text-gray-900',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'text', className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={clsx(buttonStyles[variant], className)}
        {...props}
      />
    )
  },
)
