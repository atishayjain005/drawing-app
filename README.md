# 🖌️ Whiteboard Sharing Application

A collaborative whiteboard-sharing app for real-time drawing and collaboration using modern web technologies.

---

## 🌟 Features
- 🎨 Real-time whiteboard collaboration
- 🚀 Room-based drawing and messaging
- 🔒 Scalable backend with **Supabase** for real-time database management
- 📊 SQL-based operations for data handling
- 🌈 User-friendly and responsive UI

---

## 🛠️ Technologies Used

### **Frontend**
- **React**: A JavaScript library for building user interfaces.
- **Vite**: Fast development and build tool.
- **TailwindCSS**: For responsive and beautiful designs.
- **Socket.IO Client**: Real-time communication with the backend.
- **Rough.js**: Hand-drawn styled graphics for the whiteboard.
- **UUID**: Unique ID generation for users.
- **Lodash**: Utility library for data manipulation.
- **React Copy to Clipboard**: Simplifies copying content to the clipboard.

### **Backend**
- **Express**: A fast and minimalist web framework for Node.js.
- **Socket.IO**: Real-time communication for collaborative drawing.
- **Supabase**: SQL-based real-time database management.
- **CORS**: Cross-Origin Resource Sharing for secure communication.
- **Dotenv**: Securely manage environment variables.

---

## 🖥️ Deployment

### Links
- **Frontend**: [Netlify Deployment](https://cool-brioche-284169.netlify.app/)
- **Backend**: [Render Deployment](https://drawing-app-91bo.onrender.com/)

---

## 🚀 Installation & Setup

### Prerequisites:
- Node.js (v16 or higher)
- npm or yarn

### Steps:
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the directories and install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up environment variables:
   - **Frontend**:
     ```env
     REACT_APP_BACKEND_URL=<backend-url>
     ```
   - **Backend**:
     ```env
     DB_URL=<supabase-url>
     DB_SECRET=<supabase-secret>
     ```

4. Start the development servers:
   - Frontend:
     ```bash
     npm run start
     ```
   - Backend:
     ```bash
     npm run dev
     ```



