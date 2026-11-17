import type { ComponentPropsWithoutRef } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-classes'

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & StyleProps

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />
}

type ButtonLinkProps = ComponentPropsWithoutRef<'a'> &
  StyleProps & {
    href: string
    /** Opens in a new tab with safe `rel` attributes. */
    external?: boolean
  }

export function ButtonLink({
  variant,
  size,
  className,
  external = false,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={buttonClasses({ variant, size, className })}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      {children}
    </a>
  )
}
