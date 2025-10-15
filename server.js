import app from "./app.js";
import colors from "colors";
import connectDB from "./config/db.js";

// database config
connectDB();

const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
    console.log(`Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
});