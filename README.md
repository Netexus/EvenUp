# EvenUp

EvenUp is a collaborative financial web platform designed to help users **manage shared expenses, settlements, and balances in a fair and transparent way**.  
The main goal is to provide a simple and modern experience where every user can track contributions and ensure fairness — **to "even up" with others**.  

---

## 🖼️ Project Overview

- [***Azure DevOps Board***](docs/AzureDevOps_EvenUp.pdf)
    
- [***Entity–Relationship Model*** ](docs/EvenUp.pdf)

- [***Web Mockup*** ](docs/EvenUp.pdf)
   

---

## 🚀 Features

- 👤 **User Management**: Registration, login, and role-based access (admin and regular users).  
- 💸 **Settlements**: Record payments and contributions between users.  
- ⚖️ **Automatic Balance Updates**: A MySQL trigger ensures balances stay consistent whenever a settlement is added.  
- 📊 **Balance Tracking**: View and manage shared expenses in real time.  
- 🔐 **Role-Based Access Control**: Different permissions for administrators and regular users.  
- 📱 **Responsive UI**: Clean frontend using CSS frameworks (Bulma).  

---

## 📂 Project Structure

```
evenup/
│
├── backend/                     # Node.js + Express server
│   ├── src/
│   │   ├── config/              # Database & environment setup
│   │   │   └── database.js
│   │   ├── models/              # MySQL models mapping
│   │   │   ├── groupMemberships.model.js
│   │   │   ├── expense.model.js
│   │   │   ├── expenseParticipants.model.js
│   │   │   ├── expenseGroup.model.js
│   │   │   ├── user.model.js
│   │   │   └── settlement.model.js
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.routes.js
│   │   │   ├── groupMemberships.routes.js
│   │   │   ├── expense.routes.js
│   │   │   ├── expenseGroup.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── settlement.routes.js
│   │   ├── controllers/         # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── groupMemberships.controller.js
│   │   │   ├── expense.controller.js
│   │   │   ├── expenseGroup.controller.js
│   │   │   ├── settlement.controller.js
│   │   │   └── user.controller.js
│   │   ├── middlewares/         # Tokens & validations
│   │   │   ├── error.js
│   │   │   ├── jwt.js
│   │   │   └── validators.js  
│   │   └── server.js
│   └── package.json
│
├── frontend/                    # Web client
│   ├── css/
│   │   └── styles.css
│   ├── js/                      # Connections with the backend and PWA configurations
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── pwa.js
│   │   └── main.js
│   ├── media/                   # Images and icons
│   │   ├── icons/
│   │   │   └── evenup.ico
│   │   ├── evenup.png
│   │   └── hero_image.jpg
│   ├── index.html
│   ├── dashboard.html
│   ├── login.html
│   ├── signup.html
│   ├── profile.html
│   └── sw.js
├── docs/ 
│   ├── db_schema.sql
│   ├── advanced_queries.sql
│   └── MR.svg
├── sw.js
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend
- **HTML5**, **CSS3**  
- **CSS** Framework: *Bulma*  
- Vanilla **JavaScript** for dynamic behavior  

### Backend
- **Node.js** with **Express.js**  
- **Dotenv** for environment variables management
- **JWT (JSON Web Token)** for authentication and security 
- *REST API* for managing users, groups, settlements, and balances  

### Database
- **PostgreSQL**  
- Triggers and functions for automatic updates
- Tables:  
   - **app_users** → App users once they sign up  
   - **expense_groups** → Groups of expenses
   - **group_memberships** → Members of a group with role-based access 
   - **expenses** → expenses of a group
   - **expense_participants** → Participants of an especific expense
   - **settlements** → Stores payments between users  
   - **user_balances** → Keeps track of current balance per user

---

## 📌 Installation & Setup

1. Clone this repository:  
   ```bash
   git clone https://github.com/Netexus/EvenUp
   cd EvenUp
   ```
2. Install backend dependencies:  
   ```bash
   cd backend
   npm install
   ```
3. Create a `.env` file in the *backend* with the following content: 

   ```env
   NODE_ENV=development
   DB_HOST=your_localhost
   DB_USER=your_database_name
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   PORT=your_port
   JWT_SECRET=your_JWT_key
   PGSSL=false
   ```
4. Start the server: 
   ```bash
   npm start
   ``` 
---

## 🛡️ Security

- **JWT** for secure sessions  
- **Password hashing** (bcrypt recommended)  
- Sensitive credentials stored in `.env` 

---

## 👥 Authors

<a href="https://github.com/Susilvav03">
  <img src="https://avatars.githubusercontent.com/u/144504485?v=4" width="70px;" alt="Susana Silva Vallejo"/>
</a>

***Susana Silva Vallejo***


<a href="https://github.com/Netexus">
  <img src="https://avatars.githubusercontent.com/u/174134538?v=4" width="70px;" alt="Luis Fernando Martínez Cervantes"/>
</a>

***Luis Fernando Martínez Cervantes***


<a href="https://github.com/Oomass7">
  <img src="https://avatars.githubusercontent.com/u/109863567?v=4" width="70px;" alt="José Tomás Loaiza Rodríguez"/>
</a>

***José Tomás Loaiza Rodríguez***


<a href="https://github.com/Pegasso-admon">
  <img src="https://avatars.githubusercontent.com/u/208418806?v=4" width="70px;" alt="Samuel Rosero Álvarez"/>
</a>

***Samuel Rosero Álvarez***


<a href="https://github.com/Luiolopez1">
  <img src="https://avatars.githubusercontent.com/u/116003991?v=4" width="70px;" alt="Luis Fernando Rodriguez Lopez"/>
</a>

***Luis Fernando Rodriguez Lopez***

---

## 📜 License

This project is licensed under the MIT License.
