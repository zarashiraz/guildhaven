import { Link } from 'react-router-dom';
import Panel from '../components/ui/Panel';

function CharacterCreationPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="font-display text-5xl font-bold text-forest">Welcome to Guildhaven</h1>
      <p className="mt-2 mb-6">Build your skills. Find your people. Shape your future.</p>
      <Panel title="Create your character">
        <p>Character creation coming soon.</p>
        <Link to="/village" className="mt-4 inline-block font-display text-lg text-forest underline">
          Enter the village →
        </Link>
      </Panel>
    </main>
  );
}

export default CharacterCreationPage;