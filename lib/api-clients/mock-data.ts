import { Lead, Job } from '../types';

export const MOCK_LEADS: Lead[] = [
  {
    company: "Pixel Perfect Design",
    linkedin: "https://linkedin.com/company/pixel-perfect",
    name: "Sarah Chen",
    title: "Founder & CEO",
    employees: 12
  },
  {
    company: "CloudScale Solutions",
    linkedin: "https://linkedin.com/company/cloudscale",
    name: "Michael Rodriguez",
    title: "Chief Executive Officer",
    employees: 45
  },
  {
    company: "Uxify Agency",
    linkedin: "https://linkedin.com/company/uxify",
    name: "Emma Watson",
    title: "Head of Product",
    employees: 8
  },
  {
    company: "Designers Guild",
    linkedin: "https://linkedin.com/company/designersguild",
    name: "James Bond",
    title: "Managing Director",
    employees: 22
  },
  {
    company: "Creative Connect",
    linkedin: "https://linkedin.com/company/creativeconnect",
    name: "Robert Downey Jr",
    title: "Co-Founder",
    employees: 35
  }
];

export const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior UI/UX Designer",
    company: "Google",
    location: "Remote, US",
    type: "Full-time",
    description: "Looking for an expert designer to lead our New Products team. Experience with React and Figma required.",
    link: "https://google.com/careers"
  },
  {
    id: "2",
    title: "Lead Frontend Engineer",
    company: "Airbnb",
    location: "Remote, Europe",
    type: "Contract",
    description: "Seeking a senior engineer to help build our next-generation guest experience platform.",
    link: "https://airbnb.com/careers"
  },
  {
    id: "3",
    title: "Product Designer",
    company: "Linear",
    location: "Remote, Global",
    type: "Full-time",
    description: "Join the most design-centric team in the world. Crafting tools for high-performance software teams.",
    link: "https://linear.app/careers"
  }
];

export const MOCK_CASE_STUDIES = [
  {
    title: "Enterprise SaaS Redesign",
    industry: "Fintech",
    outcome: "Increased user retention by 45% and reduced onboarding time by 30% for a Fortune 500 company."
  },
  {
    title: "AI Automation Platform",
    industry: "E-commerce",
    outcome: "Built a custom automation suite that handled 1M+ orders and saved $200k in annual operational costs."
  }
];
