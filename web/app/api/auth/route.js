import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { password } = await req.json();

    if (!process.env.APP_PASSWORD) {
      return NextResponse.json({ success: true, message: 'No password configured' });
    }

    if (password === process.env.APP_PASSWORD) {
      // Create token
      const token = Buffer.from(password).toString('base64');
      
      const response = NextResponse.json({ success: true });
      
      // Set HttpOnly secure cookie, valid for 180 days
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 180, 
        path: '/',
      });
      
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
