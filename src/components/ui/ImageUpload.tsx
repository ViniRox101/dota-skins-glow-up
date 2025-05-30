import React, { useState, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageUploadProps {
  onFileUpload: (file: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFileName(file ? file.name : null);
    onFileUpload(file);
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture" className="text-gray-300">Imagem do Produto</Label>
      <Input
        id="picture"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="bg-game-darker border-neon-green/20 text-gray-200 focus:border-neon-green focus:ring-neon-green/50 file:text-neon-green file:bg-game-dark file:border-0 file:font-semibold hover:file:bg-game-darker"
      />
      {fileName && <p className="text-sm text-gray-400 mt-1">Arquivo selecionado: {fileName}</p>}
    </div>
  );
};

export default ImageUpload;