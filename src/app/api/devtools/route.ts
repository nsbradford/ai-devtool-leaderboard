import { NextResponse } from 'next/server';
import devtoolsData from '@/devtools.json';

export async function GET() {
  return NextResponse.json(devtoolsData);
} 