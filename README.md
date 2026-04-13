# Echo News

A modern, dual-language (Arabic/English) news platform built with React 19, TypeScript, Vite, and PostgreSQL.

## 🚀 Features

- **Dual Language Support**: Full Arabic and English content support
- **Real-time Updates**: Live news updates and dynamic content
- **SEO Optimized**: Automatic sitemap generation, RSS feeds, and Google News integration
- **Admin Dashboard**: Complete content management system with AI article generation
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode**: Built-in dark/light theme switching
- **Search & Filter**: Advanced search functionality with category filtering
- **Social Sharing**: Integrated social media sharing buttons
- **Bookmarking**: Save articles for later reading
- **Related Articles**: AI-powered article recommendations

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 6** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **React Router 7** - Routing
- **Motion** - Animations
- **Lucide React** - Icons
- **React Helmet Async** - SEO meta tags

### Backend
- **Node.js** - Runtime environment
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **Jose** - JWT authentication
- **Google Generative AI** - AI article generation

### Deployment
- **Vercel** - Frontend hosting
- **Railway** - Backend hosting
- **Docker** - Containerization

## 📦 Installation

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL database
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ameeraltaleb/Echo-News.git
   cd Echo-News
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   **Required variables:**
   - `POSTGRES_URL` or `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Must be at least 32 characters (generate with `openssl rand -hex 32`)
   - `ADMIN_PASSWORD` - Strong password for admin access
   
   **Optional variables:**
   - `GEMINI_API_KEY` - For AI article generation
   - `UNSPLASH_ACCESS_KEY` - For image search
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` - For Supabase storage

4. **Initialize the database**
   
   The database tables will be created automatically on first run.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 📁 Project Structure

```
echo-news/
├── api/                  # Backend API endpoints
│   ├── _lib/            # Shared utilities
│   ├── admin/           # Admin endpoints
│   ├── articles/        # Article endpoints
│   └── categories/      # Category endpoints
├── src/                  # Frontend source code
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── db/              # Database utilities
│   └── utils/           # Helper functions
├── tests/                # Test files
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🔒 Security

See [SECURITY.md](./SECURITY.md) for security guidelines and best practices.

**Important Security Notes:**
- Never commit `.env` files to version control
- Use strong, unique passwords and secrets
- Rotate JWT_SECRET regularly
- Enable SSL for database connections in production
- Review CORS settings before deployment

## 🚢 Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Railway (Backend)

1. Create a new PostgreSQL database on Railway
2. Set environment variables
3. Deploy

### Docker

```bash
docker build -t echo-news .
docker run -p 3000:3000 --env-file .env echo-news
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

Please report bugs and feature requests in the [Issues](https://github.com/ameeraltaleb/Echo-News/issues) section.

## 📞 Support

For support, email support@echonews.com or open an issue in the repository.

---

Built with ❤️ by the Echo News Team