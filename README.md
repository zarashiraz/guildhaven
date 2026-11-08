# ⚔️ Guildhaven
### Your career journey, but make it an adventure.

**Pick a path. Complete quests. Build skills. Find your guild.**

Most career exploration starts with a personality quiz and ends with a list of jobs you have to Google.

We thought that was a pretty terrible way to figure out your future.

So we built **Guildhaven**, a multiplayer pixel-art world where you don't just read about careers. You get to try them.

Software Engineering? Debug a broken system.

Business? Make decisions when the numbers don't add up.

Data Science? Find patterns hiding in the noise.

And when you're ready to leave your little corner of the world, head to the Guild Hall, find another adventurer, and solve something together.

**No 40-question personality test. No generic career recommendations. Just you, a world to explore, and skills to discover.**

---

## 🌎 Welcome to Guildhaven

Guildhaven turns career exploration into a playable experience.

You create your character, choose a career path, and enter a world of interactive challenges inspired by real problems professionals face.

Every quest introduces a different way of thinking. Some test your logic. Others challenge your decision-making, pattern recognition, or ability to work with someone who approaches the same problem completely differently.

The more you play, the more you discover what actually interests you.

Because figuring out what you're good at should involve doing things, not just answering questions about yourself.

## 🗺️ Choose your path

### 💻 Software Engineering
*For the people who see a broken system and immediately want to know why.*

Trace bugs, solve logic puzzles, untangle dependencies, and think your way through technical problems.

### 📊 Business
*For the people who can turn a messy situation into a smart decision.*

Balance competing priorities, analyze financial records, manage resources, and make calls that actually matter.

### 🔬 Data Science
*For the people who know the interesting part is usually hiding in the data.*

Investigate patterns, work with datasets, test ideas, and uncover the story behind the numbers.

**Three paths. Different ways of thinking. One shared world.**

---

## 🤝 The Guild Hall

This is where Guildhaven stops being a solo adventure.

The Guild Hall is a live multiplayer tavern where players can walk around, meet other adventurers, chat, and team up for cooperative quests.

And here's the part we're especially proud of:

### The Two Ledgers

A village café has a problem. Its checkout records don't match up, and nobody knows where the money went.

Two players are sent to investigate.

But depending on their career paths, they approach the mystery differently.

**A Software Engineer** traces checkout events, failed transactions, and duplicate payment captures.

**A Business player** audits invoices, missing payments, and financial discrepancies.

**A Data Scientist** examines transaction patterns and anomalies.

They're investigating the same incident, but through the lens of their own profession.

The shared investigation board lets both players contribute their findings and work toward the same solution.

And yes, two players with the same career can team up too.

It's a small demonstration of something we think matters a lot: **real problems rarely belong to just one discipline.**

---

## ✨ What you can do

- **Create your adventurer.** Choose your username, pixel avatar, and career path.
- **Play career quests.** Explore challenges inspired by Software Engineering, Business, and Data Science.
- **Earn XP.** Track your progress as you complete quests.
- **Switch career paths.** Curious about another field? Go explore it.
- **Explore the Guild Hall.** Move through a shared pixel-art tavern with other players.
- **Chat in real time.** Meet other adventurers without leaving the game.
- **Team up.** Pair with another player for a cooperative investigation.
- **Build your portfolio.** See the quests you've completed and the skills you've explored.

---

## 🛠️ Built with

| Technology | What we use it for |
|---|---|
| React | Interactive game screens and components |
| Vite | Frontend development and builds |
| JavaScript | Game logic and quest mechanics |
| Tailwind CSS | Styling and responsive layouts |
| Supabase | Authentication, player profiles, and game data |
| Supabase Realtime | Multiplayer presence, pairing, and chat |
| Vercel | Hosting and deployment |

### Under the hood

The Guild Hall uses Supabase Realtime to synchronize player presence, movement, chat messages, and cooperative quest interactions.

Players pair at the quest table through mutual requests, then enter a private two-player session. Each player's career is loaded from their saved profile, allowing the same quest to present different evidence without requiring players to choose their path again.

Quest progress and player experience are stored separately from the multiplayer session, keeping character progression tied to the player's account.

---

## 🚀 Running Guildhaven locally

**1. Clone the repository**

```bash
git clone https://github.com/zarashiraz/guildhaven.git
cd guildhaven
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure Supabase**

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the environment variable names expected by your Supabase client configuration.

**4. Start the game**

```bash
npm run dev
```

Open the local URL shown in your terminal.

You'll need a configured Supabase project with the required database tables, authentication, and Realtime settings for all features to work.

---

## 💡 Why we built this

There's a weird expectation that students should know what career they want before they've ever had the chance to experience it.

You can read a hundred job descriptions and still have no idea whether you'd enjoy the work.

We wanted to make that first step less intimidating.

Not another course platform. Not another career assessment. Something that feels like a game first, but leaves you knowing a little more about yourself when you close the tab.

Guildhaven isn't trying to tell you what you should become.

**It's giving you somewhere to start finding out.**

---

## 🔮 What's next?

We have a lot of ideas for where this world could go.

More career paths. More quests. Bigger collaborative challenges. A world where your choices shape the kind of adventurer you become.

We'd love to eventually make Guildhaven a place where students from completely different backgrounds can discover not only what they enjoy doing, but what they can build together.

For now, we're starting with three paths, a handful of quests, and one very suspicious café.

---

### ⚔️ Your next quest is waiting.

**Built with curiosity, questionable amounts of caffeine, and a belief that figuring out your future should actually be fun.**
