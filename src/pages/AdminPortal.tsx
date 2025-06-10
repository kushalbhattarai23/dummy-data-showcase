
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [csvData, setCsvData] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    
    // Parse the header to determine the delimiter and format
    const firstLine = lines[0];
    let delimiter = ',';
    let header: string[];
    
    // Try to detect if it's tab-separated or comma-separated
    if (firstLine.includes('\t') && !firstLine.includes(',')) {
      delimiter = '\t';
      header = firstLine.split('\t');
    } else {
      header = parseCSVLine(firstLine);
    }
    
    // Validate header format
    const expectedHeaders = ['Show', 'Episode', 'Title', 'Air Date'];
    const normalizedHeader = header.map(h => h.trim());
    
    if (normalizedHeader.length !== 4 || 
        !expectedHeaders.every((expected, index) => 
          normalizedHeader[index].toLowerCase() === expected.toLowerCase())) {
      throw new Error('Invalid CSV format. Expected columns: Show, Episode, Title, Air Date');
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      let columns: string[];
      if (delimiter === '\t') {
        columns = line.split('\t');
      } else {
        columns = parseCSVLine(line);
      }
      
      if (columns.length === 4) {
        const [showTitle, episodeInfo, episodeTitle, airDate] = columns.map(col => col.trim());
        
        // Parse episode info (supporting formats like "S01E01", "S1E1", "1x1")
        const episodeMatch = episodeInfo.match(/S?0*(\d+)[xE]0*(\d+)/i);
        if (episodeMatch) {
          const seasonNumber = parseInt(episodeMatch[1]);
          const episodeNumber = parseInt(episodeMatch[2]);
          
          // Parse air date (handle quoted dates)
          let cleanAirDate = airDate.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
          if (cleanAirDate && cleanAirDate !== '') {
            // Try to parse different date formats
            const date = new Date(cleanAirDate);
            if (!isNaN(date.getTime())) {
              cleanAirDate = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
            }
          }
          
          data.push({
            showTitle: showTitle.replace(/^["']|["']$/g, ''), // Remove quotes from show title
            seasonNumber,
            episodeNumber,
            episodeTitle: episodeTitle.replace(/^["']|["']$/g, ''), // Remove quotes from episode title
            airDate: cleanAirDate || null
          });
        }
      }
    }
    
    return data;
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please provide CSV data",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const parsedData = parseCsvData(csvData);
      
      // Group episodes by show
      const showsMap = new Map();
      parsedData.forEach(episode => {
        if (!showsMap.has(episode.showTitle)) {
          showsMap.set(episode.showTitle, []);
        }
        showsMap.get(episode.showTitle).push(episode);
      });

      let showsCreated = 0;
      let episodesCreated = 0;

      for (const [showTitle, episodes] of showsMap) {
        // Check if show exists, if not create it
        let { data: existingShow, error: showSelectError } = await supabase
          .from('shows')
          .select('id')
          .eq('title', showTitle)
          .maybeSingle();

        if (showSelectError) throw showSelectError;

        let showId;
        if (!existingShow) {
          const { data: newShow, error: showInsertError } = await supabase
            .from('shows')
            .insert({ title: showTitle })
            .select('id')
            .single();

          if (showInsertError) throw showInsertError;
          showId = newShow.id;
          showsCreated++;
        } else {
          showId = existingShow.id;
        }

        // Insert episodes for this show
        const episodesToInsert = episodes.map(episode => ({
          show_id: showId,
          season_number: episode.seasonNumber,
          episode_number: episode.episodeNumber,
          title: episode.episodeTitle,
          air_date: episode.airDate
        }));

        const { error: episodeInsertError } = await supabase
          .from('episodes')
          .upsert(episodesToInsert, {
            onConflict: 'show_id,season_number,episode_number',
            ignoreDuplicates: false
          });

        if (episodeInsertError) throw episodeInsertError;
        episodesCreated += episodes.length;
      }

      toast({
        title: "Success",
        description: `Import completed! Created ${showsCreated} shows and ${episodesCreated} episodes.`,
      });

      setCsvData('');
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Portal</h1>
        <p className="text-gray-600">Import shows and episodes from CSV files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>CSV Import</span>
          </CardTitle>
          <CardDescription>
            Import shows and episodes from a CSV file with columns: Show, Episode, Title, Air Date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="csv-data">Or Paste CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder='Show,Episode,Title,Air Date
Agent Carter,S01E01,Now is Not the End,"January 6, 2015"
Agent Carter,S01E02,Bridge and Tunnel,"January 13, 2015"'
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={10}
              className="mt-2 font-mono text-sm"
            />
          </div>

          <div className="text-sm text-gray-500">
            <p><strong>Format requirements:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Comma-separated values (CSV) or Tab-separated values (TSV)</li>
              <li>First row must be headers: Show, Episode, Title, Air Date</li>
              <li>Episode format: S01E01, S1E1, or 1x1</li>
              <li>Air Date: Any standard date format (e.g., "January 6, 2015")</li>
              <li>Fields with commas should be quoted</li>
            </ul>
          </div>

          <Button 
            onClick={handleImport} 
            disabled={uploading || !csvData.trim()}
            className="w-full"
          >
            {uploading ? (
              'Importing...'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
