import { NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), '..', 'data', 'csv-files', 'base-sous-traitants', 'sous-traitants.csv');
    const stats = await stat(csvPath);
    
    // Format: dd/MM/yyyy
    const date = new Date(stats.mtime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return NextResponse.json({
      lastModified: `${day}/${month}/${year}`,
      timestamp: stats.mtime.getTime()
    });
  } catch (error) {
    console.error('Error reading CSV file stats:', error);
    return NextResponse.json(
      { error: 'Unable to read file stats' },
      { status: 500 }
    );
  }
}

