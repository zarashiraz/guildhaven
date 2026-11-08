import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

import { usePlayer } from '../context/PlayerContext';
import { careers } from '../data/mockData';
import TulipIcon from '../components/ui/TulipIcon';

const avatarOptions = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
  'avatar-8',
];

const focusRing =
  'peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-dusk';

function CharacterCreationPage() {
  const { player, createCharacter, logout } = usePlayer();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('avatar-1');
  const [career, setCareer] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not log out.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a name for your character.');
      return;
    }

    if (!career) {
      setError('Please choose a career path.');
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      await createCharacter({
        username: username.trim(),
        career,
        avatar,
      });

      navigate('/village', { replace: true });
    } catch (err) {
      console.error('Character creation failed:', err);

      setError(
        err.message ||
        'Could not create your character. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (player) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="flex items-center gap-3 font-display text-5xl font-bold text-forest">
          Guildhaven
          <TulipIcon className="h-12 w-9" />
        </h1>

        <p className="mb-6 mt-2">
          Build your skills. Find your people.
          Shape your future.
        </p>

        <Panel title={`Welcome back, ${player.username}`}>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/village"
              className="font-display text-lg text-forest underline"
            >
              Continue to the village →
            </Link>

            <Button
              variant="secondary"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-red-700">
              {error}
            </p>
          )}
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="flex items-center gap-3 font-display text-5xl font-bold text-forest">
        Guildhaven
        <TulipIcon className="h-12 w-9" />
      </h1>

      <p className="mb-6 mt-2">
        Build your skills. Find your people.
        Shape your future.
      </p>

      <Panel title="Create your character">
        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="username"
            className="block font-display text-xl text-bark"
          >
            Character name
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoComplete="nickname"
            aria-describedby="username-help"
            disabled={saving}
            className="mt-2 w-full rounded-sm border-4 border-bark bg-parchment px-3 py-2"
          />

          <p id="username-help" className="mt-1 text-base">
            Choose a fun nickname! :)
          </p>

          {/* Avatar selection */}
          <fieldset className="mt-6" disabled={saving}>
            <legend className="w-full text-center font-display text-xl text-bark">
              Choose your avatar
            </legend>

            <div className="mx-auto mt-2 grid w-fit grid-cols-2 gap-3 sm:grid-cols-4">
              {avatarOptions.map((id, index) => (
                <label
                  key={id}
                  className="block cursor-pointer"
                >
                  <input
                    type="radio"
                    name="avatar"
                    value={id}
                    checked={avatar === id}
                    onChange={() => setAvatar(id)}
                    className="peer sr-only"
                  />

                  <span
                    className={`block rounded-sm border-4 p-2 text-center transition-transform duration-200 hover:-translate-y-1 ${focusRing} ${
                      avatar === id
                        ? 'border-forest bg-parchment'
                        : 'border-bark bg-cream'
                    }`}
                  >
                    <Avatar
                      id={id}
                      className="h-16 w-16"
                    />

                    <span className="sr-only">
                      Avatar {index + 1}
                    </span>

                    <span
                      aria-hidden="true"
                      className="block font-display text-forest"
                    >
                      {avatar === id ? '✓' : '\u00A0'}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Career selection */}
          <fieldset className="mt-6" disabled={saving}>
            <legend className="font-display text-xl text-bark">
              Choose your career path
            </legend>

            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {careers.map((c) => (
                <label
                  key={c.id}
                  className="block cursor-pointer"
                >
                  <input
                    type="radio"
                    name="career"
                    value={c.id}
                    checked={career === c.id}
                    onChange={() => setCareer(c.id)}
                    className="peer sr-only"
                  />

                  <span
                    className={`block h-full rounded-sm border-4 p-4 transition-transform duration-200 hover:-translate-y-1 ${focusRing} ${
                      career === c.id
                        ? 'border-forest bg-parchment'
                        : 'border-bark bg-cream'
                    }`}
                  >
                    <span className="block font-display text-xl font-bold text-bark">
                      {c.name}
                    </span>

                    <span className="block text-base">
                      {c.blurb}
                    </span>

                    {career === c.id && (
                      <span className="mt-2 block font-display text-forest">
                        ✓ Selected
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="mt-4 text-center font-display text-lg text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Saving your character...'
                : 'Begin your adventure'}
            </Button>
          </div>
        </form>
      </Panel>
    </main>
  );
}

export default CharacterCreationPage;