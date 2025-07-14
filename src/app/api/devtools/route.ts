import { NextResponse } from 'next/server';
import devtoolsData from '@/devtools.json';

export async function GET() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const secondsUntilMidnight = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

  const response = NextResponse.json(devtoolsData);
  response.headers.set('Cache-Control', `public, max-age=${secondsUntilMidnight}, s-maxage=${secondsUntilMidnight}`);
  
  return response;
}   