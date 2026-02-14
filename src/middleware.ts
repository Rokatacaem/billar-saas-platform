// src/middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // Define tu dominio raíz (ej. localhost:3000 o tuapp.cl)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    const subdominio = hostname.replace(`.${rootDomain}`, "");

    // Si detectamos un subdominio que no sea 'www', hacemos el rewrite interno
    if (subdominio !== hostname && subdominio !== "www") {
        return NextResponse.rewrite(
            new URL(`/_tenant/${subdominio}${url.pathname}`, req.url)
        );
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};