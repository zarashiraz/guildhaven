function App() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-5xl font-bold text-forest">Welcome to Guildhaven </h1>
      <p className="mt-2">Build your skills. Find your people. Shape your future.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="h-16 w-16 rounded bg-cream border-2 border-bark" />
        <div className="h-16 w-16 rounded bg-forest" />
        <div className="h-16 w-16 rounded bg-sage" />
        <div className="h-16 w-16 rounded bg-wood" />
        <div className="h-16 w-16 rounded bg-bark" />
        <div className="h-16 w-16 rounded bg-dusk" />
        <div className="h-16 w-16 rounded bg-gold" />
      </div>

      <button className="mt-6 rounded bg-forest px-5 py-3 font-display text-cream">
        Press Tab to see the focus ring
      </button>
    </main>
  );
}

export default App;