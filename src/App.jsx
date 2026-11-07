import Panel from './components/ui/Panel';

function App() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-5xl font-bold text-forest">Welcome to Guildhaven </h1>
      <p className="mt-2">Build your skills. Find your people. Shape your future.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Panel title="Quest Board">
          <p>3 quests available</p>
        </Panel>
        <Panel title="Your Guild">
          <p>No guild yet. Finish a quest to get matched.</p>
        </Panel>
        <Panel className="sm:col-span-2">
          <p>This panel has no title and spans both columns.</p>
        </Panel>
      </div>
    </main>
  );
}

export default App;