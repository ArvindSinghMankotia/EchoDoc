require("./config/UserTable");
require("./config/CreditRequestTable");
require("./config/DocumentTable");
require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/UserRoutes");
const documentRoutes = require("./routes/documentRoutes");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));