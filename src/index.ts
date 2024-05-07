import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import routes from "./routes/index";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "DELETE", "PUT"],
		allowedHeaders: ["Content-Type"],
	})
);
app.use("/", routes);
app.get("/", (req, res) => {
	res.send("Im alive!!");
});

app.listen(port, () => {
	if (!fs.existsSync("./src/public/upload/img")) {
		fs.mkdirSync("./src/public/upload/img", { recursive: true });
	}
	console.log(`App listening on port ${port}`);
});
