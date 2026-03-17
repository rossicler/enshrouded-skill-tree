### Enshrouded Skill Planner

This tool was created solely to aid Enshrouded players in sharing skill trees and builds conveniently. I'm not affiliated with Keen Games and do not hold any rights to the Enshrouded game.

Special thanks to [@Glitchiz](https://www.youtube.com/@Glitchiz) for providing some of the assets used for this project.

Access the live version [here](https://enshrouded-skill-tree.com/)

<a href="https://www.buymeacoffee.com/rossicler" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

---

## Features

- Interactive skill tree with zoom, pan and node selection
- Build sharing via short URLs and JSON import/export
- Skill point and flame level tracking
- Stats summary
- Skill search with highlight
- Sound effects
- Localization (English, French)
- Mobile-friendly UI

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (for the share URL feature)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/RossiclerSA/enshrouded-skill-tree.git
cd enshrouded-skill-tree
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables by copying the example file:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your values:

| Variable | Description |
|---|---|
| `BASE_URL` | The base URL of your app (default: `http://localhost:3000`) |
| `MONGODB_URI` | Your MongoDB connection string |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS` | Google Analytics measurement ID (optional) |

### MongoDB Setup

MongoDB is used to store shared build codes (the share URL feature). You can use either:

- [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier available) — create a cluster and grab the connection string
- A local MongoDB instance

The app will automatically create the `skill-planner` database and `codes` collection on first use.

> **Note:** The app runs fine without MongoDB — the share URL feature simply won't work.

### Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
  components/     # React components (SkillTree, HUD, dialogs, shared UI)
  constants/      # Skill node definitions, edges, metadata
  lib/            # MongoDB client, API helpers
  pages/          # Next.js pages and API routes
  redux/          # Redux store and slices
  styles/         # Global CSS
  utils/          # Utility functions (assets, sounds, etc.)
public/
  assets/         # Skill icons, decorations, sounds
  locales/        # Translation files (en, fr)
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on the [GitHub repository](https://github.com/RossiclerSA/enshrouded-skill-tree).

You can also join the [Discord server](https://discord.gg/KkaGwgRWaX) to discuss the project.

## License

This project is licensed under the [GPL-3.0](LICENSE) license.
