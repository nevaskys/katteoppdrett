import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LitterReceiptsEditor } from './LitterReceiptsEditor';

interface ReceiptsButtonProps {
  images: string[];
  onChange: (images: string[]) => void;
  litterId?: string;
  disabled?: boolean;
}

export function ReceiptsButton({ images, onChange, litterId, disabled }: ReceiptsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Receipt className="h-4 w-4" />
          Kvitteringer
          {images.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
              {images.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kvitteringer og dokumenter</DialogTitle>
        </DialogHeader>
        <LitterReceiptsEditor
          images={images}
          onChange={onChange}
          litterId={litterId}
        />
      </DialogContent>
    </Dialog>
  );
}
