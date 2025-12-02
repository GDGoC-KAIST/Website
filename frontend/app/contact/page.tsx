"use client";

import { FaInstagram } from "react-icons/fa";

export default function ContactPage() {
  const instagramUrl = "https://www.instagram.com/gdg.on.campus_kaist/";

  return (
    <div className="px-10 pt-32 pb-20 max-[400px]:px-6">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl max-w-5xl mx-auto lg:text-6xl font-light leading-tight text-center mb-6">
          Contact
        </h1>
      </div>

      <p className="opacity-60 max-w-3xl text-center mx-auto max-sm:px-6 leading-relaxed mb-12">
        GDG on Campus KAIST와 소통하세요
      </p>

      <div className="flex flex-col items-center justify-center space-y-6 max-w-3xl mx-auto">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-primary transition-colors w-full"
        >
          <FaInstagram className="text-4xl text-pink-600 flex-shrink-0" />
        </a>
        <a
          href="https://linktr.ee/helloworldgdgockaist"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-primary transition-colors w-full"
        >
          <span className="text-xl font-semibold">Recruitment</span>
        </a>
      </div>
    </div>
  );
}
