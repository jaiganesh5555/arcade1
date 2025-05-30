"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const zod_1 = require("zod");
const cors_1 = __importDefault(require("cors"));
const db_1 = require("db");
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function testConnection() {
    try {
        await db_1.prisma.$connect();
        console.log('Successfully connected to database');
    }
    catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
}
testConnection();
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'https://arcade-web-two.vercel.app/',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT?.replace('/bucket', '') || '';
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "bucket";
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";
console.log('Environment variables:', {
    CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'Set' : 'Not set',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
    CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT,
    CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL
});
if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials not configured in environment variables");
}
console.log("Credentials:", {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length,
    secretAccessKey: "*".repeat(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length || 0)
});
const r2Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || "",
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || "",
    },
    forcePathStyle: true
});
async function testR2Connection() {
    try {
        console.log('Testing R2 connection...');
        console.log('Using Bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME
        });
        await r2Client.send(command);
        console.log('✅ R2 connection successful');
    }
    catch (error) {
        console.error('❌ R2 connection failed:', {
            message: error.message,
            code: error.code,
            config: {
                endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
                bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
                credsLength: {
                    accessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length,
                    secretKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length
                }
            }
        });
    }
}
testR2Connection();
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    jsonwebtoken_1.default.verify(token, config_1.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            res.status(403).json({ message: 'Invalid or expired token' });
            return;
        }
        req.user = { userId: user.userId };
        next();
    });
};
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
const signinSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
const demoSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    type: zod_1.z.string(),
    content: zod_1.z.string(),
    thumbnail: zod_1.z.string().optional(),
    url: zod_1.z.string().optional(),
    isPublic: zod_1.z.boolean().optional().default(false),
});
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already taken"
            });
        }
        const user = await db_1.prisma.user.create({
            data: {
                email,
                password,
                name
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, config_1.JWT_SECRET);
        return res.json({
            message: "User created successfully",
            token
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db_1.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true
            }
        });
        if (!user || user.password !== password) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, config_1.JWT_SECRET);
        return res.json({ token });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});
app.post('/api/demos', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { success } = demoSchema.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ message: "Invalid demo data" });
        }
        const { title, description, type, content, thumbnail, url, isPublic } = req.body;
        const demo = await db_1.prisma.demo.create({
            data: {
                title,
                description,
                type,
                content,
                thumbnail,
                url,
                isPublic,
                views: 0,
                user: {
                    connect: {
                        id: req.user.userId
                    }
                }
            }
        });
        return res.status(201).json(demo);
    }
    catch (error) {
        console.error('Create demo error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
app.get('/api/demos', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const demos = await db_1.prisma.demo.findMany({
            where: {
                user: {
                    id: req.user.userId
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.json(demos);
    }
    catch (error) {
        console.error('Get demos error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
app.get('/api/demos/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { id } = req.params;
        const demo = await db_1.prisma.demo.findFirst({
            where: {
                id,
                user: {
                    id: req.user.userId
                }
            }
        });
        if (!demo) {
            return res.status(404).json({ message: "Demo not found" });
        }
        await db_1.prisma.demo.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
        return res.json(demo);
    }
    catch (error) {
        console.error('Get demo error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
app.put('/api/demos/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { id } = req.params;
        const { success } = demoSchema.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ message: "Invalid demo data" });
        }
        const demo = await db_1.prisma.demo.findFirst({
            where: {
                id,
                user: {
                    id: req.user.userId
                }
            }
        });
        if (!demo) {
            return res.status(404).json({ message: "Demo not found" });
        }
        const { title, description, type, content, thumbnail, url, isPublic } = req.body;
        const updatedDemo = await db_1.prisma.demo.update({
            where: { id },
            data: {
                title,
                description,
                type,
                content,
                thumbnail,
                url,
                isPublic,
            }
        });
        return res.json(updatedDemo);
    }
    catch (error) {
        console.error('Update demo error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
app.delete('/api/demos/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { id } = req.params;
        const demo = await db_1.prisma.demo.findFirst({
            where: {
                id,
                user: {
                    id: req.user.userId
                }
            }
        });
        if (!demo) {
            return res.status(404).json({ message: "Demo not found" });
        }
        await db_1.prisma.demo.delete({
            where: { id }
        });
        return res.json({ message: "Demo deleted successfully" });
    }
    catch (error) {
        console.error('Delete demo error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }
        if (!R2_BUCKET_NAME) {
            return res.status(500).json({ message: "R2 bucket name not configured" });
        }
        const file = req.file;
        const key = `uploads/${Date.now()}-${file.originalname}`;
        console.log("Preparing upload:", {
            fileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            bufferLength: file.buffer.length,
            bucket: R2_BUCKET_NAME
        });
        const params = {
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        try {
            const command = new client_s3_1.PutObjectCommand(params);
            await r2Client.send(command);
        }
        catch (uploadErr) {
            console.error("❌ R2 Upload Failed:", uploadErr.message);
            return res.status(500).json({
                message: "Upload to R2 failed",
                error: uploadErr.message,
                details: {
                    bucket: R2_BUCKET_NAME,
                    endpoint: R2_ENDPOINT
                }
            });
        }
        const imageUrl = `${R2_PUBLIC_URL}/${key}`;
        console.log('✅ Image uploaded to R2:', imageUrl);
        return res.json({ url: imageUrl });
    }
    catch (error) {
        console.error('❌ Image upload error:', error.message, error.stack);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});
app.get('/api/upload-image-url', authenticateToken, async (_req, res) => {
    try {
        const key = `images/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        console.log('R2 Configuration:', {
            endpoint: R2_ENDPOINT,
            bucket: R2_BUCKET_NAME,
            publicUrl: R2_PUBLIC_URL,
            hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            key: key
        });
        try {
            const testCommand = new client_s3_1.GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: 'test.txt'
            });
            await r2Client.send(testCommand);
            console.log('✅ R2 connection test successful');
        }
        catch (testError) {
            console.log('⚠️ R2 connection test failed:', testError.message);
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: 'image/jpeg',
        });
        console.log('Generating presigned URL for:', {
            bucket: R2_BUCKET_NAME,
            key: key
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(r2Client, command, {
            expiresIn: 3600
        });
        console.log('✅ Presigned URL generated successfully');
        const publicUrl = `${R2_PUBLIC_URL}/${key}`;
        return res.json({ url, key, publicUrl });
    }
    catch (error) {
        console.error('❌ Error generating upload URL:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Failed to generate upload URL',
            details: {
                endpoint: R2_ENDPOINT,
                bucket: R2_BUCKET_NAME,
                error: error.message,
                code: error.code
            }
        });
    }
});
app.get('/api/test-r2', async (_req, res) => {
    try {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME
        });
        const data = await r2Client.send(command);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack,
            config: {
                endpoint: process.env.R2_ENDPOINT,
                bucket: process.env.R2_BUCKET_NAME,
                credsLength: {
                    accessKey: process.env.R2_ACCESS_KEY_ID?.length,
                    secretKey: process.env.R2_SECRET_ACCESS_KEY?.length
                }
            }
        });
    }
});
app.get('/api/download-url/:key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;
        const url = await (0, s3_request_presigner_1.getSignedUrl)(r2Client, new client_s3_1.GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }), { expiresIn: 3600 });
        return res.json({ url });
    }
    catch (error) {
        console.error('Error generating download URL:', error);
        return res.status(500).json({ error: 'Failed to generate download URL' });
    }
});
app.get('/api/test', (_req, res) => {
    res.json({ message: 'API is working!' });
});
app.get('/api/debug-env', (_req, res) => {
    res.json({
        bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL
    });
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map