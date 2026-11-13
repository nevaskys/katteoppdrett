import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompress';
import { toast } from 'sonner';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ReceiptPicker({ images, onChange }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await compressImage(file, 1600, 0.8);
        const blob = await (await fetch(dataUrl)).blob();
        const path = `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage
          .from('litter-receipts')
          .upload(path, blob, { contentType: 'image/jpeg' });
        if (error) throw error;
        added.push(supabase.storage.from('litter-receipts').getPublicUrl(path).data.publicUrl);
      }
      onChange([...images, ...added]);
    } catch (e) {
      console.error(e);
      toast.error('Kunne ikke laste opp kvitteringen');
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => cameraRef.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
          Ta bilde
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => galleryRef.current?.click()}>
          <ImagePlus className="h-4 w-4 mr-2" />
          Velg bilde
        </Button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative">
              <a href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="Kvittering" className="h-16 w-16 rounded-md object-cover border" />
              </a>
              <button
                type="button"
                onClick={() => onChange(images.filter((u) => u !== url))}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-destructive-foreground p-0.5"
                aria-label="Fjern"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReceiptThumbs({ images }: { images: string[] }) {
  if (!images.length) return null;
  return (
    <div className="flex gap-1 mt-1">
      {images.map((url) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          <img src={url} alt="Kvittering" className="h-9 w-9 rounded object-cover border" />
        </a>
      ))}
    </div>
  );
}
