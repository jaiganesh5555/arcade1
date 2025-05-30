import FileUploader from '../../components/FileUploader';

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">File Upload</h1>
        <FileUploader />
      </div>
    </main>
  );
} 