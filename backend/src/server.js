require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server calisiyor: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server baslatilamadi:', error.message);
    process.exit(1);
  }
}

startServer();
