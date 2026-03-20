import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Sample events for demo / offline mode
const SAMPLE_EVENTS = [
  {
    _id: '1',
    name: 'Mumbai Hack 2024',
    slug: 'mumbai-hack-2024',
    organizer: 'Tech Club IITB',
    date: '2024-10-15',
    endDate: '2024-10-17',
    registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    mode: 'In-Person',
    city: 'Mumbai',
    category: ['Hackathon', 'Fintech'],
    prizePool: '₹50,000',
    registrationLink: 'https://example.com',
    description: 'Build the future of finance in 48 hours. Focus on UPI integrations and micro-lending platforms.',
    verified: true,
  },
  {
    _id: '2',
    name: 'Intro to Rust',
    slug: 'intro-to-rust',
    organizer: 'FOSS India',
    date: '2024-11-02',
    mode: 'Online',
    city: 'Online (Discord)',
    category: ['Workshop'],
    prizePool: 'Free',
    registrationLink: 'https://example.com',
    description: 'Memory safety without garbage collection. A hands-on weekend workshop for intermediate devs.',
    verified: true,
  },
  {
    _id: '3',
    name: "Synapse '24",
    slug: 'synapse-24',
    organizer: 'NIT Surat',
    date: '2024-12-10',
    endDate: '2024-12-14',
    mode: 'In-Person',
    city: 'Surat',
    category: ['Tech Fest'],
    prizePool: '',
    highlights: 'RoboWars, CTF',
    registrationLink: 'https://example.com',
    description: 'Annual technical festival of NIT Surat. Robotics, coding, gaming, and guest lectures.',
    verified: true,
  },
  {
    _id: '4',
    name: 'AI/ML Bootcamp',
    slug: 'ai-ml-bootcamp',
    organizer: 'Google DSC BITS',
    date: '2024-11-20',
    endDate: '2024-11-22',
    mode: 'Online',
    city: 'Online (Google Meet)',
    category: ['Workshop', 'AI/ML'],
    prizePool: 'Free',
    registrationLink: 'https://example.com',
    description: 'Three-day intensive bootcamp covering PyTorch, transformers, and deployment with Vertex AI.',
    verified: true,
  },
  {
    _id: '5',
    name: 'HackBengaluru',
    slug: 'hack-bengaluru',
    organizer: 'BLR Tech Community',
    date: '2024-12-01',
    endDate: '2024-12-02',
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    mode: 'In-Person',
    city: 'Bengaluru',
    category: ['Hackathon', 'Web3'],
    prizePool: '₹1,00,000',
    registrationLink: 'https://example.com',
    description: 'Bangalore\'s biggest open hackathon. Web3, DeFi, and decentralized identity tracks.',
    verified: true,
  },
  {
    _id: '6',
    name: 'DevOps Day Delhi',
    slug: 'devops-day-delhi',
    organizer: 'CloudNative India',
    date: '2024-11-15',
    mode: 'In-Person',
    city: 'Delhi',
    category: ['Workshop'],
    prizePool: '₹500',
    registrationLink: 'https://example.com',
    description: 'Kubernetes, CI/CD pipelines, and observability. Hands-on labs with industry mentors.',
    verified: true,
  },
];

export function useEvents(teamId = null) {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    mode: '',
    category: '',
    city: '',
  });

  const fetchEvents = useCallback(async () => {
    // Demo mode: use sample events
    if (currentUser?.isDemo) {
      let filtered = [...SAMPLE_EVENTS];
      // filter sample events...
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.organizer.toLowerCase().includes(q) ||
            e.city.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q)
        );
      }
      if (filters.mode) filtered = filtered.filter((e) => e.mode === filters.mode);
      if (filters.category) filtered = filtered.filter((e) => e.category.includes(filters.category));
      if (filters.city) filtered = filtered.filter((e) => e.city.toLowerCase().includes(filters.city.toLowerCase()));
      setEvents(filtered);
      setLoading(false);
      return;
    }

    if (!currentUser) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.mode) params.append('mode', filters.mode);
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);
      if (teamId) params.append('teamId', teamId); // Future proofing

      const token = await currentUser.getIdToken();
      const res = await axios.get(`/api/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
      setError(null);
    } catch (err) {
      console.warn('API not available, using sample events');
      // Filter sample events locally
      let filtered = [...SAMPLE_EVENTS];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.name?.toLowerCase().includes(q) ||
            e.organizer?.toLowerCase().includes(q) ||
            e.city?.toLowerCase().includes(q) ||
            (e.description && e.description.toLowerCase().includes(q)) ||
            (e.mode && e.mode.toLowerCase().includes(q)) ||
            (e.category && (Array.isArray(e.category) ? e.category.join(' ').toLowerCase().includes(q) : e.category.toLowerCase().includes(q))) ||
            (e.prizePool && e.prizePool.toLowerCase().includes(q))
        );
      }
      if (filters.mode) {
        filtered = filtered.filter((e) => e.mode === filters.mode);
      }
      if (filters.category) {
        filtered = filtered.filter((e) => e.category?.includes(filters.category));
      }
      if (filters.city) {
        filtered = filtered.filter((e) =>
          e.city?.toLowerCase().includes(filters.city.toLowerCase())
        );
      }
      setEvents(filtered);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const addEventLocally = useCallback((newEvent) => {
    setEvents((prev) => [...prev, newEvent]);
  }, []);

  const updateEventLocally = useCallback((updatedEvent) => {
    setEvents((prev) => prev.map((e) => e._id === updatedEvent._id ? updatedEvent : e));
  }, []);

  const removeEventLocally = useCallback((eventId) => {
    setEvents((prev) => prev.filter((e) => e._id !== eventId));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, filters, setFilters, refetch: fetchEvents, addEventLocally, updateEventLocally, removeEventLocally };
}
