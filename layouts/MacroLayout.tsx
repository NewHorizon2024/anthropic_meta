"use server";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

type MacroLayoutProps = Readonly<{
  children: ReactNode;
}>;

const styleLink = "text-gray-700 hover:text-gray-900";

export async function MacroLayout({ children }: MacroLayoutProps) {
  return (
    <>
      <header className="w-full shadow-2xl backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white">
            <Link href="/">
              <Image src="/assets/logo.png" width={60} height={60} alt="Logo" />
            </Link>
            <h1 className="text-lg font-semibold">Anthropic</h1>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link className={styleLink} href="/operations">
              Operations
            </Link>
            <Link className={styleLink} href="/chat">
              Chat
            </Link>
          </nav>
        </div>
      </header>

      <main className="min-h-screen w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <section>{children}</section>
      </main>
    </>
  );
}
