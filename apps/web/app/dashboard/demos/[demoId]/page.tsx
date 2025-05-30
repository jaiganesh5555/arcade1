"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DemoData {
  id: string;
  title: string;
  description: string;
  type: string;
  content: string;
  thumbnail?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function DemoDetailPage() {
  const params = useParams();
  const demoId = params.demoId as string;

  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!demoId) return;

    const fetchDemo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3002/api/demos/${demoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const fetchedDemo = response.data;
        setDemo(fetchedDemo);

        try {
          const decodedContent = decodeURIComponent(fetchedDemo.content);
          const urls = JSON.parse(decodedContent);
          if (Array.isArray(urls) && urls.every(url => typeof url === 'string')) {
            setImageUrls(urls);
          } else {
            console.warn("Decoded content is not a JSON array of strings:", urls);
            setImageUrls([]);
          }
        } catch (parseError) {
          console.error("Failed to decode or parse demo content:", parseError);
          setImageUrls([]);
        }

      } catch (err: any) {
        console.error("Error fetching demo:", err);
        setError(err.response?.data?.message || "Failed to load demo.");
      } finally {
        setLoading(false);
      }
    };

    fetchDemo();
  }, [demoId]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + imageUrls.length) % imageUrls.length);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading demo...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-destructive">Error: {error}</div>;
  }

  if (!demo) {
    return <div className="flex justify-center items-center min-h-screen">Demo not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{demo.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{demo.description}</p>
          <div className="mb-4">
            <strong>Type:</strong> {demo.type}
          </div>
          <div className="mb-4">
            <strong>Views:</strong> {demo.views}
          </div>
          <div className="mb-4">
            <strong>Created At:</strong> {new Date(demo.createdAt).toLocaleDateString()}
          </div>
          <div className="mb-4">
            <strong>Updated At:</strong> {new Date(demo.updatedAt).toLocaleDateString()}
          </div>
          <div>
            <strong>Content:</strong>
            {imageUrls.length > 0 ? (
              <div className="relative w-full max-w-2xl mx-auto mt-4">
                <div className="aspect-video relative">
                  <Image
                    src={imageUrls[currentImageIndex]!}
                    alt={`Demo image ${currentImageIndex + 1}`}
                    fill
                    style={{ objectFit: 'contain' }}
                    className="rounded-md"
                  />
                </div>
                {imageUrls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}
                <div className="text-center text-sm text-muted-foreground mt-2">
                  {currentImageIndex + 1} of {imageUrls.length}
                </div>
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm mt-2">
                {demo.content}
              </pre>
            )}
          </div>
          {demo.thumbnail && (
            <div className="mt-4">
              <strong>Thumbnail:</strong>
              <p>{demo.thumbnail}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 