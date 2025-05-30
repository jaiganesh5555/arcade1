'use client';

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Configure axios defaults
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
axios.defaults.withCredentials = true;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function FileUploader() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await axios.get('/api/auth/me');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      const url = newUrls[index];
      if (typeof url === 'string') {
        URL.revokeObjectURL(url);
      }
      return newUrls.filter((_, i) => i !== index);
    });
  }, []);

  const handleRemoveAll = useCallback(() => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
  }, [previewUrls]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Validate files
      const validFiles = newFiles.filter(file => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error(`${file.name} is not a supported image type`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} is too large. Maximum size is 5MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      
      setFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to upload images');
      router.push('/login');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select images to upload');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        // 1. Get presigned URL
        const { data } = await axios.get('/api/upload-image-url');
        const { url, key, publicUrl } = data;

        // 2. Upload to R2
        await axios.put(url, file, {
          headers: {
            'Content-Type': file.type,
            'Content-Length': file.size.toString()
          },
          onUploadProgress: (e) => {
            if (e.total) {
              const fileProgress = (e.loaded / e.total) * 100;
              const totalProgress = ((index + fileProgress / 100) / files.length) * 100;
              setProgress(totalProgress);
            }
          }
        });

        return { key, publicUrl };
      });

      const results = await Promise.all(uploadPromises);
      toast.success('Images uploaded successfully!');
      
      // Clear files and previews after successful upload
      handleRemoveAll();
      
      return results;
    } catch (error: any) {
      console.error('Upload failed:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        toast.error(error.response?.data?.error || 'Upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  }, [files, handleRemoveAll, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster position="top-right" />
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Image Upload</h2>
        
        <div className="mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p className="mt-2 text-sm text-gray-500">
            Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB per image.
          </p>
        </div>

        {files.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Selected Images:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square relative rounded-lg overflow-hidden">
                    {previewUrls[index] && (
                      <Image
                        src={previewUrls[index]!}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Uploading... {Math.round(progress)}%</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Images'}
          </button>
          
          {files.length > 0 && (
            <button
              onClick={handleRemoveAll}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Remove All
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 