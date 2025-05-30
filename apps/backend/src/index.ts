import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config';
import { z as zod } from 'zod';
import cors from 'cors';
import { prisma, PrismaClient } from 'db';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, CreateBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
dotenv.config();

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

testConnection();

const app = express();
const port = process.env.PORT || 3002;

// Enable CORS and JSON parsing
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://arcade1-web-rtr6.vercel.app/',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT?.replace('/bucket', '') || '';
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
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length,
  secretAccessKey: "*".repeat(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length || 0)
});

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || "",
  },
  forcePathStyle: true
});

// Test R2 connection on startup
async function testR2Connection() {
  try {
    console.log('Testing R2 connection...');
    console.log('Using Bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
    const command = new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME
    });
    await r2Client.send(command);
    console.log('✅ R2 connection successful');
  } catch (error: any) {
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

// Call the test function
testR2Connection();

// Types
interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
  file?: Express.Multer.File;
}

// Middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
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

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
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
const signupSchema = zod.object({
  name: zod.string().min(3),
  email: zod.string().email(),
  password: zod.string()
});

const signinSchema = zod.object({
  email: zod.string().email(),
  password: zod.string()
});

const demoSchema = zod.object({
  title: zod.string().min(1),
  description: zod.string(),
  type: zod.string(),
  content: zod.string(),
  thumbnail: zod.string().optional(),
  url: zod.string().optional(),
  isPublic: zod.boolean().optional().default(false),
});

// Auth Routes
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already taken"
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    return res.json({
      message: "User created successfully",
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
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

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    return res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Demo Routes
app.post('/api/demos', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { success } = demoSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ message: "Invalid demo data" });
    }

    const { title, description, type, content, thumbnail, url, isPublic } = req.body;
    const demo = await prisma.demo.create({
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
  } catch (error) {
    console.error('Create demo error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/demos', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const demos = await prisma.demo.findMany({
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
  } catch (error) {
    console.error('Get demos error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/demos/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const demo = await prisma.demo.findFirst({
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
    await prisma.demo.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    return res.json(demo);
  } catch (error) {
    console.error('Get demo error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.put('/api/demos/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { success } = demoSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ message: "Invalid demo data" });
    }

    const demo = await prisma.demo.findFirst({
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
    const updatedDemo = await prisma.demo.update({
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
  } catch (error) {
    console.error('Update demo error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/api/demos/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const demo = await prisma.demo.findFirst({
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

    await prisma.demo.delete({
      where: { id }
    });

    return res.json({ message: "Demo deleted successfully" });
  } catch (error) {
    console.error('Delete demo error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Image Upload Endpoint (Fixed)
app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
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
      const command = new PutObjectCommand(params);
      await r2Client.send(command);
    } catch (uploadErr: any) {
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

  } catch (error: any) {
    console.error('❌ Image upload error:', error.message, error.stack);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Update the upload URL endpoint
app.get('/api/upload-image-url', authenticateToken, async (_req, res) => {
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
      const testCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: 'test.txt'
      });
      await r2Client.send(testCommand);
      console.log('✅ R2 connection test successful');
    } catch (testError: any) {
      console.log('⚠️ R2 connection test failed:', testError.message);
      // Continue anyway as the bucket might be empty
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: 'image/jpeg',
    });

    console.log('Generating presigned URL for:', {
      bucket: R2_BUCKET_NAME,
      key: key
    });

    const url = await getSignedUrl(r2Client, command, { 
      expiresIn: 3600 
    });

    console.log('✅ Presigned URL generated successfully');

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    return res.json({ url, key, publicUrl });
  } catch (error: any) {
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

// Update the test endpoint
app.get('/api/test-r2', async (_req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME
    });
    const data = await r2Client.send(command);
    res.json({ success: true, data });
  } catch (error: any) {
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

// Update the download URL endpoint
app.get('/api/download-url/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const url = await getSignedUrl(r2Client, new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }), { expiresIn: 3600 });
    return res.json({ url });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Test endpoint
app.get('/api/test', (_req: Request, res: Response) => {
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
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});