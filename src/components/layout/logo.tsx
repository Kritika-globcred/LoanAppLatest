import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="hover:opacity-80 transition-opacity">
      <Image 
        src="https://globcred.org/images/globcred-logo.png" 
        alt="Globcred Logo" 
        width={150} // You might want to adjust this width
        height={40} // And this height, to maintain aspect ratio
        className="h-auto" // Added to help with responsiveness if width is primary driver
      />
    </Link>
  );
}
