import { useId } from 'react';

function Panel({ title, children, className = '' }) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={`rounded-sm border-4 border-bark bg-cream p-5 shadow-[4px_4px_0_0_var(--color-bark)] ${className}`}
    >
      {title && (
        <h2
          id={titleId}
          className="mb-3 border-b-4 border-wood pb-2 font-display text-2xl font-bold text-bark"
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export default Panel;