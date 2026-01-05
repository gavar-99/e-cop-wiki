import React, { useMemo } from 'react';
import SearchBar from './SearchBar';
import HighlightsSection from './HighlightsSection';
import { LatestEntries, OnThisDay } from './EntryList';
import { spacing } from '../../styles/theme';

const Dashboard = ({ entries, onNavigate }) => {
  // Featured entry - prioritize entries with substantial content
  const featured = useMemo(() => {
    const candidates = entries.filter((e) => e.content && e.content.length > 500);
    return candidates.length > 0 ? candidates[0] : entries.length > 0 ? entries[0] : null;
  }, [entries]);

  // Recent entries - top 5 newest
  const recent = useMemo(() => {
    return [...entries].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [entries]);

  // On This Day - entries with eventDate matching today OR created on this day in previous years
  const onThisDay = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const todayYear = today.getFullYear();
    const month = today.toLocaleString('en', { month: 'long' });

    // Priority 1: Entries with eventDate matching today (any year)
    const hasEventOnThisDay = entries.filter((e) => {
      if (!e.event_date) return false;
      const eventDate = new Date(e.event_date);
      return eventDate.getMonth() === todayMonth && eventDate.getDate() === todayDay;
    });

    // Priority 2: Entries created on this day in previous years
    const createdOnThisDay = entries.filter((e) => {
      if (!e.createdAt || hasEventOnThisDay.includes(e)) return false;
      const entryDate = new Date(e.createdAt);
      return (
        entryDate.getMonth() === todayMonth &&
        entryDate.getDate() === todayDay &&
        entryDate.getFullYear() !== todayYear // Exclude entries from today
      );
    });

    // Priority 3: Entries mentioning today's date in content (e.g., "June 6", "6 June", "June 6, 1944")
    const datePattern = new RegExp(`(${month}\\s+${todayDay}|${todayDay}\\s+${month})`, 'i');
    const mentionsDate = entries.filter(
      (e) =>
        e.content &&
        datePattern.test(e.content) &&
        !hasEventOnThisDay.includes(e) &&
        !createdOnThisDay.includes(e)
    );

    // Combine results (eventDate entries first, then createdAt, then content matches)
    const combined = [...hasEventOnThisDay, ...createdOnThisDay, ...mentionsDate];

    if (combined.length > 0) {
      // Sort by event date year (oldest first for historical feel) and limit to 3
      return combined
        .sort((a, b) => {
          const dateA = a.event_date ? new Date(a.event_date) : new Date(a.createdAt);
          const dateB = b.event_date ? new Date(b.event_date) : new Date(b.createdAt);
          return dateA - dateB;
        })
        .slice(0, 3);
    }

    // Fallback: random entries if no matches
    const shuffled = [...entries].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }, [entries]);

  return (
    <div style={styles.container}>
      <SearchBar entries={entries} onNavigate={onNavigate} />

      <HighlightsSection featured={featured} onNavigate={onNavigate} />

      <div style={styles.gridContainer}>
        <LatestEntries entries={recent} onNavigate={onNavigate} />
        <OnThisDay entries={onThisDay} onNavigate={onNavigate} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: `${spacing['5xl']} ${spacing['6xl']}`,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: spacing['5xl'],
    marginTop: spacing['5xl'],
  },
};

export default Dashboard;
