import { Link } from 'react-router-dom';
import { Cat as CatIcon } from 'lucide-react';

interface Cat {
  id: string;
  name: string;
  images?: string[];
  breed?: string;
}

interface ParentImagesProps {
  mother?: Cat | null;
  father?: Cat | null;
  externalFatherName?: string | null;
}

export function ParentImages({ mother, father, externalFatherName }: ParentImagesProps) {
  const hasAnyParent = mother || father || externalFatherName;
  
  if (!hasAnyParent) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {/* Mother */}
      {mother ? (
        <Link 
          to={`/cats/${mother.id}`}
          className="flex flex-col items-center group"
        >
          <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-900/30 border-2 border-pink-200 dark:border-pink-800 overflow-hidden flex items-center justify-center group-hover:ring-2 ring-primary transition-all">
            {mother.images?.[0] ? (
              <img 
                src={mother.images[0]} 
                alt={mother.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <CatIcon className="h-8 w-8 text-pink-400" />
            )}
          </div>
          <span className="mt-2 text-sm font-medium text-center group-hover:text-primary transition-colors">
            {mother.name}
          </span>
          <span className="text-xs text-muted-foreground">Mor</span>
        </Link>
      ) : null}

      {/* Heart icon between parents */}
      {(mother || father || externalFatherName) && (
        <div className="text-2xl text-pink-400">♥</div>
      )}

      {/* Father */}
      {father ? (
        <Link 
          to={`/cats/${father.id}`}
          className="flex flex-col items-center group"
        >
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 overflow-hidden flex items-center justify-center group-hover:ring-2 ring-primary transition-all">
            {father.images?.[0] ? (
              <img 
                src={father.images[0]} 
                alt={father.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <CatIcon className="h-8 w-8 text-blue-400" />
            )}
          </div>
          <span className="mt-2 text-sm font-medium text-center group-hover:text-primary transition-colors">
            {father.name}
          </span>
          <span className="text-xs text-muted-foreground">Far</span>
        </Link>
      ) : externalFatherName ? (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 overflow-hidden flex items-center justify-center">
            <CatIcon className="h-8 w-8 text-blue-400" />
          </div>
          <span className="mt-2 text-sm font-medium text-center">
            {externalFatherName}
          </span>
          <span className="text-xs text-muted-foreground">Ekstern far</span>
        </div>
      ) : null}
    </div>
  );
}