# EvenUp

EvenUp is a collaborative financial web platform designed to help users **manage shared expenses, settlements, and balances in a fair and transparent way**.  
The main goal is to provide a simple and modern experience where every user can track contributions and ensure fairness — **to "even up" with others**.  

---

## 🚀 Features

- 👤 **User Management**: Registration, login, and role-based access (admin and regular users).  
- 💸 **Settlements**: Record payments and contributions between users.  
- ⚖️ **Automatic Balance Updates**: A MySQL trigger ensures balances stay consistent whenever a settlement is added.  
- 📊 **Balance Tracking**: View and manage shared expenses in real time.  
- 🔐 **Role-Based Access Control**: Different permissions for administrators and regular users.  
- 📱 **Responsive UI**: Clean frontend using CSS frameworks (Bulma).  

---

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3  
- CSS Framework: **Bulma**  
- Vanilla JavaScript for dynamic behavior  

### Backend
- **Node.js** with **Express.js**  
- REST API for managing users, settlements, and balances  

### Database
- **MySQL**  
- Tables: `Users`, `Settlements`, `Balances`, `Logs`  
- Triggers for automatic updates  

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
│   │   │   ├── user.model.js
│   │   │   ├── settlement.model.js
│   │   │   └── balance.model.js
│   │   ├── routes/              # API endpoints
│   │   │   ├── user.routes.js
│   │   │   ├── settlement.routes.js
│   │   │   └── balance.routes.js
│   │   ├── controllers/         # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── balance.controller.js
│   │   │   ├── expense.controller.js
│   │   │   ├── group.controller.js
│   │   │   ├── settlement.controller.js
│   │   │   └── user.controller.js
│   │   ├── middlewares/         # Auth & validation
│   │   │   ├── authjs
│   │   │   └── error.js
│   │   └── server.js
│   └── package.json
│
├── frontend/                    # Web client
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── assets/
│
└── README.md
```

---

## ⚙️ Database Schema

- **Users** → App users with role-based access  
- **Settlements** → Stores payments between users  
- **Balances** → Keeps track of current balance per user  
- **Logs** → History of activity and transactions  

### Example Trigger
```sql
CREATE TRIGGER update_balance_after_settlement
AFTER INSERT ON Settlements
FOR EACH ROW
BEGIN
  UPDATE Balances
  SET amount = amount + NEW.amount
  WHERE user_id = NEW.user_id;
END;
```

---

## 📌 Installation & Setup

1. Clone this repository:  
   ```bash
   git clone https://github.com/your-username/evenup.git
   ```
2. Install backend dependencies:  
   ```bash
   cd backend
   npm install
   ```
3. Configure environment variables in `.env`:  
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=yourpassword
   DB_NAME=EvenUp
   PORT=4000
   ```
4. Run backend:  
   ```bash
   npm start
   ```
5. Open `frontend/index.html` in your browser.  


## 🧑‍💻 Authors

- **Susana Silva**  
- **Tomás**  
- **Samuel Rosero**  
- **Luis Rodriguez**  
- **Luis Martínez**  

---

## 📜 License

This project is licensed under the MIT License.
