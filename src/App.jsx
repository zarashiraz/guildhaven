import Panel from './components/ui/Panel';
import Button from './components/ui/Button';
import XPBar from './components/ui/XPBar';

function App() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-5xl font-bold text-forest">Welcome to Guildhaven </h1>
      <p className="mt-2">Build your skills. Find your people. Shape your future.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Panel title="Your Guild">
        <XPBar current={240} max={400} level={3} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Start quest</Button>
          <Button variant="secondary">Secondary</Button>
          <Button disabled>Locked</Button>
        </div>
      </Panel>
      </div>
    </main>
  );
}

export default App;