import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost' };
export default function Button({ variant='primary', className, ...props }: Props) {
  const base = 'btn ' + (variant === 'primary' ? 'btn-primary' : 'btn-ghost');
  return <button className={cn(base, className)} {...props} />;
}
