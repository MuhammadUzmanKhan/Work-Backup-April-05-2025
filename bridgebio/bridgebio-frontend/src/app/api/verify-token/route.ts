import { NextRequest, NextResponse } from 'next/server';
import { oktaJwtVerifier } from '@/services/okta-verifier';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('id_token');

    if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    try {
        // Verify the token and get the data
        const data = await oktaJwtVerifier.verifyIdToken(token, process.env.OKTA_CLIENT_ID!);

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }
}