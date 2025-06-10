
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface Universe {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface UniverseCardProps {
  universe: Universe;
  onSelect: (universeId: string) => void;
}

export const UniverseCard: React.FC<UniverseCardProps> = ({ universe, onSelect }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow border-universe-primary/20 hover:border-universe-primary/40"
      onClick={() => onSelect(universe.id)}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {universe.name}
          <Badge variant="secondary" className="bg-universe-secondary text-universe-primary">Universe</Badge>
        </CardTitle>
        {universe.description && (
          <CardDescription>{universe.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          Created {new Date(universe.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
