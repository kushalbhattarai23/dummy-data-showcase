# 🎯 Track Hub

**A comprehensive tracking platform combining two powerful systems:**

- 📺 **TV Universe Tracker** – Organize and monitor your favorite TV shows and fictional universes.  
- 💰 **Finance Hub** – Track personal finances including wallets, transactions, categories, and more.

🌐 **Live Demo:** [trackerhub](https://trackerhub.netlify.app)

---

## ✨ Features

### 🔑 Login
Email Password Registration
Trying to add Google Login
--
### 📺 TV Universe Tracker
A modern system to track shows, seasons, and universes.

#### Show Management
- Browse and track public TV shows  
- Detailed info: seasons, episodes  
- Track individual episode progress  
- Mark shows/seasons/episodes as watched or unwatched  
- Search and filter functionality  

#### Universe System
- Create/manage TV show universes  
- Add shows to universes  
- Public/private universe support  
- Universe dashboard with statistics  
- Episode timeline across shows in a universe  

---

### 💰 Finance Hub *(New!)*
A personal finance tracker to manage daily expenses and income.

#### Wallets & Transactions
- Add multiple wallets (e.g., cash, bank, credit)  
- Track income and expenses  
- Create categories (e.g., groceries, bills, salary)  
- *(Upcoming)* Transfer between wallets  

#### Reports & Insights
- Daily, weekly, and monthly financial reports  
- Summary dashboard with key financial metrics  
- Category-based spending breakdown  

---

### 👤 User Features
- Secure authentication with email/password  
- Personalized dashboards for both modules  
- Visual charts for progress and finance stats  
- User-specific data isolation (Supabase RLS)  

---

### 🔧 Admin Features
- Admin dashboard for managing content and users  
- Bulk import TV shows/episodes via CSV  
- Support for flexible CSV formats  

---

## 🧰 Tech Stack

### 🖥️ Frontend
- React 18 + TypeScript  
- Vite for fast dev/build  
- TailwindCSS for styling  
- [shadcn/ui](https://ui.shadcn.com) for UI components  
- Lucide React for icons  
- React Router for routing  
- React Query for data fetching  
- React Hook Form for form handling  

### 🗄️ Backend
- **Supabase** (PostgreSQL, Auth, RLS, real-time)  
- Role-based access control  
- Real-time data via Supabase subscriptions  

### 🛠️ Dev Tools
- ESLint & Prettier  
- TypeScript  
- Hot Module Replacement (HMR)  
- .env configuration for environment variables  

---

## 🔑 Pages & Routes

### TV Universe Tracker
- `/` — Dashboard  
- `/shows/public`  
- `/shows/my`  
- `/universes/public`  
- `/universes/my`  
- `/show/:showSlug`  
- `/universe/:universeSlug`  

### Finance Hub
- `/finance/dashboard`  
- `/finance/wallets`  
- `/finance/transactions`  
- `/finance/categories`  
- `/finance/reports`  

---

## 🧠 Acknowledgments

- Built with [Vite](https://vitejs.dev) + [React](https://react.dev)  
- UI powered by [shadcn/ui](https://ui.shadcn.com)  
- Icons by [Lucide](https://lucide.dev)  
- Backend by [Supabase](https://supabase.com)  
- AI support via [Bolt.new](https://bolt.new) & [Lovable.dev](https://lovable.dev)  

---

## 🚀 Get Started

Clone the repo:

```bash
git clone https://github.com/your-username/track-hub.git
cd track-hub
npm install
npm run dev
