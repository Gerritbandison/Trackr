# IT Asset Management System - Frontend

A modern, responsive React application for managing IT assets, software licenses, users, and departments.

## 🎨 Features

### Dashboard
- Real-time statistics and analytics
- Asset status distribution charts
- Asset category breakdown
- Quick access to key metrics
- License utilization overview

### Asset Management
- Complete asset inventory with search and filters
- Asset details with warranty tracking
- Asset assignment to users
- Status and condition tracking
- Purchase and warranty information

### User Management
- User directory with role-based access
- User profiles with assigned resources
- Contact information management
- Asset and license assignment tracking

### License Management
- Software license tracking
- Seat utilization visualization
- Expiration date monitoring
- User assignment management
- Cost and renewal tracking

### Additional Features
- Department organization
- Report generation and CSV export
- System settings and configuration
- Real-time notifications
- Role-based access control (Admin, Manager, Staff)

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Recharts** - Chart visualization
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications
- **Zustand** - State management
- **date-fns** - Date formatting

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn
- Backend API running on port 5000

## 🚀 Getting Started

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Asset Management System
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🔐 Authentication

The app uses JWT-based authentication with role-based access control.

### Test Credentials (Development)

```
Admin User:
Email: admin@company.com
Password: password123

Manager User:
Email: john.smith@company.com
Password: password123

Staff User:
Email: sarah.johnson@company.com
Password: password123
```

### User Roles

**Admin**
- Full system access
- User management
- Settings configuration
- All CRUD operations

**Manager**
- Asset and license management
- User viewing
- Department management
- Report generation

**Staff**
- View own assets and licenses
- View asset inventory
- Limited user directory access

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Common/      # Generic components (Badge, Modal, etc.)
│   │   └── Layout/      # Layout components (Sidebar, Header)
│   │
│   ├── config/          # Configuration files
│   │   └── api.js       # Axios configuration and API endpoints
│   │
│   ├── contexts/        # React contexts
│   │   └── AuthContext.jsx  # Authentication context
│   │
│   ├── pages/           # Page components
│   │   ├── Auth/        # Login page
│   │   ├── Dashboard/   # Dashboard
│   │   ├── Assets/      # Asset management
│   │   ├── Users/       # User management
│   │   ├── Licenses/    # License management
│   │   ├── Departments/ # Department management
│   │   ├── Reports/     # Report generation
│   │   └── Settings/    # System settings
│   │
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
│
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── package.json         # Dependencies and scripts
```

## 🎨 UI Components

### Common Components

**LoadingSpinner**
```jsx
<LoadingSpinner size="md" fullScreen={false} />
```

**Badge**
```jsx
<Badge variant="success" size="md">Active</Badge>
```

**Modal**
```jsx
<Modal isOpen={true} onClose={handleClose} title="Modal Title" size="md">
  Content here
</Modal>
```

**StatCard**
```jsx
<StatCard
  title="Total Assets"
  value={100}
  icon={FiPackage}
  color="primary"
  link="/assets"
/>
```

**SearchBar**
```jsx
<SearchBar onSearch={handleSearch} placeholder="Search..." />
```

**Pagination**
```jsx
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={handlePageChange}
/>
```

## 🔌 API Integration

The app uses React Query for data fetching and caching. API endpoints are configured in `src/config/api.js`.

### Example Usage

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { assetsAPI } from '../config/api';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['assets'],
  queryFn: () => assetsAPI.getAll().then(res => res.data),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => assetsAPI.create(data),
  onSuccess: () => {
    // Handle success
  },
});
```

## 🎯 Key Features Implementation

### Protected Routes

Routes are protected based on user authentication and role:

```jsx
<ProtectedRoute requiredRole={['admin', 'manager']}>
  <Component />
</ProtectedRoute>
```

### Real-time Stats

Dashboard displays real-time statistics using React Query:
- Asset utilization
- User counts
- License usage
- Expiration alerts

### Search and Filters

All list views include:
- Full-text search
- Status filters
- Category filters
- Role filters
- Pagination

### Responsive Design

- Mobile-first approach
- Tailwind CSS breakpoints
- Responsive tables and cards
- Mobile navigation

## 🚢 Deployment

### Vercel

```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Netlify

```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Docker

```bash
# Build production image
docker build -t asset-mgmt-frontend .

# Run container
docker run -p 80:80 asset-mgmt-frontend
```

### Environment Variables for Production

```env
VITE_API_URL=https://your-api-domain.com/api/v1
VITE_APP_NAME=Asset Management System
```

## 🔧 Customization

### Theming

Edit `tailwind.config.js` to customize colors:

```js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        // ... your colors
      },
    },
  },
}
```

### Logo and Branding

- Update app name in `frontend/src/components/Layout/Sidebar.jsx`
- Replace favicon in `public/`
- Update `index.html` title

## 📊 Charts and Visualizations

The app uses Recharts for data visualization:

- Pie charts for status distribution
- Bar charts for category breakdown
- Progress bars for utilization
- Custom stat cards

## 🔔 Notifications

Toast notifications using `react-hot-toast`:

```jsx
import toast from 'react-hot-toast';

toast.success('Operation successful!');
toast.error('Something went wrong');
toast.loading('Processing...');
```

## 🐛 Troubleshooting

### API Connection Issues

**Problem**: Cannot connect to backend API

**Solution**:
1. Ensure backend is running on port 5000
2. Check `VITE_API_URL` in `.env`
3. Verify CORS settings in backend

### Build Errors

**Problem**: Build fails with module errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Routing Issues in Production

**Problem**: 404 errors on page refresh

**Solution**: Configure server to serve `index.html` for all routes

For Netlify, create `_redirects` file:
```
/*    /index.html   200
```

## 📝 Development Tips

### Hot Reload

Vite provides instant hot module replacement (HMR) during development.

### TypeScript (Optional)

To add TypeScript:
```bash
npm install --save-dev typescript @types/react @types/react-dom
# Rename files from .jsx to .tsx
```

### Linting

```bash
npm run lint
```

### Code Formatting

Use Prettier for consistent code formatting:
```bash
npm install --save-dev prettier
npx prettier --write src/
```

## 🤝 Contributing

1. Follow the existing code structure
2. Use functional components with hooks
3. Keep components small and focused
4. Add comments for complex logic
5. Test across different screen sizes

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

For issues and questions:
- Check the backend README
- Review API documentation
- Contact your system administrator

---

**Built with ❤️ using React + Vite + TailwindCSS**

