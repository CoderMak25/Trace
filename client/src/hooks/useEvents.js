import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


export function useEvents(teamId = null) {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    mode: '',
    category: '',
    city: '',
  });

  const fetchEvents = useCallback(async (targetPage = 1) => {
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
      if (teamId) params.append('teamId', teamId);
      
      params.append('page', targetPage);
      params.append('limit', 12); // Number of items per grid page

      const token = await currentUser.getIdToken();
      const res = await axios.get(`/api/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.events) {
        // ALWAYS replace for explicit pagination
        setEvents(res.data.events);
        setPage(res.data.page);
        setTotalPages(res.data.totalPages || 1);
      } else {
        // Fallback backward compatibility
        setEvents(res.data);
        setTotalPages(1);
      }
      setError(null);
    } catch (err) {
      console.error('API error', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser, teamId]);

  const goToPage = useCallback((newPage) => {
    if (!loading && newPage >= 1 && newPage <= totalPages) {
      fetchEvents(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, totalPages, fetchEvents]);

  // Reset page and fetch when filters change
  useEffect(() => {
    fetchEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const addEventLocally = useCallback((newEvent) => {
    setEvents((prev) => {
      // If we are on page 1, show it at the top
      if (page === 1) return [newEvent, ...prev];
      return prev;
    });
  }, [page]);

  const updateEventLocally = useCallback((updatedEvent) => {
    setEvents((prev) => prev.map((e) => e._id === updatedEvent._id ? updatedEvent : e));
  }, []);

  const removeEventLocally = useCallback((eventId) => {
    setEvents((prev) => prev.filter((e) => e._id !== eventId));
  }, []);

  return { 
    events, loading, page, totalPages, goToPage, error, filters, setFilters, 
    refetch: () => fetchEvents(page), addEventLocally, updateEventLocally, removeEventLocally 
  };
}
