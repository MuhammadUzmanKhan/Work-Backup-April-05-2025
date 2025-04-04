import { oktaJwtVerifier } from "@/services/okta-verifier";
import { NextRequest } from "next/server";
import { parse } from 'querystring';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const parsedBody = parse(body);

        await oktaJwtVerifier.verifyIdToken(parsedBody.id_token as string, process.env.OKTA_CLIENT_ID as string);

        const url = new URL("/login", req.url);
        url.searchParams.append("id_token", parsedBody.id_token as string);

        return Response.redirect(url);
    } catch (error) {        
        return Response.redirect(new URL("/unauthorized", req.url));
    }
}