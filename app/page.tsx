"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { 
  ArrowRightIcon, 
  ShieldCheckIcon,
  UserCircleIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth');
  }, [router]);

  return null;
}