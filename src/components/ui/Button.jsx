const styles = {
  primary: 'bg-forest text-cream border-bark hover:bg-forest/90',
  secondary: 'bg-cream text-bark border-bark hover:bg-parchment',
};

function Button({ children, variant = 'primary', className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`rounded-sm border-4 px-5 py-2 font-display text-lg font-bold shadow-[3px_3px_0_0_var(--color-bark)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;