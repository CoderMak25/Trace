import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


export function useEvents(teamId = null) {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    mode: '',
    category: '',
    city: '',
  });

  const fetchEvents = useCallback(async (isLoadMore = false) => {
    if (!currentUser) {
      setEvents([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const targetPage = isLoadMore ? page + 1 : 1;
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
        // New paginated response
        if (isLoadMore) {
          setEvents(prev => [...prev, ...res.data.events]);
        } else {
          setEvents(res.data.events);
        }
        setPage(res.data.page);
        setHasMore(res.data.page < res.data.totalPages);
      } else {
        // Fallback backward compatibility
        setEvents(res.data);
        setHasMore(false);
      }
      setError(null);
    } catch (err) {
      console.error('API error', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, currentUser, teamId, page]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchEvents(true);
    }
  }, [loading, loadingMore, hasMore, fetchEvents]);

  // Reset page and fetch when filters change
  useEffect(() => {
    fetchEvents(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const addEventLocally = useCallback((newEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  const updateEventLocally = useCallback((updatedEvent) => {
    setEvents((prev) => prev.map((e) => e._id === updatedEvent._id ? updatedEvent : e));
  }, []);

  const removeEventLocally = useCallback((eventId) => {
    setEvents((prev) => prev.filter((e) => e._id !== eventId));
  }, []);

  return { events, loading, loadingMore, hasMore, loadMore, error, filters, setFilters, refetch: () => fetchEvents(false), addEventLocally, updateEventLocally, removeEventLocally };
}
