"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwt = __importStar(require("jsonwebtoken"));
const config_1 = require("./config");
const zod_1 = require("zod");
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("db"));
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Test database connection
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.$connect();
            console.log('Successfully connected to database');
        }
        catch (error) {
            console.error('Failed to connect to database:', error);
            process.exit(1);
        }
    });
}
testConnection();
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
// Enable CORS and JSON parsing
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'https://arcade1-web-rtr6.vercel.app/',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Configure multer for file uploads
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const R2_ENDPOINT = ((_a = process.env.CLOUDFLARE_R2_ENDPOINT) === null || _a === void 0 ? void 0 : _a.replace('/bucket', '')) || '';
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "bucket";
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";
// Debug environment variables
console.log('Environment variables:', {
    CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'Set' : 'Not set',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
    CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT,
    CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL
});
// Validate R2 credentials
if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials not configured in environment variables");
}
console.log("Credentials:", {
    accessKeyId: (_b = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) === null || _b === void 0 ? void 0 : _b.length,
    secretAccessKey: "*".repeat(((_c = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) === null || _c === void 0 ? void 0 : _c.length) || 0)
});
const r2Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: ((_d = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) === null || _d === void 0 ? void 0 : _d.trim()) || "",
        secretAccessKey: ((_e = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) === null || _e === void 0 ? void 0 : _e.trim()) || "",
    },
    forcePathStyle: true
});
// Test R2 connection on startup
function testR2Connection() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Testing R2 connection...');
            console.log('Using Bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME
            });
            yield r2Client.send(command);
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
                        accessKey: (_a = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) === null || _a === void 0 ? void 0 : _a.length,
                        secretKey: (_b = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) === null || _b === void 0 ? void 0 : _b.length
                    }
                }
            });
        }
    });
}
// Call the test function
testR2Connection();
// Middleware
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
    jwt.verify(token, config_1.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            res.status(403).json({ message: 'Invalid or expired token' });
            return;
        }
        req.user = { userId: user.userId };
        next();
    });
};
// Validation schemas
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
// Auth Routes
app.post('/api/auth/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }
        const existingUser = yield db_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already taken"
            });
        }
        const user = yield db_1.default.user.create({
            data: {
                email,
                password,
                name
            }
        });
        const token = jwt.sign({ userId: user.id }, config_1.JWT_SECRET);
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
}));
app.post('/api/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield db_1.default.user.findUnique({
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
        const token = jwt.sign({ userId: user.id }, config_1.JWT_SECRET);
        return res.json({ token });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.get('/api/auth/me', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const user = yield db_1.default.user.findUnique({
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
}));
// Demo Routes
app.post('/api/demos', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { success } = demoSchema.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ message: "Invalid demo data" });
        }
        const { title, description, type, content, thumbnail, url, isPublic } = req.body;
        const demo = yield db_1.default.demo.create({
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
}));
app.get('/api/demos', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const demos = yield db_1.default.demo.findMany({
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
}));
app.get('/api/demos/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { id } = req.params;
        const demo = yield db_1.default.demo.findFirst({
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
        // Increment views
        yield db_1.default.demo.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
        return res.json(demo);
    }
    catch (error) {
        console.error('Get demo error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
app.put('/api/demos/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { id } = req.params;
        const { success } = demoSchema.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ message: "Invalid demo data" });
        }
        const demo = yield db_1.default.demo.findFirst({
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
        const updatedDemo = yield db_1.default.demo.update({
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
}));
app.delete('/api/demos/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { id } = req.params;
        const demo = yield db_1.default.demo.findFirst({
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
        yield db_1.default.demo.delete({
            where: { id }
        });
        return res.json({ message: "Demo deleted successfully" });
    }
    catch (error) {
        console.error('Delete demo error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
// Image Upload Endpoint (Fixed)
app.post('/api/upload-image', authenticateToken, upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            yield r2Client.send(command);
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
}));
// Update the upload URL endpoint
app.get('/api/upload-image-url', authenticateToken, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = `images/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        // Log the full configuration
        console.log('R2 Configuration:', {
            endpoint: R2_ENDPOINT,
            bucket: R2_BUCKET_NAME,
            publicUrl: R2_PUBLIC_URL,
            hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            key: key
        });
        // Test R2 connection
        try {
            const testCommand = new client_s3_1.GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: 'test.txt'
            });
            yield r2Client.send(testCommand);
            console.log('✅ R2 connection test successful');
        }
        catch (testError) {
            console.log('⚠️ R2 connection test failed:', testError.message);
            // Continue anyway as the bucket might be empty
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
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(r2Client, command, {
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
}));
// Update the test endpoint
app.get('/api/test-r2', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    try {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME
        });
        const data = yield r2Client.send(command);
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
                    accessKey: (_f = process.env.R2_ACCESS_KEY_ID) === null || _f === void 0 ? void 0 : _f.length,
                    secretKey: (_g = process.env.R2_SECRET_ACCESS_KEY) === null || _g === void 0 ? void 0 : _g.length
                }
            }
        });
    }
}));
// Update the download URL endpoint
app.get('/api/download-url/:key', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.params;
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(r2Client, new client_s3_1.GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }), { expiresIn: 3600 });
        return res.json({ url });
    }
    catch (error) {
        console.error('Error generating download URL:', error);
        return res.status(500).json({ error: 'Failed to generate download URL' });
    }
}));
// Test endpoint
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
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
