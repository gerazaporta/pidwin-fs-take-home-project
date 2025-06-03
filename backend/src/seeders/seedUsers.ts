// seedUsers.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from "../models/user.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/pidwin';

async function seedUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');

        // Clear existing users
        await User.deleteMany();

        const users = [
            {
                name: 'Alice',
                email: 'alice@example.com',
                password: await bcrypt.hash('password123', 10),
                tokens: 100,
            },
            {
                name: 'Bob',
                email: 'bob@example.com',
                password: await bcrypt.hash('securepass', 10),
                tokens: 100,
            },
            {
                name: 'Charlie',
                email: 'charlie@example.com',
                password: await bcrypt.hash('charliepass', 10),
                tokens: 100,
            },
        ];

        await User.insertMany(users);
        console.log('Seeded users successfully');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        mongoose.disconnect();
    }
}

seedUsers();