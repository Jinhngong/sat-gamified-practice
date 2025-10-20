# SAT Gamified Practice

🎯 **Live Demo:** [https://sat-gamified-practice.vercel.app/](https://sat-gamified-practice.vercel.app/)

A gamified SAT practice platform built with React that helps students improve their test performance through adaptive learning, progress tracking, and engaging game mechanics.

## 🎮 What This Project Aims to Achieve

This platform addresses common challenges in SAT preparation by:

- **Adaptive Learning**: Automatically identifies weak skill areas and prioritizes practice questions based on individual performance patterns
- **Gamification**: Motivates consistent practice through points, streaks, and achievement systems
- **Flexible Practice Modes**: 
  - **Practice Rush** - Quick, focused skill practice with immediate feedback
  - **Exam Mode** - Full-length timed practice simulating real test conditions
- **Progress Analytics**: Visual dashboard tracking performance trends, skill-level accuracy, and improvement over time
- **Personalized Question Selection**: Uses weighted algorithms to serve questions from skills where users need the most improvement

## ✨ Key Features

- 🌙 **Dark/Light Mode** - Built-in theme toggle for comfortable studying
- 📊 **Performance Dashboard** - Real-time analytics showing strengths and weaknesses
- 🎯 **Skill-Based Tracking** - Monitors accuracy across different SAT skill categories
- 🔥 **Streak System** - Encourages daily practice habits
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React, CSS3
- **State Management**: React Context API
- **Deployment**: Vercel
- **Data Storage**: Browser localStorage (demo) with Supabase integration ready

## 🚀 Getting Started

### Prerequisites

Download and install [Node.js (LTS)](https://nodejs.org). This includes `npm`.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jinhngong/sat-gamified-practice.git
cd sat-gamified-practice
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## 📦 Project Structure

```
sat-gamified-practice/
├── public/
│   └── questions.json          # SAT question bank (replace with OpenSAT dataset)
├── src/
│   ├── auth.js                 # Demo authentication UI and logic
│   ├── utils.js                # Core progress tracking & adaptive selection
│   ├── supabaseClient.js       # Scaffold for database integration
│   └── components/             # React components
└── README.md
```

## 🗄️ Database Integration (Currently Not Working)

The current demo uses browser `localStorage` for:
- User accounts (username/password - demo only, not secure)
- Per-user progress stored under `sat_progress_{userId}`

**⚠️ Limitations**: Progress doesn't sync across devices and is cleared if browser data is cleared.

### Setting Up Supabase (Recommended)

To enable real authentication and persistent cross-device progress:

1. Create a free [Supabase](https://supabase.com) project
2. Enable Authentication
3. Create a `progress` table:

```sql
create table progress (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  points int default 0,
  streak int default 0,
  skill_stats jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
```

4. Add environment variables in Vercel:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

5. Update `src/supabaseClient.js` to use `@supabase/supabase-js`

## 🎯 How Adaptive Question Selection Works

1. **Track Performance**: Records attempts and correct answers per skill
2. **Calculate Accuracy**: Computes accuracy rate for each skill (correct/attempts)
3. **Weight Skills**: Assigns higher weights to skills with lower accuracy
4. **Smart Selection**: Randomly selects next question weighted toward weaker skills

This ensures users spend more time on areas that need improvement.

## 📝 Customizing Questions

Replace `public/questions.json` with your own question bank. Expected format:

```json
[
  {
    "id": 1,
    "skill": "Algebra",
    "question": "Solve for x: 2x + 5 = 15",
    "options": ["x = 5", "x = 10", "x = 15", "x = 20"],
    "correct": 0
  }
]
```

Consider using the [OpenSAT dataset](https://github.com/openstax/openstax-resource-server) for authentic practice questions.

## 🚀 Deployment

This project is deployed on Vercel. To deploy your own:

1. Create a [Vercel account](https://vercel.com) and connect GitHub
2. Click **New Project** → Import your repository
3. Use detected build settings (Create React App)
4. Add environment variables if using Supabase
5. Click **Deploy**

## 🔮 Future Enhancements

- [ ] Full Supabase integration for persistent storage
- [ ] Social features (leaderboards, study groups)
- [ ] Expanded question bank with official SAT questions
- [ ] Detailed analytics with performance predictions
- [ ] Mobile app version
- [ ] AI-powered explanations for wrong answers

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Jinhngong/sat-gamified-practice/issues).

## 👨‍💻 Author

**Jin Hng Ong**
- GitHub: [@Jinhngong](https://github.com/Jinhngong)
- LinkedIn: [jinhngong](https://www.linkedin.com/in/jinhngong)

---

⭐ If you find this project helpful, please consider giving it a star!
