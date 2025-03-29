import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

import "./tailwind.css";

export const meta: MetaFunction = () => {
  return [
    { title: "People I've Met - A Personal Connection Journal" },
    { name: "description", content: "A personal collection of all the interesting people I've encountered on my journey through life." },
  ];
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="container mx-auto p-4 mt-4 flex-grow">
          <Outlet />
        </main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
