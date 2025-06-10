
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tv } from 'lucide-react';

interface Show {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  created_at: string;
}

interface ShowCardProps {
  show: Show;
  onSelect: (showId: string) => void;
}

export const ShowCard: React.FC<ShowCardProps> = ({ show, onSelect }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow h-full"
      onClick={() => onSelect(show.id)}
    >
      <CardHeader className="p-3 md:p-6">
        {show.poster_url && (
          <img
            src={show.poster_url}
            alt={show.title}
            className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-md mb-2 md:mb-4"
          />
        )}
        <CardTitle className="flex items-center justify-between text-sm md:text-base">
          <span className="truncate mr-2">{show.title}</span>
          <Badge variant="outline" className="flex-shrink-0">
            <Tv className="h-2 w-2 md:h-3 md:w-3 mr-1" />
            <span className="hidden sm:inline">Show</span>
            <span className="sm:hidden">S</span>
          </Badge>
        </CardTitle>
        {show.description && (
          <CardDescription className="text-xs md:text-sm line-clamp-2 md:line-clamp-3">
            {show.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0">
        <div className="text-xs md:text-sm text-gray-500">
          Added {new Date(show.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
