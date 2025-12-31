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
- **Overview**: High-level campaign summary with brand snapshot and strategy highlights
- **Brief**: Detailed campaign goals, brand information, and project specifications
- **Research**: Market analysis, competitor insights, audience mapping, and SWOT analysis
- **Strategy**: Strategic doctrine, campaign pillars, KPIs, audience segmentation, and channel strategy
- **Tasks**: Kanban-style task board to manage campaign execution

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
│   │   │   ├── tabs/         # Project tab components
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
```

### Supabase Edge Function

The project uses a Supabase Edge Function to proxy requests to the AETEA AI API. Configure the function with:

```bash
# Deploy the Edge Function
supabase functions deploy api-proxy

# Set environment secret
supabase secrets set AETEA_API_TOKEN=your-api-token
```

---

## 📖 Usage

### Creating a New Project

1. **Upload Brief Files**: Drag and drop PDF, DOCX, or TXT files containing your creative brief
2. **Add Context** (Optional): Provide additional context or specific instructions
3. **Analyze**: Click "Analyze Brief" to start AI processing
4. **Monitor Progress**: Watch real-time progress updates as AI analyzes your brief
5. **Review Results**: Explore generated insights across Overview, Brief, Research, Strategy, and Tasks tabs

### Managing Projects

- **View Projects**: Browse all your projects in the left sidebar
- **Open Project**: Click any project to view its details
- **Delete Project**: Click the three-dot menu next to a project and select "Delete"

### Working with Tasks

- Navigate to the **Tasks** tab to view your execution task board
- Organize tasks by status: To Do, In Progress, or Done
- Drag and drop tasks between columns to update their status

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

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

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
