import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="hover:opacity-80 transition-opacity">
      <Image 
        src="https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/globcred-white.png" 
        alt="Globcred Logo" 
        width={150} 
        height={40} 
        className="h-auto" 
      />
    </Link>
  );
}
