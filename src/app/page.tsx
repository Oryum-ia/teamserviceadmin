"use client";

import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

export default function Home() {
  return (
    <main className="login-page relative flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/img/aspiradora.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={75}
        />
        {/* Overlay mejorado para mejor contraste */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40 dark:from-black/60 dark:via-black/50 dark:to-black/60"></div>
      </div>

      {/* Botón de tema en la esquina superior derecha */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Contenido del login */}
      <div className="relative z-10 w-full max-w-md px-4">
        <LoginForm />
      </div>
    </main>
  );
}
