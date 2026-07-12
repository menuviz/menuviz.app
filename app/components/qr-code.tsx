import Image from "next/image";

export function QrCode() {
  return (
    <Image
      src="/images/qr-code.jpeg"
      alt="QR code linking to the MenuViz demo menu"
      width={640}
      height={640}
      className="h-full w-full rounded-sm"
    />
  );
}
