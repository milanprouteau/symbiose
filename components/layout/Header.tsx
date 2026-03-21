import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full h-[140px] justify-center px-6 flex items-center border-b border-(--color-border) bg-(--color-background)">
      <Image
        src="/LOGO/LOGO_mascotte/LOGO-SYMBIOSE_mascotte.svg"
        alt="Symbiose"
        width={180}
        height={180}
        priority
      />
    </header>
  );
}