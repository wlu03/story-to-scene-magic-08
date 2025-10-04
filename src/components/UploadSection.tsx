import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  onCancel: () => void;
}

export const UploadSection = ({ onFileSelect, onCancel }: UploadSectionProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file type
      const validTypes = ['text/plain', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a text or PDF file");
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      toast.success("File selected successfully");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
  });

  const handleProcess = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="max-w-2xl w-full p-8 bg-card border-border shadow-elegant">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Upload Your Story</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-all duration-300
            ${isDragActive 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            {selectedFile ? (
              <>
                <FileText className="h-16 w-16 text-primary" />
                <div>
                  <p className="text-lg font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-16 w-16 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? "Drop your file here" : "Drag & drop your story"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    or click to browse • TXT or PDF • Max 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setSelectedFile(null)}
              className="flex-1"
            >
              Choose Different File
            </Button>
            <Button
              onClick={handleProcess}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
            >
              Process Story
            </Button>
          </div>
        )}

        <div className="mt-8 p-4 rounded-lg bg-secondary/50">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> For best results, 
            ensure your story has clear scene breaks or paragraphs. The AI will 
            automatically detect scene changes and create corresponding video segments.
          </p>
        </div>
      </Card>
    </section>
  );
};
