# Talk-Sphere 💬

A full-stack real-time chat application built with the MERN stack and Socket.IO. Talk-Sphere supports one-on-one and group messaging, audio/video calls, stories, emoji reactions, and much more — all wrapped in a clean, responsive UI with light/dark mode support.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| Frontend | [https://talk-sphere-frontend-9el7.onrender.com](https://talk-sphere-frontend-9el7.onrender.com) |
| Backend API | [https://talk-sphere-3.onrender.com](https://talk-sphere-3.onrender.com) |

---

## ✨ Features

- **Real-time messaging** — instant one-on-one and group chat powered by Socket.IO
- **Audio & Video calls** — peer-to-peer WebRTC calls with accept/reject flow
- **Stories** — post text or image stories visible to all users, with view tracking
- **Message reactions** — react to any message with emoji (👍 ❤️ and more)
- **Reply to messages** — inline reply with quoted preview
- **Edit & Delete messages** — update or remove your own messages in real time
- **Image messages** — share images via URL in chat
- **Message search** — filter messages in the active chat window
- **Group chats** — create and manage group conversations
- **Typing indicators** — see when the other person is typing
- **User authentication** — register, login, email verification, forgot/reset password
- **Profile management** — update name, profile picture via Cloudinary
- **Favourites** — mark contacts or chats as favourites
- **Light / Dark mode** — toggle between themes
- **Custom accent colors** — choose from multiple theme color options
- **Fully responsive** — works on desktop and mobile

---

## 🛠️ Technologies Used

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Redux + Redux Thunk | State management |
| Socket.IO Client | Real-time communication |
| Styled Components | Component-level styling |
| Tailwind CSS | Utility-first CSS |
| Framer Motion | Animations |
| Axios | HTTP requests |
| React Router v6 | Client-side routing |
| Emoji Mart | Emoji picker |
| Moment.js | Date/time formatting |
| Swiper | Team carousel |
| AOS | Scroll animations |
| React Toastify | Toast notifications |
| React Icons | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB + Mongoose | Database & ODM |
| Socket.IO | WebSocket server |
| JSON Web Token (JWT) | Authentication |
| bcryptjs | Password hashing |
| Cloudinary | Image/media storage |
| Nodemailer | Email (verification, password reset) |
| Multer | File upload handling |
| Helmet | HTTP security headers |
| dotenv | Environment variable management |

---

## 📁 Project Structure

```
Talk-Sphere/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── Components/      # UI components (Chat, Auth, Modals, etc.)
│       ├── Pages/           # Route-level pages
│       ├── Redux/           # Redux reducers, actions, types
│       ├── Layout/          # Layout HOC
│       ├── GlobalStyle/     # Global styled-components theme
│       ├── HelperFunction/  # Utility functions
│       └── config.js/       # Static data (features, team, colors)
│
└── server/                  # Express backend
    ├── config/              # DB connection, environment keys
    ├── controllers/         # Route handlers
    ├── middleware/          # Auth, error handling
    ├── models/              # Mongoose schemas
    └── routes/              # API route definitions
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image uploads)
- Gmail account with App Password (for email features)

### 1. Clone the repository

```bash
git clone https://github.com/Codesat45/Talk-Sphere.git
cd Talk-Sphere
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory with your MongoDB, JWT, Cloudinary, SMTP, and port configuration.

Start the server:

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

### 3. Set up the client

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory with your server base URL.

Start the client:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/register` | Register a new user |
| POST | `/api/user/login` | Login |
| GET | `/api/user` | Search users |
| GET | `/api/chat` | Get all chats |
| POST | `/api/chat` | Create / access a chat |
| POST | `/api/chat/group` | Create a group chat |
| GET | `/api/message/:chatId` | Get messages for a chat |
| POST | `/api/message` | Send a message |
| PUT | `/api/message/:id` | Edit a message |
| DELETE | `/api/message/:id` | Delete a message |
| GET | `/api/story` | Get all stories |
| POST | `/api/story` | Create a story |
| PUT | `/api/story/:id/view` | Mark story as viewed |
| DELETE | `/api/story/:id` | Delete a story |

---

## 👥 Team

| Name | Role |
|------|------|
| Satyam Tripathi | Frontend Developer |
| Dheeraj Kumar | Backend Developer |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
