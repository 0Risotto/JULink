import { Ad } from "./types";

export const MOCK_ADS: Ad[] = [
  {
    id: "ad-1",
    title: "JU Coffee House",
    description: "Fuel your study sessions with the best coffee on campus. 15% student discount for all JU members!",
    gradient: "from-amber-500 via-amber-600 to-amber-800",
    iconName: "Coffee",
    ctaText: "Get Coffee",
    link: "https://ju.edu.jo"
  },
  {
    id: "ad-2",
    title: "KASIT Coding Club",
    description: "Ready to hack? Join the annual KASIT Programming Contest this summer! Form your teams now.",
    gradient: "from-indigo-600 via-blue-600 to-indigo-800",
    iconName: "Code",
    ctaText: "Register Now",
    link: "https://ju.edu.jo"
  },
  {
    id: "ad-3",
    title: "JULink Premium",
    description: "Enjoy an ad-free experience, see who viewed your profile, and highlight your posts starting at $1.99/mo.",
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    iconName: "Sparkles",
    ctaText: "Go Premium",
    link: "/settings"
  },
  {
    id: "ad-4",
    title: "JU Book Store",
    description: "All academic textbooks, reference guides, lecture notes, and stationeries in one place.",
    gradient: "from-emerald-500 via-teal-600 to-teal-800",
    iconName: "BookOpen",
    ctaText: "Shop Books",
    link: "https://ju.edu.jo"
  },
  {
    id: "ad-5",
    title: "KASIT Career Fair 2026",
    description: "Connect with over 40 top tech companies in Jordan. Bring your CV and secure your dream internship!",
    gradient: "from-purple-600 via-violet-600 to-fuchsia-800",
    iconName: "Briefcase",
    ctaText: "Explore Jobs",
    link: "https://ju.edu.jo"
  }
];
