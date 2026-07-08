# 🎨 AETEA Forge Studio

<div align="center">

**AI-Powered Campaign Strategy & Execution Platform**

Transform your creative briefs into comprehensive marketing campaigns with intelligent analysis, strategic planning, and execution tracking.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## ✨ Features

### 🤖 **AI-Powered Brief Analysis**
Upload your creative briefs (PDF, DOCX, TXT) and let AI extract key information, analyze market trends, and generate comprehensive campaign strategies.

### 📊 **Comprehensive Project Views**
- **Brief**: Detailed campaign goals, brand information, and project specifications
- **Research**: Market analysis, competitor insights, audience mapping, and SWOT analysis
- **Strategy**: Strategic doctrine, campaign pillars, KPIs, audience segmentation, and channel strategy
- **Creative**: Creative truth/tone, key visual, style cards, and the **Deliverables** list —
  each one opens a full canvas workspace for execution
- **Assets**: a real per-chat folder tree (not a flat list) for uploaded and generated files

> Note: there is no standalone "Overview" or "Tasks" tab — an `OverviewTab` component exists in
> the codebase but isn't wired into navigation, and deliverable execution moved from a Kanban
> board to the canvas workspace described below.

### 🖼️ **Deliverable Canvas**
An infinite, pannable/zoomable workspace (React Flow) for each deliverable: a task detail card,
a task-scoped chat, and every AI-generated output as its own draggable, resizable card. Select a
card to use it as a reference in your next message; approve a card to mark it the finalized
output — approval is a user action only, never something the AI can do itself. A side panel gives
quick-reference popups for the other campaign tabs and the asset folder tree without leaving the
canvas, and a bottom-center switcher jumps between deliverables.

### 🎯 **Intelligent Features**
- Real-time streaming progress updates during AI analysis
- Markdown rendering for rich text formatting
- Project management with create, view, and delete operations
- Secure authentication with Supabase Auth
- Beautiful, responsive UI with dark mode support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **bun** package manager
- **Supabase Account** - [Sign up here](https://supabase.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/aetea-forge-studio.git

# Navigate to project directory
cd aetea-forge-studio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start the development server
npm run dev
```

The app will be running at `http://localhost:8080` 🎉

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **TanStack Query** - Powerful data fetching and caching
- **React Router** - Client-side routing
- **React Markdown** - Markdown rendering

### Backend & Services
- **Supabase** - Backend-as-a-Service (Authentication, Database)
- **Supabase Edge Functions** - Serverless API proxy
- **AETEA AI API** - Custom AI analysis engine
- **Server-Sent Events (SSE)** - Real-time streaming updates

---

## 📁 Project Structure

```
aetea-forge-studio/
├── src/
│   ├── components/
│   │   ├── app/              # Application-specific components
│   │   │   ├── tabs/         # Campaign tab components (Brief, Research, Strategy, Creative, Assets, Analytics, Settings)
│   │   │   ├── canvas/       # Deliverable canvas workspace (React Flow: workspace, nodes, left pane, switcher)
│   │   │   ├── ProjectList.tsx
│   │   │   ├── DeleteProjectDialog.tsx
│   │   │   └── BriefAnalysisLoading.tsx
│   │   └── ui/               # Reusable UI components (shadcn)
│   ├── hooks/                # Custom React hooks
│   ├── layouts/              # Layout components
│   ├── pages/                # Page components
│   ├── services/             # API services
│   ├── types/                # TypeScript type definitions
│   └── integrations/         # Third-party integrations
├── supabase/
│   ├── functions/            # Edge Functions
│   │   └── api-proxy/        # API proxy function
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_AETEA_API_TOKEN=your-huggingface-api-token
```

**Note**: The `VITE_AETEA_API_TOKEN` is used to authenticate directly with the HuggingFace backend API. This token will be visible in the frontend bundle, so use a token with appropriate permissions.

---

## 📖 Usage

### Creating a New Project

1. **Upload Brief Files**: Drag and drop PDF, DOCX, or TXT files containing your creative brief
2. **Add Context** (Optional): Provide additional context or specific instructions
3. **Analyze**: Click "Analyze Brief" to start AI processing
4. **Monitor Progress**: Watch real-time progress updates as AI analyzes your brief
5. **Review Results**: Explore generated insights across the Brief, Research, Strategy, Creative,
   and Assets tabs

### Managing Projects

- **View Projects**: Browse all your projects in the left sidebar
- **Open Project**: Click any project to view its details
- **Delete Project**: Click the three-dot menu next to a project and select "Delete"

### Working with Deliverables

- Open the **Creative** tab and scroll to **Deliverables** to see your campaign's execution list
- Click a deliverable to open its canvas workspace and work it with the AI
- Status (`todo` → `in_progress` → `under_review` → `done`) is driven by the agent as work
  progresses — there's no drag-and-drop board

---

## 🎨 UI/UX Features

- **Custom Scrollbars**: Elegant scrollbar styling for better aesthetics
- **Markdown Support**: Rich text rendering for URLs, formatting, and more
- **Loading States**: Dynamic loading animations with progress indicators
- **Error Boundaries**: Graceful error handling with user-friendly messages
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Beautiful dark theme optimized for long work sessions

---

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npm run type-check
```

### Code Quality

- **ESLint**: JavaScript/TypeScript linting
- **TypeScript**: Full type safety
- **Prettier**: Code formatting (configured in editor)

---

## 📦 Deployment

### Deploy to Production

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy Edge Function**:
   ```bash
   supabase functions deploy api-proxy --project-ref your-project-ref
   ```

3. **Set production secrets**:
   ```bash
   supabase secrets set AETEA_API_TOKEN=your-production-token
   ```

4. **Deploy frontend** to your hosting platform:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - GitHub Pages
---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Failed to fetch" when deleting projects
- **Solution**: Ensure the Edge Function is deployed with the latest CORS configuration

**Issue**: Blank screen when opening a project
- **Solution**: Check browser console for errors. Ensure backend API is returning valid data structure

**Issue**: "react-markdown" import error
- **Solution**: Run `npm install react-markdown` and restart dev server

**Issue**: Authentication not working
- **Solution**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in `.env.local`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- **shadcn/ui** - For the beautiful component library
- **Supabase** - For the excellent BaaS platform
- **Lucide Icons** - For the comprehensive icon set
- **TanStack Query** - For powerful data synchronization

---

## 📧 Contact

For questions or support, please contact the AETEA team.

---

<div align="center">

**Built with ❤️ by the AETEA Team**

</div>
