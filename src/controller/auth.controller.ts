import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { prisma } from "../config/database";

dotenv.config();
if (!process.env.JWT_SECRET) {
	console.error("ENV Error!!");
	process.exit(1);
}

const registerUser = async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (!email) {
		return res.status(400).send("Email is required");
	}
	if (!password) {
		return res.status(400).send("Password is required");
	}
	const encryptedPassword = bcrypt.hashSync(password, 10);
	const user = await prisma.user.create({
		data: {
			email,
			password: encryptedPassword,
		},
		select: {
			id: true,
			email: true,
		},
	});
	res.json(user);
};

const loginUser = async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (!email) {
		return res.status(400).send("Email is required");
	}
	if (!password) {
		return res.status(400).send("Password is required");
	}
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});
	if (!user) {
		return res.status(404).send("User not found");
	}
	const isPasswordValid = bcrypt.compareSync(password, user.password);
	if (!isPasswordValid) {
		return res.status(401).send("Invalid password");
	}
	if (!process.env.JWT_SECRET) {
		return res.status(500).send("Internal server error");
	}
	const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
		expiresIn: "12h",
	});
	res.json({
		token,
		user: {
			id: user.id,
			email: user.email,
		},
	});
};

export { registerUser, loginUser };
